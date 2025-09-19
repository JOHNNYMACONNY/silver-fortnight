// Phase 1 TODO System - CLI
// Commands: add, list|search, start, done, reopen, reorder, metrics, archive|archive-completed,
//           update, export, snapshot, integrity
// Exit Codes: 0 success | 2 domain (expected business rule violation) | 1 unexpected
// Human output by default; --json for structured JSON lines (one object per line)
//
// NOTE: Phase 1 scope only. Future TODOs:
// - TODO: Snapshot export/import
// - TODO: Watch mode / subscriptions
// - TODO: Advanced integrity diagnostics

import { FileStorageAdapter } from './storage/fileAdapter';
import { MemoryStorageAdapter } from './storage/memoryAdapter';
import { generateMarkdown } from './snapshot';
import * as fs from 'fs';
import * as path from 'path';
import {
  TodoStatus,
  DuplicateContentError,
  InvalidTransitionError,
  ReopenWindowExpiredError,
  ReorderValidationError,
  type Todo,
} from './models';
import { TodoService, createTodoService, type TodoServiceConfig } from './service';

interface CliOptions {
  json: boolean;
  storageFile?: string;
  inMemory?: boolean;
  reopenWindowHours?: number;
}

interface ParsedArgs {
  command: string | null;
  params: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const flags: Record<string, string | boolean> = {};
  const params: string[] = [];
  for (const a of args) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        const key = a.slice(2, eq);
        const value = a.slice(eq + 1);
        flags[key] = value;
      } else {
        flags[a.slice(2)] = true;
      }
    } else {
      params.push(a);
    }
  }
  const command = params.length ? params[0] : null;
  return { command, params: command ? params.slice(1) : [], flags };
}

export function buildCliOptions(parsed: ParsedArgs): CliOptions {
  return {
    json: Boolean(parsed.flags.json),
    storageFile: typeof parsed.flags.file === 'string' ? (parsed.flags.file as string) : process.env.TODO_FILE,
    inMemory: Boolean(parsed.flags.memory),
    reopenWindowHours: parsed.flags.reopenWindowHours
      ? Number(parsed.flags.reopenWindowHours)
      : undefined,
  };
}

export function output(options: CliOptions, obj: any, humanFallback: () => string) {
  if (options.json) {
    console.log(JSON.stringify(obj));
  } else {
    console.log(humanFallback());
  }
}

export function formatTodo(t: Todo): string {
  const base = `[${t.status}] #${t.order} ${t.id} :: ${t.content}`;
  if (t.status === TodoStatus.Completed) {
    return `${base} (completedAt=${t.completedAt})`;
  }
  return base;
}

export async function initService(opts: CliOptions): Promise<TodoService> {
  const adapter = opts.inMemory
    ? new MemoryStorageAdapter()
    : new FileStorageAdapter(opts.storageFile || 'todo-data.json');
  const config: TodoServiceConfig = {};
  if (opts.reopenWindowHours && !Number.isNaN(opts.reopenWindowHours)) {
    config.reopenWindowMs = opts.reopenWindowHours * 60 * 60 * 1000;
  }
  return createTodoService(adapter, config);
}

export async function cmdAdd(svc: TodoService, options: CliOptions, params: string[], flags: Record<string, string | boolean>) {
  if (!params.length) {
    throw new Error('Content required: add <content...>');
  }
  const content = params.join(' ');
  const tags = typeof flags.tags === 'string'
    ? (flags.tags as string).split(',').map(s => s.trim()).filter(Boolean)
    : undefined;
  const todo = svc.addTodo(content, tags);
  output(options, { event: 'added', todo }, () => `Added: ${formatTodo(todo)}`);
}

export async function cmdListOrSearch(command: 'list'|'search', svc: TodoService, options: CliOptions, flags: Record<string,string|boolean>) {
  const statusFlag = typeof flags.status === 'string' ? (flags.status as string) : undefined;
  const tagFlag = typeof flags.tag === 'string' ? (flags.tag as string) : undefined;
  const textFlag = typeof flags.text === 'string' ? (flags.text as string) : undefined;
  const includeArchived = Boolean(flags.includeArchived);
  let status;
  switch (statusFlag) {
    case 'pending': status = TodoStatus.Pending; break;
    case 'in_progress': status = TodoStatus.InProgress; break;
    case 'completed': status = TodoStatus.Completed; break;
    case 'archived': status = TodoStatus.Archived; break;
    case undefined: break;
    default: throw new Error(`Unknown --status value: ${statusFlag}`);
  }
  const todos = svc.listTodos({
    status,
    tag: tagFlag,
    text: textFlag,
    includeArchived,
    sort: 'order',
  });
  output(
    options,
    { event: command, count: todos.length, todos, filters: { status: statusFlag, tag: tagFlag, text: textFlag, includeArchived } },
    () => {
      if (!todos.length) return 'No todos.';
      return todos.map(formatTodo).join('\n');
    }
  );
}

export async function cmdStart(svc: TodoService, options: CliOptions, params: string[]) {
  const id = params[0];
  if (!id) throw new Error('Usage: start <id>');
  const todo = svc.start(id);
  output(options, { event: 'started', todo }, () => `Started: ${formatTodo(todo)}`);
}

export async function cmdDone(svc: TodoService, options: CliOptions, params: string[]) {
  const id = params[0];
  if (!id) throw new Error('Usage: done <id>');
  const todo = svc.done(id);
  output(options, { event: 'completed', todo }, () => `Completed: ${formatTodo(todo)}`);
}

export async function cmdReopen(svc: TodoService, options: CliOptions, params: string[]) {
  const id = params[0];
  if (!id) throw new Error('Usage: reopen <id>');
  const todo = svc.reopen(id);
  output(options, { event: 'reopened', todo }, () => `Reopened: ${formatTodo(todo)}`);
}

export async function cmdUpdate(svc: TodoService, options: CliOptions, params: string[], flags: Record<string,string|boolean>) {
  const id = params[0];
  if (!id) throw new Error('Usage: update <id> [--content=...] [--tags=tag1,tag2]');
  const patch: { content?: string; tags?: string[]|null } = {};
  if (typeof flags.content === 'string') {
    patch.content = (flags.content as string);
  }
  if (flags.tags !== undefined) {
    if (typeof flags.tags === 'string' && (flags.tags as string).length) {
      patch.tags = (flags.tags as string).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      patch.tags = [];
    }
  }
  if (!('content' in patch) && !('tags' in patch)) {
    throw new Error('No changes specified; provide --content and/or --tags');
  }
  const todo = svc.updateTodo(id, patch);
  output(options, { event: 'updated', todo }, () => `Updated: ${formatTodo(todo)}`);
}

export async function cmdReorder(svc: TodoService, options: CliOptions, params: string[]) {
  if (!params.length) throw new Error('Usage: reorder <id1,id2,id3,...>');
  const ids = params[0].split(',').map(s => s.trim()).filter(Boolean);
  svc.reorderTodos(ids);
  const todos = svc.listTodos({ includeArchived: false });
  output(
    options,
    { event: 'reordered', newOrder: todos.map(t => ({ id: t.id, order: t.order })) },
    () => 'Reordered successfully.'
  );
}

export async function cmdMetrics(svc: TodoService, options: CliOptions) {
  const metrics = svc.getMetrics();
  output(
    options,
    { event: 'metrics', metrics },
    () => `Metrics: total=${metrics.total} active=${metrics.active} completed=${metrics.completed} archived=${metrics.archived} ratio=${metrics.completionRatio}`
  );
}

export async function cmdArchive(svc: TodoService, options: CliOptions) {
  const archived = svc.archiveCompletedTodos();
  output(
    options,
    { event: 'archived_completed', archivedCount: archived.length, ids: archived },
    () => `Archived ${archived.length} completed todo(s).`
  );
}

export function help(): string {
  return `TODO CLI (Phase 1++)
Commands:
  add <content...> [--tags=tag1,tag2]       Add a new todo (tags normalized)
  update <id> [--content=..] [--tags=..]    Update content and/or tags
  list|search [--status=..] [--tag=..] [--text=substr] [--includeArchived]
                                           List todos with filters (AND-combined)
  start <id>                                pending -> in_progress
  done <id>                                 in_progress -> completed
  reopen <id>                               completed -> pending (within window)
  reorder <id1,id2,...>                     Reorder active + completed
  metrics                                   Show metrics
  archive|archive-completed                 Archive all completed todos
  export --format=md|json [--includeArchived]
                                           Export snapshot to stdout
  snapshot [--includeArchived]              Write markdown to memory-bank/todo.md
  integrity                                 Run integrity scaffold (non-mutating)
  help                                      Show help
Flags:
  --json                                    JSON line output
  --file=path                               Storage file (default: todo-data.json)
  --memory                                  In-memory (non-persistent)
  --reopenWindowHours=N                     Override reopen window hours (default 24)
  --tags=tag1,tag2                          Tag list for add/update
  --status=pending|in_progress|completed|archived
  --tag=tag                                 Single tag filter
  --text=substr                             Case-insensitive substring filter
  --includeArchived                         Include archived in list/export/snapshot
  --format=md|json                          Export format
  --help                                    Show help
Examples:
  todo add "Write docs" --tags=docs,feature
  todo list --status=pending
  todo search --text=docs
  todo update 123 --content="Refine docs" --tags=docs
  todo export --format=md > snapshot.md
  todo snapshot
  todo integrity --json
`;
}

export function mapDomainError(err: unknown): { isDomain: boolean; name: string; message: string } {
  if (
    err instanceof DuplicateContentError ||
    err instanceof InvalidTransitionError ||
    err instanceof ReopenWindowExpiredError ||
    err instanceof ReorderValidationError
  ) {
    return { isDomain: true, name: err.name, message: err.message };
  }
  return { isDomain: false, name: (err as any)?.name || 'Error', message: (err as any)?.message || String(err) };
}

export async function cmdIntegrity(svc: TodoService, options: CliOptions) {
  const result = svc.checkIntegrity();
  output(options, { event: 'integrity_check', result }, () =>
    `Integrity: total=${result.metrics.total} anomalies=${result.anomalies.length}`
  );
}

async function cmdExport(svc: TodoService, options: CliOptions, flags: Record<string,string|boolean>) {
  const format = typeof flags.format === 'string' ? (flags.format as string) : 'md';
  const includeArchived = Boolean(flags.includeArchived);
  const todos = svc.listTodos({ includeArchived, sort: 'order' });
  if (format === 'json') {
    const json = { generatedAt: new Date().toISOString(), todos, includeArchived };
    output(options, { event: 'export', format: 'json', payload: json }, () => JSON.stringify(json, null, 2));
    return;
  }
  if (format === 'md') {
    const md = generateMarkdown(todos, { includeArchived });
    if (options.json) {
      output(options, { event: 'export', format: 'md', markdown: md }, () => '');
    } else {
      console.log(md);
    }
    return;
  }
  throw new Error(`Unsupported export format: ${format}`);
}

async function ensureMemoryBankDir(): Promise<string> {
  const dir = 'memory-bank';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  return path.join(dir, 'todo.md');
}

async function cmdSnapshot(svc: TodoService, options: CliOptions, flags: Record<string,string|boolean>) {
  const includeArchived = Boolean(flags.includeArchived);
  const todos = svc.listTodos({ includeArchived, sort: 'order' });
  const md = generateMarkdown(todos, { includeArchived });
  const filePath = await ensureMemoryBankDir();
  fs.writeFileSync(filePath, md, 'utf8');
  output(options, { event: 'snapshot_written', file: filePath }, () => `Snapshot written: ${filePath}`);
}

export async function dispatch(command: string | null, params: string[], svc: TodoService, options: CliOptions, flags: Record<string,string|boolean>) {
  switch (command) {
    case 'add': return cmdAdd(svc, options, params, flags);
    case 'update': return cmdUpdate(svc, options, params, flags);
    case 'list':
    case 'search': return cmdListOrSearch(command as any, svc, options, flags);
    case 'start': return cmdStart(svc, options, params);
    case 'done': return cmdDone(svc, options, params);
    case 'reopen': return cmdReopen(svc, options, params);
    case 'reorder': return cmdReorder(svc, options, params);
    case 'metrics': return cmdMetrics(svc, options);
    case 'archive':
    case 'archive-completed': return cmdArchive(svc, options);
    case 'export': return cmdExport(svc, options, flags);
    case 'snapshot': return cmdSnapshot(svc, options, flags);
    case 'integrity': return cmdIntegrity(svc, options);
    case 'help':
    case null:
      console.log(help());
      return;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

export async function runTodoCli(argv = process.argv): Promise<number> {
  const parsed = parseArgs(argv);
  if (parsed.flags.help) {
    console.log(help());
    return 0;
  }
  const options = buildCliOptions(parsed);
  let svc: TodoService | null = null;
  try {
    svc = await initService(options);
    await dispatch(parsed.command, parsed.params, svc, options, parsed.flags);
    return 0;
  } catch (err) {
    const mapped = mapDomainError(err);
    if (options.json) {
      console.error(JSON.stringify({ error: mapped.name, message: mapped.message }));
    } else {
      console.error(mapped.isDomain ? `DomainError: ${mapped.message}` : `Error: ${mapped.message}`);
    }
    return mapped.isDomain ? 2 : 1;
  } finally {
    if (svc) {
      await svc.shutdown();
    }
  }
}

// Allow direct execution (ts-node / compiled)
if (require.main === module) {
  runTodoCli().then(code => {
    process.exit(code);
  });
}