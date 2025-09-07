/**
 * Phase 1 TODO System - add.test.ts
 * Covers: basic add, trimming, ordering, duplicate prevention (case-insensitive),
 * allowance after archival of original completed item.
 */

import { DuplicateContentError, TodoStatus, type Todo } from '../../src/todo';
import { createInMemoryService, addTodos } from './testUtils';

describe('addTodo', () => {
  test('adds a todo with trimmed content and pending status', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('  First Task  ');
    expect(t.content).toBe('First Task');
    expect(t.status).toBe(TodoStatus.Pending);
    expect(t.order).toBe(0);
    const t2 = svc.addTodo('Second');
    expect(t2.order).toBe(1);
    // list ordering stable
    const list = svc.listTodos({ sort: 'order' });
    expect(list.map(x => x.id)).toEqual([t.id, t2.id]);
  });

  test('prevents duplicate active content (case-insensitive)', async () => {
    const svc = await createInMemoryService();
    svc.addTodo('Write Docs');
    expect(() => svc.addTodo('write docs')).toThrow(DuplicateContentError);
  });

  test('allows same content after original archived', async () => {
    const svc = await createInMemoryService();
    const [orig] = addTodos(svc, ['Test Item']);
    // Move through lifecycle: start -> done -> archive
    svc.start(orig.id);
    svc.done(orig.id);
    const archived = svc.archiveCompletedTodos();
    expect(archived).toContain(orig.id);
    // Now adding same content should succeed (original no longer active)
    const next = svc.addTodo('test item');
    expect(next.content).toBe('test item');
    expect(next.id).not.toBe(orig.id);
  });

  test('order increments sequentially including after archive', async () => {
    const svc = await createInMemoryService();
    const a = svc.addTodo('A');
    svc.start(a.id);
    svc.done(a.id);
    svc.archiveCompletedTodos();
    const b = svc.addTodo('B');
    expect(b.order).toBeGreaterThan(a.order);
  });
});