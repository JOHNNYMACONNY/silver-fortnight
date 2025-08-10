/**
 * Migration Integration Tests
 * 
 * End-to-end tests that validate the complete migration flow,
 * including service integration, error handling, and rollback scenarios.
 */

import { MigrationServiceRegistry, migrationRegistry } from '../../services/migration/migrationRegistry';
import { TradeCompatibilityService } from '../../services/migration/tradeCompatibility';
import { ChatCompatibilityService } from '../../services/migration/chatCompatibility';

// Mock Firebase
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  runTransaction: jest.fn(),
  batch: jest.fn(),
  writeBatch: jest.fn()
} as any;

jest.mock('../../firebase-config', () => ({
  db: mockFirestore,
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

// Mock the migration status functions
jest.mock('../../services/migration', () => ({
  migrationRegistry: require('../../services/migration/migrationRegistry').migrationRegistry,
  TradeCompatibilityService: require('../../services/migration/tradeCompatibility').TradeCompatibilityService,
  ChatCompatibilityService: require('../../services/migration/chatCompatibility').ChatCompatibilityService,
  isMigrationReady: jest.fn(),
  getMigrationStatus: jest.fn(),
  Trade: {},
  TradeSkill: {},
  ChatConversation: {}
}));

const mockIsMigrationReady = require('../../services/migration').isMigrationReady as jest.Mock;
const mockGetMigrationStatus = require('../../services/migration').getMigrationStatus as jest.Mock;

describe('Migration Integration Tests', () => {
  let registry: MigrationServiceRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get fresh registry instance
    registry = MigrationServiceRegistry.getInstance();
    registry.reset();
    
    // Setup default mocks
    mockIsMigrationReady.mockReturnValue(false);
    mockGetMigrationStatus.mockReturnValue({
      migrationMode: false,
      initialized: false,
      services: { trades: false, chat: false }
    });
  });

  describe('Complete Migration Flow', () => {
    test('should handle full migration initialization sequence', async () => {
      // Step 1: Registry starts uninitialized
      expect(registry.isInitialized()).toBe(false);
      expect(mockIsMigrationReady()).toBe(false);

      // Step 2: Initialize registry
      registry.initialize(mockFirestore);
      expect(registry.isInitialized()).toBe(true);

      // Step 3: Migration becomes ready
      mockIsMigrationReady.mockReturnValue(true);
      mockGetMigrationStatus.mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });

      // Step 4: Validate services
      const validation = await registry.validateServices();
      expect(validation.trades).toBe(true);
      expect(validation.chat).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 5: Enable migration mode
      registry.enableMigrationMode();
      expect(registry.isMigrationMode()).toBe(true);

      // Step 6: Verify status
      const status = registry.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.migrationMode).toBe(true);
      expect(status.services.trades).toBe(true);
      expect(status.services.chat).toBe(true);
    });

    test('should handle migration mode transitions correctly', () => {
      registry.initialize(mockFirestore);
      
      // Test multiple mode transitions
      expect(registry.isMigrationMode()).toBe(false);
      
      registry.enableMigrationMode();
      expect(registry.isMigrationMode()).toBe(true);
      
      registry.disableMigrationMode();
      expect(registry.isMigrationMode()).toBe(false);
      
      // Test with specific mode
      registry.enableMigrationMode('PRODUCTION_MIGRATING');
      expect(registry.isMigrationMode()).toBe(true);
      
      registry.disableMigrationMode();
      expect(registry.isMigrationMode()).toBe(false);
    });

    test('should provide accurate status information throughout migration', () => {
      // Initial state
      let status = registry.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.migrationMode).toBe(false);
      expect(status.services.trades).toBe(false);
      expect(status.services.chat).toBe(false);

      // After initialization
      registry.initialize(mockFirestore);
      status = registry.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.migrationMode).toBe(false);
      expect(status.services.trades).toBe(true);
      expect(status.services.chat).toBe(true);

      // After enabling migration mode
      registry.enableMigrationMode();
      status = registry.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.migrationMode).toBe(true);
    });
  });

  describe('Service Integration', () => {
    beforeEach(() => {
      registry.initialize(mockFirestore);
      mockIsMigrationReady.mockReturnValue(true);
      mockGetMigrationStatus.mockReturnValue({
        migrationMode: true,
        initialized: true,
        services: { trades: true, chat: true }
      });
    });

    test('should integrate trade and chat services correctly', async () => {
      // Mock successful responses
      mockFirestore.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'trade-1',
            data: () => ({
              title: 'Test Trade',
              skillsOffered: [{ id: 'skill-1', name: 'Skill 1', level: 'intermediate' }],
              participants: { creator: 'user-1', participant: null },
              status: 'active'
            }),
            exists: () => true
          }
        ]
      });

      // Test trade service
      const trades = await registry.trades.queryTrades([
        { fieldPath: 'status', operator: '==', value: 'active' }
      ], 10);

      expect(trades).toHaveLength(1);
      expect(trades[0].title).toBe('Test Trade');
      expect(trades[0].compatibilityLayerUsed).toBe(true);

      // Test chat service
      const conversationData = {
        id: 'conv-1',
        participantIds: ['user-1', 'user-2'],
        type: 'direct'
      };

      const normalizedConv = registry.chat.normalizeConversationData(conversationData);
      expect(normalizedConv.participantIds).toEqual(['user-1', 'user-2']);
      expect(normalizedConv.compatibilityLayerUsed).toBe(true);
    });

    test('should handle service failures gracefully', async () => {
      // Mock service failure
      mockFirestore.getDocs.mockRejectedValue(new Error('Service unavailable'));

      try {
        await registry.trades.queryTrades([
          { fieldPath: 'status', operator: '==', value: 'active' }
        ], 10);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Service unavailable');
      }

      // Registry should still be functional
      expect(registry.isInitialized()).toBe(true);
      expect(registry.isMigrationMode()).toBe(true);
    });

    test('should validate cross-service data consistency', () => {
      const tradeData = {
        id: 'trade-123',
        title: 'Cross-service Trade',
        skillsOffered: [{ id: 'skill-1', name: 'Skill 1', level: 'expert' }],
        participants: { creator: 'user-1', participant: 'user-2' }
      };

      const conversationData = {
        id: 'conv-123',
        participantIds: ['user-1', 'user-2'],
        metadata: { tradeId: 'trade-123' }
      };

      const normalizedTrade = registry.trades.normalizeTradeData(tradeData);
      const normalizedConv = registry.chat.normalizeConversationData(conversationData);

      // Validate consistency
      expect(normalizedTrade.participants.creator).toBe(normalizedConv.participantIds[0]);
      expect(normalizedTrade.participants.participant).toBe(normalizedConv.participantIds[1]);
      expect(normalizedConv.metadata.tradeId).toBe(normalizedTrade.id);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle initialization failures', () => {
      const invalidFirestore = null;

      expect(() => {
        registry.initialize(invalidFirestore as any);
      }).toThrow();

      expect(registry.isInitialized()).toBe(false);
    });

    test('should handle service validation failures', async () => {
      registry.initialize(mockFirestore);

      // Mock service validation failure
      const originalValidate = TradeCompatibilityService.normalizeTradeData;
      TradeCompatibilityService.normalizeTradeData = jest.fn(() => {
        throw new Error('Validation failed');
      });

      const validation = await registry.validateServices();

      expect(validation.trades).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Trade service validation failed');

      // Restore original method
      TradeCompatibilityService.normalizeTradeData = originalValidate;
    });

    test('should recover from temporary service failures', async () => {
      registry.initialize(mockFirestore);
      registry.enableMigrationMode();

      // First call fails
      mockFirestore.getDocs.mockRejectedValueOnce(new Error('Temporary failure'));
      
      try {
        await registry.trades.queryTrades([
          { fieldPath: 'status', operator: '==', value: 'active' }
        ], 5);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Temporary failure');
      }

      // Second call succeeds
      mockFirestore.getDocs.mockResolvedValueOnce({
        docs: [{
          id: 'recovery-trade',
          data: () => ({ title: 'Recovery Trade' }),
          exists: () => true
        }]
      });

      const trades = await registry.trades.queryTrades([
        { fieldPath: 'status', operator: '==', value: 'active' }
      ], 5);

      expect(trades).toHaveLength(1);
      expect(trades[0].title).toBe('Recovery Trade');
    });

    test('should handle migration state corruption', () => {
      registry.initialize(mockFirestore);
      registry.enableMigrationMode();

      // Simulate state corruption
      (registry as any).initialized = false;

      expect(() => {
        registry.trades;
      }).toThrow('Migration registry not initialized');

      // Should be able to recover by re-initializing
      registry.initialize(mockFirestore);
      expect(registry.isInitialized()).toBe(true);
    });
  });

  describe('Rollback Scenarios', () => {
    test('should support clean rollback to pre-migration state', () => {
      registry.initialize(mockFirestore);
      registry.enableMigrationMode();

      expect(registry.isMigrationMode()).toBe(true);

      // Simulate rollback
      registry.disableMigrationMode();
      expect(registry.isMigrationMode()).toBe(false);

      // Should still be initialized but not in migration mode
      expect(registry.isInitialized()).toBe(true);

      const status = registry.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.migrationMode).toBe(false);
    });

    test('should handle rollback with active operations', async () => {
      registry.initialize(mockFirestore);
      registry.enableMigrationMode();

      // Start an operation
      mockFirestore.getDocs.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ docs: [] }), 100))
      );

      const queryPromise = registry.trades.queryTrades([
        { fieldPath: 'status', operator: '==', value: 'active' }
      ], 5);

      // Trigger rollback while operation is running
      registry.disableMigrationMode();

      // Operation should complete normally
      const result = await queryPromise;
      expect(Array.isArray(result)).toBe(true);

      // But registry should be in non-migration mode
      expect(registry.isMigrationMode()).toBe(false);
    });

    test('should validate data integrity after rollback', () => {
      registry.initialize(mockFirestore);
      registry.enableMigrationMode();

      const testData = {
        id: 'rollback-test',
        title: 'Rollback Test Trade',
        skillsOffered: [{ id: 'skill-1', name: 'Skill 1', level: 'intermediate' }],
        participants: { creator: 'user-1', participant: null }
      };

      // Normalize data during migration
      const duringMigration = registry.trades.normalizeTradeData(testData);
      expect(duringMigration.compatibilityLayerUsed).toBe(true);

      // Rollback
      registry.disableMigrationMode();

      // Data should still be valid after rollback
      const afterRollback = registry.trades.normalizeTradeData(testData);
      expect(afterRollback.id).toBe(testData.id);
      expect(afterRollback.title).toBe(testData.title);
      expect(afterRollback.skillsOffered).toEqual(testData.skillsOffered);
    });
  });

  describe('Concurrent Access Patterns', () => {
    test('should handle concurrent registry access', async () => {
      const concurrentInitializations = Array.from({ length: 10 }, () => 
        new Promise<void>(resolve => {
          setTimeout(() => {
            registry.initialize(mockFirestore);
            resolve();
          }, Math.random() * 10);
        })
      );

      await Promise.all(concurrentInitializations);

      // Should be initialized only once
      expect(registry.isInitialized()).toBe(true);
    });

    test('should handle concurrent mode switches', async () => {
      registry.initialize(mockFirestore);

      const modeSwitches = Array.from({ length: 20 }, (_, i) => 
        new Promise<void>(resolve => {
          setTimeout(() => {
            if (i % 2 === 0) {
              registry.enableMigrationMode();
            } else {
              registry.disableMigrationMode();
            }
            resolve();
          }, Math.random() * 50);
        })
      );

      await Promise.all(modeSwitches);

      // Registry should be in a valid state
      expect(registry.isInitialized()).toBe(true);
      expect(typeof registry.isMigrationMode()).toBe('boolean');
    });

    test('should handle concurrent service access', async () => {
      registry.initialize(mockFirestore);
      registry.enableMigrationMode();

      mockFirestore.getDocs.mockResolvedValue({ docs: [] });

      const concurrentQueries = Array.from({ length: 20 }, (_, i) => 
        registry.trades.queryTrades([
          { fieldPath: 'status', operator: '==', value: 'active' }
        ], 5)
      );

      const results = await Promise.all(concurrentQueries);

      // All queries should succeed
      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Integration with External Systems', () => {
    test('should integrate with performance monitoring', async () => {
      const performanceMetrics = {
        operations: [],
        errors: []
      };

      // Mock performance monitoring
      const originalConsoleLog = console.log;
      console.log = jest.fn((message) => {
        if (message.includes('Migration')) {
          performanceMetrics.operations.push(message);
        }
      });

      registry.initialize(mockFirestore);
      registry.enableMigrationMode();

      mockFirestore.getDocs.mockResolvedValue({
        docs: Array.from({ length: 5 }, (_, i) => ({
          id: `trade-${i}`,
          data: () => ({ title: `Trade ${i}` }),
          exists: () => true
        }))
      });

      await registry.trades.queryTrades([
        { fieldPath: 'status', operator: '==', value: 'active' }
      ], 5);

      // Restore console.log
      console.log = originalConsoleLog;

      // Should have captured performance metrics
      expect(performanceMetrics.operations.length).toBeGreaterThan(0);
    });

    test('should handle environment configuration', () => {
      const originalEnv = process.env.REACT_APP_MIGRATION_MODE;

      // Test enabling via environment
      process.env.REACT_APP_MIGRATION_MODE = 'true';
      registry.initialize(mockFirestore);
      registry.enableMigrationModeFromConfig();
      expect(registry.isMigrationMode()).toBe(true);

      // Test disabling via environment
      process.env.REACT_APP_MIGRATION_MODE = 'false';
      registry.enableMigrationModeFromConfig();
      expect(registry.isMigrationMode()).toBe(false);

      // Restore environment
      process.env.REACT_APP_MIGRATION_MODE = originalEnv;
    });

    test('should provide comprehensive status for monitoring systems', () => {
      registry.initialize(mockFirestore);
      registry.enableMigrationMode();

      const status = registry.getStatus();

      // Should include all necessary information for monitoring
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('migrationMode');
      expect(status).toHaveProperty('services');
      expect(status.services).toHaveProperty('trades');
      expect(status.services).toHaveProperty('chat');

      // Should be suitable for health checks
      const isHealthy = status.initialized && 
                        status.services.trades && 
                        status.services.chat;
      expect(isHealthy).toBe(true);
    });
  });
});
