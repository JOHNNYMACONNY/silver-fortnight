// Phase 1 TODO System - Repository
// Plan References:
//  - §3 Storage Abstraction (bridge to adapters)
//  - §6 Integrity Repair (subset Phase 1)
//  - §2 Ordering
//  - §4 Error Model (reorder / duplicate handling)

import {
  Todo,
  TodoStatus,
  IntegrityRepairSummary,
  IntegrityRepairAction,
  IntegrityAnomaly,
  ReorderValidationError,
  isActiveStatus,
  cloneTodo,
} from './models';
import { IStorageAdapter } from './storage/adapter';

type Listener = () => void;

/**
 * Debounced persistence interval (ms)
 * Plan §3: Debounced write strategy (Phase 1: fixed 250ms)
 */
const PERSIST_DEBOUNCE_MS = 250;

export class TodoRepository {
  private todos: Todo[] = [];
  private adapter: IStorageAdapter;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<Listener> = new Set();

  constructor(adapter: IStorageAdapter) {
    this.adapter = adapter;
  }

  //////////////////////
  // Initialization
  //////////////////////

  /**
   * Load todos from adapter into memory (one-time on service init).
   */
  async load(): Promise<void> {
    this.todos = await this.adapter.load();
    // Ensure internal order consistency even before explicit repair.
    this.todos.sort((a, b) => a.order - b.order);
  }

  //////////////////////
  // Subscription (internal use)
  //////////////////////

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        // swallow listener errors (Phase 1 simple)
      }
    }
  }

  //////////////////////
  // Accessors
  //////////////////////

  getAll(): readonly Todo[] {
    return this.todos;
  }

  //////////////////////
  // CRUD / Mutations
  //////////////////////

  insert(todo: Todo): void {
    this.todos.push(todo);
    this.schedulePersist();
    this.emit();
  }

  replace(todo: Todo): void {
    const idx = this.todos.findIndex(t => t.id === todo.id);
    if (idx === -1) {
      throw new Error('Attempted replace on non-existent todo');
    }
    this.todos[idx] = todo;
    this.schedulePersist();
    this.emit();
  }

  /**
   * Reorder active (non-archived) todos.
   * Validation (Phase 1):
   *  - ids set must exactly match the set of non-archived todo IDs (coverage atomic)
   *  - no duplicates
   *  - archived todos retain their order values (appended after active ordering reassign)
   */
  reorder(ids: string[]): void {
    const activeTodos = this.todos.filter(t => t.status !== TodoStatus.Archived);
    const archivedTodos = this.todos.filter(t => t.status === TodoStatus.Archived);

    if (ids.length !== activeTodos.length) {
      throw new ReorderValidationError('Reorder id list length mismatch');
    }

    const uniqueCheck = new Set(ids);
    if (uniqueCheck.size !== ids.length) {
      throw new ReorderValidationError('Duplicate ids in reorder list');
    }

    const activeIdSet = new Set(activeTodos.map(t => t.id));
    for (const id of ids) {
      if (!activeIdSet.has(id)) {
        throw new ReorderValidationError(`Unknown id in reorder list: ${id}`);
      }
    }

    // Map for quick lookup
    const byId = new Map(activeTodos.map(t => [t.id, t]));
    // Reassign order sequentially
    let orderCounter = 0;
    const reorderedActive: Todo[] = [];
    for (const id of ids) {
      const original = byId.get(id)!;
      if (original.order !== orderCounter) {
        original.order = orderCounter;
        original.updatedAt = new Date().toISOString();
      }
      reorderedActive.push(original);
      orderCounter++;
    }

    // Archived after active, keep their relative order (they might already have high order numbers)
    // Reassign archived order after active for normalization & predictability
    for (const arch of archivedTodos) {
      arch.order = orderCounter++;
    }

    // Compose final list sorted by order
    this.todos = [...reorderedActive, ...archivedTodos].sort((a, b) => a.order - b.order);

    this.schedulePersist();
    this.emit();
  }

  //////////////////////
  // Integrity Repair (Phase 1 subset)
  //////////////////////

  /**
   * Performs corrective actions:
   *  1. Normalize ordering (compact sequential starting at 0) across all todos (active + completed + archived).
   *  2. Detect duplicate active content (case-insensitive) among active statuses (pending, in_progress).
   *     - Archive duplicates after the first occurrence.
   *
   * Returns summary of actions for logging by service layer.
   */
  integrityRepair(): IntegrityRepairSummary {
    const actions: IntegrityRepairAction[] = [];
    let changed = false;
    const now = new Date().toISOString();

    // Step 1: Normalize existing order (sort by current order then reassign sequential).
    let reassignmentCount = 0;
    this.todos.sort((a, b) => a.order - b.order);
    for (let i = 0; i < this.todos.length; i++) {
      if (this.todos[i].order !== i) {
        this.todos[i].order = i;
        this.todos[i].updatedAt = now;
        reassignmentCount++;
        changed = true;
      }
    }
    if (reassignmentCount > 0) {
      actions.push({ action: 'normalized_order', details: { reassignments: reassignmentCount } });
    }

    // Step 2: Duplicate active content archival
    const seenContent = new Map<string, string>(); // lowerContent -> first todo id
    for (const t of this.todos) {
      if (!isActiveStatus(t.status)) continue;
      const key = t.content.trim().toLowerCase();
      const existing = seenContent.get(key);
      if (!existing) {
        seenContent.set(key, t.id);
        continue;
      }
      // Duplicate: archive this one
      t.status = TodoStatus.Archived;
      t.archivedAt = now;
      t.updatedAt = now;
      changed = true;
      actions.push({
        action: 'archived_duplicate',
        details: { originalId: existing, archivedId: t.id },
      });
    }

    // If duplicates archived we should renormalize order to keep sequential indexing
    if (changed) {
      this.todos.sort((a, b) => a.order - b.order);
      let i = 0;
      for (const t of this.todos) {
        if (t.order !== i) {
            t.order = i;
            t.updatedAt = now;
        }
        i++;
      }
      // persist scheduled below
      this.schedulePersist();
      this.emit();
    }
    return { actions, changed };
  }
  /**
   * Detects anomalies without performing repairs (Phase 1++ expansion).
   * Returns structured anomaly classifications for integrity checking.
   */
  detectAnomalies(): IntegrityAnomaly[] {
    const anomalies: IntegrityAnomaly[] = [];

    // Detect duplicate active content
    const seenContent = new Map<string, string[]>(); // lowerContent -> ids
    for (const t of this.todos) {
      if (!isActiveStatus(t.status)) continue;
      const key = t.content.trim().toLowerCase();
      const existing = seenContent.get(key) || [];
      existing.push(t.id);
      seenContent.set(key, existing);
    }

    for (const [content, ids] of seenContent) {
      if (ids.length > 1) {
        anomalies.push({
          type: 'duplicate_active_content',
          details: { content, ids, count: ids.length },
        });
      }
    }

    // Detect order gaps (non-sequential order values)
    const sortedByOrder = [...this.todos].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sortedByOrder.length; i++) {
      if (sortedByOrder[i].order !== i) {
        anomalies.push({
          type: 'order_gap',
          details: {
            expectedOrder: i,
            actualOrder: sortedByOrder[i].order,
            id: sortedByOrder[i].id,
          },
        });
      }
    }

    // Detect invalid states (basic validation)
    for (const t of this.todos) {
      // Check for completed todos without completedAt
      if (t.status === TodoStatus.Completed && !t.completedAt) {
        anomalies.push({
          type: 'invalid_state',
          details: {
            id: t.id,
            issue: 'completed todo missing completedAt timestamp',
            status: t.status,
          },
        });
      }

      // Check for archived todos without archivedAt
      if (t.status === TodoStatus.Archived && !t.archivedAt) {
        anomalies.push({
          type: 'invalid_state',
          details: {
            id: t.id,
            issue: 'archived todo missing archivedAt timestamp',
            status: t.status,
          },
        });
      }

      // Check for missing required fields
      if (!t.content || t.content.trim() === '') {
        anomalies.push({
          type: 'missing_required_field',
          details: { id: t.id, field: 'content' },
        });
      }

      if (!t.id || t.id.trim() === '') {
        anomalies.push({
          type: 'missing_required_field',
          details: { id: t.id, field: 'id' },
        });
      }
    }

    return anomalies;
  }

  //////////////////////
  // Persistence Control
  //////////////////////

  private schedulePersist(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.persistNow();
    }, PERSIST_DEBOUNCE_MS);
  }

  private async persistNow(): Promise<void> {
    // Persist clones to avoid accidental mutation during write loop
    const snapshot = this.todos.map(t => cloneTodo(t));
    await this.adapter.persist(snapshot);
  }

  /**
   * Flush any pending debounced persist immediately (used by tests/service shutdown).
   */
  async flush(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    await this.persistNow();
  }
}

//////////////////////
// Phase 1 TODO Markers
//////////////////////

// TODO (Phase >1): More granular integrity actions (e.g., orphan detection)
// TODO (Phase >1): Soft-deleted handling
// TODO (Phase >1): Snapshot referencing integration
// TODO (Phase >1): Detailed duplicate resolution strategies
