/**
 * Migration Performance Regression Tests
 * 
 * Tests to ensure that migration compatibility layer doesn't significantly
 * impact application performance. Critical for validating production readiness.
 */

import { performance } from 'perf_hooks';
import { TradeCompatibilityService } from '../../services/migration/tradeCompatibility';
import { ChatCompatibilityService } from '../../services/migration/chatCompatibility';
import { MigrationServiceRegistry, migrationRegistry } from '../../services/migration/migrationRegistry';

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
  startAfter: jest.fn()
} as any;

jest.mock('../../firebase-config', () => ({
  db: mockFirestore,
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

// Performance benchmarks - adjust these based on your requirements
const PERFORMANCE_THRESHOLDS = {
  NORMALIZATION_TIME_MS: 5, // Time to normalize single trade
  BATCH_NORMALIZATION_TIME_MS: 100, // Time to normalize 100 trades
  QUERY_RESPONSE_TIME_MS: 500, // Maximum query response time
  MEMORY_USAGE_MB: 50, // Maximum additional memory usage
  LARGE_DATASET_TIME_MS: 1000 // Time to process 1000 items
};

// Test data generators
const generateLegacyTrade = (id: string) => ({
  id,
  title: `Legacy Trade ${id}`,
  description: `Description for legacy trade ${id}`,
  offeredSkills: ['Skill 1', 'Skill 2', 'Skill 3'],
  requestedSkills: ['Skill 4', 'Skill 5'],
  creatorId: `user-${id}`,
  participantId: Math.random() > 0.5 ? `participant-${id}` : null,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
});

const generateModernTrade = (id: string) => ({
  id,
  title: `Modern Trade ${id}`,
  description: `Description for modern trade ${id}`,
  skillsOffered: [
    { id: 'skill-1', name: 'Skill 1', level: 'intermediate' },
    { id: 'skill-2', name: 'Skill 2', level: 'advanced' },
    { id: 'skill-3', name: 'Skill 3', level: 'expert' }
  ],
  skillsWanted: [
    { id: 'skill-4', name: 'Skill 4', level: 'intermediate' },
    { id: 'skill-5', name: 'Skill 5', level: 'beginner' }
  ],
  participants: {
    creator: `user-${id}`,
    participant: Math.random() > 0.5 ? `participant-${id}` : null
  },
  status: 'active',
  schemaVersion: '2.0',
  createdAt: new Date(),
  updatedAt: new Date()
});

const generateLegacyConversation = (id: string) => ({
  id,
  type: 'direct',
  participants: [
    {
      id: `user-${id}-1`,
      name: `User ${id} One`,
      avatar: `https://example.com/avatar-${id}-1.jpg`,
      status: 'online'
    },
    {
      id: `user-${id}-2`,
      name: `User ${id} Two`,
      avatar: `https://example.com/avatar-${id}-2.jpg`,
      status: 'offline'
    }
  ],
  lastMessage: {
    text: `Message from conversation ${id}`,
    timestamp: new Date(),
    senderId: `user-${id}-1`
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

describe('Migration Performance Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset memory usage tracking
    if (global.gc) {
      global.gc();
    }
  });

  describe('Data Normalization Performance', () => {
    test('should normalize single trade within performance threshold', () => {
      const legacyTrade = generateLegacyTrade('perf-test-1');
      
      const startTime = performance.now();
      const normalized = TradeCompatibilityService.normalizeTradeData(legacyTrade);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMALIZATION_TIME_MS);
      expect(normalized).toHaveProperty('compatibilityLayerUsed', true);
      
      console.log(`Single trade normalization: ${duration.toFixed(2)}ms`);
    });

    test('should normalize batch of trades efficiently', () => {
      const trades = Array.from({ length: 100 }, (_, i) => 
        i % 2 === 0 ? generateLegacyTrade(`batch-${i}`) : generateModernTrade(`batch-${i}`)
      );
      
      const startTime = performance.now();
      const normalized = trades.map(trade => 
        TradeCompatibilityService.normalizeTradeData(trade)
      );
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_NORMALIZATION_TIME_MS);
      expect(normalized).toHaveLength(100);
      
      console.log(`Batch normalization (100 trades): ${duration.toFixed(2)}ms`);
    });

    test('should handle large datasets without performance degradation', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        generateLegacyTrade(`large-${i}`)
      );
      
      const startTime = performance.now();
      const normalized = largeDataset.map(trade => 
        TradeCompatibilityService.normalizeTradeData(trade)
      );
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_TIME_MS);
      expect(normalized).toHaveLength(1000);
      
      console.log(`Large dataset normalization (1000 trades): ${duration.toFixed(2)}ms`);
    });

    test('should normalize conversation data efficiently', () => {
      const conversations = Array.from({ length: 100 }, (_, i) => 
        generateLegacyConversation(`conv-${i}`)
      );
      
      const startTime = performance.now();
      const normalized = conversations.map(conv => 
        ChatCompatibilityService.normalizeConversationData(conv)
      );
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_NORMALIZATION_TIME_MS);
      expect(normalized).toHaveLength(100);
      
      console.log(`Conversation normalization (100 items): ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Impact', () => {
    test('should not cause significant memory increase during normalization', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and normalize large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        generateLegacyTrade(`memory-${i}`)
      );
      
      const normalized = largeDataset.map(trade => 
        TradeCompatibilityService.normalizeTradeData(trade)
      );
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB
      
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB);
      expect(normalized).toHaveLength(1000);
      
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    });

    test('should properly clean up temporary objects', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create, normalize, and discard multiple batches
      for (let batch = 0; batch < 10; batch++) {
        const trades = Array.from({ length: 100 }, (_, i) => 
          generateLegacyTrade(`cleanup-${batch}-${i}`)
        );
        
        const normalized = trades.map(trade => 
          TradeCompatibilityService.normalizeTradeData(trade)
        );
        
        // Simulate processing and discarding
        normalized.forEach(trade => {
          expect(trade.compatibilityLayerUsed).toBe(true);
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
      
      // Memory should not continuously grow
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB);
      
      console.log(`Memory after cleanup: ${memoryIncrease.toFixed(2)}MB increase`);
    });
  });

  describe('Query Performance Impact', () => {
    test('should not significantly slow down query operations', async () => {
      // Mock successful query response
      const mockTrades = Array.from({ length: 20 }, (_, i) => 
        generateModernTrade(`query-${i}`)
      );
      
      mockFirestore.getDocs.mockResolvedValue({
        docs: mockTrades.map(trade => ({
          id: trade.id,
          data: () => trade,
          exists: () => true
        }))
      });
      
      const startTime = performance.now();
      
      // Simulate the query pattern used in TradesPage
      const result = await TradeCompatibilityService.queryTrades([
        { fieldPath: 'status', operator: '==', value: 'active' },
        { fieldPath: 'createdAt', order: 'desc' }
      ], 20);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_RESPONSE_TIME_MS);
      expect(result).toHaveLength(20);
      
      console.log(`Query with normalization: ${duration.toFixed(2)}ms`);
    });

    test('should handle query errors efficiently', async () => {
      // Mock query failure
      mockFirestore.getDocs.mockRejectedValue(new Error('Firestore timeout'));
      
      const startTime = performance.now();
      
      try {
        await TradeCompatibilityService.queryTrades([
          { fieldPath: 'status', operator: '==', value: 'active' }
        ], 10);
      } catch (error) {
        // Expected error
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Error handling should be fast
      expect(duration).toBeLessThan(100);
      
      console.log(`Query error handling: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Migration Registry Performance', () => {
    test('should initialize migration registry efficiently', () => {
      const registry = MigrationServiceRegistry.getInstance();
      registry.reset(); // Ensure clean state
      
      const startTime = performance.now();
      registry.initialize(mockFirestore);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Initialization should be fast
      expect(registry.isInitialized()).toBe(true);
      
      console.log(`Migration registry initialization: ${duration.toFixed(2)}ms`);
    });

    test('should validate services efficiently', async () => {
      const registry = MigrationServiceRegistry.getInstance();
      registry.initialize(mockFirestore);
      
      const startTime = performance.now();
      const validation = await registry.validateServices();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
      expect(validation).toHaveProperty('trades');
      expect(validation).toHaveProperty('chat');
      
      console.log(`Service validation: ${duration.toFixed(2)}ms`);
    });

    test('should handle mode switching efficiently', () => {
      const registry = MigrationServiceRegistry.getInstance();
      registry.initialize(mockFirestore);
      
      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        registry.enableMigrationMode();
        registry.disableMigrationMode();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / iterations;
      
      expect(avgDuration).toBeLessThan(10); // Less than 10ms per mode switch - more realistic threshold
      
      console.log(`Mode switching (${iterations} iterations): ${avgDuration.toFixed(4)}ms average`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent normalizations efficiently', async () => {
      const concurrentOperations = 50;
      const tradesPerOperation = 20;
      
      const operations = Array.from({ length: concurrentOperations }, (_, i) => 
        new Promise<void>((resolve) => {
          setTimeout(() => {
            const trades = Array.from({ length: tradesPerOperation }, (_, j) => 
              generateLegacyTrade(`concurrent-${i}-${j}`)
            );
            
            trades.forEach(trade => 
              TradeCompatibilityService.normalizeTradeData(trade)
            );
            
            resolve();
          }, Math.random() * 10); // Random delay up to 10ms
        })
      );
      
      const startTime = performance.now();
      await Promise.all(operations);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      console.log(`Concurrent operations (${concurrentOperations} * ${tradesPerOperation}): ${duration.toFixed(2)}ms`);
    });

    test('should maintain performance under load', async () => {
      const loadTestDuration = 2000; // 2 seconds
      const operationsPerSecond = 100;
      
      let completedOperations = 0;
      const startTime = performance.now();
      
      const loadTest = setInterval(() => {
        const trade = generateLegacyTrade(`load-${completedOperations}`);
        TradeCompatibilityService.normalizeTradeData(trade);
        completedOperations++;
      }, 1000 / operationsPerSecond);
      
      await new Promise(resolve => setTimeout(resolve, loadTestDuration));
      clearInterval(loadTest);
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      const actualOpsPerSecond = (completedOperations / actualDuration) * 1000;
      
      expect(actualOpsPerSecond).toBeGreaterThan(operationsPerSecond * 0.8); // Within 20% of target
      
      console.log(`Load test: ${completedOperations} operations in ${actualDuration.toFixed(2)}ms (${actualOpsPerSecond.toFixed(2)} ops/sec)`);
    });
  });

  describe('Real-World Scenario Performance', () => {
    test('should handle TradesPage load scenario efficiently', async () => {
      // Simulate TradesPage loading with mixed data
      const trades = [
        ...Array.from({ length: 10 }, (_, i) => generateLegacyTrade(`page-legacy-${i}`)),
        ...Array.from({ length: 10 }, (_, i) => generateModernTrade(`page-modern-${i}`))
      ];
      
      mockFirestore.getDocs.mockResolvedValue({
        docs: trades.map(trade => ({
          id: trade.id,
          data: () => trade,
          exists: () => true
        }))
      });
      
      const startTime = performance.now();
      
      // Simulate complete TradesPage flow
      const queryResult = await TradeCompatibilityService.queryTrades([
        { fieldPath: 'status', operator: '==', value: 'active' }
      ], 20);
      
      // Simulate additional processing like search filtering
      const filtered = queryResult.filter(trade => 
        trade.title.toLowerCase().includes('trade')
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_RESPONSE_TIME_MS);
      expect(filtered.length).toBeGreaterThan(0);
      
      console.log(`TradesPage simulation: ${duration.toFixed(2)}ms`);
    });

    test('should handle search operations efficiently', () => {
      const trades = Array.from({ length: 100 }, (_, i) => 
        i % 2 === 0 ? generateLegacyTrade(`search-${i}`) : generateModernTrade(`search-${i}`)
      );
      
      const normalized = trades.map(trade => 
        TradeCompatibilityService.normalizeTradeData(trade)
      );
      
      const startTime = performance.now();
      
      // Simulate various search scenarios
      const searchTerms = ['skill', 'trade', 'modern', 'legacy', 'description'];
      
      searchTerms.forEach(term => {
        const results = normalized.filter(trade => {
          // Simulate search logic similar to TradesPage
          const searchInTitle = trade.title?.toLowerCase().includes(term.toLowerCase()) || false;
          const searchInDescription = trade.description?.toLowerCase().includes(term.toLowerCase()) || false;
          const searchInSkills = [
            ...(trade.skillsOffered || []),
            ...(trade.skillsWanted || [])
          ].some(skill => skill.name.toLowerCase().includes(term.toLowerCase()));
          
          return searchInTitle || searchInDescription || searchInSkills;
        });
        
        expect(Array.isArray(results)).toBe(true);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Search should be fast
      
      console.log(`Search operations: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Performance Monitoring', () => {
    test('should provide performance metrics for monitoring', () => {
      const metrics = {
        normalizationTimes: [],
        queryTimes: [],
        memoryUsage: []
      };
      
      // Collect metrics during operations
      for (let i = 0; i < 100; i++) {
        const trade = generateLegacyTrade(`metrics-${i}`);
        
        const startTime = performance.now();
        TradeCompatibilityService.normalizeTradeData(trade);
        const endTime = performance.now();
        
        metrics.normalizationTimes.push(endTime - startTime);
        metrics.memoryUsage.push(process.memoryUsage().heapUsed);
      }
      
      // Calculate statistics
      const avgNormalizationTime = metrics.normalizationTimes.reduce((a, b) => a + b) / metrics.normalizationTimes.length;
      const maxNormalizationTime = Math.max(...metrics.normalizationTimes);
      
      expect(avgNormalizationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMALIZATION_TIME_MS);
      expect(maxNormalizationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMALIZATION_TIME_MS * 2);
      
      console.log(`Performance metrics:
        Average normalization time: ${avgNormalizationTime.toFixed(4)}ms
        Max normalization time: ${maxNormalizationTime.toFixed(4)}ms
        Total operations: ${metrics.normalizationTimes.length}`);
    });
  });
});
