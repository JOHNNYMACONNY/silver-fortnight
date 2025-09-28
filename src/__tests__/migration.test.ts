/**
 * Comprehensive Migration Tests for TradeYa Firestore Migration
 * 
 * This test suite validates the compatibility services and migration logic
 * before actual migration execution to ensure data integrity and zero-downtime migration.
 */

import { TradeCompatibilityService } from '../services/migration/tradeCompatibility';
import { ChatCompatibilityService } from '../services/migration/chatCompatibility';
import { MigrationServiceRegistry } from '../services/migration/migrationRegistry';

import type {
  Trade,
  TradeSkill,
  TradeParticipants
} from '../services/migration/tradeCompatibility';

import type {
  ChatConversation,
  ChatMessage,
  ChatParticipant
} from '../services/migration/chatCompatibility';

// Mock Firestore methods (use var to avoid TDZ with jest.mock hoisting)
var mockGet = jest.fn();
var mockGetDocs = jest.fn();
var mockCollection = jest.fn();
var mockDoc = jest.fn();
var mockQuery = jest.fn();
var mockWhere = jest.fn();
var mockOrderBy = jest.fn();
var mockLimit = jest.fn();

// Mock Firebase/Firestore dependencies
const mockFirestore = {
  collection: mockCollection,
  doc: mockDoc,
  runTransaction: jest.fn(),
  batch: jest.fn()
} as any;

// Mock firebase/firestore functions
jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGet,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
    fromDate: (date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })
  }
}));

jest.mock('../firebase-config', () => ({
  db: mockFirestore,
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

// Mock performance monitoring
jest.mock('../contexts/PerformanceContext', () => ({
  usePerformance: () => ({
    startTimer: jest.fn(),
    endTimer: jest.fn(),
    recordMetric: jest.fn()
  })
}));
var mockQuery = jest.fn();
var mockWhere = jest.fn();
var mockOrderBy = jest.fn();
var mockLimit = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: mockGet,
  getDocs: mockGetDocs,
  collection: jest.fn(),
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  collectionGroup: jest.fn()
}));

describe('TradeYa Migration Test Suite', () => {
  let tradeCompatibilityService: TradeCompatibilityService;
  let chatCompatibilityService: ChatCompatibilityService;
  let registry: MigrationServiceRegistry;

  // Test data representing legacy schema format
  const legacyTradeData = {
    id: 'legacy-trade-1',
    title: 'Web Development for Logo Design',
    description: 'I need a logo designed for my website',
    offeredSkills: [
      { id: 'react', name: 'React', level: 'advanced' as const },
      { id: 'js', name: 'JavaScript', level: 'expert' as const },
      { id: 'css', name: 'CSS', level: 'intermediate' as const }
    ],
    requestedSkills: [
      { id: 'design', name: 'Graphic Design', level: 'intermediate' as const },
      { id: 'illustrator', name: 'Adobe Illustrator', level: 'beginner' as const }
    ],
    creatorId: 'user-1',
    participantId: 'user-2',
    status: 'active' as const,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    category: 'Development',
    tags: ['web', 'design'],
    requirements: {
      timeframe: '2 weeks',
      deliverables: ['Logo files', 'Brand guidelines']
    }
  };

  // Test data representing new schema format
  const newTradeData = {
    id: 'new-trade-1',
    title: 'Mobile App Development for Marketing Support',
    description: 'Looking for React Native development assistance',
    skillsOffered: [
      { id: 'react-native', name: 'React Native', level: 'expert' as const },
      { id: 'typescript', name: 'TypeScript', level: 'advanced' as const },
      { id: 'firebase', name: 'Firebase', level: 'intermediate' as const }
    ],
    skillsWanted: [
      { id: 'ui-ux', name: 'UI/UX Design', level: 'intermediate' as const },
      { id: 'marketing', name: 'Marketing Strategy', level: 'beginner' as const }
    ],
    participants: {
      creator: 'user-3',
      participant: 'user-4'
    },
    status: 'in_progress' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    metadata: {
      category: 'Development',
      tags: ['mobile', 'app'],
      priority: 'high'
    },
    requirements: {
      timeline: { start: new Date(), end: new Date() },
      deliverables: ['App prototype', 'Source code'],
      specifications: ['Cross-platform compatibility']
    }
  };

  // Legacy chat/conversation data
  const legacyChatData = {
    id: 'legacy-chat-1',
    participants: [
      { 
        id: 'user-1',
        userId: 'user-1', 
        name: 'John Doe', 
        email: 'john@example.com',
        role: 'creator',
        lastSeen: new Date('2023-01-01')
      },
      { 
        id: 'user-2',
        userId: 'user-2', 
        name: 'Jane Smith', 
        email: 'jane@example.com',
        role: 'participant',
        lastSeen: new Date('2023-01-01')
      }
    ],
    tradeId: 'legacy-trade-1',
    lastMessage: {
      content: 'Looking forward to working together!',
      senderId: 'user-1',
      createdAt: new Date('2023-01-01')
    },
    lastActivity: new Date('2023-01-01'),
    unreadCount: { 'user-1': 0, 'user-2': 1 },
    type: 'trade' as const,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  // New chat/conversation data format
  const newChatData = {
    id: 'new-chat-1',
    participantIds: ['user-3', 'user-4'],
    participants: [
      {
        id: 'user-3',
        name: 'Alice Johnson',
        avatar: 'https://example.com/avatar3.jpg'
      },
      {
        id: 'user-4',
        name: 'Bob Wilson',
        avatar: 'https://example.com/avatar4.jpg'
      }
    ],
    relatedTradeId: 'new-trade-1',
    lastMessage: {
      content: 'Project requirements updated',
      senderId: 'user-3',
      createdAt: new Date('2024-01-01')
    },
    type: 'trade' as const,
    unreadCount: { 'user-3': 0, 'user-4': 2 },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  // Edge case and corrupted data scenarios
  const corruptedTradeData = {
    id: 'corrupted-trade-1',
    title: '', // Empty title
    offeredSkills: null, // Null skills
    creatorId: undefined, // Undefined creator
    status: 'unknown' as any,
    // Missing required fields
  };

  const corruptedChatData = {
    id: 'corrupted-chat-1',
    participants: null,
    participantIds: undefined,
    // Missing required fields
  };

  beforeEach(() => {
    // Initialize services for each test
    tradeCompatibilityService = new TradeCompatibilityService(mockFirestore);
    chatCompatibilityService = new ChatCompatibilityService(mockFirestore);
    registry = MigrationServiceRegistry.getInstance();
    registry.reset(); // Reset registry state
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockLimit.mockReturnValue({});
  });

  afterEach(() => {
    registry.reset();
  });

  describe('TradeCompatibilityService', () => {
    describe('Data Normalization', () => {
      it('should normalize legacy trade data to new schema format', () => {
        const normalized = TradeCompatibilityService.normalizeTradeData(legacyTradeData);
        
        expect(normalized).toBeDefined();
        expect(normalized.skillsOffered).toEqual(legacyTradeData.offeredSkills);
        expect(normalized.skillsWanted).toEqual(legacyTradeData.requestedSkills);
        expect(normalized.participants.creator).toBe(legacyTradeData.creatorId);
        expect(normalized.participants.participant).toBe(legacyTradeData.participantId);
        expect(normalized.compatibilityLayerUsed).toBe(true);
        
        // Should maintain legacy fields for backward compatibility
        expect(normalized.offeredSkills).toEqual(legacyTradeData.offeredSkills);
        expect(normalized.requestedSkills).toEqual(legacyTradeData.requestedSkills);
        expect(normalized.creatorId).toBe(legacyTradeData.creatorId);
        expect(normalized.participantId).toBe(legacyTradeData.participantId);
      });

      it('should handle new schema data without modification', () => {
        const normalized = TradeCompatibilityService.normalizeTradeData(newTradeData);
        
        expect(normalized.skillsOffered).toEqual(newTradeData.skillsOffered);
        expect(normalized.skillsWanted).toEqual(newTradeData.skillsWanted);
        expect(normalized.participants).toEqual(newTradeData.participants);
        expect(normalized.compatibilityLayerUsed).toBe(true);
      });

      it('should handle missing or null fields gracefully', () => {
        const normalized = TradeCompatibilityService.normalizeTradeData(corruptedTradeData);
        
        expect(normalized.title).toBe('');
        expect(normalized.skillsOffered).toEqual([]);
        expect(normalized.skillsWanted).toEqual([]);
        expect(normalized.participants.creator).toBeDefined();
        expect(normalized.status).toBe('unknown');
      });

      it('should normalize string skills to TradeSkill objects', () => {
        const dataWithStringSkills = {
          id: 'test-1',
          title: 'Test Trade',
          offeredSkills: ['React', 'JavaScript'],
          requestedSkills: ['Design'],
          creatorId: 'user-1',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const normalized = TradeCompatibilityService.normalizeTradeData(dataWithStringSkills);
        
        expect(normalized.skillsOffered).toEqual([
          { id: 'React', name: 'React', level: 'intermediate' },
          { id: 'JavaScript', name: 'JavaScript', level: 'intermediate' }
        ]);
        expect(normalized.skillsWanted).toEqual([
          { id: 'Design', name: 'Design', level: 'intermediate' }
        ]);
      });

      it('should handle mixed skill formats', () => {
        const mixedSkillsData = {
          id: 'test-mixed',
          title: 'Mixed Skills Test',
          offeredSkills: [
            'React',
            { id: 'node', name: 'Node.js', level: 'expert' },
            { name: 'GraphQL' }, // Missing id
            null, // Invalid skill
            42 // Invalid type
          ],
          creatorId: 'user-1',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const normalized = TradeCompatibilityService.normalizeTradeData(mixedSkillsData);
        
        expect(normalized.skillsOffered).toHaveLength(5);
        expect(normalized.skillsOffered[0]).toEqual({ id: 'React', name: 'React', level: 'intermediate' });
        expect(normalized.skillsOffered[1]).toEqual({ id: 'node', name: 'Node.js', level: 'expert' });
        expect(normalized.skillsOffered[2].name).toBe('GraphQL');
        expect(normalized.skillsOffered[3].name).toBe('Unknown Skill');
        expect(normalized.skillsOffered[4].name).toBe('42');
      });
    });

    describe('Backward Compatibility', () => {
      it('should support queries with legacy field names', async () => {
        const mockQueryResult = [legacyTradeData, newTradeData];
        
        // Mock successful query
        mockGetDocs.mockResolvedValue({
          docs: mockQueryResult.map(data => ({
            id: data.id,
            data: () => data,
            exists: true
          }))
        });

        const results = await tradeCompatibilityService.queryTrades([
          mockWhere('offeredSkills', 'array-contains-any', ['React'])
        ]);

        expect(results).toHaveLength(2);
        expect(results[0].skillsOffered.some((skill: TradeSkill) => skill.name === 'React')).toBe(true);
      });

      it('should handle Firestore query errors gracefully', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore connection error'));

        const results = await tradeCompatibilityService.queryTrades([
          mockWhere('status', '==', 'active')
        ]);

        expect(results).toEqual([]);
      });

      it('should validate trade data correctly', () => {
        const validTrade = TradeCompatibilityService.normalizeTradeData(legacyTradeData);
        expect(TradeCompatibilityService.validateTrade(validTrade)).toBe(true);

        const invalidTrade = { id: 'invalid' };
        expect(TradeCompatibilityService.validateTrade(invalidTrade)).toBe(false);

        expect(TradeCompatibilityService.validateTrade(null)).toBe(false);
        expect(TradeCompatibilityService.validateTrade(undefined)).toBe(false);
      });
    });

    describe('Skills-based Search', () => {
      it('should find trades by skills across both schema formats', async () => {
        const mockSearchResults = [legacyTradeData, newTradeData];
        
        mockGetDocs.mockResolvedValue({
          docs: mockSearchResults.map(data => ({
            id: data.id,
            data: () => data,
            exists: true
          }))
        });

        const results = await tradeCompatibilityService.getTradesBySkill('React', 'offered');

        expect(results).toHaveLength(2);
        expect(results.some((trade: Trade) => trade.id === 'legacy-trade-1')).toBe(true);
        expect(results.some((trade: Trade) => trade.id === 'new-trade-1')).toBe(true);
      });

      it('should handle empty search results', async () => {
        mockGetDocs.mockResolvedValue({ docs: [] });

        const results = await tradeCompatibilityService.getTradesBySkill('NonexistentSkill');
        
        expect(results).toEqual([]);
      });

      it('should search wanted skills', async () => {
        mockGetDocs.mockResolvedValue({
          docs: [legacyTradeData].map(data => ({
            id: data.id,
            data: () => data,
            exists: true
          }))
        });

        const results = await tradeCompatibilityService.getTradesBySkill('Graphic Design', 'wanted');
        
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('legacy-trade-1');
      });
    });

    describe('User Trade Queries', () => {
      it('should get trades by user across both schema formats', async () => {
        const userId = 'user-1';
        const mockUserTrades = [legacyTradeData];
        
        mockGetDocs.mockResolvedValue({
          docs: mockUserTrades.map(data => ({
            id: data.id,
            data: () => data,
            exists: true
          }))
        });

        const results = await tradeCompatibilityService.getTradesByUser(userId);

        expect(results).toHaveLength(1);
        expect(results[0].participants.creator).toBe(userId);
      });

      it('should handle user queries with fallback to legacy format', async () => {
        const userId = 'user-1';
        
        // First call fails (new format), second succeeds (legacy format)
        mockGetDocs
          .mockRejectedValueOnce(new Error('New format not supported'))
          .mockResolvedValueOnce({
            docs: [legacyTradeData].map(data => ({
              id: data.id,
              data: () => data,
              exists: true
            }))
          });

        const results = await tradeCompatibilityService.getTradesByUser(userId);
        
        expect(results).toHaveLength(1);
      });
    });

    describe('Performance Testing', () => {
      it('should handle large datasets efficiently', async () => {
        const largeDataset = Array.from({ length: 100 }, (_, i) => ({
          ...legacyTradeData,
          id: `trade-${i}`,
          offeredSkills: [{ id: `skill-${i % 10}`, name: `Skill${i % 10}`, level: 'intermediate' as const }]
        }));

        const startTime = Date.now();
        
        const normalizedData = largeDataset.map(data => 
          TradeCompatibilityService.normalizeTradeData(data)
        );

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        expect(normalizedData).toHaveLength(100);
        expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
        
        // Verify data integrity
        normalizedData.forEach((trade, index) => {
          expect(trade.id).toBe(`trade-${index}`);
          expect(trade.skillsOffered).toHaveLength(1);
          expect(trade.compatibilityLayerUsed).toBe(true);
        });
      });
    });

    describe('Error Handling', () => {
      it('should throw error for null data', () => {
        expect(() => TradeCompatibilityService.normalizeTradeData(null as any)).toThrow('Trade data is null or undefined');
      });

      it('should throw error for invalid trade ID', async () => {
        await expect(tradeCompatibilityService.getTrade('')).rejects.toThrow('Trade ID must be a non-empty string');
        await expect(tradeCompatibilityService.getTrade(null as any)).rejects.toThrow('Trade ID must be a non-empty string');
      });

      it('should throw error for invalid user ID', async () => {
        await expect(tradeCompatibilityService.getTradesByUser('')).rejects.toThrow('User ID must be a non-empty string');
      });

      it('should throw error for invalid query constraints', async () => {
        await expect(tradeCompatibilityService.queryTrades(null as any)).rejects.toThrow('Constraints must be an array');
      });

      it('should handle malformed trade data gracefully', async () => {
        const malformedData = {
          id: 'malformed-1',
          // Missing required fields
        };
        
        mockGetDocs.mockResolvedValue({
          docs: [{
            id: 'malformed-1',
            data: () => malformedData,
            exists: true
          }]
        });

        const results = await tradeCompatibilityService.queryTrades([]);
        
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Error Loading Trade');
        expect(results[0].status).toBe('draft');
      });
    });
  });

  describe('ChatCompatibilityService', () => {
    describe('Conversation Data Normalization', () => {
      it('should normalize legacy chat data to new format', () => {
        const normalized = ChatCompatibilityService.normalizeConversationData(legacyChatData);

        expect(normalized.participantIds).toEqual(['user-1', 'user-2']);
        expect(normalized.participants).toHaveLength(2);
        expect(normalized.participants?.[0]?.name).toBe('John Doe');
        expect(normalized.participants?.[1]?.name).toBe('Jane Smith');
        expect(normalized.compatibilityLayerUsed).toBe(true);
      });

      it('should handle new format data without modification', () => {
        const normalized = ChatCompatibilityService.normalizeConversationData(newChatData);
        
        expect(normalized.participantIds).toEqual(['user-3', 'user-4']);
        expect(normalized.participants).toEqual(newChatData.participants);
        expect(normalized.compatibilityLayerUsed).toBe(true);
      });

      it('should handle missing participant data gracefully', () => {
        const dataWithoutParticipants = {
          id: 'test-chat',
          participantIds: ['user-1', 'user-2'],
          type: 'direct',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const normalized = ChatCompatibilityService.normalizeConversationData(dataWithoutParticipants);
        
        expect(normalized.participantIds).toEqual(['user-1', 'user-2']);
        expect(normalized.participants).toHaveLength(2);
        expect(normalized.participants?.[0]?.id).toBe('user-1');
        expect(normalized.participants?.[0]?.name).toBe('');
      });

      it('should extract participant IDs from legacy participant objects', () => {
        const legacyData = {
          id: 'legacy-conv',
          participants: [
            { id: 'user-1', name: 'John', userId: 'user-1' },
            { userId: 'user-2', name: 'Jane' }, // Missing id but has userId
            { id: 'user-3', displayName: 'Bob' } // Different name field
          ],
          type: 'group',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const normalized = ChatCompatibilityService.normalizeConversationData(legacyData);
        
        expect(normalized.participantIds).toEqual(['user-1', 'user-2', 'user-3']);
        expect(normalized.participants?.[0]?.name).toBe('John');
        expect(normalized.participants?.[1]?.name).toBe('Jane');
        expect(normalized.participants?.[2]?.name).toBe('');
      });

      it('should throw error for conversations without participants', () => {
        const invalidData = {
          id: 'invalid-chat',
          type: 'direct',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        expect(() => ChatCompatibilityService.normalizeConversationData(invalidData))
          .toThrow('Conversation must have at least one participant');
      });
    });

    describe('Message Data Normalization', () => {
      it('should normalize message data with various field names', () => {
        const messageData = {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello world',
          type: 'text',
          createdAt: new Date()
        };
        
        const normalized = ChatCompatibilityService.normalizeMessageData(messageData);
        
        expect(normalized).toEqual(messageData);
      });

      it('should handle legacy message field names', () => {
        const legacyMessageData = {
          id: 'msg-legacy',
          chatId: 'conv-1', // Legacy field name
          userId: 'user-1', // Legacy field name
          message: 'Hello from legacy', // Legacy field name
          timestamp: new Date() // Legacy field name
        };
        
        const normalized = ChatCompatibilityService.normalizeMessageData(legacyMessageData);
        
        expect(normalized.conversationId).toBe('conv-1');
        expect(normalized.senderId).toBe('user-1');
        expect(normalized.content).toBe('Hello from legacy');
        expect(normalized.createdAt).toEqual(legacyMessageData.timestamp);
        expect(normalized.type).toBe('text'); // Default value
      });

      it('should handle missing message fields gracefully', () => {
        const incompleteData = {
          id: 'incomplete-msg'
          // Missing required fields
        };
        
        const normalized = ChatCompatibilityService.normalizeMessageData(incompleteData);
        
        expect(normalized.conversationId).toBe('');
        expect(normalized.senderId).toBe('');
        expect(normalized.content).toBe('');
        expect(normalized.type).toBe('text');
      });
    });

    describe('Conversation Queries', () => {
      it('should get user conversations across both formats', async () => {
        const userId = 'user-1';
        const mockConversations = [legacyChatData, newChatData];
        
        mockGetDocs.mockResolvedValue({
          docs: mockConversations.map(data => ({
            id: data.id,
            data: () => data,
            exists: true
          }))
        });

        const results = await chatCompatibilityService.getUserConversations(userId);

        expect(results).toHaveLength(2);
        expect(results.some((conv: ChatConversation) => conv.id === 'legacy-chat-1')).toBe(true);
        expect(results.some((conv: ChatConversation) => conv.id === 'new-chat-1')).toBe(true);
      });

      it('should handle conversation query with fallback to legacy format', async () => {
        const userId = 'user-1';
        
        // First call (new format) fails, second call (legacy format) succeeds
        mockGetDocs
          .mockRejectedValueOnce(new Error('New format query failed'))
          .mockResolvedValueOnce({
            docs: [{
              id: 'legacy-chat-1',
              data: () => legacyChatData,
              exists: true
            }]
          });

        const results = await chatCompatibilityService.getUserConversations(userId);
        
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('legacy-chat-1');
      });

      it('should search conversations by participant name', async () => {
        const userId = 'user-1';
        const searchTerm = 'John';
        
        // Mock getUserConversations to return test data
        jest.spyOn(chatCompatibilityService, 'getUserConversations')
          .mockResolvedValue([
            ChatCompatibilityService.normalizeConversationData(legacyChatData),
            ChatCompatibilityService.normalizeConversationData(newChatData)
          ]);

        const results = await chatCompatibilityService.searchConversations(userId, searchTerm);
        
        expect(results).toHaveLength(1);
        expect(results[0].participants?.some((p: ChatParticipant) => p.name.includes('John'))).toBe(true);
      });

      it('should find direct conversation between users', async () => {
        const userIds = ['user-1', 'user-2'];
        
        mockGetDocs.mockResolvedValue({
          docs: [{
            id: 'direct-conv',
            data: () => ({
              id: 'direct-conv',
              type: 'direct',
              participantIds: ['user-1', 'user-2'],
              createdAt: new Date(),
              updatedAt: new Date()
            }),
            exists: true
          }]
        });

        const result = await chatCompatibilityService.getDirectConversation(userIds);
        
        expect(result).toBeDefined();
        expect(result?.participantIds).toEqual(['user-1', 'user-2']);
        expect(result?.type).toBe('direct');
      });
    });

    describe('Message Queries', () => {
      it('should get messages for a conversation', async () => {
        const conversationId = 'conv-1';
        const mockMessages = [
          {
            id: 'msg-1',
            senderId: 'user-1',
            content: 'Hello',
            type: 'text',
            createdAt: new Date()
          },
          {
            id: 'msg-2',
            senderId: 'user-2',
            content: 'Hi there',
            type: 'text',
            createdAt: new Date()
          }
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockMessages.map(data => ({
            id: data.id,
            data: () => data,
            exists: true
          }))
        });

        const results = await chatCompatibilityService.getMessages(conversationId);

        expect(results).toHaveLength(2);
        expect(results[0].conversationId).toBe(conversationId);
        expect(results[1].conversationId).toBe(conversationId);
      });

      it('should handle malformed messages gracefully', async () => {
        const conversationId = 'conv-1';
        const malformedMessage = {
          id: 'malformed-msg'
          // Missing required fields
        };
        
        mockGetDocs.mockResolvedValue({
          docs: [{
            id: 'malformed-msg',
            data: () => malformedMessage,
            exists: true
          }]
        });

        const results = await chatCompatibilityService.getMessages(conversationId);

        expect(results).toHaveLength(1);
        expect(results[0].content).toBe('Error loading message');
        expect(results[0].type).toBe('system');
      });
    });

    describe('Validation', () => {
      it('should validate conversation data correctly', () => {
        const validConversation = ChatCompatibilityService.normalizeConversationData(newChatData);
        expect(ChatCompatibilityService.validateConversation(validConversation)).toBe(true);

        const invalidConversation = { id: 'invalid' };
        expect(ChatCompatibilityService.validateConversation(invalidConversation)).toBe(false);

        expect(ChatCompatibilityService.validateConversation(null)).toBe(false);
      });

      it('should validate message data correctly', () => {
        const validMessage = {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello'
        };
        expect(ChatCompatibilityService.validateMessage(validMessage)).toBe(true);

        const invalidMessage = { id: 'invalid' };
        expect(ChatCompatibilityService.validateMessage(invalidMessage)).toBe(false);

        expect(ChatCompatibilityService.validateMessage(null)).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should throw error for null conversation data', () => {
        expect(() => ChatCompatibilityService.normalizeConversationData(null as any))
          .toThrow('Conversation data is null or undefined');
      });

      it('should throw error for null message data', () => {
        expect(() => ChatCompatibilityService.normalizeMessageData(null as any))
          .toThrow('Message data is null or undefined');
      });

      it('should throw error for invalid conversation ID', async () => {
        await expect(chatCompatibilityService.getConversation(''))
          .rejects.toThrow('Conversation ID must be a non-empty string');
      });

      it('should throw error for invalid user ID in conversation queries', async () => {
        await expect(chatCompatibilityService.getUserConversations(''))
          .rejects.toThrow('User ID must be a non-empty string');
      });

      it('should throw error for invalid direct conversation parameters', async () => {
        await expect(chatCompatibilityService.getDirectConversation(['user-1']))
          .rejects.toThrow('Direct conversation requires exactly 2 user IDs');
          
        await expect(chatCompatibilityService.getDirectConversation(['user-1', 'user-1']))
          .rejects.toThrow('Invalid user IDs for direct conversation');
      });
    });
  });

  describe('MigrationServiceRegistry', () => {
    describe('Singleton Pattern', () => {
      it('should return the same instance', () => {
        const instance1 = MigrationServiceRegistry.getInstance();
        const instance2 = MigrationServiceRegistry.getInstance();
        
        expect(instance1).toBe(instance2);
        expect(instance1).toBe(registry);
      });
    });

    describe('Initialization', () => {
      it('should initialize with Firestore instance', () => {
        expect(registry.isInitialized()).toBe(false);
        
        registry.initialize(mockFirestore);
        
        expect(registry.isInitialized()).toBe(true);
        expect(registry.trades).toBeInstanceOf(TradeCompatibilityService);
        expect(registry.chat).toBeInstanceOf(ChatCompatibilityService);
      });

      it('should warn on duplicate initialization', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        registry.initialize(mockFirestore);
        registry.initialize(mockFirestore); // Second initialization
        
        expect(consoleSpy).toHaveBeenCalledWith('⚠️ Migration registry already initialized');
        
        consoleSpy.mockRestore();
      });

      it('should throw error when accessing services before initialization', () => {
        const freshRegistry = MigrationServiceRegistry.getInstance();
        freshRegistry.reset();
        
        expect(() => freshRegistry.trades).toThrow('Migration registry not initialized');
        expect(() => freshRegistry.chat).toThrow('Migration registry not initialized');
      });
    });

    describe('Migration Mode Management', () => {
      beforeEach(() => {
        registry.initialize(mockFirestore);
      });

      it('should enable and disable migration mode', () => {
        expect(registry.isMigrationMode()).toBe(false);
        
        registry.enableMigrationMode();
        expect(registry.isMigrationMode()).toBe(true);
        
        registry.disableMigrationMode();
        expect(registry.isMigrationMode()).toBe(false);
      });

      it('should enable migration mode from environment config', () => {
        const originalEnv = process.env.REACT_APP_MIGRATION_MODE;
        process.env.REACT_APP_MIGRATION_MODE = 'true';
        
        registry.enableMigrationModeFromConfig();
        expect(registry.isMigrationMode()).toBe(true);
        
        process.env.REACT_APP_MIGRATION_MODE = 'false';
        registry.enableMigrationModeFromConfig();
        expect(registry.isMigrationMode()).toBe(false);
        
        // Restore original environment
        process.env.REACT_APP_MIGRATION_MODE = originalEnv;
      });
    });

    describe('Status Monitoring', () => {
      it('should provide accurate status information', () => {
        const uninitializedStatus = registry.getStatus();
        expect(uninitializedStatus.initialized).toBe(false);
        expect(uninitializedStatus.migrationMode).toBe(false);
        expect(uninitializedStatus.services.trades).toBe(false);
        expect(uninitializedStatus.services.chat).toBe(false);
        
        registry.initialize(mockFirestore);
        registry.enableMigrationMode();
        
        const initializedStatus = registry.getStatus();
        expect(initializedStatus.initialized).toBe(true);
        expect(initializedStatus.migrationMode).toBe(true);
        expect(initializedStatus.services.trades).toBe(true);
        expect(initializedStatus.services.chat).toBe(true);
      });
    });

    describe('Service Validation', () => {
      it('should validate all services successfully', async () => {
        registry.initialize(mockFirestore);
        
        const validationResult = await registry.validateServices();
        
        expect(validationResult.trades).toBe(true);
        expect(validationResult.chat).toBe(true);
        expect(validationResult.errors).toEqual([]);
      });

      it('should handle validation errors', async () => {
        const validationResult = await registry.validateServices();
        
        expect(validationResult.trades).toBe(false);
        expect(validationResult.chat).toBe(false);
        expect(validationResult.errors).toContain('Registry validation failed: Registry not initialized');
      });
    });

    describe('Reset Functionality', () => {
      it('should reset registry state correctly', () => {
        registry.initialize(mockFirestore);
        registry.enableMigrationMode();
        
        expect(registry.isInitialized()).toBe(true);
        expect(registry.isMigrationMode()).toBe(true);
        
        registry.reset();
        
        expect(registry.isInitialized()).toBe(false);
        expect(registry.isMigrationMode()).toBe(false);
      });
    });
  });

  describe('Integration Testing', () => {
    beforeEach(() => {
      registry.initialize(mockFirestore);
      registry.enableMigrationMode();
    });

    describe('Cross-Service Compatibility', () => {
      it('should handle trade and chat data consistently', () => {
        const tradeNormalized = TradeCompatibilityService.normalizeTradeData(legacyTradeData);
        const chatNormalized = ChatCompatibilityService.normalizeConversationData(legacyChatData);
        
        expect(tradeNormalized.compatibilityLayerUsed).toBe(true);
        expect(chatNormalized.compatibilityLayerUsed).toBe(true);
        
        // Both should maintain data integrity
        expect(tradeNormalized.id).toBe(legacyTradeData.id);
        expect(chatNormalized.id).toBe(legacyChatData.id);
      });

      it('should maintain referential integrity between trades and chats', () => {
        const normalizedTrade = TradeCompatibilityService.normalizeTradeData(legacyTradeData);
        const normalizedChat = ChatCompatibilityService.normalizeConversationData({
          ...legacyChatData,
          relatedTradeId: legacyTradeData.id
        });
        
        expect(normalizedChat.relatedTradeId).toBe(normalizedTrade.id);
        
        // Verify participant consistency
        const tradeParticipants = [normalizedTrade.participants.creator, normalizedTrade.participants.participant];
        const chatParticipants = normalizedChat.participantIds;
        
        expect(chatParticipants.every((p: string) => tradeParticipants.includes(p))).toBe(true);
      });
    });

    describe('Data Consistency Validation', () => {
      it('should maintain data consistency throughout normalization', () => {
        const originalData = { ...legacyTradeData };
        const normalizedData = TradeCompatibilityService.normalizeTradeData(originalData);
        
        // Original data should not be modified
        expect(originalData).toEqual(legacyTradeData);
        
        // Normalized data should contain all original information
        expect(normalizedData.id).toBe(originalData.id);
        expect(normalizedData.title).toBe(originalData.title);
        expect(normalizedData.description).toBe(originalData.description);
        expect(normalizedData.status).toBe(originalData.status);
      });

      it('should handle concurrent normalization operations', () => {
        const testData = Array.from({ length: 50 }, (_, i) => ({
          ...legacyTradeData,
          id: `concurrent-trade-${i}`,
          title: `Concurrent Trade ${i}`
        }));
        
        const results = testData.map(data => 
          TradeCompatibilityService.normalizeTradeData(data)
        );
        
        expect(results).toHaveLength(50);
        results.forEach((result, index) => {
          expect(result.id).toBe(`concurrent-trade-${index}`);
          expect(result.title).toBe(`Concurrent Trade ${index}`);
          expect(result.compatibilityLayerUsed).toBe(true);
        });
      });
    });

    describe('Performance Under Load', () => {
      it('should handle mixed data formats efficiently', () => {
        const mixedDataset = Array.from({ length: 200 }, (_, i) => {
          // Alternate between legacy and new formats
          return i % 2 === 0 ? 
            { ...legacyTradeData, id: `mixed-trade-${i}` } :
            { ...newTradeData, id: `mixed-trade-${i}` };
        });
        
        const startTime = Date.now();
        
        const results = mixedDataset.map(data => 
          TradeCompatibilityService.normalizeTradeData(data)
        );
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(results).toHaveLength(200);
        expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
        
        // Verify all data was processed correctly
        results.forEach((result, index) => {
          expect(result.id).toBe(`mixed-trade-${index}`);
          expect(result.compatibilityLayerUsed).toBe(true);
        });
      });
    });
  });

  describe('Migration Validation Tests', () => {
    describe('Data Integrity', () => {
      it('should preserve all original data during normalization', () => {
        const originalTrade = { ...legacyTradeData };
        const originalChat = { ...legacyChatData };
        
        const normalizedTrade = TradeCompatibilityService.normalizeTradeData(originalTrade);
        const normalizedChat = ChatCompatibilityService.normalizeConversationData(originalChat);
        
        // Verify no data loss occurred
        expect(normalizedTrade.title).toBe(originalTrade.title);
        expect(normalizedTrade.description).toBe(originalTrade.description);
        expect(normalizedTrade.status).toBe(originalTrade.status);
        
        expect(normalizedChat.type).toBe(originalChat.type);
        expect(normalizedChat.lastMessage).toEqual(originalChat.lastMessage);
        expect(normalizedChat.unreadCount).toEqual(originalChat.unreadCount);
      });

      it('should handle edge cases without data corruption', () => {
        const edgeCases = [
          { ...legacyTradeData, title: null },
          { ...legacyTradeData, description: undefined },
          { ...legacyTradeData, offeredSkills: [] },
          { ...legacyTradeData, creatorId: '' }
        ];
        
        edgeCases.forEach((edgeCase, index) => {
          const result = TradeCompatibilityService.normalizeTradeData(edgeCase);
          expect(result).toBeDefined();
          expect(result.id).toBe(edgeCase.id);
          expect(result.compatibilityLayerUsed).toBe(true);
        });
      });
    });

    describe('Rollback Scenarios', () => {
      it('should maintain backward compatibility for rollback', () => {
        const newFormatData = { ...newTradeData };
        const normalized = TradeCompatibilityService.normalizeTradeData(newFormatData);
        
        // Verify legacy fields are populated for rollback scenarios
        expect(normalized.offeredSkills).toEqual(normalized.skillsOffered);
        expect(normalized.requestedSkills).toEqual(normalized.skillsWanted);
        expect(normalized.creatorId).toBe(normalized.participants.creator);
        expect(normalized.participantId).toBe(normalized.participants.participant);
      });
    });

    describe('Error Recovery', () => {
      it('should recover from normalization errors gracefully', () => {
        const problematicData = {
          id: 'problematic-trade',
          // Intentionally problematic data structure
          offeredSkills: 'not-an-array',
          participants: 'not-an-object',
          createdAt: 'invalid-date'
        };
        
        const result = TradeCompatibilityService.normalizeTradeData(problematicData);
        
        expect(result).toBeDefined();
        expect(result.id).toBe('problematic-trade');
        expect(Array.isArray(result.skillsOffered)).toBe(true);
        expect(result.skillsOffered).toEqual([]);
        expect(typeof result.participants).toBe('object');
      });
    });
  });

  describe('Boundary Conditions', () => {
    describe('Memory and Resource Limits', () => {
      it('should handle maximum field lengths', () => {
        const longString = 'x'.repeat(10000);
        const dataWithLongFields = {
          ...legacyTradeData,
          title: longString,
          description: longString
        };
        
        const result = TradeCompatibilityService.normalizeTradeData(dataWithLongFields);
        
        expect(result.title).toBe(longString);
        expect(result.description).toBe(longString);
        expect(result.compatibilityLayerUsed).toBe(true);
      });

      it('should handle maximum array lengths', () => {
        const manySkills = Array.from({ length: 1000 }, (_, i) => ({
          id: `skill-${i}`,
          name: `Skill ${i}`,
          level: 'intermediate' as const
        }));
        
        const dataWithManySkills = {
          ...legacyTradeData,
          offeredSkills: manySkills
        };
        
        const result = TradeCompatibilityService.normalizeTradeData(dataWithManySkills);
        
        expect(result.skillsOffered).toHaveLength(1000);
        expect(result.skillsOffered[999].name).toBe('Skill 999');
      });
    });

    describe('Unicode and Special Characters', () => {
      it('should handle unicode and special characters correctly', () => {
        const unicodeData = {
          ...legacyTradeData,
          title: '🚀 React开发 für Anfänger',
          description: 'Développement avec émojis 😊 и русские символы',
          offeredSkills: [
            { id: 'skill-1', name: '中文技能', level: 'expert' as const },
            { id: 'skill-2', name: 'العربية', level: 'intermediate' as const }
          ]
        };
        
        const result = TradeCompatibilityService.normalizeTradeData(unicodeData);
        
        expect(result.title).toBe('🚀 React开发 für Anfänger');
        expect(result.description).toBe('Développement avec émojis 😊 и русские символы');
        expect(result.skillsOffered[0].name).toBe('中文技能');
        expect(result.skillsOffered[1].name).toBe('العربية');
      });
    });
  });
});

/**
 * Helper for Jest's toThrow matcher in async/await tests.
 * Returns a function that throws the provided error message.
 */
function toThrow(message: string) {
  return () => { throw new Error(message); };
}
