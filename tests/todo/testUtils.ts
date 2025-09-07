/**
 * Test Utilities for Phase 1 TODO System
 * Provides helpers to create an in-memory service instance and seed data.
 *
 * NOTE: These utilities intentionally avoid coupling to file adapter or CLI.
 */

import {
  MemoryStorageAdapter,
  createTodoService,
  type TodoService,
  type Todo,
  TodoStatus,
} from '../../src/todo';

/**
 * Creates a fresh in-memory TodoService (already initialized & repaired).
 */
export async function createInMemoryService(opts?: {
  reopenWindowHours?: number;
}): Promise<TodoService> {
  const adapter = new MemoryStorageAdapter();
  const reopenWindowMs =
    opts?.reopenWindowHours != null ? opts.reopenWindowHours * 60 * 60 * 1000 : undefined;
  const svc = await createTodoService(adapter, { reopenWindowMs });
  return svc;
}

/**
 * Gracefully flushes and shuts down service (safe to call multiple times).
 * Included for future extension if adapters add resources.
 */
export async function shutdownService(svc: TodoService): Promise<void> {
  // @ts-ignore accessing internal method for test safety (flush ordering)
  if (typeof svc['repo']?.flush === 'function') {
    try {
      await svc['repo'].flush();
    } catch {
      /* ignore */
    }
  }
  // @ts-ignore adapter reference (not part of public API)
  const adapter = svc['adapter'];
  if (adapter && typeof adapter.dispose === 'function') {
    await adapter.dispose();
  }
}

/**
 * Creates multiple todos quickly.
 */
export function addTodos(svc: TodoService, contents: string[]): Todo[] {
  return contents.map(c => svc.addTodo(c));
}

/**
 * Advances a todo from pending -> in_progress -> completed for convenience.
 */
export function completeTodoFast(svc: TodoService, id: string): Todo {
  svc.start(id);
  return svc.done(id);
}

/**
 * Collects non-archived todos ordered by their order field (stable view).
 */
export function listActiveOrdered(svc: TodoService): readonly Todo[] {
  return svc
    .listTodos({ includeArchived: false, sort: 'order' })
    .filter(t => t.status !== TodoStatus.Archived);
}

/**
 * Simple helper to sleep (used sparingly; repository debounce may need flush timing in future tests).
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract lightweight projection for assertions.
 */
export function project(t: Todo): Pick<Todo, 'id' | 'content' | 'status' | 'order'> {
  return { id: t.id, content: t.content, status: t.status, order: t.order };
}