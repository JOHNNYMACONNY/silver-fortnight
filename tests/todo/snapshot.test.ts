/**
 * Phase 1++ TODO System - snapshot.test.ts
 *
 * Tests structural correctness of markdown snapshot generation (generateMarkdown):
 *  - Required sections presence
 *  - Metrics values alignment with service metrics
 *  - Tag Index aggregation (counts, ordering rule: desc count then alpha)
 *  - Archived section inclusion / exclusion based on option
 *  - Group ordering internal (order monotonic ascending)
 */

import {
  generateMarkdown,
  TodoStatus,
  createTodoService,
  MemoryStorageAdapter,
} from '../../src/todo';

function extractSection(md: string, heading: string): string | null {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(l => l.trim() === `## ${heading}`);
  if (start === -1) return null;
  const collected: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ') && line.trim() !== `## ${heading}`) break;
    collected.push(line);
  }
  return collected.join('\n');
}

describe('generateMarkdown', () => {
  test('full snapshot with archived + tag index', async () => {
    const svc = await createTodoService(new MemoryStorageAdapter());

    // Seed todos
    const tA = svc.addTodo('Write Docs', ['Docs', 'docs', '  ']); // -> docs
    const tB = svc.addTodo('Implement Feature', ['Feature', 'feature', 'FEAT']); // -> feature,feat
    const tC = svc.addTodo('Refactor Module', ['infra', 'Infra']); // -> infra
    const tD = svc.addTodo('Polish UI'); // no tags

    // Lifecycle
    svc.start(tB.id);
    svc.done(tB.id); // completed
    svc.start(tC.id); // in progress
    svc.archiveCompletedTodos(); // archive Implement Feature

    // Add another to affect tag counts
    const tE = svc.addTodo('Add Tests', ['feature', 'tests']); // feature,tests

    const todos = svc.listTodos({ includeArchived: true, sort: 'order' });
    const md = generateMarkdown(todos, { includeArchived: true, includeTagIndex: true });

    // Basic header
    expect(md).toContain('# TODO Snapshot');
    // Sections
    for (const sec of ['Metrics', 'Pending', 'In Progress', 'Completed', 'Archived', 'Tag Index']) {
      expect(md).toContain(`## ${sec}`);
    }

    // Metrics alignment
    const metrics = svc.getMetrics();
    expect(md).toContain(`- Total: ${metrics.total}`);
    expect(md).toContain(`- Pending: ${metrics.pending}`);
    expect(md).toContain(`- In Progress: ${metrics.inProgress}`);
    expect(md).toContain(`- Completed: ${metrics.completed}`);
    expect(md).toContain(`- Archived: ${metrics.archived}`);
    expect(md).toContain(`- Active (pending + in_progress): ${metrics.active}`);
    expect(md).toContain(`- Completion Ratio: ${metrics.completionRatio.toFixed(3)}`);

    // Tag index content
    const tagIndex = extractSection(md, 'Tag Index');
    expect(tagIndex).not.toBeNull();
    // expected counts:
    // feature: 2 (Implement Feature archived, Add Tests)
    // docs: 1
    // feat: 1
    // infra:1
    // tests:1
    expect(tagIndex).toContain('- feature (count=2)');
    expect(tagIndex).toContain('- docs (count=1)');
    expect(tagIndex).toContain('- feat (count=1)');
    expect(tagIndex).toContain('- infra (count=1)');
    expect(tagIndex).toContain('- tests (count=1)');

    // Ordering rule: ensure first non-empty line after potential blank is feature
    const tagLines = (tagIndex || '').split('\n').filter(l => l.startsWith('- '));
    expect(tagLines[0]).toMatch(/^- feature \(count=2\)/);

    // Archived section includes Implement Feature
    const archivedSec = extractSection(md, 'Archived');
    expect(archivedSec).toContain('Implement Feature');

    // Completed section should be _None_ because only completed was archived
    const completedSec = extractSection(md, 'Completed');
    expect(completedSec).toContain('_None_');

    // Pending section contains Write Docs, Polish UI, Add Tests
    const pendingSec = extractSection(md, 'Pending');
    expect(pendingSec).toContain('Write Docs');
    expect(pendingSec).toContain('Polish UI');
    expect(pendingSec).toContain('Add Tests');

    // In Progress section contains Refactor Module
    const inProgSec = extractSection(md, 'In Progress');
    expect(inProgSec).toContain('Refactor Module');

    // Ordering monotonic inside Pending group
    const orderNumbers = (pendingSec || '')
      .split('\n')
      .filter(l => l.startsWith('- '))
      .map(l => {
        const m = l.match(/\(order=(\d+)\)$/);
        return m ? parseInt(m[1], 10) : NaN;
      })
      .filter(n => !Number.isNaN(n));
    const sorted = [...orderNumbers].sort((a, b) => a - b);
    expect(orderNumbers).toEqual(sorted);
  });

  test('exclude archived section when includeArchived=false', async () => {
    const svc = await createTodoService(new MemoryStorageAdapter());
    const t = svc.addTodo('Archive Me');
    svc.start(t.id);
    svc.done(t.id);
    svc.archiveCompletedTodos();

    const todos = svc.listTodos({ includeArchived: true, sort: 'order' });
    const md = generateMarkdown(todos, { includeArchived: false });

    expect(md).not.toContain('## Archived');
    // Completed section should be _None_ because completed moved to archived and we excluded archived
    const completedSec = extractSection(md, 'Completed');
    expect(completedSec).toContain('_None_');
  });
});