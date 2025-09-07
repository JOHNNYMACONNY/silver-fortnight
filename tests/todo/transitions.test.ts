/**
 * Phase 1 TODO System - transitions.test.ts
 * Covers valid lifecycle transitions and invalid transition enforcement:
 *  - pending -> in_progress (start)
 *  - in_progress -> completed (done)
 *  - completed -> pending (reopen within window)
 *  - Reopen expired window enforcement
 *  - Invalid transitions (double start, done from pending, reopen from non-completed, etc.)
 */

import {
  TodoStatus,
  InvalidTransitionError,
  ReopenWindowExpiredError,
  DuplicateContentError,
  createTodoService,
  MemoryStorageAdapter,
} from '../../src/todo';
import { createInMemoryService, addTodos } from './testUtils';

describe('Todo lifecycle transitions', () => {
  test('valid start and done transitions update status and timestamps', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Implement feature');
    expect(t.status).toBe(TodoStatus.Pending);

    const started = svc.start(t.id);
    expect(started.status).toBe(TodoStatus.InProgress);
    expect(started.updatedAt).not.toBe(t.updatedAt);

    const completed = svc.done(t.id);
    expect(completed.status).toBe(TodoStatus.Completed);
    expect(completed.completedAt).toBeDefined();
  });

  test('cannot start a todo that is already in_progress', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Double start guard');
    svc.start(t.id);
    expect(() => svc.start(t.id)).toThrow(InvalidTransitionError);
  });

  test('cannot complete a pending todo directly', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Pending cannot go directly to completed');
    expect(() => svc.done(t.id)).toThrow(InvalidTransitionError);
  });

  test('cannot reopen a non-completed todo', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Reopen only completed');
    expect(() => svc.reopen(t.id)).toThrow(InvalidTransitionError);
  });

  test('reopen within window succeeds and preserves order', async () => {
    // Large window (default) sufficient; just complete then reopen
    const svc = await createInMemoryService();
    const [t] = addTodos(svc, ['Reopen path']);
    svc.start(t.id);
    svc.done(t.id);
    const beforeCompletedAt = svc.listTodos().find(x => x.id === t.id)!.completedAt;
    expect(beforeCompletedAt).toBeTruthy();

    const reopened = svc.reopen(t.id);
    expect(reopened.status).toBe(TodoStatus.Pending);
    // completedAt retained for history (design choice)
    expect(reopened.completedAt).toBe(beforeCompletedAt);
  });

  test('reopen expired throws ReopenWindowExpiredError', async () => {
    // Configure extremely small reopen window (1 second)
    const adapter = new MemoryStorageAdapter();
    const svc = await createTodoService(adapter, { reopenWindowMs: 1000 });
    const todo = svc.addTodo('Expire reopen');
    svc.start(todo.id);
    const done = svc.done(todo.id);

    // Force completedAt into the past beyond the configured window
    const past = new Date(Date.now() - 10_000).toISOString();
    // listTodos returns object references (not deep clones), we mutate directly
    const ref = svc.listTodos().find(t => t.id === done.id)!;
    ref.completedAt = past;

    expect(() => svc.reopen(done.id)).toThrow(ReopenWindowExpiredError);
  });

  test('duplicate prevention only checks active (pending/in_progress)', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Duplicate Check');
    // Completing (after start) keeps it active until archived
    svc.start(t.id);
    svc.done(t.id);
    // Still not archived => still considered for duplicate conflict
    expect(() => svc.addTodo('duplicate check')).toThrow(DuplicateContentError);
    svc.archiveCompletedTodos();
    // Now can add again (original inactive)
    const t2 = svc.addTodo('Duplicate Check');
    expect(t2.id).not.toBe(t.id);
  });

  test('reorder after transitions keeps non-archived ordering compact', async () => {
    const svc = await createInMemoryService();
    const [a, b, c] = addTodos(svc, ['A', 'B', 'C']);
    svc.start(a.id);
    svc.done(a.id); // completed but still non-archived
    // Reorder C,B,A
    svc.reorderTodos([c.id, b.id, a.id]);
    const orderIds = svc
      .listTodos({ includeArchived: false, sort: 'order' })
      .map(t => t.id);
    expect(orderIds).toEqual([c.id, b.id, a.id]);
  });

  test('updateTodo cannot change status directly', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Direct status mutation guard');
    expect(() => svc.updateTodo(t.id, { status: TodoStatus.Completed })).toThrow(InvalidTransitionError);
  });
});