// Phase 1 TODO System - Service Layer
// Plan References:
//  - §2 Data / Status Lifecycle
//  - §3 Storage + Repository Integration
//  - §4 Error Model & Transitions
//  - §5 Logging (structured events)
//  - §6 Integrity Repair (invoked on init; log summary)
//  - §7 Metrics (basic snapshot)
//  - Reopen window enforcement included (configurable)
//
// Out-of-scope Phase 1 (marked TODO):
//  - Snapshot generation
//  - Advanced integrity repair detail classification
//  - External subscriber ecosystems beyond simple listener pattern

import {
  Todo,
  TodoStatus,
  DuplicateContentError,
  InvalidTransitionError,
  ReopenWindowExpiredError,
  ReorderValidationError,
  createTodo,
  computeMetrics,
  createLogEvent,
  StructuredLogEvent,
  Metrics,
  TodoEvent,
  isActiveStatus,
  cloneTodo,
  normalizeTags,
  IntegrityAnomaly,
} from './models';
import { TodoRepository } from './repository';
import { IStorageAdapter } from './storage/adapter';

//////////////////////
// Config
//////////////////////

export interface TodoServiceConfig {
  /**
   * Reopen window in milliseconds. If undefined/null => unlimited.
   * Plan: Enforce reopen-window now (Phase 1), value sourced from architecture plan (placeholder default 72h).
   * TODO (Phase >1): Externalize to environment / config file
   */
  reopenWindowMs?: number | null;
  /**
   * Emit periodic metrics snapshot (Phase 1 default: disabled)
   * TODO (Phase >1): Implement interval-based metrics emission
   */
  metricsIntervalMs?: number;
}

/**
 * Exported default reopen window (reduced from original 72h to 24h per roadmap).
 */
export const REOPEN_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h default

type ServiceListener = (todos: readonly Todo[]) => void;
type EventListener = (event: TodoEvent, snapshot: readonly Todo[]) => void;

/**
 * Integrity check result with anomaly classification (Phase 1++ expansion).
 * Non-mutating check that surfaces anomaly classifications without performing repair.
 */
export interface IntegrityCheckResult {
  timestamp: string;
  metrics: Metrics;
  anomalies: IntegrityAnomaly[];
  note: string;
}

export class TodoService {
  private readonly repo: TodoRepository;
  private readonly adapter: IStorageAdapter;
  private readonly config: TodoServiceConfig;
  private listeners: Set<ServiceListener> = new Set();
  private eventListeners: Set<EventListener> = new Set();

  constructor(adapter: IStorageAdapter, config: TodoServiceConfig = {}) {
    this.adapter = adapter;
    this.config = {
      reopenWindowMs: config.reopenWindowMs ?? REOPEN_WINDOW_MS,
      metricsIntervalMs: config.metricsIntervalMs,
    };
    this.repo = new TodoRepository(adapter);
    this.repo.subscribe(() => this.emit());
  }

  //////////////////////
  // Initialization / Shutdown
  //////////////////////

  async init(): Promise<void> {
    await this.repo.load();
    const summary = this.repo.integrityRepair();
    if (summary.changed) {
      this.logEvent(createLogEvent({ type: 'integrity_repair', summary }));
    }
  }

  async shutdown(): Promise<void> {
    await this.repo.flush();
    if (typeof this.adapter.dispose === 'function') {
      await this.adapter.dispose();
    }
  }

  //////////////////////
  // Subscription
  //////////////////////

  subscribe(listener: ServiceListener): () => void {
    this.listeners.add(listener);
    // Immediate sync callback
    listener(this.repo.getAll());
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to domain events (emitted synchronously after log emission).
   * Listener receives the raw TodoEvent and current snapshot (read-only).
   */
  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.repo.getAll();
    for (const l of this.listeners) {
      try {
        l(snapshot);
      } catch {
        // swallow listener errors (Phase 1 simplicity)
      }
    }
  }

  //////////////////////
  // Core Operations
  //////////////////////

  addTodo(content: string, tags?: string[]): Todo {
    const trimmed = content.trim();
    this.ensureNoDuplicateActive(trimmed);
    const order = this.repo.getAll().length;
    // Normalize tags via factory helper (imported from models)
    const todo = createTodo(trimmed, order, tags);
    this.repo.insert(todo);
    this.logEvent(createLogEvent({ type: 'todo_added', todo }));
    // Return defensive clone so external references don't mutate on subsequent lifecycle changes
    return cloneTodo(todo);
  }

  /**
   * listTodos - extended Phase 1++ filtering
   * Filters:
   *  - status (exact)
   *  - includeArchived (defaults false)
   *  - tag (todos containing the tag, case-insensitive exact match on stored normalized tags)
   *  - text (case-insensitive substring search on content)
   *  - sort: order | createdAt
   */
  listTodos(opts: {
    status?: TodoStatus;
    includeArchived?: boolean;
    sort?: 'order' | 'createdAt';
    tag?: string;
    text?: string;
  } = {}): readonly Todo[] {
    let items = this.repo.getAll();

    if (opts.status) {
      items = items.filter(t => t.status === opts.status);
    }
    if (!opts.includeArchived) {
      items = items.filter(t => t.status !== TodoStatus.Archived);
    }
    if (opts.tag) {
      const tag = opts.tag.trim().toLowerCase();
      if (tag) {
        items = items.filter(t => t.tags.includes(tag));
      }
    }
    if (opts.text) {
      const needle = opts.text.trim().toLowerCase();
      if (needle) {
        items = items.filter(t => t.content.toLowerCase().includes(needle));
      }
    }

    switch (opts.sort) {
      case 'createdAt':
        return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      case 'order':
      default:
        return [...items].sort((a, b) => a.order - b.order);
    }
  }

  updateTodo(
    id: string,
    patch: {
      content?: string;
      status?: TodoStatus; // Direct status mutations still forbidden
      tags?: string[] | null; // Tag patching (Phase 1++ tagging extension)
    },
  ): Todo {
    const existing = this.findByIdOrThrow(id);
    const before = { ...existing };

    if (patch.status && patch.status !== existing.status) {
      // Enforce state machine via start/done/reopen methods
      throw new InvalidTransitionError(
        'Direct status change not permitted via updateTodo; use start/done/reopen methods',
      );
    }

    if (typeof patch.content === 'string') {
      const newContent = patch.content.trim();
      if (newContent !== existing.content) {
        this.ensureNoDuplicateActive(newContent, existing.id);
        existing.content = newContent;
        existing.updatedAt = new Date().toISOString();
      }
    }

    // Tag updates:
    // Allow caller to explicitly clear tags by passing [].
    // Only mutate if a tags field was provided (even if empty array).
    if (Object.prototype.hasOwnProperty.call(patch, 'tags')) {
      const normalized = normalizeTags(patch.tags || []);
      // Shallow equality check (ordered unique list)
      const changed =
        normalized.length !== existing.tags.length ||
        normalized.some((v, i) => v !== existing.tags[i]);
      if (changed) {
        existing.tags = normalized;
        existing.updatedAt = new Date().toISOString();
      }
    }

    this.repo.replace(existing);
    this.logEvent(createLogEvent({ type: 'todo_updated', before, after: { ...existing } }));
    return cloneTodo(existing);
  }

  start(id: string): Todo {
    const t = this.findByIdOrThrow(id);
    if (t.status !== TodoStatus.Pending) {
      throw new InvalidTransitionError('Only pending todos can be started');
    }
    t.status = TodoStatus.InProgress;
    t.updatedAt = new Date().toISOString();
    this.repo.replace(t);
    this.logEvent(createLogEvent({ type: 'todo_started', id: t.id }));
    return cloneTodo(t);
  }

  done(id: string): Todo {
    const t = this.findByIdOrThrow(id);
    if (t.status !== TodoStatus.InProgress) {
      throw new InvalidTransitionError('Only in_progress todos can be completed');
    }
    const now = new Date().toISOString();
    t.status = TodoStatus.Completed;
    // Set or update completion time (updates on re-completion after reopen)
    t.completedAt = now;
    t.updatedAt = now;
    this.repo.replace(t);
    this.logEvent(createLogEvent({ type: 'todo_completed', id: t.id, completedAt: now }));
    return cloneTodo(t);
  }

  reopen(id: string): Todo {
    const t = this.findByIdOrThrow(id);
    if (t.status !== TodoStatus.Completed) {
      throw new InvalidTransitionError('Only completed todos can be reopened');
    }
    if (this.config.reopenWindowMs != null && this.config.reopenWindowMs >= 0) {
      if (!t.completedAt) {
        // Defensive: Completed todos should have completedAt
        throw new ReopenWindowExpiredError('Completed timestamp missing; cannot validate window');
      }
      const completedTime = new Date(t.completedAt).getTime();
      const now = Date.now();
      if (now - completedTime > this.config.reopenWindowMs) {
        throw new ReopenWindowExpiredError();
      }
    }
    // We retain previous completedAt for historical reference; new completion will overwrite (Plan note)
    t.status = TodoStatus.Pending;
    t.updatedAt = new Date().toISOString();
    this.repo.replace(t);
    this.logEvent(createLogEvent({ type: 'todo_reopened', id: t.id }));
    return cloneTodo(t);
  }

  reorderTodos(ids: string[]): void {
    try {
      this.repo.reorder(ids);
    } catch (err) {
      if (err instanceof ReorderValidationError) throw err;
      throw err;
    }
    const ordered = this.repo.getAll()
      .filter(t => t.status !== TodoStatus.Archived)
      .sort((a, b) => a.order - b.order)
      .map(t => t.id);
    this.logEvent(createLogEvent({ type: 'todo_reordered', order: ordered }));
  }

  archiveCompletedTodos(): string[] {
    const nowIso = new Date().toISOString();
    const toArchive = this.repo
      .getAll()
      .filter(t => t.status === TodoStatus.Completed)
      .map(t => t.id);
    if (toArchive.length === 0) return [];
    for (const id of toArchive) {
      const t = this.findByIdOrThrow(id);
      t.status = TodoStatus.Archived;
      t.archivedAt = nowIso;
      t.updatedAt = nowIso;
      this.repo.replace(t);
    }
    this.logEvent(createLogEvent({ type: 'archive_completed_batch', archivedIds: toArchive }));
    return toArchive;
  }

  getMetrics(): Metrics {
    const metrics = computeMetrics(this.repo.getAll());
    return metrics;
  }

  /**
   * Non-mutating integrity check with anomaly classification (Phase 1++ expansion).
   * Returns current metrics & structured anomaly classifications without performing repair.
   */
  checkIntegrity(): IntegrityCheckResult {
    const anomalies = this.repo.detectAnomalies();
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      anomalies,
      note: 'Integrity check with anomaly classification (no repair performed)',
    };
  }

  //////////////////////
  // Helpers
  //////////////////////

  private findByIdOrThrow(id: string): Todo {
    const t = this.repo.getAll().find(t => t.id === id);
    if (!t) throw new Error(`Todo not found: ${id}`);
    return t;
  }

  private ensureNoDuplicateActive(content: string, ignoreId?: string): void {
    const lower = content.trim().toLowerCase();
    // Duplicate policy (adjusted after test feedback):
    // Consider ANY non-archived todo (pending | in_progress | completed) as conflicting.
    // Only archived todos free the content for reuse.
    const conflict = this.repo
      .getAll()
      .find(
        t =>
          t.status !== TodoStatus.Archived &&
          t.content.trim().toLowerCase() === lower &&
          t.id !== ignoreId,
      );
    if (conflict) {
      throw new DuplicateContentError();
    }
  }

  //////////////////////
  // Logging
  //////////////////////

  private logEvent(ev: StructuredLogEvent): void {
    // Plan §5 Logging: console JSON single line
    // Safe stringify (payload expected to be serializable)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(ev));
    // Dispatch to event listeners (best-effort, swallow errors)
    const snapshot = this.repo.getAll();
    for (const l of this.eventListeners) {
      try {
        l(ev.event, snapshot);
      } catch {
        // swallow to avoid impacting core flow
      }
    }
  }
}

//////////////////////
// Factory
//////////////////////

export async function createTodoService(
  adapter: IStorageAdapter,
  config?: TodoServiceConfig,
): Promise<TodoService> {
  const svc = new TodoService(adapter, config);
  await svc.init();
  return svc;
}

//////////////////////
// Phase 1 TODO Markers
//////////////////////

// TODO (Phase >1): Metrics periodic snapshot emission
// TODO (Phase >1): Correlation IDs for multi-step operations
// TODO (Phase >1): Snapshot generation triggers
// TODO (Phase >1): Pluggable event subscribers
// TODO (Phase >1): Bulk operations (batch add/update)
// TODO (Phase >1): Extended integrity repair invocation scheduling
