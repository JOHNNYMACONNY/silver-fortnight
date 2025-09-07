/**
 * Phase 1 TODO System - reorder.test.ts
 * Validates reorderTodos behavior via service wrapper:
 *  - Successful reorder of non-archived (active + completed) todos
 *  - Archived todos excluded from required id list and appended after reorder
 *  - Validation errors:
 *      * length mismatch
 *      * duplicate ids
 *      * unknown / missing id
 *
 * Repository contract (src/todo/repository.ts:reorder):
 *   ids list must match exactly the set of non-archived todos (Pending | InProgress | Completed)
 *   (Archived excluded). Duplicates / unknown ids => ReorderValidationError.
 *
 * Service method simply delegates & then logs event.
 */

import {
  ReorderValidationError,
  TodoStatus,
} from '../../src/todo';
import {
  createInMemoryService,
  addTodos,
  listActiveOrdered,
  completeTodoFast,
} from './testUtils';

function activeIds(svc: any): string[] {
  return listActiveOrdered(svc).map(t => t.id);
}

describe('reorderTodos', () => {
  test('successful reorder of active (non-archived) todos', async () => {
    const svc = await createInMemoryService();
    const [a, b, c] = addTodos(svc, ['A', 'B', 'C']);
    // initial order a,b,c
    svc.reorderTodos([c.id, a.id, b.id]);
    const after = activeIds(svc);
    expect(after).toEqual([c.id, a.id, b.id]);
  });

  test('completed (but not archived) todos are included in reorder set', async () => {
    const svc = await createInMemoryService();
    const [a, b, c] = addTodos(svc, ['A', 'B', 'C']);
    // Move A to completed (still non-archived)
    svc.start(a.id);
    svc.done(a.id);
    // Reorder placing completed A last
    svc.reorderTodos([c.id, b.id, a.id]);
    expect(activeIds(svc)).toEqual([c.id, b.id, a.id]);
    const aEntity = svc.listTodos().find((t: any) => t.id === a.id)!;
    expect(aEntity.status).toBe(TodoStatus.Completed);
  });

  test('archived todos excluded from ids list and appended after reorder', async () => {
    const svc = await createInMemoryService();
    const [a, b, c, d] = addTodos(svc, ['A', 'B', 'C', 'D']);
    // Complete & archive A and D
    completeTodoFast(svc, a.id);
    completeTodoFast(svc, d.id);
    svc.archiveCompletedTodos();
    // Remaining non-archived: B, C (both pending)
    const nonArchived = svc.listTodos({ includeArchived: false, sort: 'order' }).map(t => t.id);
    expect(nonArchived.sort()).toEqual([b.id, c.id].sort());

    // Reorder active as C,B
    svc.reorderTodos([c.id, b.id]);

    const orderedAll = svc.listTodos({ includeArchived: true, sort: 'order' });
    const orderedActive = orderedAll.filter(t => t.status !== TodoStatus.Archived).map(t => t.id);
    expect(orderedActive).toEqual([c.id, b.id]);

    const archivedIds = orderedAll.filter(t => t.status === TodoStatus.Archived).map(t => t.id);
    // Archived A & D should now appear after active (order compaction)
    expect(archivedIds.sort()).toEqual([a.id, d.id].sort());
    // Ensure their order indices are greater than last active
    const lastActiveOrder = orderedAll.find(t => t.id === b.id)!.order;
    for (const arch of archivedIds) {
      const entity = orderedAll.find(t => t.id === arch)!;
      expect(entity.order).toBeGreaterThan(lastActiveOrder);
    }
  });

  test('length mismatch triggers ReorderValidationError', async () => {
    const svc = await createInMemoryService();
    const [a, b, c] = addTodos(svc, ['A', 'B', 'C']);
    // Provide only two ids (missing one)
    expect(() => svc.reorderTodos([a.id, b.id])).toThrow(ReorderValidationError);
    // Provide four ids (one extra bogus)
    expect(() => svc.reorderTodos([a.id, b.id, c.id, 'extra'])).toThrow(ReorderValidationError);
  });

  test('duplicate ids triggers ReorderValidationError', async () => {
    const svc = await createInMemoryService();
    const [a, b, c] = addTodos(svc, ['A', 'B', 'C']);
    expect(() => svc.reorderTodos([a.id, a.id, c.id])).toThrow(ReorderValidationError);
  });

  test('unknown id triggers ReorderValidationError', async () => {
    const svc = await createInMemoryService();
    const [a, b, c] = addTodos(svc, ['A', 'B', 'C']);
    expect(() => svc.reorderTodos([a.id, b.id, 'nope'])).toThrow(ReorderValidationError);
  });

  test('excluding archived id is required (including it causes length mismatch)', async () => {
    const svc = await createInMemoryService();
    const [a, b, c] = addTodos(svc, ['A', 'B', 'C']);
    completeTodoFast(svc, a.id);
    svc.archiveCompletedTodos(); // A archived
    // Current non-archived: B,C (2 items)
    // Passing archived A id plus others => length mismatch (3 vs expected 2)
    expect(() => svc.reorderTodos([a.id, b.id, c.id])).toThrow(ReorderValidationError);
    // Correct reorder list
    svc.reorderTodos([c.id, b.id]);
    expect(activeIds(svc)).toEqual([c.id, b.id]);
  });
});