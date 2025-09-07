/**
 * Phase 1++ TODO System - Integrity Anomaly Classification Tests
 * Tests for detectAnomalies() method covering:
 * - duplicate_active_content scenarios
 * - order_gap detection
 * - invalid_state validation
 * - missing_required_field detection
 */

import { TodoRepository } from '../../src/todo/repository';
import { MemoryStorageAdapter } from '../../src/todo/storage/memoryAdapter';
import { TodoStatus, IntegrityAnomaly } from '../../src/todo/models';
import { createTodo } from '../../src/todo/models';

describe('Integrity Anomaly Classification', () => {
  let repo: TodoRepository;
  let adapter: MemoryStorageAdapter;

  beforeEach(async () => {
    adapter = new MemoryStorageAdapter();
    repo = new TodoRepository(adapter);
    await repo.load();
  });

  describe('duplicate_active_content anomalies', () => {
    test('detects duplicate content among pending todos', () => {
      // Create two pending todos with same content
      const todo1 = createTodo('duplicate task', 0);
      const todo2 = createTodo('duplicate task', 1);

      repo.insert(todo1);
      repo.insert(todo2);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0]).toMatchObject({
        type: 'duplicate_active_content',
        details: {
          content: 'duplicate task',
          ids: expect.arrayContaining([todo1.id, todo2.id]),
          count: 2
        }
      });
    });

    test('detects duplicate content among in_progress todos', () => {
      const todo1 = createTodo('in progress duplicate', 0);
      const todo2 = createTodo('in progress duplicate', 1);

      todo1.status = TodoStatus.InProgress;
      todo2.status = TodoStatus.InProgress;

      repo.insert(todo1);
      repo.insert(todo2);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe('duplicate_active_content');
    });

    test('detects duplicate content across pending and in_progress', () => {
      const todo1 = createTodo('mixed status duplicate', 0);
      const todo2 = createTodo('mixed status duplicate', 1);

      todo1.status = TodoStatus.Pending;
      todo2.status = TodoStatus.InProgress;

      repo.insert(todo1);
      repo.insert(todo2);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe('duplicate_active_content');
    });

    test('ignores duplicates among archived todos', () => {
      const todo1 = createTodo('archived duplicate', 0);
      const todo2 = createTodo('archived duplicate', 1);

      todo1.status = TodoStatus.Archived;
      todo2.status = TodoStatus.Archived;

      repo.insert(todo1);
      repo.insert(todo2);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(0);
    });

    test('handles case-insensitive duplicate detection', () => {
      const todo1 = createTodo('Case Sensitive Task', 0);
      const todo2 = createTodo('case sensitive task', 1);

      repo.insert(todo1);
      repo.insert(todo2);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe('duplicate_active_content');
    });

    test('handles trimmed whitespace in duplicate detection', () => {
      const todo1 = createTodo('whitespace task', 0);
      const todo2 = createTodo('  whitespace task  ', 1);

      repo.insert(todo1);
      repo.insert(todo2);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe('duplicate_active_content');
    });
  });

  describe('order_gap anomalies', () => {
    test('detects single order gap', () => {
      const todo1 = createTodo('first', 0);
      const todo2 = createTodo('second', 2); // Gap at order 1

      repo.insert(todo1);
      repo.insert(todo2);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0]).toMatchObject({
        type: 'order_gap',
        details: {
          expectedOrder: 1,
          actualOrder: 2,
          id: todo2.id
        }
      });
    });

    test('detects multiple order gaps', () => {
      const todo1 = createTodo('first', 0);
      const todo2 = createTodo('second', 3); // Gaps at 1 and 2
      const todo3 = createTodo('third', 5);  // Gap at 4

      repo.insert(todo1);
      repo.insert(todo2);
      repo.insert(todo3);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(2);
      const orderGaps = anomalies.filter(a => a.type === 'order_gap');
      expect(orderGaps).toHaveLength(2);
    });

    test('no anomalies when orders are sequential', () => {
      const todo1 = createTodo('first', 0);
      const todo2 = createTodo('second', 1);
      const todo3 = createTodo('third', 2);

      repo.insert(todo1);
      repo.insert(todo2);
      repo.insert(todo3);

      const anomalies = repo.detectAnomalies();

      const orderGaps = anomalies.filter(a => a.type === 'order_gap');
      expect(orderGaps).toHaveLength(0);
    });

    test('handles empty repository', () => {
      const anomalies = repo.detectAnomalies();
      expect(anomalies).toHaveLength(0);
    });
  });

  describe('invalid_state anomalies', () => {
    test('detects completed todo without completedAt', () => {
      const todo = createTodo('completed without timestamp', 0);
      todo.status = TodoStatus.Completed;
      todo.completedAt = null; // Should have completedAt

      repo.insert(todo);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0]).toMatchObject({
        type: 'invalid_state',
        details: {
          id: todo.id,
          issue: 'completed todo missing completedAt timestamp',
          status: TodoStatus.Completed
        }
      });
    });

    test('detects archived todo without archivedAt', () => {
      const todo = createTodo('archived without timestamp', 0);
      todo.status = TodoStatus.Archived;
      todo.archivedAt = null; // Should have archivedAt

      repo.insert(todo);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0]).toMatchObject({
        type: 'invalid_state',
        details: {
          id: todo.id,
          issue: 'archived todo missing archivedAt timestamp',
          status: TodoStatus.Archived
        }
      });
    });

    test('no anomalies for valid completed todo', () => {
      const todo = createTodo('valid completed', 0);
      todo.status = TodoStatus.Completed;
      todo.completedAt = new Date().toISOString();

      repo.insert(todo);

      const anomalies = repo.detectAnomalies();

      const invalidStates = anomalies.filter(a => a.type === 'invalid_state');
      expect(invalidStates).toHaveLength(0);
    });

    test('no anomalies for valid archived todo', () => {
      const todo = createTodo('valid archived', 0);
      todo.status = TodoStatus.Archived;
      todo.archivedAt = new Date().toISOString();

      repo.insert(todo);

      const anomalies = repo.detectAnomalies();

      const invalidStates = anomalies.filter(a => a.type === 'invalid_state');
      expect(invalidStates).toHaveLength(0);
    });
  });

  describe('missing_required_field anomalies', () => {
    test('detects missing content', () => {
      const todo = createTodo('valid content', 0);
      todo.content = ''; // Invalid empty content

      repo.insert(todo);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0]).toMatchObject({
        type: 'missing_required_field',
        details: {
          id: todo.id,
          field: 'content'
        }
      });
    });

    test('detects missing id', () => {
      const todo = createTodo('valid content', 0);
      todo.id = ''; // Invalid empty id

      repo.insert(todo);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0]).toMatchObject({
        type: 'missing_required_field',
        details: {
          id: todo.id,
          field: 'id'
        }
      });
    });

    test('detects whitespace-only content', () => {
      const todo = createTodo('   ', 0); // Whitespace-only content

      repo.insert(todo);

      const anomalies = repo.detectAnomalies();

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe('missing_required_field');
    });

    test('no anomalies for valid required fields', () => {
      const todo = createTodo('valid content', 0);

      repo.insert(todo);

      const anomalies = repo.detectAnomalies();

      const missingFields = anomalies.filter(a => a.type === 'missing_required_field');
      expect(missingFields).toHaveLength(0);
    });
  });

  describe('complex anomaly scenarios', () => {
    test('detects multiple anomaly types simultaneously', () => {
      // Create todos with various issues
      const todo1 = createTodo('duplicate', 0);
      const todo2 = createTodo('duplicate', 1); // duplicate_active_content
      const todo3 = createTodo('', 3); // missing_required_field (content) and order_gap
      const todo4 = createTodo('completed without timestamp', 2);
      todo4.status = TodoStatus.Completed;
      todo4.completedAt = null; // invalid_state

      repo.insert(todo1);
      repo.insert(todo2);
      repo.insert(todo3);
      repo.insert(todo4);

      const anomalies = repo.detectAnomalies();

      expect(anomalies.length).toBeGreaterThan(1);

      const types = anomalies.map(a => a.type);
      expect(types).toContain('duplicate_active_content');
      expect(types).toContain('missing_required_field');
      expect(types).toContain('invalid_state');
      expect(types).toContain('order_gap');
    });

    test('handles large dataset with multiple anomalies', () => {
      // Create 10 todos with various issues
      for (let i = 0; i < 10; i++) {
        const todo = createTodo(`task ${i}`, i);
        if (i % 3 === 0) {
          todo.content = ''; // missing content
        }
        if (i % 4 === 0) {
          todo.status = TodoStatus.Completed;
          todo.completedAt = null; // invalid state
        }
        repo.insert(todo);
      }

      const anomalies = repo.detectAnomalies();

      expect(anomalies.length).toBeGreaterThan(0);
      // Should detect missing fields and invalid states
      const types = anomalies.map(a => a.type);
      expect(types).toContain('missing_required_field');
      expect(types).toContain('invalid_state');
    });
  });

  describe('anomaly classification accuracy', () => {
    test('correctly classifies each anomaly type', () => {
      const duplicate1 = createTodo('dup', 0);
      const duplicate2 = createTodo('dup', 1);
      const gapTodo = createTodo('gap', 3); // Gap at 2
      const invalidCompleted = createTodo('invalid', 2);
      invalidCompleted.status = TodoStatus.Completed;
      invalidCompleted.completedAt = null;
      const missingContent = createTodo('', 4);

      repo.insert(duplicate1);
      repo.insert(duplicate2);
      repo.insert(gapTodo);
      repo.insert(invalidCompleted);
      repo.insert(missingContent);

      const anomalies = repo.detectAnomalies();

      const byType = anomalies.reduce((acc, anomaly) => {
        acc[anomaly.type] = (acc[anomaly.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(byType['duplicate_active_content']).toBe(1);
      expect(byType['order_gap']).toBe(1);
      expect(byType['invalid_state']).toBe(1);
      expect(byType['missing_required_field']).toBe(1);
    });
  });
});