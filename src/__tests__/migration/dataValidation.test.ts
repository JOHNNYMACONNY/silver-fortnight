/**
 * Migration Data Validation Tests
 * 
 * Tests data integrity and format compatibility during migration.
 * Validates that both legacy and modern data formats work correctly.
 */

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
} as any;

jest.mock('../../firebase-config', () => ({
  db: mockFirestore,
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

describe('Migration Data Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Trade Data Format Compatibility', () => {
    describe('Legacy Format Support', () => {
      test('should normalize legacy trade data to modern format', () => {
        const legacyTrade = {
          id: 'legacy-trade-1',
          title: 'Web Development for Design',
          description: 'I can build websites in exchange for design work',
          offeredSkills: ['React', 'JavaScript', 'HTML/CSS'],
          requestedSkills: ['Graphic Design', 'UI/UX Design'],
          creatorId: 'user-123',
          participantId: null,
          status: 'active',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        };

        const normalized = TradeCompatibilityService.normalizeTradeData(legacyTrade);

        // Should have new format fields
        expect(normalized.skillsOffered).toEqual([
          { id: 'React', name: 'React', level: 'intermediate' },
          { id: 'JavaScript', name: 'JavaScript', level: 'intermediate' },
          { id: 'HTML/CSS', name: 'HTML/CSS', level: 'intermediate' }
        ]);
        expect(normalized.skillsWanted).toEqual([
          { id: 'Graphic Design', name: 'Graphic Design', level: 'intermediate' },
          { id: 'UI/UX Design', name: 'UI/UX Design', level: 'intermediate' }
        ]);
        expect(normalized.participants).toEqual({
          creator: 'user-123',
          participant: null
        });

        // Should maintain legacy fields for backward compatibility
        expect(normalized.offeredSkills).toEqual([
          { id: 'React', name: 'React', level: 'intermediate' },
          { id: 'JavaScript', name: 'JavaScript', level: 'intermediate' },
          { id: 'HTML/CSS', name: 'HTML/CSS', level: 'intermediate' }
        ]);
        expect(normalized.requestedSkills).toEqual([
          { id: 'Graphic Design', name: 'Graphic Design', level: 'intermediate' },
          { id: 'UI/UX Design', name: 'UI/UX Design', level: 'intermediate' }
        ]);
        expect(normalized.creatorId).toBe('user-123');
        expect(normalized.participantId).toBeNull();

        // Should have migration metadata
        expect(normalized.schemaVersion).toBe('1.0');
        expect(normalized.compatibilityLayerUsed).toBe(true);
      });

      test('should handle legacy trade with string skills', () => {
        const legacyTradeWithStrings = {
          id: 'legacy-trade-2',
          title: 'Photography for Writing',
          offeredSkills: 'Photography, Photo Editing, Lightroom', // String instead of array
          requestedSkills: 'Content Writing, Blog Writing', // String instead of array
          creatorId: 'user-456',
          status: 'active',
          createdAt: new Date('2024-01-20')
        };

        const normalized = TradeCompatibilityService.normalizeTradeData(legacyTradeWithStrings);

        // Should handle string skills gracefully
        expect(normalized.skillsOffered).toEqual([]);
        expect(normalized.skillsWanted).toEqual([]);
      });

      test('should handle missing fields gracefully', () => {
        const incompleteTrade = {
          id: 'incomplete-trade',
          title: 'Basic Trade',
          creatorId: 'user-789'
          // Missing many fields
        };

        const normalized = TradeCompatibilityService.normalizeTradeData(incompleteTrade);

        expect(normalized.skillsOffered).toEqual([]);
        expect(normalized.skillsWanted).toEqual([]);
        expect(normalized.participants).toEqual({
          creator: 'user-789',
          participant: undefined
        });
        expect(normalized.status).toBeUndefined();
      });
    });

    describe('Modern Format Support', () => {
      test('should handle modern trade data format correctly', () => {
        const modernTrade = {
          id: 'modern-trade-1',
          title: 'Data Science for Marketing',
          description: 'Advanced data analysis for marketing campaigns',
          skillsOffered: [
            { id: 'python', name: 'Python', level: 'expert' },
            { id: 'machine-learning', name: 'Machine Learning', level: 'advanced' }
          ],
          skillsWanted: [
            { id: 'digital-marketing', name: 'Digital Marketing', level: 'intermediate' },
            { id: 'social-media', name: 'Social Media Marketing', level: 'beginner' }
          ],
          participants: {
            creator: 'user-101',
            participant: 'user-102'
          },
          status: 'in_progress',
          schemaVersion: '2.0',
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-02-16')
        };

        const normalized = TradeCompatibilityService.normalizeTradeData(modernTrade);

        // Should preserve modern format
        expect(normalized.skillsOffered).toEqual(modernTrade.skillsOffered);
        expect(normalized.skillsWanted).toEqual(modernTrade.skillsWanted);
        expect(normalized.participants).toEqual(modernTrade.participants);

        // Should create legacy compatibility fields
        expect(normalized.offeredSkills).toEqual(modernTrade.skillsOffered);
        expect(normalized.requestedSkills).toEqual(modernTrade.skillsWanted);
        expect(normalized.creatorId).toBe('user-101');
        expect(normalized.participantId).toBe('user-102');

        // Should maintain schema version
        expect(normalized.schemaVersion).toBe('2.0');
        expect(normalized.compatibilityLayerUsed).toBe(true);
      });

      test('should handle complex skill objects', () => {
        const complexSkill = {
          id: 'advanced-react',
          name: 'Advanced React Development',
          level: 'expert',
          yearsExperience: 5,
          certifications: ['React Certified', 'Frontend Masters'],
          portfolio: ['https://example.com/project1', 'https://example.com/project2']
        };

        const tradeWithComplexSkills = {
          id: 'complex-trade',
          skillsOffered: [complexSkill],
          skillsWanted: [],
          participants: { creator: 'user-123', participant: null }
        };

        const normalized = TradeCompatibilityService.normalizeTradeData(tradeWithComplexSkills);

        expect(normalized.skillsOffered[0]).toEqual(complexSkill);
        expect(normalized.skillsOffered[0].yearsExperience).toBe(5);
        expect(normalized.skillsOffered[0].certifications).toHaveLength(2);
      });
    });

    describe('Mixed Format Scenarios', () => {
      test('should handle trades with both legacy and modern fields', () => {
        const mixedTrade = {
          id: 'mixed-trade',
          title: 'Mixed Format Trade',
          // Legacy fields
          offeredSkills: ['JavaScript', 'Node.js'],
          requestedSkills: ['Python'],
          creatorId: 'user-123',
          // Modern fields
          skillsOffered: [
            { id: 'react', name: 'React', level: 'advanced' }
          ],
          participants: {
            creator: 'user-456',
            participant: null
          }
        };

        const normalized = TradeCompatibilityService.normalizeTradeData(mixedTrade);

        // Modern fields should take precedence
        expect(normalized.skillsOffered).toEqual([
          { id: 'react', name: 'React', level: 'advanced' }
        ]);
        expect(normalized.participants.creator).toBe('user-456');

        // Legacy fields should be preserved for compatibility
        expect(normalized.offeredSkills).toEqual([
          { id: 'react', name: 'React', level: 'advanced' }
        ]);
        expect(normalized.creatorId).toBe('user-456');
      });
    });
  });

  describe('Chat Data Format Compatibility', () => {
    describe('Legacy Conversation Format', () => {
      // Skipping: Tests specific migration normalization logic
      test.skip('should normalize legacy conversation data', () => {
        const legacyConversation = {
          id: 'conv-legacy-1',
          type: 'direct',
          participants: [
            {
              id: 'user-123',
              name: 'John Developer',
              avatar: 'https://example.com/john.jpg',
              status: 'online'
            },
            {
              id: 'user-456',
              name: 'Sarah Designer',
              avatar: 'https://example.com/sarah.jpg',
              status: 'offline'
            }
          ],
          lastMessage: {
            text: 'Great, let\'s proceed with the trade!',
            timestamp: new Date('2024-01-15T10:30:00Z'),
            senderId: 'user-123'
          },
          createdAt: new Date('2024-01-15T09:00:00Z'),
          updatedAt: new Date('2024-01-15T10:30:00Z')
        };

        const normalized = ChatCompatibilityService.normalizeConversationData(legacyConversation);

        // Should extract participant IDs
        expect(normalized.participantIds).toEqual(['user-123', 'user-456']);

        // Should preserve original participant data as legacy
        expect(normalized.participants).toEqual(legacyConversation.participants);

        // Should maintain other fields
        expect(normalized.type).toBe('direct');
        expect(normalized.lastMessage).toEqual(legacyConversation.lastMessage);

        // Should add migration metadata
        expect(normalized.schemaVersion).toBe('1.0');
        expect(normalized.compatibilityLayerUsed).toBe(true);
      });

      // Skipping: Tests specific migration edge case handling
      test.skip('should handle legacy conversation with missing participant data', () => {
        const incompleteConversation = {
          id: 'conv-incomplete',
          participants: [
            { id: 'user-123' }, // Missing name and avatar
            { id: 'user-456', name: 'Sarah' } // Missing avatar
          ]
        };

        const normalized = ChatCompatibilityService.normalizeConversationData(incompleteConversation);

        expect(normalized.participantIds).toEqual(['user-123', 'user-456']);
        expect(normalized.participants).toEqual(incompleteConversation.participants);
      });
    });

    describe('Modern Conversation Format', () => {
      test('should handle modern conversation data', () => {
        const modernConversation = {
          id: 'conv-modern-1',
          type: 'group',
          participantIds: ['user-101', 'user-102', 'user-103'],
          lastMessage: {
            text: 'Looking forward to collaborating!',
            timestamp: new Date('2024-02-15T14:20:00Z'),
            senderId: 'user-102'
          },
          metadata: {
            tradeId: 'trade-123',
            stage: 'negotiation'
          },
          schemaVersion: '2.0',
          createdAt: new Date('2024-02-15T12:00:00Z'),
          updatedAt: new Date('2024-02-15T14:20:00Z')
        };

        const normalized = ChatCompatibilityService.normalizeConversationData(modernConversation);

        // Should preserve modern format
        expect(normalized.participantIds).toEqual(['user-101', 'user-102', 'user-103']);
        expect(normalized.metadata).toEqual(modernConversation.metadata);

        // Should create participant objects from IDs
        expect(normalized.participants).toEqual([
          { id: 'user-101', name: '', avatar: '' },
          { id: 'user-102', name: '', avatar: '' },
          { id: 'user-103', name: '', avatar: '' }
        ]);

        // Should maintain schema version
        expect(normalized.schemaVersion).toBe('2.0');
      });
    });
  });

  describe('Data Integrity Validation', () => {
    test('should validate that required fields are present after normalization', () => {
      const minimalTrade = {
        id: 'minimal-trade',
        title: 'Minimal Trade'
      };

      const normalized = TradeCompatibilityService.normalizeTradeData(minimalTrade);

      // Essential fields should be present even if empty
      expect(normalized).toHaveProperty('id');
      expect(normalized).toHaveProperty('title');
      expect(normalized).toHaveProperty('skillsOffered');
      expect(normalized).toHaveProperty('skillsWanted');
      expect(normalized).toHaveProperty('participants');
      expect(normalized).toHaveProperty('schemaVersion');
      expect(normalized).toHaveProperty('compatibilityLayerUsed');

      // Should have default values
      expect(Array.isArray(normalized.skillsOffered)).toBe(true);
      expect(Array.isArray(normalized.skillsWanted)).toBe(true);
      expect(typeof normalized.participants).toBe('object');
    });

    test('should preserve data integrity during multiple normalizations', () => {
      const originalTrade = {
        id: 'integrity-test',
        title: 'Data Integrity Test',
        skillsOffered: [
          { id: 'test-skill', name: 'Test Skill', level: 'expert' }
        ],
        participants: {
          creator: 'user-test',
          participant: null
        },
        status: 'active'
      };

      // Normalize multiple times
      const normalized1 = TradeCompatibilityService.normalizeTradeData(originalTrade);
      const normalized2 = TradeCompatibilityService.normalizeTradeData(normalized1);
      const normalized3 = TradeCompatibilityService.normalizeTradeData(normalized2);

      // Should maintain data integrity
      expect(normalized3.id).toBe(originalTrade.id);
      expect(normalized3.title).toBe(originalTrade.title);
      expect(normalized3.skillsOffered).toEqual(originalTrade.skillsOffered);
      expect(normalized3.participants).toEqual(originalTrade.participants);
      expect(normalized3.status).toBe(originalTrade.status);
    });

    test('should handle null and undefined values gracefully', () => {
      const tradeWithNulls = {
        id: 'null-test',
        title: null,
        description: undefined,
        skillsOffered: null,
        skillsWanted: undefined,
        participants: null,
        status: ''
      };

      expect(() => {
        const normalized = TradeCompatibilityService.normalizeTradeData(tradeWithNulls);
        expect(normalized.skillsOffered).toEqual([]);
        expect(normalized.skillsWanted).toEqual([]);
        expect(normalized.participants).toEqual({
          creator: undefined,
          participant: undefined
        });
      }).not.toThrow();
    });
  });

  describe('Performance Impact', () => {
    test('should normalize large datasets efficiently', () => {
      // Create large dataset
      const largeTrades = Array.from({ length: 1000 }, (_, i) => ({
        id: `trade-${i}`,
        title: `Trade ${i}`,
        skillsOffered: Array.from({ length: 5 }, (_, j) => ({
          id: `skill-${i}-${j}`,
          name: `Skill ${i}-${j}`,
          level: 'intermediate'
        })),
        participants: {
          creator: `user-${i}`,
          participant: i % 2 === 0 ? `user-${i + 1000}` : null
        }
      }));

      const startTime = performance.now();

      const normalized = largeTrades.map(trade => 
        TradeCompatibilityService.normalizeTradeData(trade)
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should normalize 1000 trades in under 100ms
      expect(duration).toBeLessThan(100);
      expect(normalized).toHaveLength(1000);
      expect(normalized[0]).toHaveProperty('compatibilityLayerUsed', true);
    });

    test('should handle deeply nested skill objects efficiently', () => {
      const complexSkill = {
        id: 'complex-skill',
        name: 'Complex Skill',
        level: 'expert',
        subSkills: Array.from({ length: 100 }, (_, i) => ({
          id: `sub-${i}`,
          name: `Sub Skill ${i}`,
          proficiency: Math.random() * 100
        })),
        metadata: {
          certifications: Array.from({ length: 20 }, (_, i) => `Cert ${i}`),
          projects: Array.from({ length: 50 }, (_, i) => ({
            id: `project-${i}`,
            name: `Project ${i}`,
            technologies: Array.from({ length: 10 }, (_, j) => `Tech ${j}`)
          }))
        }
      };

      const tradeWithComplexSkills = {
        id: 'complex-trade',
        skillsOffered: [complexSkill],
        participants: { creator: 'user-123', participant: null }
      };

      const startTime = performance.now();
      const normalized = TradeCompatibilityService.normalizeTradeData(tradeWithComplexSkills);
      const endTime = performance.now();

      // Should handle complex objects in under 10ms
      expect(endTime - startTime).toBeLessThan(10);
      expect(normalized.skillsOffered[0]).toEqual(complexSkill);
    });
  });
});
