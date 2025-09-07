/**
 * Phase 1++ TODO System - parity.test.ts
 *
 * Goal: Ensure functional parity (domain semantics + ordering + metrics + snapshot content invariants)
 * between MemoryStorageAdapter and FileStorageAdapter for an identical scripted scenario.
 *
 * We do NOT assert on raw IDs or timestamps (they are inherently different between runs/adapters),
 * but we DO assert on:
 *  - Final ordered sequence of (content, status, order, tags)
 *  - Metrics snapshot equality
 *  - Archive semantics (completed -> archived) parity
 *  - Tag normalization & preservation across lifecycle parity
 *
 * NOTE:
 *  - Integrity repair on init may mutate ordering or archive duplicates; scenario avoids duplicates.
 *  - Reopen window default (24h) is sufficient; reopen executed immediately (within window).
 */

import { promises as fs } from 'fs';
import {
  TodoStatus,
  createTodoService,
  MemoryStorageAdapter,
  FileStorageAdapter,
  type TodoService,
  generateMarkdown,
  type Metrics,
} from '../../src/todo';
import { normalizeTags } from '../../src/todo/models'; // internal helper for expectations if needed

interface ScenarioResult {
  projection: Array<{ content: string; status: TodoStatus; order: number; tags: string[] }>;
  metrics: Metrics;
  markdown: string;
}

const FILE_PATH = '.cache/parity-test-todos.json';

/**
 * Returns a stable projection of listTodos output (include archived) sorted by order (service already provides stable ordering).
 */
function projectServiceState(svc: TodoService): ScenarioResult {
  const list = svc.listTodos({ includeArchived: true, sort: 'order' });
  const projection = list.map(t => ({
    content: t.content,
    status: t.status,
    order: t.order,
    tags: [...t.tags],
  }));
  const metrics = svc.getMetrics();
  const markdown = generateMarkdown(list, { includeArchived: true, includeTagIndex: true });
  return { projection, metrics, markdown };
}

/**
 * Executes an identical logical scenario against a freshly created service instance.
 *
 * We execute operations referencing IDs derived from the instance itself,
 * so ID differences across adapters do NOT affect parity assertions.
 */
async function runScenario(adapterType: 'memory' | 'file'): Promise<ScenarioResult> {
  const adapter =
    adapterType === 'memory'
      ? new MemoryStorageAdapter()
      : new FileStorageAdapter(FILE_PATH);
  const svc = await createTodoService(adapter);

  // Phase 1++ scenario steps:

  // 1. Add initial todos (mix with and without tags)
  const alpha = svc.addTodo('Alpha'); // no tags
  const beta = svc.addTodo('Beta', ['Feature', 'feature']); // dedupe + lower
  const gamma = svc.addTodo('Gamma', ['Docs']);
  const delta = svc.addTodo('Delta');

  // 2. Start & complete Beta, start & complete Gamma then reopen Gamma
  svc.start(beta.id);
  svc.done(beta.id);

  svc.start(gamma.id);
  svc.done(gamma.id);
  // Reopen gamma (now pending again, completedAt retained)
  svc.reopen(gamma.id);

  // 3. Update Alpha content + add tags
  const updatedAlpha = svc.updateTodo(alpha.id, {
    content: 'Alpha Updated',
    tags: ['infra', 'Infra', '  ', 'Docs'],
  });
  // Sanity: tag normalization expectation
  expect(updatedAlpha.tags).toEqual(['infra', 'docs']);

  // 4. Add another todo with tags to influence ordering and tag index
  const zeta = svc.addTodo('Zeta', ['feature', 'New', 'new']); // expects ['feature','new']

  // 5. Reorder non-archived (completed Beta is still non-archived at this point)
  // Current statuses:
  //  - Alpha Updated (pending)
  //  - Beta (completed)
  //  - Gamma (pending after reopen)
  //  - Delta (pending)
  //  - Zeta (pending)
  const idsForReorder = [
    gamma.id, // bring reopened gamma first
    updatedAlpha.id,
    delta.id,
    zeta.id,
    beta.id, // completed toward end
  ];
  svc.reorderTodos(idsForReorder);

  // 6. Archive completed (Beta) -> moves to archived section & order normalization happens internally next operations
  svc.archiveCompletedTodos();

  // 7. Final state projection (include archived)
  const result = projectServiceState(svc);

  // 8. Validate internal invariants locally (ordering dense)
  const orders = result.projection.map(p => p.order);
  for (let i = 0; i < orders.length; i++) {
    expect(orders[i]).toBe(i);
  }

  // 9. Basic markdown presence checks (not part of parity diff yet)
  expect(result.markdown).toContain('# TODO Snapshot');
  expect(result.markdown).toContain('## Pending');
  expect(result.markdown).toContain('## Completed'); // Completed section should exist even if empty
  expect(result.markdown).toContain('## Archived');
  expect(result.markdown).toContain('## Tag Index');

  // Cleanup file adapter persistent file after use (avoid residue between test runs)
  if (adapterType === 'file') {
    // Flush any pending debounced persist by shutting down gracefully
    await svc.shutdown();
    // Best-effort remove file + possible lock/tmp artifacts
    try {
      await fs.unlink(FILE_PATH);
    } catch {
      /* ignore */
    }
    try {
      await fs.unlink(FILE_PATH + '.tmp');
    } catch {
      /* ignore */
    }
    try {
      await fs.unlink('.cache/todos.lock');
    } catch {
      /* ignore */
    }
  }

  return result;
}

describe('adapter parity (MemoryStorageAdapter vs FileStorageAdapter)', () => {
  test('scenario parity equivalence', async () => {
    const mem = await runScenario('memory');
    const file = await runScenario('file');

    // 1. Compare metrics
    expect(file.metrics).toEqual(mem.metrics);

    // 2. Compare projection length
    expect(file.projection.length).toBe(mem.projection.length);

    // 3. Compare ordered projection entries field-by-field (content, status, order, tags)
    for (let i = 0; i < mem.projection.length; i++) {
      const a = mem.projection[i];
      const b = file.projection[i];
      expect(b.content).toBe(a.content);
      expect(b.status).toBe(a.status);
      expect(b.order).toBe(a.order);
      expect(b.tags).toEqual(a.tags);
    }

    // 4. Archived item parity: exactly one archived (Beta) with same content
    const memArchived = mem.projection.filter(p => p.status === TodoStatus.Archived);
    const fileArchived = file.projection.filter(p => p.status === TodoStatus.Archived);
    expect(memArchived.length).toBe(1);
    expect(fileArchived.length).toBe(1);
    expect(memArchived[0].content).toBe('Beta');
    expect(fileArchived[0].content).toBe('Beta');

    // 5. Tag index parity (lightweight check): ensure every tag set from memory exists in file in some order
    const tagSetMem = new Set(mem.projection.flatMap(p => p.tags));
    const tagSetFile = new Set(file.projection.flatMap(p => p.tags));
    expect(tagSetFile).toEqual(tagSetMem);

    // 6. Markdown structural parity (not byte-for-byte due to timestamps). Check presence of each todo content line.
    for (const proj of mem.projection) {
      expect(file.markdown).toContain(proj.content);
      expect(mem.markdown).toContain(proj.content);
    }
  });
});