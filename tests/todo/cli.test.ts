/**
 * Phase 1 TODO System - CLI Tests
 * Covers: argument parsing, flag handling, command dispatch, error mapping
 */

import { runTodoCli } from '../../src/todo/cli';
import { createInMemoryService } from './testUtils';
import { DuplicateContentError, InvalidTransitionError, ReopenWindowExpiredError, ReorderValidationError } from '../../src/todo/models';

// Mock process.argv for testing
const originalArgv = process.argv;

describe('CLI Argument Parsing', () => {
  test('parses basic command with params', () => {
    const { parseArgs } = require('../../src/todo/cli');
    const result = parseArgs(['node', 'todo', 'add', 'Test Task']);
    expect(result.command).toBe('add');
    expect(result.params).toEqual(['Test Task']);
    expect(result.flags).toEqual({});
  });

  test('parses flags with equals', () => {
    const { parseArgs } = require('../../src/todo/cli');
    const result = parseArgs(['node', 'todo', 'list', '--status=pending', '--tag=test']);
    expect(result.command).toBe('list');
    expect(result.params).toEqual([]);
    expect(result.flags).toEqual({ status: 'pending', tag: 'test' });
  });

  test('parses flags without equals', () => {
    const { parseArgs } = require('../../src/todo/cli');
    const result = parseArgs(['node', 'todo', 'list', '--json', '--includeArchived']);
    expect(result.command).toBe('list');
    expect(result.params).toEqual([]);
    expect(result.flags).toEqual({ json: true, includeArchived: true });
  });

  test('parses mixed flags and params', () => {
    const { parseArgs } = require('../../src/todo/cli');
    const result = parseArgs(['node', 'todo', 'add', 'Task', '--tags=a,b', '--json']);
    expect(result.command).toBe('add');
    expect(result.params).toEqual(['Task']);
    expect(result.flags).toEqual({ tags: 'a,b', json: true });
  });

  test('handles no command (help)', () => {
    const { parseArgs } = require('../../src/todo/cli');
    const result = parseArgs(['node', 'todo']);
    expect(result.command).toBe(null);
    expect(result.params).toEqual([]);
    expect(result.flags).toEqual({});
  });
});

describe('CLI Options Building', () => {
  test('builds default options', () => {
    const { buildCliOptions } = require('../../src/todo/cli');
    const result = buildCliOptions({ command: 'list', params: [], flags: {} });
    expect(result.json).toBe(false);
    expect(result.storageFile).toBeUndefined();
    expect(result.inMemory).toBe(false);
    expect(result.reopenWindowHours).toBeUndefined();
  });

  test('builds options with flags', () => {
    const { buildCliOptions } = require('../../src/todo/cli');
    const result = buildCliOptions({
      command: 'list',
      params: [],
      flags: { json: true, file: 'custom.json', memory: true, reopenWindowHours: '48' }
    });
    expect(result.json).toBe(true);
    expect(result.storageFile).toBe('custom.json');
    expect(result.inMemory).toBe(true);
    expect(result.reopenWindowHours).toBe(48);
  });

  test('uses env var for storage file', () => {
    const originalEnv = process.env.TODO_FILE;
    process.env.TODO_FILE = 'env-file.json';
    try {
      const { buildCliOptions } = require('../../src/todo/cli');
      const result = buildCliOptions({ command: 'list', params: [], flags: {} });
      expect(result.storageFile).toBe('env-file.json');
    } finally {
      process.env.TODO_FILE = originalEnv;
    }
  });
});

describe('CLI Command Dispatch', () => {
  let mockService: any;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    mockService = {
      addTodo: jest.fn().mockReturnValue({ id: '1', content: 'Test', status: 'pending', order: 0 }),
      listTodos: jest.fn().mockReturnValue([]),
      start: jest.fn().mockReturnValue({ id: '1', content: 'Test', status: 'in_progress' }),
      done: jest.fn().mockReturnValue({ id: '1', content: 'Test', status: 'completed' }),
      reopen: jest.fn().mockReturnValue({ id: '1', content: 'Test', status: 'pending' }),
      updateTodo: jest.fn().mockReturnValue({ id: '1', content: 'Updated', status: 'pending' }),
      reorderTodos: jest.fn(),
      getMetrics: jest.fn().mockReturnValue({ total: 0, active: 0, completed: 0, archived: 0, completionRatio: 0 }),
      archiveCompletedTodos: jest.fn().mockReturnValue([]),
      checkIntegrity: jest.fn().mockReturnValue({ metrics: { total: 0 }, anomalies: [] }),
      shutdown: jest.fn().mockResolvedValue(undefined)
    };

    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  test('dispatches add command', async () => {
    const { cmdAdd } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdAdd(mockService, options, ['Test Task'], {});
    expect(mockService.addTodo).toHaveBeenCalledWith('Test Task', undefined);
    expect(mockConsoleLog).toHaveBeenCalledWith('Added: [pending] #0 1 :: Test Task');
  });

  test('dispatches add with tags', async () => {
    const { cmdAdd } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdAdd(mockService, options, ['Test Task'], { tags: 'tag1,tag2' });
    expect(mockService.addTodo).toHaveBeenCalledWith('Test Task', ['tag1', 'tag2']);
  });

  test('dispatches list command', async () => {
    const { cmdListOrSearch } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdListOrSearch('list', mockService, options, {});
    expect(mockService.listTodos).toHaveBeenCalledWith({
      status: undefined,
      tag: undefined,
      text: undefined,
      includeArchived: false,
      sort: 'order'
    });
  });

  test('dispatches list with filters', async () => {
    const { cmdListOrSearch } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdListOrSearch('list', mockService, options, { status: 'pending', tag: 'test', includeArchived: true });
    expect(mockService.listTodos).toHaveBeenCalledWith({
      status: 'pending',
      tag: 'test',
      text: undefined,
      includeArchived: true,
      sort: 'order'
    });
  });

  test('dispatches start command', async () => {
    const { cmdStart } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdStart(mockService, options, ['123']);
    expect(mockService.start).toHaveBeenCalledWith('123');
    expect(mockConsoleLog).toHaveBeenCalledWith('Started: [in_progress] #0 1 :: Test');
  });

  test('dispatches done command', async () => {
    const { cmdDone } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdDone(mockService, options, ['123']);
    expect(mockService.done).toHaveBeenCalledWith('123');
    expect(mockConsoleLog).toHaveBeenCalledWith('Completed: [completed] #0 1 :: Test');
  });

  test('dispatches reopen command', async () => {
    const { cmdReopen } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdReopen(mockService, options, ['123']);
    expect(mockService.reopen).toHaveBeenCalledWith('123');
    expect(mockConsoleLog).toHaveBeenCalledWith('Reopened: [pending] #0 1 :: Test');
  });

  test('dispatches update command', async () => {
    const { cmdUpdate } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdUpdate(mockService, options, ['123'], { content: 'New Content' });
    expect(mockService.updateTodo).toHaveBeenCalledWith('123', { content: 'New Content' });
    expect(mockConsoleLog).toHaveBeenCalledWith('Updated: [pending] #0 1 :: Updated');
  });

  test('dispatches reorder command', async () => {
    const { cmdReorder } = require('../../src/todo/cli');
    const options = { json: false };
    mockService.listTodos.mockReturnValue([{ id: '1', order: 0 }, { id: '2', order: 1 }]);
    await cmdReorder(mockService, options, ['2,1']);
    expect(mockService.reorderTodos).toHaveBeenCalledWith(['2', '1']);
    expect(mockConsoleLog).toHaveBeenCalledWith('Reordered successfully.');
  });

  test('dispatches metrics command', async () => {
    const { cmdMetrics } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdMetrics(mockService, options);
    expect(mockService.getMetrics).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith('Metrics: total=0 active=0 completed=0 archived=0 ratio=0');
  });

  test('dispatches archive command', async () => {
    const { cmdArchive } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdArchive(mockService, options);
    expect(mockService.archiveCompletedTodos).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith('Archived 0 completed todo(s).');
  });

  test('dispatches integrity command', async () => {
    const { cmdIntegrity } = require('../../src/todo/cli');
    const options = { json: false };
    await cmdIntegrity(mockService, options);
    expect(mockService.checkIntegrity).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith('Integrity: total=0 anomalies=0');
  });
});

describe('CLI Error Handling', () => {
  test('maps domain errors correctly', () => {
    const { mapDomainError } = require('../../src/todo/cli');

    const duplicateError = new DuplicateContentError('Duplicate content');
    expect(mapDomainError(duplicateError)).toEqual({
      isDomain: true,
      name: 'DuplicateContentError',
      message: 'Duplicate content'
    });

    const transitionError = new InvalidTransitionError('Invalid transition');
    expect(mapDomainError(transitionError)).toEqual({
      isDomain: true,
      name: 'InvalidTransitionError',
      message: 'Invalid transition'
    });

    const reopenError = new ReopenWindowExpiredError('Reopen window expired');
    expect(mapDomainError(reopenError)).toEqual({
      isDomain: true,
      name: 'ReopenWindowExpiredError',
      message: 'Reopen window expired'
    });

    const reorderError = new ReorderValidationError('Reorder validation failed');
    expect(mapDomainError(reorderError)).toEqual({
      isDomain: true,
      name: 'ReorderValidationError',
      message: 'Reorder validation failed'
    });

    const genericError = new Error('Generic error');
    expect(mapDomainError(genericError)).toEqual({
      isDomain: false,
      name: 'Error',
      message: 'Generic error'
    });
  });

  test('handles command errors with proper exit codes', async () => {
    const mockService = {
      addTodo: jest.fn().mockImplementation(() => {
        throw new DuplicateContentError('Duplicate content');
      }),
      shutdown: jest.fn().mockResolvedValue(undefined)
    };

    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

    try {
      process.argv = ['node', 'todo', 'add', 'duplicate'];
      await runTodoCli(['node', 'todo', 'add', 'duplicate']);
    } catch {
      // Expected to throw due to process.exit
    }

    expect(mockConsoleError).toHaveBeenCalledWith('DomainError: Duplicate content');
    expect(mockProcessExit).toHaveBeenCalledWith(2);

    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });
});

describe('CLI Output Formatting', () => {
  test('formats todo correctly', () => {
    const { formatTodo } = require('../../src/todo/cli');
    const pendingTodo = { id: '1', content: 'Test', status: 'pending', order: 0 };
    expect(formatTodo(pendingTodo)).toBe('[pending] #0 1 :: Test');

    const completedTodo = {
      id: '2',
      content: 'Done',
      status: 'completed',
      order: 1,
      completedAt: '2023-01-01T00:00:00.000Z'
    };
    expect(formatTodo(completedTodo)).toBe('[completed] #1 2 :: Done (completedAt=2023-01-01T00:00:00.000Z)');
  });

  test('outputs JSON when json flag is true', () => {
    const { output } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    output({ json: true }, { test: 'data' }, () => 'fallback');
    expect(mockConsoleLog).toHaveBeenCalledWith('{"test":"data"}');

    output({ json: false }, { test: 'data' }, () => 'fallback text');
    expect(mockConsoleLog).toHaveBeenCalledWith('fallback text');

    mockConsoleLog.mockRestore();
  });
});

describe('CLI Integration', () => {
  test('runs help command', async () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    const { runTodoCli } = require('../../src/todo/cli');

    const exitCode = await runTodoCli(['node', 'todo', '--help']);
    expect(exitCode).toBe(0);
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('TODO CLI (Phase 1++)'));

    mockConsoleLog.mockRestore();
  });

  test('handles unknown command', async () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

    const { runTodoCli } = require('../../src/todo/cli');

    try {
      await runTodoCli(['node', 'todo', 'unknown']);
    } catch {
      // Expected due to process.exit
    }

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Unknown command: unknown');
    expect(mockProcessExit).toHaveBeenCalledWith(1);

    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });
describe('CLI Integration Tests', () => {
  let testService: any;
  let originalArgv: string[];

  beforeEach(async () => {
    testService = await createInMemoryService();
    originalArgv = process.argv;
  });

  afterEach(async () => {
    if (testService) {
      await testService.shutdown();
    }
    process.argv = originalArgv;
  });

  test('add command integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    const exitCode = await runTodoCli(['node', 'todo', 'add', 'Integration Test Task', '--tags=test,integration']);
    expect(exitCode).toBe(0);

    const todos = testService.listTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0].content).toBe('Integration Test Task');
    expect(todos[0].tags).toEqual(['test', 'integration']);

    mockConsoleLog.mockRestore();
  });

  test('list command integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    // Add a todo first
    await testService.addTodo('List Test Task', ['test']);

    const exitCode = await runTodoCli(['node', 'todo', 'list']);
    expect(exitCode).toBe(0);

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('List Test Task'));

    mockConsoleLog.mockRestore();
  });

  test('start and done command integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    // Add a todo
    const todo = await testService.addTodo('Workflow Test Task');

    // Start it
    const startExitCode = await runTodoCli(['node', 'todo', 'start', todo.id]);
    expect(startExitCode).toBe(0);

    let todos = testService.listTodos();
    expect(todos[0].status).toBe('in_progress');

    // Complete it
    const doneExitCode = await runTodoCli(['node', 'todo', 'done', todo.id]);
    expect(doneExitCode).toBe(0);

    todos = testService.listTodos();
    expect(todos[0].status).toBe('completed');

    mockConsoleLog.mockRestore();
  });

  test('update command integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    // Add a todo
    const todo = await testService.addTodo('Update Test Task', ['old']);

    // Update it
    const exitCode = await runTodoCli(['node', 'todo', 'update', todo.id, '--content=Updated Task', '--tags=new,updated']);
    expect(exitCode).toBe(0);

    const todos = testService.listTodos();
    expect(todos[0].content).toBe('Updated Task');
    expect(todos[0].tags).toEqual(['new', 'updated']);

    mockConsoleLog.mockRestore();
  });

  test('reorder command integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    // Add multiple todos
    const todo1 = await testService.addTodo('First Task');
    const todo2 = await testService.addTodo('Second Task');
    const todo3 = await testService.addTodo('Third Task');

    // Reorder them
    const exitCode = await runTodoCli(['node', 'todo', 'reorder', `${todo3.id},${todo1.id},${todo2.id}`]);
    expect(exitCode).toBe(0);

    const todos = testService.listTodos();
    expect(todos[0].id).toBe(todo3.id);
    expect(todos[1].id).toBe(todo1.id);
    expect(todos[2].id).toBe(todo2.id);

    mockConsoleLog.mockRestore();
  });

  test('metrics command integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    // Add and complete a todo
    const todo = await testService.addTodo('Metrics Test Task');
    await testService.done(todo.id);

    const exitCode = await runTodoCli(['node', 'todo', 'metrics']);
    expect(exitCode).toBe(0);

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('total=1'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('completed=1'));

    mockConsoleLog.mockRestore();
  });

  test('archive command integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    // Add and complete a todo
    const todo = await testService.addTodo('Archive Test Task');
    await testService.done(todo.id);

    const exitCode = await runTodoCli(['node', 'todo', 'archive']);
    expect(exitCode).toBe(0);

    const todos = testService.listTodos({ includeArchived: false });
    expect(todos).toHaveLength(0);

    const archivedTodos = testService.listTodos({ includeArchived: true });
    expect(archivedTodos).toHaveLength(1);
    expect(archivedTodos[0].status).toBe('archived');

    mockConsoleLog.mockRestore();
  });

  test('integrity command integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    // Add a todo
    await testService.addTodo('Integrity Test Task');

    const exitCode = await runTodoCli(['node', 'todo', 'integrity']);
    expect(exitCode).toBe(0);

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Integrity:'));

    mockConsoleLog.mockRestore();
  });

  test('JSON output integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    // Add a todo
    await testService.addTodo('JSON Test Task');

    const exitCode = await runTodoCli(['node', 'todo', 'list', '--json']);
    expect(exitCode).toBe(0);

    // Should output JSON
    const lastCall = mockConsoleLog.mock.calls[mockConsoleLog.mock.calls.length - 1][0];
    const parsed = JSON.parse(lastCall);
    expect(parsed).toHaveProperty('event', 'list');
    expect(parsed).toHaveProperty('todos');
    expect(Array.isArray(parsed.todos)).toBe(true);

    mockConsoleLog.mockRestore();
  });

  test('error handling integration', async () => {
    const { runTodoCli } = require('../../src/todo/cli');
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

    try {
      // Try to start non-existent todo
      await runTodoCli(['node', 'todo', 'start', 'non-existent-id']);
    } catch {
      // Expected due to process.exit
    }

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);

    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });
});
});