// Phase 1 TODO System - In-Memory Storage Adapter
// Plan §3 Storage Adapters (Memory Variant)
//
// This adapter is intentionally ephemeral and suitable for tests or
// ephemeral CLI usage where persistence is not required.

import { Todo } from '../models';
import { IStorageAdapter } from './adapter';

export class MemoryStorageAdapter implements IStorageAdapter {
  private data: Todo[];

  constructor(initial?: Todo[]) {
    this.data = initial ? initial.map(t => ({ ...t })) : [];
  }

  async load(): Promise<Todo[]> {
    // Return clones to prevent external mutation of internal array
    return this.data.map(t => ({ ...t }));
  }

  async persist(todos: Todo[]): Promise<void> {
    // Replace with deep-cloned snapshot
    this.data = todos.map(t => ({ ...t }));
  }

  // No dispose needed for memory adapter, but provided for symmetry
  async dispose(): Promise<void> {
    // noop
  }
}

// TODO (Phase >1): Add optional event tracing hooks to adapters