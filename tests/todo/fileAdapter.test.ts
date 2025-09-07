/**
 * Phase 1++ TODO System - File Adapter Error Recovery Tests
 * Tests for FileStorageAdapter error handling and recovery:
 * - Malformed JSON recovery scenarios
 * - Lock conflict handling
 * - Backup recovery mechanisms
 */

import { FileStorageAdapter } from '../../src/todo/storage/fileAdapter';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Todo, TodoStatus } from '../../src/todo/models';
import { createTodo } from '../../src/todo/models';

// Mock fs operations for controlled testing
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    access: jest.fn(),
    unlink: jest.fn(),
    open: jest.fn(),
    stat: jest.fn(),
  },
}));

// Mock path operations
jest.mock('path', () => ({
  dirname: jest.fn(),
  join: jest.fn(),
}));

describe('File Adapter Error Recovery', () => {
  let adapter: FileStorageAdapter;
  let mockFs: jest.Mocked<typeof fs>;
  let mockPath: jest.Mocked<typeof path>;
  let testFilePath: string;
  let testDir: string;
  let tmpPath: string;
  let lockPath: string;
  let backupPath: string;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockFs = fs as jest.Mocked<typeof fs>;
    mockPath = path as jest.Mocked<typeof path>;

    testFilePath = '/tmp/test-todos.json';
    testDir = '/tmp';
    tmpPath = '/tmp/test-todos.json.tmp';
    lockPath = '/tmp/test-todos.lock';
    backupPath = '/tmp/test-todos.json.backup';

    // Setup path mocks
    mockPath.dirname.mockReturnValue(testDir);
    mockPath.join.mockImplementation((...args) => args.join('/'));

    // Create adapter
    adapter = new FileStorageAdapter(testFilePath);

    // Mock successful directory creation
    mockFs.mkdir.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Cleanup
    if (adapter && typeof (adapter as any).dispose === 'function') {
      await (adapter as any).dispose();
    }
  });

  describe('malformed JSON recovery', () => {
    test('recovers from malformed JSON using backup', async () => {
      const validTodos: Todo[] = [
        createTodo('valid task', 0),
        createTodo('another task', 1),
      ];

      // Mock file operations
      mockFs.readFile
        .mockResolvedValueOnce('corrupted json {{{') // Primary file corrupted
        .mockResolvedValueOnce(JSON.stringify({ version: 1, todos: validTodos })); // Backup valid

      mockFs.access
        .mockResolvedValueOnce(undefined) // Primary exists
        .mockResolvedValueOnce(undefined); // Backup exists

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await adapter.load();

      expect(result).toEqual(validTodos);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Recovered from backup due to JSON parse error:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    test('returns empty array when both primary and backup are malformed', async () => {
      // Mock file operations for malformed JSON
      mockFs.readFile
        .mockResolvedValueOnce('corrupted primary')
        .mockResolvedValueOnce('corrupted backup');

      mockFs.access.mockResolvedValue(undefined);

      const result = await adapter.load();

      expect(result).toEqual([]);
    });

    test('handles empty JSON gracefully', async () => {
      mockFs.readFile.mockResolvedValue('');
      mockFs.access.mockResolvedValue(undefined);

      const result = await adapter.load();

      expect(result).toEqual([]);
    });

    test('handles non-array JSON gracefully', async () => {
      mockFs.readFile.mockResolvedValue('"not an array"');
      mockFs.access.mockResolvedValue(undefined);

      const result = await adapter.load();

      expect(result).toEqual([]);
    });
  });

  describe('lock conflict handling', () => {
    test('handles lock acquisition failure with retry', async () => {
      const todos: Todo[] = [createTodo('test', 0)];

      // Mock lock file exists (EEXIST error)
      const mockFd = { close: jest.fn().mockResolvedValue(undefined) };
      (mockFs.open as jest.Mock)
        .mockRejectedValueOnce({ code: 'EEXIST' }) // First attempt fails
        .mockRejectedValueOnce({ code: 'EEXIST' }) // Second attempt fails
        .mockResolvedValueOnce(mockFd as any); // Third attempt succeeds

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);

      await adapter.persist(todos);

      expect(mockFs.open).toHaveBeenCalledTimes(3);
    });

    test('throws error after max retries on lock conflict', async () => {
      const todos: Todo[] = [createTodo('test', 0)];

      // Mock persistent lock conflicts
      (mockFs.open as jest.Mock).mockRejectedValue({ code: 'EEXIST' });
      mockFs.writeFile.mockResolvedValue(undefined);

      await expect(adapter.persist(todos)).rejects.toThrow(
        'Failed to acquire todo file lock after retries'
      );

      expect(mockFs.open).toHaveBeenCalledTimes(5); // Default attempts
    });

    test('successfully acquires lock on first try', async () => {
      const todos: Todo[] = [createTodo('test', 0)];

      const mockFd = { close: jest.fn().mockResolvedValue(undefined) };
      (mockFs.open as jest.Mock).mockResolvedValue(mockFd as any);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);

      await adapter.persist(todos);

      expect(mockFs.open).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFile).toHaveBeenCalledWith(tmpPath, expect.any(String), 'utf8');
      expect(mockFs.rename).toHaveBeenCalledWith(tmpPath, testFilePath);
    });
  });

  describe('backup recovery mechanisms', () => {
    test('creates backup on successful load', async () => {
      const todos: Todo[] = [createTodo('backup test', 0)];

      mockFs.readFile.mockResolvedValue(JSON.stringify({ version: 1, todos }));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await adapter.load();

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        backupPath,
        JSON.stringify({ version: 1, todos }),
        'utf8'
      );
    });

    test('handles backup creation failure gracefully', async () => {
      const todos: Todo[] = [createTodo('backup test', 0)];

      mockFs.readFile.mockResolvedValue(JSON.stringify({ version: 1, todos }));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile
        .mockResolvedValueOnce(undefined) // Successful load
        .mockRejectedValueOnce(new Error('Backup write failed')); // Backup fails

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await adapter.load();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to create backup:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });
  });
});