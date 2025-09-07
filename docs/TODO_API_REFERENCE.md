# TODO System API Reference

**Last Updated**: September 2025  
**Version**: Phase 1++  
**System**: TradeYa TODO Management System

## Overview

This document provides comprehensive API reference documentation for the TradeYa TODO system, a robust task management solution with CLI interface, integrity repair, and multiple storage adapters.

## Table of Contents

1. [Core Models](#core-models)
2. [Service Layer API](#service-layer-api)
3. [Repository Layer API](#repository-layer-api)
4. [Storage Adapters](#storage-adapters)
5. [CLI Interface](#cli-interface)
6. [Error Handling](#error-handling)
7. [Type Definitions](#type-definitions)

## Core Models

### TodoItem

```typescript
interface TodoItem {
  id: string;
  content: string;
  state: TodoState;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

### TodoState

```typescript
enum TodoState {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}
```

### IntegrityAnomaly

```typescript
interface IntegrityAnomaly {
  type: IntegrityAnomalyType;
  itemId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedFix?: string;
}
```

### IntegrityAnomalyType

```typescript
enum IntegrityAnomalyType {
  DUPLICATE_ACTIVE_CONTENT = 'duplicate_active_content',
  ORDER_GAP = 'order_gap',
  INVALID_STATE = 'invalid_state',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  TIMESTAMP_DRIFT = 'timestamp_drift',
  FUTURE_TIMESTAMP = 'future_timestamp',
  NEGATIVE_DURATION = 'negative_duration',
  MALFORMED_DATA = 'malformed_data',
  ORPHANED_REFERENCE = 'orphaned_reference',
  INCONSISTENT_METADATA = 'inconsistent_metadata'
}
```

## Service Layer API

### TodoService

The main service class that orchestrates TODO operations with business logic.

#### Constructor

```typescript
constructor(repository: TodoRepository)
```

**Parameters:**
- `repository` (TodoRepository): Repository instance for data operations

#### Core Methods

##### `addTodo(content: string, tags?: string[]): Promise<TodoItem>`

Add a new TODO item.

**Parameters:**
- `content` (string): TODO content/description
- `tags` (string[], optional): Associated tags

**Returns:** `Promise<TodoItem>` - The created TODO item

**Throws:** `TodoError` for validation failures

##### `startTodo(id: string): Promise<TodoItem>`

Mark a TODO as active (in progress).

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<TodoItem>` - Updated TODO item

**Throws:** `TodoError` if item not found or invalid transition

##### `completeTodo(id: string): Promise<TodoItem>`

Mark a TODO as completed.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<TodoItem>` - Updated TODO item

**Throws:** `TodoError` if item not found or invalid transition

##### `reopenTodo(id: string): Promise<TodoItem>`

Reopen a completed TODO within the reopen window.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<TodoItem>` - Updated TODO item

**Throws:** `TodoError` if outside reopen window or invalid transition

##### `updateTodo(id: string, updates: Partial<Pick<TodoItem, 'content' | 'tags'>>): Promise<TodoItem>`

Update TODO content or tags.

**Parameters:**
- `id` (string): TODO item ID
- `updates` (object): Fields to update
  - `content` (string, optional): New content
  - `tags` (string[], optional): New tags

**Returns:** `Promise<TodoItem>` - Updated TODO item

**Throws:** `TodoError` if item not found

##### `reorderTodo(id: string, newOrder: number): Promise<TodoItem>`

Change the order/priority of a TODO item.

**Parameters:**
- `id` (string): TODO item ID
- `newOrder` (number): New order position

**Returns:** `Promise<TodoItem>` - Updated TODO item

**Throws:** `TodoError` if item not found or invalid order

##### `archiveTodo(id: string): Promise<TodoItem>`

Archive a completed TODO item.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<TodoItem>` - Updated TODO item

**Throws:** `TodoError` if item not found or not completed

##### `deleteTodo(id: string): Promise<void>`

Permanently delete a TODO item.

**Parameters:**
- `id` (string): TODO item ID

**Throws:** `TodoError` if item not found

#### Query Methods

##### `getAllTodos(): Promise<TodoItem[]>`

Get all TODO items.

**Returns:** `Promise<TodoItem[]>` - Array of all TODO items

##### `getTodoById(id: string): Promise<TodoItem | null>`

Get a specific TODO item by ID.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<TodoItem | null>` - TODO item or null if not found

##### `getTodosByState(state: TodoState): Promise<TodoItem[]>`

Get TODO items filtered by state.

**Parameters:**
- `state` (TodoState): State to filter by

**Returns:** `Promise<TodoItem[]>` - Filtered TODO items

##### `getActiveTodos(): Promise<TodoItem[]>`

Get all active TODO items.

**Returns:** `Promise<TodoItem[]>` - Active TODO items

#### Integrity Methods

##### `checkIntegrity(): Promise<IntegrityCheckResult>`

Perform integrity check on all TODO items.

**Returns:** `Promise<IntegrityCheckResult>` - Integrity check results

##### `repairIntegrity(): Promise<IntegrityRepairResult>`

Attempt to repair detected integrity issues.

**Returns:** `Promise<IntegrityRepairResult>` - Repair operation results

#### Metrics Methods

##### `getMetrics(): Promise<TodoMetrics>`

Get comprehensive TODO system metrics.

**Returns:** `Promise<TodoMetrics>` - System metrics

##### `repairIntegrity(options?: IntegrityRepairOptions): Promise<IntegrityRepairResult>`

Perform automatic integrity repairs with configurable options.

**Parameters:**
- `options` (IntegrityRepairOptions, optional): Repair configuration options

**Returns:** `Promise<IntegrityRepairResult>` - Repair operation results

##### `scheduleIntegrityRepair(intervalMs: number, options?: IntegrityRepairOptions): string`

Schedule periodic integrity repairs.

**Parameters:**
- `intervalMs` (number): Interval between repairs in milliseconds
- `options` (IntegrityRepairOptions, optional): Repair configuration options

**Returns:** `string` - Scheduled repair ID

##### `cancelScheduledRepair(id: string): boolean`

Cancel a scheduled integrity repair.

**Parameters:**
- `id` (string): Scheduled repair ID

**Returns:** `boolean` - True if cancelled successfully

##### `getIntegrityHistory(limit?: number): Promise<IntegrityRepairSummary[]>`

Get historical integrity repair summaries.

**Parameters:**
- `limit` (number, optional): Maximum number of entries to return

**Returns:** `Promise<IntegrityRepairSummary[]>` - Historical repair summaries</search>

## Repository Layer API

### TodoRepository

Abstract repository interface for TODO data operations.

#### Core CRUD Methods

##### `create(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem>`

Create a new TODO item.

**Parameters:**
- `item` (object): TODO item data without auto-generated fields

**Returns:** `Promise<TodoItem>` - Created TODO item

##### `findById(id: string): Promise<TodoItem | null>`

Find TODO item by ID.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<TodoItem | null>` - TODO item or null

##### `findAll(): Promise<TodoItem[]>`

Find all TODO items.

**Returns:** `Promise<TodoItem[]>` - All TODO items

##### `update(id: string, updates: Partial<TodoItem>): Promise<TodoItem>`

Update a TODO item.

**Parameters:**
- `id` (string): TODO item ID
- `updates` (object): Fields to update

**Returns:** `Promise<TodoItem>` - Updated TODO item

##### `delete(id: string): Promise<void>`

Delete a TODO item.

**Parameters:**
- `id` (string): TODO item ID

#### Query Methods

##### `findByState(state: TodoState): Promise<TodoItem[]>`

Find TODO items by state.

**Parameters:**
- `state` (TodoState): State to filter by

**Returns:** `Promise<TodoItem[]>` - Filtered TODO items

##### `findByTags(tags: string[]): Promise<TodoItem[]>`

Find TODO items by tags.

**Parameters:**
- `tags` (string[]): Tags to filter by

**Returns:** `Promise<TodoItem[]>` - Filtered TODO items

#### Integrity Methods

##### `detectAnomalies(): Promise<IntegrityAnomaly[]>`

Detect data integrity anomalies.

**Returns:** `Promise<IntegrityAnomaly[]>` - Detected anomalies

##### `getOrderSequence(): Promise<number[]>`

Get current order sequence for gap detection.

**Returns:** `Promise<number[]>` - Current order values

## Storage Adapters

### FileAdapter

File-based storage adapter with atomic writes and recovery.

#### Constructor

```typescript
constructor(filePath: string, options?: FileAdapterOptions)
```

**Parameters:**
- `filePath` (string): Path to storage file
- `options` (FileAdapterOptions, optional): Configuration options

#### FileAdapterOptions

```typescript
interface FileAdapterOptions {
  debounceMs?: number; // Write debouncing delay (default: 250)
  retryAttempts?: number; // Retry attempts for failed writes (default: 5)
  retryDelayMs?: number; // Delay between retries (default: 50)
}
```

#### Key Methods

##### `load(): Promise<TodoItem[]>`

Load TODO items from file with error recovery.

**Returns:** `Promise<TodoItem[]>` - Loaded TODO items

**Throws:** `StorageError` for unrecoverable errors

##### `save(items: TodoItem[]): Promise<void>`

Save TODO items to file atomically.

**Parameters:**
- `items` (TodoItem[]): Items to save

**Throws:** `StorageError` for write failures

### MemoryAdapter

In-memory storage adapter for testing and development.

#### Constructor

```typescript
constructor(initialData?: TodoItem[])
```

**Parameters:**
- `initialData` (TodoItem[], optional): Initial TODO items

## CLI Interface

### Command Functions

All CLI commands return structured results with consistent error handling.

#### `cmdAdd(content: string, tags?: string[]): Promise<CliResult<TodoItem>>`

Add a new TODO item via CLI.

**Parameters:**
- `content` (string): TODO content
- `tags` (string[], optional): Associated tags

**Returns:** `Promise<CliResult<TodoItem>>` - CLI result with created item

#### `cmdList(state?: TodoState): Promise<CliResult<TodoItem[]>>`

List TODO items via CLI.

**Parameters:**
- `state` (TodoState, optional): Filter by state

**Returns:** `Promise<CliResult<TodoItem[]>>` - CLI result with items

#### `cmdStart(id: string): Promise<CliResult<TodoItem>>`

Start a TODO item via CLI.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<CliResult<TodoItem>>` - CLI result with updated item

#### `cmdDone(id: string): Promise<CliResult<TodoItem>>`

Complete a TODO item via CLI.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<CliResult<TodoItem>>` - CLI result with updated item

#### `cmdReopen(id: string): Promise<CliResult<TodoItem>>`

Reopen a completed TODO item via CLI.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<CliResult<TodoItem>>` - CLI result with updated item

#### `cmdUpdate(id: string, content?: string, tags?: string[]): Promise<CliResult<TodoItem>>`

Update a TODO item via CLI.

**Parameters:**
- `id` (string): TODO item ID
- `content` (string, optional): New content
- `tags` (string[], optional): New tags

**Returns:** `Promise<CliResult<TodoItem>>` - CLI result with updated item

#### `cmdReorder(id: string, newOrder: number): Promise<CliResult<TodoItem>>`

Reorder a TODO item via CLI.

**Parameters:**
- `id` (string): TODO item ID
- `newOrder` (number): New order position

**Returns:** `Promise<CliResult<TodoItem>>` - CLI result with updated item

#### `cmdMetrics(): Promise<CliResult<TodoMetrics>>`

Get system metrics via CLI.

**Returns:** `Promise<CliResult<TodoMetrics>>` - CLI result with metrics

#### `cmdArchive(id: string): Promise<CliResult<TodoItem>>`

Archive a TODO item via CLI.

**Parameters:**
- `id` (string): TODO item ID

**Returns:** `Promise<CliResult<TodoItem>>` - CLI result with updated item

#### `cmdIntegrity(): Promise<CliResult<IntegrityCheckResult>>`

Check system integrity via CLI.

**Returns:** `Promise<CliResult<IntegrityCheckResult>>` - CLI result with integrity check

### CLI Result Types

```typescript
interface CliResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  exitCode: number;
}
```

## Error Handling

### TodoError

```typescript
class TodoError extends Error {
  constructor(
    message: string,
    public code: TodoErrorCode,
    public itemId?: string
  ) {
    super(message);
  }
}
```

### TodoErrorCode

```typescript
enum TodoErrorCode {
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  DUPLICATE_CONTENT = 'DUPLICATE_CONTENT',
  INVALID_ORDER = 'INVALID_ORDER',
  OUTSIDE_REOPEN_WINDOW = 'OUTSIDE_REOPEN_WINDOW',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

### StorageError

```typescript
class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public originalError?: Error
  ) {
    super(message);
  }
}
```

## Type Definitions

### IntegrityCheckResult

```typescript
interface IntegrityCheckResult {
  isValid: boolean;
  anomalies: IntegrityAnomaly[];
  summary: {
    totalItems: number;
    anomaliesFound: number;
    severityBreakdown: Record<string, number>;
  };
}
```

### IntegrityRepairResult

```typescript
interface IntegrityRepairResult {
  success: boolean;
  repairsApplied: number;
  remainingAnomalies: IntegrityAnomaly[];
  errors: string[];
}
```

### IntegrityRepairOptions

```typescript
interface IntegrityRepairOptions {
  dryRun?: boolean;
  severityLevels?: ('low' | 'medium' | 'high')[];
  anomalyTypes?: IntegrityAnomalyType[];
  maxRepairs?: number;
  emitEvents?: boolean;
}
```

### IntegrityRepairSummary

```typescript
interface IntegrityRepairSummary {
  timestamp: Date;
  repairsApplied: number;
  anomaliesFound: number;
  anomaliesRepaired: number;
  errors: string[];
  duration: number;
  severityBreakdown: Record<string, number>;
}
```

### IntegrityScheduler

```typescript
interface IntegrityScheduler {
  schedulePeriodicRepair(intervalMs: number, options?: IntegrityRepairOptions): string;
  cancelScheduledRepair(id: string): boolean;
  getScheduledRepairs(): ScheduledRepair[];
  executeScheduledRepair(id: string): Promise<IntegrityRepairResult>;
}
```

### ScheduledRepair

```typescript
interface ScheduledRepair {
  id: string;
  intervalMs: number;
  options: IntegrityRepairOptions;
  nextExecution: Date;
  lastExecution?: Date;
  enabled: boolean;
}
```</search>

### TodoMetrics

```typescript
interface TodoMetrics {
  total: number;
  byState: Record<TodoState, number>;
  completionRate: number;
  averageCompletionTime: number;
  oldestPending: TodoItem | null;
  recentActivity: {
    completedToday: number;
    completedThisWeek: number;
    createdToday: number;
  };
}
```

## Usage Examples

### Basic Service Usage

```typescript
import { TodoService } from './src/todo/service';
import { FileAdapter } from './src/todo/storage/fileAdapter';

const adapter = new FileAdapter('./todos.json');
const service = new TodoService(adapter);

// Add a new TODO
const todo = await service.addTodo('Implement user authentication', ['auth', 'security']);

// Start working on it
await service.startTodo(todo.id);

// Complete it
await service.completeTodo(todo.id);
```

### CLI Usage

```typescript
import { cmdAdd, cmdList, cmdStart, cmdDone } from './src/todo/cli';

// Add a TODO
const result = await cmdAdd('Fix login bug');
if (result.success) {
  console.log(`Added TODO: ${result.data.content}`);
}

// List all TODOs
const listResult = await cmdList();
if (listResult.success) {
  listResult.data.forEach(todo => {
    console.log(`${todo.id}: ${todo.content} [${todo.state}]`);
  });
}
```

### Repository Usage

```typescript
import { TodoRepository } from './src/todo/repository';

const repository: TodoRepository = new FileAdapter('./todos.json');

// Query operations
const activeTodos = await repository.findByState(TodoState.ACTIVE);
const taggedTodos = await repository.findByTags(['urgent', 'bug']);

// Integrity checking
const anomalies = await repository.detectAnomalies();
```

## Configuration

### Environment Variables

- `TODO_STORAGE_PATH`: Default storage file path (default: `./todos.json`)
- `TODO_REOPEN_WINDOW_HOURS`: Hours after completion to allow reopening (default: 24)
- `TODO_DEBOUNCE_MS`: Write debouncing delay in milliseconds (default: 250)

### Runtime Configuration

```typescript
const config = {
  storage: {
    path: './data/todos.json',
    debounceMs: 500,
    retryAttempts: 3
  },
  business: {
    reopenWindowHours: 48,
    maxDuplicateDistance: 3
  }
};
```

## Testing

The system includes comprehensive test suites:

- **Unit Tests**: Individual component testing with mocks
- **Integration Tests**: End-to-end CLI command testing
- **Repository Tests**: Data persistence and integrity testing

Run tests with:
```bash
npm test -- --testPathPattern=todo
```

## Performance Considerations

- File writes are debounced to reduce I/O operations
- Atomic writes prevent data corruption
- In-memory operations for fast queries
- Lazy loading for large datasets
- Efficient indexing for state-based queries

## Migration Guide

### From Phase 1 to Phase 1++

1. Update storage adapter initialization
2. Add integrity checking to existing workflows
3. Implement CLI command exports
4. Add comprehensive test coverage
5. Update error handling for new error types

## Support

For issues and questions:

- **Documentation**: This API reference
- **Tests**: Comprehensive test suite in `tests/todo/`
- **Examples**: Usage examples in this document
- **Issues**: GitHub issues for bugs and feature requests