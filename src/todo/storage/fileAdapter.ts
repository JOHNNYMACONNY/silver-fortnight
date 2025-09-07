// Phase 1 TODO System - File Storage Adapter
// Plan §3 Storage Adapters (File Variant)
// Responsibilities (Phase 1 subset):
//  - Provide durable persistence to JSON file (default .cache/todos.json)
//  - Atomic writes via temp file + rename
//  - Simple lock (.cache/todos.lock) with retry/backoff (5 attempts × 50ms)
//  - Temp recovery on load (recover from *.tmp if primary missing; discard if primary present)
//  - Compact JSON (no pretty printing)
//  - No advanced snapshot / append log yet (TODO future phase)

import { promises as fs } from 'fs';
import * as path from 'path';
import { IStorageAdapter } from './adapter';
import { Todo } from '../models';

interface PersistOptions {
  attempts?: number;
  backoffMs?: number;
}

const DEFAULT_ATTEMPTS = 5;
const DEFAULT_BACKOFF_MS = 50;
const STORAGE_VERSION = 1;

interface VersionedPayloadV1 {
  version: number;
  todos: Todo[];
}

export class FileStorageAdapter implements IStorageAdapter {
  private readonly filePath: string;
  private readonly dir: string;
  private readonly tmpPath: string;
  private readonly lockPath: string;

  constructor(filePath = '.cache/todos.json') {
    this.filePath = filePath;
    this.dir = path.dirname(filePath);
    this.tmpPath = this.filePath + '.tmp';
    this.lockPath = path.join(this.dir, 'todos.lock');
  }

  //////////////////////
  // Public API
  //////////////////////

  async load(): Promise<Todo[]> {
    await this.ensureDirectory();
    await this.recoverIfNecessary();

    try {
      const data = await fs.readFile(this.filePath, 'utf8').catch(err => {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          return '[]';
        }
        throw err;
      });
      if (!data.trim()) return [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch (parseErr) {
        // Attempt recovery from backup if available
        const backupData = await this.tryLoadBackup();
        if (backupData) {
          console.warn('Recovered from backup due to JSON parse error:', parseErr);
          return backupData;
        }
        console.error('JSON parse error and no backup available:', parseErr);
        return [];
      }

      let todos: Todo[] = [];

      // Backward compatibility: legacy plain array
      if (Array.isArray(parsed)) {
        todos = parsed as Todo[];
      }
      // Versioned wrapper form { version: number, todos: [...] }
      else if (parsed && typeof parsed === 'object') {
        const obj = parsed as Partial<VersionedPayloadV1>;
        if (Array.isArray(obj.todos)) {
          todos = obj.todos as Todo[];
        }
      }

      // Validate and sanitize loaded data
      const validatedTodos = this.validateAndSanitizeTodos(todos);
      if (validatedTodos.length !== todos.length) {
        console.warn(`Sanitized ${todos.length - validatedTodos.length} invalid todos during load`);
      }

      // Create backup of successfully loaded data
      await this.createBackup(validatedTodos);

      return validatedTodos;
    } catch (err) {
      // Attempt emergency recovery
      const backupData = await this.tryLoadBackup();
      if (backupData) {
        console.warn('Emergency recovery from backup due to load error:', err);
        return backupData;
      }
      throw err;
    }
  }

  async persist(todos: Todo[], opts: PersistOptions = {}): Promise<void> {
    await this.ensureDirectory();
    const attempts = opts.attempts ?? DEFAULT_ATTEMPTS;
    const backoffMs = opts.backoffMs ?? DEFAULT_BACKOFF_MS;

    // Always write versioned wrapper (v1). Provides forward compatibility for future schema changes.
    const payloadObject: VersionedPayloadV1 = { version: STORAGE_VERSION, todos };
    const payload = JSON.stringify(payloadObject);

    for (let i = 0; i < attempts; i++) {
      const locked = await this.tryAcquireLock();
      if (!locked) {
        if (i === attempts - 1) {
          throw new Error('Failed to acquire todo file lock after retries');
        }
        await delay(backoffMs);
        continue;
      }
      try {
        await fs.writeFile(this.tmpPath, payload, 'utf8');
        // fsync durability (optional - omitted Phase 1 for simplicity)
        await fs.rename(this.tmpPath, this.filePath);
        return;
      } finally {
        await this.releaseLock();
        // Best-effort cleanup if tmp remains
        await safeUnlink(this.tmpPath);
      }
    }
  }

  // Optional cleanup (nothing persistent to close here)
  // eslint-disable-next-line @typescript-eslint/require-await
  async dispose(): Promise<void> {
    // No persistent handles. Attempt to remove stale tmp if exists.
    await safeUnlink(this.tmpPath);
    // Do not remove regular file or lock (lock should normally be gone).
    await safeUnlink(this.lockPath);
  }

  //////////////////////
  // Internal Helpers
  //////////////////////

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  /**
   * Recovery logic:
   *  - If tmp exists and main does NOT: rename tmp -> main (assume last write crashed mid-rename)
   *  - If both exist: discard tmp (assume main is authoritative post-rename)
   */
  private async recoverIfNecessary(): Promise<void> {
    const tmpExists = await pathExists(this.tmpPath);
    if (!tmpExists) return;

    const mainExists = await pathExists(this.filePath);
    if (!mainExists) {
      try {
        await fs.rename(this.tmpPath, this.filePath);
        return;
      } catch {
        // If rename fails, leave both for future manual inspection (Phase >1 could quarantine)
      }
    } else {
      // Discard orphaned tmp
      await safeUnlink(this.tmpPath);
    }
  }

  private async tryAcquireLock(): Promise<boolean> {
    try {
      // Using exclusive flag to fail if exists
      const fd = await fs.open(this.lockPath, 'wx');
      await fd.close();
      return true;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'EEXIST') return false;
      // Other errors propagate
      throw err;
    }
  }

  private async releaseLock(): Promise<void> {
    await safeUnlink(this.lockPath);
  }

  /**
   * Validates and sanitizes loaded todos, removing invalid entries.
   */
  private validateAndSanitizeTodos(todos: Todo[]): Todo[] {
    return todos.filter(todo => {
      // Basic validation: ensure required fields exist and are valid
      if (!todo.id || typeof todo.id !== 'string' || todo.id.trim() === '') {
        console.warn('Filtering out todo with invalid id:', todo);
        return false;
      }
      if (!todo.content || typeof todo.content !== 'string') {
        console.warn('Filtering out todo with invalid content:', todo);
        return false;
      }
      if (typeof todo.order !== 'number' || todo.order < 0) {
        console.warn('Filtering out todo with invalid order:', todo);
        return false;
      }
      if (!Array.isArray(todo.tags)) {
        console.warn('Filtering out todo with invalid tags:', todo);
        return false;
      }
      if (!todo.createdAt || typeof todo.createdAt !== 'string') {
        console.warn('Filtering out todo with invalid createdAt:', todo);
        return false;
      }
      if (!todo.updatedAt || typeof todo.updatedAt !== 'string') {
        console.warn('Filtering out todo with invalid updatedAt:', todo);
        return false;
      }
      // Validate status enum
      const validStatuses = ['pending', 'in_progress', 'completed', 'archived'];
      if (!validStatuses.includes(todo.status)) {
        console.warn('Filtering out todo with invalid status:', todo);
        return false;
      }
      return true;
    });
  }

  /**
   * Creates a backup of the current valid todos.
   */
  private async createBackup(todos: Todo[]): Promise<void> {
    const backupPath = this.filePath + '.backup';
    try {
      const payloadObject: VersionedPayloadV1 = { version: STORAGE_VERSION, todos };
      const payload = JSON.stringify(payloadObject);
      await fs.writeFile(backupPath, payload, 'utf8');
    } catch (err) {
      console.warn('Failed to create backup:', err);
      // Don't throw - backup failure shouldn't break normal operation
    }
  }

  /**
   * Attempts to load from backup file.
   */
  private async tryLoadBackup(): Promise<Todo[] | null> {
    const backupPath = this.filePath + '.backup';
    try {
      const data = await fs.readFile(backupPath, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).todos)) {
        return (parsed as VersionedPayloadV1).todos;
      }
    } catch (err) {
      console.warn('Failed to load backup:', err);
    }
    return null;
  }
}

//////////////////////
// Utility Functions
//////////////////////

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function safeUnlink(p: string): Promise<void> {
  try {
    await fs.unlink(p);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

//////////////////////
// Phase 1 TODO Markers
//////////////////////

// TODO (Phase >1): Enhanced corruption handling & journal
// TODO (Phase >1): Lock contention metrics
// TODO (Phase >1): Snapshot emission integration
