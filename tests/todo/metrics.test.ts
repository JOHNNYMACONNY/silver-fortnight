/**
 * Phase 1 TODO System - metrics.test.ts
 * Verifies Metrics evolution across lifecycle operations:
 *  - Empty system baseline
 *  - After adds
 *  - After start/done transitions
 *  - After archive
 *  - After further additions & new completion
 *
 * Metrics shape (src/todo/models.ts):
 *  { total, pending, inProgress, completed, archived, active, completionRatio }
 *
 * completionRatio = completed / total (archived NOT counted as completed)
 */

import {
  TodoStatus,
  createTodoService,
  MemoryStorageAdapter,
  type Metrics,
} from '../../src/todo';
import { createInMemoryService } from './testUtils';

function expectMetrics(actual: Metrics, expected: Partial<Metrics>): void {
  for (const [k, v] of Object.entries(expected)) {
    // numeric close comparison for ratio
    if (k === 'completionRatio') {
      expect(actual.completionRatio).toBeCloseTo(v as number, 10);
    } else {
      expect((actual as any)[k]).toBe(v);
    }
  }
}

describe('metrics', () => {
  test('empty service metrics all zero', async () => {
    const svc = await createInMemoryService();
    const m = svc.getMetrics();
    expectMetrics(m, {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      archived: 0,
      active: 0,
      completionRatio: 0,
    });
  });

  test('adding todos increments pending, active, total', async () => {
    const svc = await createInMemoryService();
    svc.addTodo('A');
    svc.addTodo('B');
    svc.addTodo('C');
    const m = svc.getMetrics();
    expectMetrics(m, {
      total: 3,
      pending: 3,
      inProgress: 0,
      completed: 0,
      archived: 0,
      active: 3,
      completionRatio: 0,
    });
  });

  test('start and done transitions update counters & ratio (completed counts, active drops)', async () => {
    const svc = await createInMemoryService();
    const a = svc.addTodo('A');
    const b = svc.addTodo('B');
    const c = svc.addTodo('C');
    // Start & complete A
    svc.start(a.id);
    svc.done(a.id);
    // Start (but not complete) B
    svc.start(b.id);
    let m = svc.getMetrics();
    expectMetrics(m, {
      total: 3,
      pending: 1,      // C
      inProgress: 1,   // B
      completed: 1,    // A
      archived: 0,
      active: 2,       // pending + in_progress
      completionRatio: 1 / 3,
    });

    // Complete B now
    svc.done(b.id);
    m = svc.getMetrics();
    expectMetrics(m, {
      total: 3,
      pending: 1,      // C
      inProgress: 0,
      completed: 2,    // A,B
      archived: 0,
      active: 1,
      completionRatio: 2 / 3,
    });
  });

  test('archiving completed removes them from completed and active; completionRatio recalculates', async () => {
    const svc = await createInMemoryService();
    const a = svc.addTodo('A');
    const b = svc.addTodo('B');
    svc.start(a.id);
    svc.done(a.id);
    svc.start(b.id);
    svc.done(b.id);
    let m = svc.getMetrics();
    expectMetrics(m, {
      total: 2,
      pending: 0,
      inProgress: 0,
      completed: 2,
      archived: 0,
      active: 0,
      completionRatio: 1, // 2/2
    });

    // Archive both
    svc.archiveCompletedTodos();
    m = svc.getMetrics();
    expectMetrics(m, {
      total: 2,
      pending: 0,
      inProgress: 0,
      completed: 0, // archived no longer counted as completed
      archived: 2,
      active: 0,
      completionRatio: 0, // completed / total (0/2)
    });
  });

  test('subsequent additions & new completion after archival compute correct ratio', async () => {
    // Use explicit service creation to show adapter independence
    const adapter = new MemoryStorageAdapter();
    const svc = await createTodoService(adapter);
    // Add & complete one
    const a = svc.addTodo('A');
    svc.start(a.id);
    svc.done(a.id);
    // Archive it
    svc.archiveCompletedTodos();
    let m = svc.getMetrics();
    expectMetrics(m, {
      total: 1,
      archived: 1,
      completed: 0,
      completionRatio: 0,
    });

    // Add three new pending
    const b = svc.addTodo('B');
    const c = svc.addTodo('C');
    const d = svc.addTodo('D');
    m = svc.getMetrics();
    expectMetrics(m, {
      total: 4,
      pending: 3,
      completed: 0,
      archived: 1,
      active: 3,
      completionRatio: 0,
    });

    // Complete one of the new
    svc.start(b.id);
    svc.done(b.id);
    m = svc.getMetrics();
    expectMetrics(m, {
      total: 4,
      pending: 2,
      inProgress: 0,
      completed: 1,
      archived: 1,
      active: 2,
      completionRatio: 1 / 4,
    });
  });

  test('completionRatio stays 0 until first completion regardless of additions', async () => {
    const svc = await createInMemoryService();
    for (let i = 0; i < 5; i++) {
      svc.addTodo(`Task ${i}`);
    }
    const m = svc.getMetrics();
    expect(m.completionRatio).toBe(0);
    expect(m.completed).toBe(0);
    expect(m.total).toBe(5);
  });
});