// Phase 1++ TODO System - Snapshot Generation Module
// Plan Roadmap: Adds snapshot generation (markdown) ahead of broader Phase 2 features.
// Non-invasive: Pure function utilities; no side effects, no persistence.
// Future (Phase >1):
//  - Versioned snapshot payloads (binary / JSON forms)
//  - Diff snapshots (previous vs current)
//  - Event emission integration (todo_snapshot_created)
//  - CLI integration (export / snapshot command)
//  - Inclusion of integrity + anomaly summaries

import {
  Todo,
  TodoStatus,
  Metrics,
  computeMetrics,
} from './models';

// Public API (intentionally minimal for first introduction)
export interface SnapshotOptions {
  /**
   * Optional pre-computed metrics (supply to avoid recomputation if already available).
   * If omitted, metrics are computed internally from provided todos.
   */
  metrics?: Metrics;
  /**
   * Whether to include archived todos in the snapshot sections.
   * Default: true (we surface archived in its own section for completeness).
   */
  includeArchived?: boolean;
  /**
   * Optional title override for top-level heading.
   * Default: "TODO Snapshot"
   */
  title?: string;
  /**
   * Include a tag index section (aggregated counts + references).
   * Default: true
   */
  includeTagIndex?: boolean;
}

interface TagAggregate {
  count: number;
  todoIds: string[];
}

// Escapes markdown code fences inside content (defensive; low probability of need)
function escapeContent(text: string): string {
  return text.replace(/```/g, '\\`\\`\\`');
}

function formatTodoLine(t: Todo): string {
  const icon = (() => {
    switch (t.status) {
      case TodoStatus.Pending:
        return '🟡';
      case TodoStatus.InProgress:
        return '🟠';
      case TodoStatus.Completed:
        return '✅';
      case TodoStatus.Archived:
        return '📦';
    }
  })();
  const tags = t.tags.length ? ` (tags: ${t.tags.join(',')})` : '';
  return `- ${icon} [${t.id}] ${escapeContent(t.content)}${tags} (order=${t.order})`;
}

function buildTagIndex(todos: readonly Todo[]): string {
  const agg = new Map<string, TagAggregate>();
  for (const t of todos) {
    for (const tag of t.tags) {
      let a = agg.get(tag);
      if (!a) {
        a = { count: 0, todoIds: [] };
        agg.set(tag, a);
      }
      a.count++;
      a.todoIds.push(t.id);
    }
  }
  if (agg.size === 0) {
    return '_No tags present._';
  }
  const lines = [...agg.entries()]
    .sort((a, b) => {
      // Sort by descending count then alpha
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return a[0].localeCompare(b[0]);
    })
    .map(([tag, info]) => `- ${tag} (count=${info.count}) ids: ${info.todoIds.join(',')}`);
  return lines.join('\n');
}

/**
 * Generates a markdown snapshot summarizing current todos, grouped by lifecycle stage and enriched with metrics.
 *
 * Section Layout:
 *  # Title
 *  Generated timestamp
 *  ## Metrics
 *  Summary list
 *  ## Pending
 *  (items)
 *  ## In Progress
 *  (items)
 *  ## Completed
 *  (items)
 *  ## Archived (optional)
 *  (items)
 *  ## Tag Index (optional)
 *
 * Invariants:
 *  - Input todos are treated as read-only (never mutated).
 *  - Ordering inside each status group sorted ascending by 'order'.
 */
export function generateMarkdown(
  todos: readonly Todo[],
  opts: SnapshotOptions = {},
): string {
  const {
    metrics: providedMetrics,
    includeArchived = true,
    title = 'TODO Snapshot',
    includeTagIndex = true,
  } = opts;

  const metrics = providedMetrics ?? computeMetrics(todos);

  // Stable ordering across entire set by order, then createdAt fallback
  const ordered = [...todos].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const pending = ordered.filter(t => t.status === TodoStatus.Pending);
  const inProgress = ordered.filter(t => t.status === TodoStatus.InProgress);
  const completed = ordered.filter(t => t.status === TodoStatus.Completed);
  const archived = includeArchived ? ordered.filter(t => t.status === TodoStatus.Archived) : [];

  const nowIso = new Date().toISOString();

  const sections: string[] = [];

  // Header
  sections.push(`# ${title}`);
  sections.push('');
  sections.push(`Generated: ${nowIso}`);
  sections.push('');

  // Metrics
  sections.push('## Metrics');
  sections.push('');
  sections.push(`- Total: ${metrics.total}`);
  sections.push(`- Pending: ${metrics.pending}`);
  sections.push(`- In Progress: ${metrics.inProgress}`);
  sections.push(`- Completed: ${metrics.completed}`);
  sections.push(`- Archived: ${metrics.archived}`);
  sections.push(`- Active (pending + in_progress): ${metrics.active}`);
  sections.push(`- Completion Ratio: ${metrics.completionRatio.toFixed(3)}`);
  sections.push('');

  function pushGroup(title: string, list: readonly Todo[]) {
    sections.push(`## ${title}`);
    sections.push('');
    if (list.length === 0) {
      sections.push('_None_');
    } else {
      for (const t of list) {
        sections.push(formatTodoLine(t));
      }
    }
    sections.push('');
  }

  pushGroup('Pending', pending);
  pushGroup('In Progress', inProgress);
  pushGroup('Completed', completed);
  if (includeArchived) pushGroup('Archived', archived);

  if (includeTagIndex) {
    sections.push('## Tag Index');
    sections.push('');
    sections.push(buildTagIndex(ordered));
    sections.push('');
  }

  sections.push('---');
  sections.push('_End of snapshot_');

  return sections.join('\n');
}

// FUTURE TODOs:
// - TODO: export JSON snapshot variant
// - TODO: integrate with service event emitter (emit snapshot event)
// - TODO: attach integrity summary section when available
// - TODO: CLI command wiring (snapshot/export) writing to memory-bank/todo.md