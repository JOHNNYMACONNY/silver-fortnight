// Phase 1 TODO System - Storage Adapter Interface
// Plan §3 Storage Abstraction

import { Todo } from '../models';

export interface IStorageAdapter {
  /**
   * Load all todos from the underlying storage.
   * May perform recovery steps (file adapter handles tmp recovery).
   */
  load(): Promise<Todo[]>;

  /**
   * Persist the full set of todos atomically.
   */
  persist(todos: Todo[]): Promise<void>;

  /**
   * Optional cleanup (file handle release, etc.)
   */
  dispose?(): Promise<void> | void;
}

// TODO (Phase >1): Snapshot aware adapter extensions
// TODO (Phase >1): Incremental append log strategy