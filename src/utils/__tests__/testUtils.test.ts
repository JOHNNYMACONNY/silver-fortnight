import { jest, beforeEach, beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import {
  MockTimestamp,
  createMockDoc,
  generateMockRole,
  generateTestId,
  mockEvent,
  createChangeEvent,
  waitForMockCall,
  flushPromises,
  RoleMonitoringError,
  mockAsyncOperation
} from './testUtils';

export const createMockBatch = () => {
  const operations: any[] = [];
  return {
    set: jest.fn((ref: any, data: any) => {
      operations.push({ type: 'set', ref, data });
    }),
    update: jest.fn((ref: any, data: any) => {
      operations.push({ type: 'update', ref, data });
    }),
    delete: jest.fn((ref: any) => {
      operations.push({ type: 'delete', ref });
    }),
    commit: jest.fn<() => Promise<void>>().mockResolvedValue(void 0),
    operations
  };
};

describe('Test Utilities', () => {
  beforeAll(() => {
    jest.useFakeTimers({ advanceTimers: true });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('MockTimestamp', () => {
    const MOCK_DATE = 1747326212000;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(MOCK_DATE);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create timestamps with correct values', () => {
      const timestamp = MockTimestamp.now();
      const expectedSeconds = Math.floor(MOCK_DATE / 1000);
      
      expect(timestamp.seconds).toBe(expectedSeconds);
      expect(timestamp.nanoseconds).toBe(0);
      expect(timestamp.toMillis()).toBe(expectedSeconds * 1000);
    });

    it('should create timestamps from dates', () => {
      const testDate = new Date('2025-01-01T00:00:00Z');
      const timestamp = MockTimestamp.fromDate(testDate);
      const expectedSeconds = Math.floor(testDate.getTime() / 1000);
      
      expect(timestamp.seconds).toBe(expectedSeconds);
      expect(timestamp.nanoseconds).toBe(0);
      expect(timestamp.toMillis()).toBe(expectedSeconds * 1000);
      expect(timestamp.toDate().getTime()).toBe(expectedSeconds * 1000);
    });
  });

  describe('Document Mocks', () => {
    it('should create mock documents', () => {
      const data = { name: 'Test', value: 123 };
      const doc = createMockDoc(data);

      expect(doc.id).toBeDefined();
      expect(typeof doc.id).toBe('string');
      expect(doc.exists()).toBe(true);
      expect(doc.data()).toEqual(expect.objectContaining(data));
      expect(doc.ref.path).toContain(doc.id);
    });

    it('should preserve provided document IDs', () => {
      const customId = 'custom-id';
      const doc = createMockDoc({ id: customId, name: 'Test' });

      expect(doc.id).toBe(customId);
      expect(doc.data()).toEqual({
        id: customId,
        name: 'Test'
      });
    });
  });

  describe('Batch Operations', () => {
    it('should track batch operations', async () => {
      const batch = createMockBatch();
      const docRef = { id: 'test', path: 'test/path', set: jest.fn(), update: jest.fn(), delete: jest.fn() };
      const data = { field: 'value' };

      batch.set(docRef, data);
      batch.update(docRef, { field: 'updated' });
      batch.delete(docRef);

      expect(batch.operations).toHaveLength(3);
      expect(batch.operations).toEqual([
        { type: 'set', ref: docRef, data },
        { type: 'update', ref: docRef, data: { field: 'updated' } },
        { type: 'delete', ref: docRef }
      ]);

      await batch.commit();
      expect(batch.commit).toHaveBeenCalled();
    });
  });

  describe('Role Generation', () => {
    it('should generate mock roles with defaults', () => {
      const role = generateMockRole();

      expect(role.id).toBeDefined();
      expect(role.title).toBe('Mock Role');
      expect(role.status).toBe('active');
      expect(role.createdAt).toBeInstanceOf(MockTimestamp);
      expect(role.userId).toBeDefined();
      expect(role.collaborationId).toBeDefined();
    });

    it('should allow overriding role properties', () => {
      const customRole = generateMockRole({
        id: 'custom-id',
        title: 'Custom Role',
        status: 'pending',
        userId: 'user-123'
      });

      expect(customRole.id).toBe('custom-id');
      expect(customRole.title).toBe('Custom Role');
      expect(customRole.status).toBe('pending');
      expect(customRole.userId).toBe('user-123');
    });
  });

  describe('Event Utilities', () => {
    it('should provide mock events', () => {
      mockEvent.preventDefault();
      mockEvent.stopPropagation();

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should create change events', () => {
      const event = createChangeEvent('test value');
      expect(event.target.value).toBe('test value');
      expect(typeof event.preventDefault).toBe('function');
      expect(typeof event.stopPropagation).toBe('function');
    });
  });

  describe('Error Types', () => {
    it('should create role monitoring errors', () => {
      const error = new RoleMonitoringError('Test message', 'TEST_CODE');
      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('RoleMonitoringError');
    });
  });

  describe('Async Utilities', () => {
    it('should handle mock async operations', async () => {
      const result = 'test';
      const promise = mockAsyncOperation(result, 100);
      jest.advanceTimersByTime(100);
      const value = await promise;
      expect(value).toBe(result);
    });

    it('should wait for mock calls', async () => {
      const mock = jest.fn();
      setTimeout(() => mock('test'), 50);
      jest.advanceTimersByTime(50);
      await waitForMockCall(mock);
      expect(mock).toHaveBeenCalledWith('test');
    });

    it('should handle mock call timeouts', async () => {
      const mock = jest.fn();
      const promise = waitForMockCall(mock, 100);
      jest.advanceTimersByTime(100);
      await expect(promise).rejects.toThrow('Mock was not called within timeout');
    });

    it('should flush promises', async () => {
      let resolved = false;
      Promise.resolve().then(() => { resolved = true; });
      
      jest.runAllTimers();
      await Promise.resolve(); // Let promise queue drain
      
      expect(resolved).toBe(true);
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateTestId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should generate string IDs', () => {
      const id = generateTestId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});