// Phase 1 TODO System - Data Models
// Plan §2 Data Model & §5 Logging

//////////////////////
// ID Generation
//////////////////////

/**
 * Generates a UUID (uses crypto.randomUUID if available; otherwise a RFC4122 v4 compliant fallback).
 * Plan §2.1 ID Strategy
 */
export function generateId(): string {
  const c: Crypto | undefined =
    typeof globalThis !== "undefined" ? (globalThis as any).crypto : undefined;
  if (c && typeof (c as any).randomUUID === "function") {
    return (c as any).randomUUID();
  }
  // Fallback (non-cryptographic) - acceptable for internal TODO system
  // Adapted common pattern
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

//////////////////////
// Status Enum
//////////////////////

// Plan §2.2 Status Lifecycle
export enum TodoStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
  Archived = "archived",
}

//////////////////////
// Core Entity
//////////////////////

// Plan §2.3 Entity Shape
export interface Todo {
  id: string;
  content: string;
  status: TodoStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  completedAt?: string | null; // first or latest completion time (updated on re-completion after reopen)
  archivedAt?: string | null;
  order: number; // ordering index (lower = earlier)
  /**
   * Tagging (Phase >1 precursor) - added in Phase 1++ extension.
   * Invariants:
   *  - Always an array (never undefined)
   *  - Normalized to unique, case-insensitive (stored in original case chosen after trim; current strategy: lower-case)
   *  - No empty strings
   */
  tags: string[];
  // Future extension fields (snapshot references, etc.) - Phase 1 out-of-scope
  // TODO: snapshotRefs (Phase >1)
}

//////////////////////
// Metrics
//////////////////////

// Plan §7 Metrics (initial subset)
export interface Metrics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  archived: number;
  active: number; // pending + in_progress
  completionRatio: number; // completed / total (0 if total=0)
}

//////////////////////
// Domain Errors
//////////////////////

// Plan §4 Error Model
export class DuplicateContentError extends Error {
  constructor(message = "Duplicate active todo content") {
    super(message);
    this.name = "DuplicateContentError";
  }
}

export class InvalidTransitionError extends Error {
  constructor(message = "Invalid status transition") {
    super(message);
    this.name = "InvalidTransitionError";
  }
}

export class ReopenWindowExpiredError extends Error {
  constructor(message = "Reopen window has expired") {
    super(message);
    this.name = "ReopenWindowExpiredError";
  }
}

export class ReorderValidationError extends Error {
  constructor(message = "Invalid reorder request") {
    super(message);
    this.name = "ReorderValidationError";
  }
}

//////////////////////
// Integrity Repair
//////////////////////

// Plan §6 Integrity Repair (subset Phase 1)
export type IntegrityRepairAction =
  | { action: "normalized_order"; details?: { reassignments: number } }
  | {
      action: "archived_duplicate";
      details: { originalId: string; archivedId: string };
    }
  | {
      action: "deduplicated_active";
      details: { keptId: string; removedId: string };
    };

// Summary returned by repository.integrityRepair()
export interface IntegrityRepairSummary {
  actions: IntegrityRepairAction[];
  changed: boolean;
}

// Anomaly types for integrity checking (Phase 1++ expansion)
export type IntegrityAnomaly =
  | {
      type: "duplicate_active_content";
      details: { content: string; ids: string[]; count: number };
    }
  | {
      type: "order_gap";
      details: { expectedOrder: number; actualOrder: number; id: string };
    }
  | {
      type: "invalid_state";
      details: { id: string; issue: string; status: TodoStatus };
    }
  | { type: "missing_required_field"; details: { id: string; field: string } };

//////////////////////
// Logging Events
//////////////////////

// Plan §5 Logging - Event Union (Phase 1 subset)
export type TodoEvent =
  | { type: "todo_added"; todo: Todo }
  | { type: "todo_updated"; before: Todo; after: Todo }
  | { type: "todo_started"; id: string }
  | { type: "todo_completed"; id: string; completedAt: string }
  | { type: "todo_reopened"; id: string }
  | { type: "todo_reordered"; order: string[] }
  | { type: "todo_archived"; id: string; archivedAt: string }
  | { type: "archive_completed_batch"; archivedIds: string[] }
  | { type: "integrity_repair"; summary: IntegrityRepairSummary }
  | { type: "metrics_snapshot"; metrics: Metrics };

// Structured log envelope
export interface StructuredLogEvent {
  // ISO timestamp
  ts: string;
  // Namespace - fixed for this system
  ns: "todo_system";
  // Event payload
  event: TodoEvent;
  // Phase or version tagging for evolution
  phase: "phase1";
  // Optional correlation ID (future multi-action operations)
  correlationId?: string;
}

//////////////////////
// Type Guards
//////////////////////

export function isActiveStatus(status: TodoStatus): boolean {
  return status === TodoStatus.Pending || status === TodoStatus.InProgress;
}

export function isCompletedStatus(status: TodoStatus): boolean {
  return status === TodoStatus.Completed;
}

export function cloneTodo(t: Todo): Todo {
  return { ...t };
}

//////////////////////
// Factories
//////////////////////

// Plan §2.4 Factory

/**
 * Normalizes a tags array:
 *  - If undefined/null => []
 *  - Trim each
 *  - Lower-case (current strategy to simplify duplicate detection in future search)
 *  - Remove empties
 *  - De-duplicate preserving first occurrence
 *
 * NOTE: Exported for reuse by service & future CLI enhancements.
 */
export function normalizeTags(input?: string[] | null): string[] {
  if (!input || input.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const v = raw.trim().toLowerCase();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

export function createTodo(
  content: string,
  order: number,
  tags?: string[] | null
): Todo {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    content: content.trim(),
    status: TodoStatus.Pending,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    archivedAt: null,
    order,
    tags: normalizeTags(tags),
  };
}

//////////////////////
// Utility
//////////////////////

export function computeMetrics(todos: readonly Todo[]): Metrics {
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let archived = 0;
  for (const t of todos) {
    switch (t.status) {
      case TodoStatus.Pending:
        pending++;
        break;
      case TodoStatus.InProgress:
        inProgress++;
        break;
      case TodoStatus.Completed:
        completed++;
        break;
      case TodoStatus.Archived:
        archived++;
        break;
    }
  }
  const total = todos.length;
  const active = pending + inProgress;
  const completionRatio = total === 0 ? 0 : completed / total;
  return {
    total,
    pending,
    inProgress,
    completed,
    archived,
    active,
    completionRatio,
  };
}

export function createLogEvent(
  event: TodoEvent,
  correlationId?: string
): StructuredLogEvent {
  return {
    ts: new Date().toISOString(),
    ns: "todo_system",
    event,
    phase: "phase1",
    correlationId,
  };
}

//////////////////////
// Phase 1 TODO Markers
//////////////////////

// TODO: Snapshot event types (Phase >1)
// TODO: Integrity repair detailed classification & recovery steps (Phase >1)
// TODO: Advanced reopen window enforcement logging details (Phase >1)
