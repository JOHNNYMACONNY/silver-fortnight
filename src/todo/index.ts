// Phase 1 TODO System - Public API Barrel
// Plan Reference: Public API exposure (Service factory, types, errors, adapters)
//
// Exports kept intentionally conservative for Phase 1; future phases may
// add snapshot utilities, advanced integrity helpers, etc.

// Core Models & Types
export {
  TodoStatus,
  type Todo,
  type Metrics,
  type StructuredLogEvent,
  type TodoEvent,
  type IntegrityRepairSummary,
  type IntegrityRepairAction,
  DuplicateContentError,
  InvalidTransitionError,
  ReopenWindowExpiredError,
  ReorderValidationError,
  computeMetrics,
  createLogEvent,
  createTodo,
  normalizeTags,
} from './models';

// Repository (rarely needed externally; exported for advanced callers / tests)
export { TodoRepository } from './repository';

// Service + Factory
export {
  TodoService,
  createTodoService,
  type TodoServiceConfig,
} from './service';

// Storage Adapters
export type { IStorageAdapter } from './storage/adapter';
export { MemoryStorageAdapter } from './storage/memoryAdapter';
export { FileStorageAdapter } from './storage/fileAdapter';

// Snapshot utilities (Phase 1++ initial export)
export { generateMarkdown } from './snapshot';

// Event / integrity scaffolds
export { REOPEN_WINDOW_MS, type IntegrityCheckResult } from './service';

// TODO (Phase >1): Batch operation helpers
// TODO (Phase >1): Extended integrity repair diagnostics
