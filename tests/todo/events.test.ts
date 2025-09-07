/**
 * Phase 1++ TODO System - Event Emission Tests
 * Tests for event emission patterns, particularly:
 * - Integrity repair anomaly events
 * - Service lifecycle events
 * - Event listener patterns
 */

import { TodoService, createTodoService } from '../../src/todo/service';
import { MemoryStorageAdapter } from '../../src/todo/storage/memoryAdapter';
import { TodoEvent, TodoStatus } from '../../src/todo/models';
import { createTodo } from '../../src/todo/models';

describe('Event Emission Tests', () => {
  let service: TodoService;
  let adapter: MemoryStorageAdapter;
  let eventLog: TodoEvent[];

  beforeEach(async () => {
    adapter = new MemoryStorageAdapter();
    service = await createTodoService(adapter);
    eventLog = [];
  });

  afterEach(async () => {
    if (service) {
      await service.shutdown();
    }
  });

  describe('integrity repair event emission', () => {
    test('emits integrity_repair event on init when anomalies are repaired', async () => {
      // Create adapter with corrupted data that will trigger repair
      const corruptedAdapter = new MemoryStorageAdapter();

      // Manually insert corrupted data (duplicate active todos)
      const todo1 = createTodo('duplicate', 0);
      const todo2 = createTodo('duplicate', 1);
      corruptedAdapter.persist([todo1, todo2]);

      // Create service and capture events
      const testService = new TodoService(corruptedAdapter);
      const events: TodoEvent[] = [];

      testService.onEvent((event) => {
        events.push(event);
      });

      await testService.init();

      // Should have emitted integrity_repair event
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'integrity_repair',
        summary: {
          actions: expect.any(Array),
          changed: true
        }
      });

      await testService.shutdown();
    });

    test('does not emit integrity_repair event when no repair needed', async () => {
      const cleanAdapter = new MemoryStorageAdapter();
      const cleanService = new TodoService(cleanAdapter);
      const events: TodoEvent[] = [];

      cleanService.onEvent((event) => {
        events.push(event);
      });

      await cleanService.init();

      // Should not have emitted any events
      expect(events).toHaveLength(0);

      await cleanService.shutdown();
    });

    test('integrity_repair event includes correct action details', async () => {
      // Create adapter with order gaps that need repair
      const gapAdapter = new MemoryStorageAdapter();

      // Create todos with order gaps
      const todo1 = createTodo('first', 0);
      const todo3 = createTodo('third', 3); // Gap at order 1 and 2
      gapAdapter.persist([todo1, todo3]);

      const gapService = new TodoService(gapAdapter);
      const events: TodoEvent[] = [];

      gapService.onEvent((event) => {
        events.push(event);
      });

      await gapService.init();

      expect(events).toHaveLength(1);
      const repairEvent = events[0] as any;
      expect(repairEvent.summary.actions).toContainEqual(
        expect.objectContaining({
          action: 'normalized_order',
          details: { reassignments: expect.any(Number) }
        })
      );

      await gapService.shutdown();
    });
  });

  describe('service event listener patterns', () => {
    test('multiple event listeners receive events', async () => {
      const listener1Events: TodoEvent[] = [];
      const listener2Events: TodoEvent[] = [];

      service.onEvent((event) => listener1Events.push(event));
      service.onEvent((event) => listener2Events.push(event));

      // Trigger an event
      service.addTodo('test task');

      expect(listener1Events).toHaveLength(1);
      expect(listener2Events).toHaveLength(1);
      expect(listener1Events[0]).toMatchObject({
        type: 'todo_added',
        todo: expect.objectContaining({ content: 'test task' })
      });
    });

    test('event listeners handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.onEvent(() => {
        throw new Error('Listener error');
      });

      // This should not throw despite listener error
      expect(() => {
        service.addTodo('test task');
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    test('event listeners receive correct snapshot data', async () => {
      let capturedSnapshot: readonly any[] = [];

      service.onEvent((event, snapshot) => {
        capturedSnapshot = snapshot;
      });

      service.addTodo('first task');
      service.addTodo('second task');

      expect(capturedSnapshot).toHaveLength(2);
      expect(capturedSnapshot.map(t => t.content)).toEqual(['first task', 'second task']);
    });
  });

  describe('lifecycle event emission', () => {
    test('emits todo_added event with correct structure', () => {
      const events: TodoEvent[] = [];

      service.onEvent((event) => events.push(event));

      const todo = service.addTodo('new task', ['tag1', 'tag2']);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'todo_added',
        todo: {
          id: todo.id,
          content: 'new task',
          status: TodoStatus.Pending,
          tags: ['tag1', 'tag2']
        }
      });
    });

    test('emits todo_updated event with before/after data', () => {
      const events: TodoEvent[] = [];

      service.onEvent((event) => events.push(event));

      const todo = service.addTodo('original content');
      service.updateTodo(todo.id, { content: 'updated content' });

      expect(events).toHaveLength(2); // add + update
      const updateEvent = events[1] as any;
      expect(updateEvent).toMatchObject({
        type: 'todo_updated',
        before: expect.objectContaining({ content: 'original content' }),
        after: expect.objectContaining({ content: 'updated content' })
      });
    });

    test('emits lifecycle transition events', () => {
      const events: TodoEvent[] = [];

      service.onEvent((event) => events.push(event));

      const todo = service.addTodo('lifecycle test');

      service.start(todo.id);
      service.done(todo.id);
      service.reopen(todo.id);

      const lifecycleEvents = events.slice(1); // Skip the add event
      expect(lifecycleEvents).toHaveLength(3);

      expect(lifecycleEvents[0]).toMatchObject({
        type: 'todo_started',
        id: todo.id
      });

      expect(lifecycleEvents[1]).toMatchObject({
        type: 'todo_completed',
        id: todo.id,
        completedAt: expect.any(String)
      });

      expect(lifecycleEvents[2]).toMatchObject({
        type: 'todo_reopened',
        id: todo.id
      });
    });

    test('emits reorder event with correct order data', () => {
      const events: TodoEvent[] = [];

      service.onEvent((event) => events.push(event));

      const todo1 = service.addTodo('first');
      const todo2 = service.addTodo('second');
      const todo3 = service.addTodo('third');

      service.reorderTodos([todo3.id, todo1.id, todo2.id]);

      const reorderEvent = events.find(e => e.type === 'todo_reordered') as any;
      expect(reorderEvent).toBeDefined();
      expect(reorderEvent.order).toEqual([todo3.id, todo1.id, todo2.id]);
    });

    test('emits archive batch event', () => {
      const events: TodoEvent[] = [];

      service.onEvent((event) => events.push(event));

      const todo1 = service.addTodo('task 1');
      const todo2 = service.addTodo('task 2');

      service.done(todo1.id);
      service.done(todo2.id);

      service.archiveCompletedTodos();

      const archiveEvent = events.find(e => e.type === 'archive_completed_batch') as any;
      expect(archiveEvent).toBeDefined();
      expect(archiveEvent.archivedIds).toHaveLength(2);
      expect(archiveEvent.archivedIds).toContain(todo1.id);
      expect(archiveEvent.archivedIds).toContain(todo2.id);
    });
  });

  describe('event emission isolation', () => {
    test('events are emitted synchronously after state changes', () => {
      const events: TodoEvent[] = [];
      let eventEmitted = false;

      service.onEvent((event) => {
        events.push(event);
        eventEmitted = true;
      });

      service.addTodo('sync test');

      // Event should be emitted immediately
      expect(eventEmitted).toBe(true);
      expect(events).toHaveLength(1);
    });

    test('event listeners do not affect service operation', () => {
      service.onEvent(() => {
        // Slow listener
        const start = Date.now();
        while (Date.now() - start < 10) {} // 10ms delay
      });

      const start = Date.now();
      const todo = service.addTodo('performance test');
      const end = Date.now();

      // Service operation should complete quickly despite slow listener
      expect(end - start).toBeLessThan(50); // Should be much faster than listener delay
      expect(todo.content).toBe('performance test');
    });
  });
});