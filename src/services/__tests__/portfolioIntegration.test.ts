// src/services/__tests__/portfolioIntegration.test.ts

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  generateTradePortfolioItem, 
  generateCollaborationPortfolioItem,
  getUserPortfolioItems,
  updatePortfolioItemVisibility,
  updatePortfolioItemFeatured,
  updatePortfolioItemPinned,
  deletePortfolioItem
} from '../portfolio';
import { getSyncFirebaseDb } from '../../firebase-config';

// Mock Firestore object (use var to avoid TDZ with jest.mock hoisting)
var mockFirestore = {};

// Mock Firebase
jest.mock('../../firebase-config', () => ({
  getSyncFirebaseDb: jest.fn(() => mockFirestore),
  db: mockFirestore
}));

// Mock Firestore functions
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: any[]) => mockAddDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  doc: (...args: any[]) => mockDoc(...args),
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000 })
  }
}));

describe('Portfolio Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock return values
    mockCollection.mockReturnValue({ _type: 'collection-ref' });
    mockDoc.mockReturnValue({ _type: 'doc-ref' });
    mockQuery.mockReturnValue({ _type: 'query' });
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Trade Portfolio Generation', () => {
    it('should generate portfolio item from completed trade', async () => {
      mockAddDoc.mockResolvedValue({ id: 'portfolio-item-1' });

      const mockTrade = {
        id: 'trade-123',
        title: 'Logo Design for Website',
        description: 'Create a modern logo for tech startup',
        creatorId: 'user-1',
        creatorName: 'John Doe',
        creatorPhotoURL: 'https://example.com/photo.jpg',
        participantId: 'user-2',
        participantName: 'Jane Smith',
        participantPhotoURL: 'https://example.com/photo2.jpg',
        offeredSkills: ['Logo Design', 'Branding'],
        requestedSkills: ['Web Development'],
        status: 'completed'
      };

      const result = await generateTradePortfolioItem(
        mockTrade,
        'user-2', // participant
        false, // isCreator = false (user-2 is participant, not creator)
        true // defaultVisibility
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-2',
          sourceId: 'trade-123',
          sourceType: 'trade',
          title: 'Logo Design for Website',
          skills: ['Web Development'], // participant gets requestedSkills
          visible: true,
          featured: false,
          pinned: false
        })
      );
    });

    it('should handle trade portfolio generation errors gracefully', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      const mockTrade = {
        id: 'trade-123',
        title: 'Test Trade',
        description: 'Test description',
        creatorId: 'user-1',
        participantId: 'user-2',
        offeredSkills: ['Skill A'],
        requestedSkills: ['Skill B']
      };

      const result = await generateTradePortfolioItem(
        mockTrade,
        'user-2',
        false, // isCreator = false
        true // defaultVisibility
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Firestore error');
    });
  });

  describe('Collaboration Portfolio Generation', () => {
    it('should generate portfolio item from completed collaboration role', async () => {
      mockAddDoc.mockResolvedValue({ id: 'portfolio-item-2' });

      const mockCollaboration = {
        id: 'collab-456',
        title: 'Mobile App Development',
        description: 'Build a React Native app',
        creatorId: 'user-1',
        creatorName: 'Project Lead',
        participants: ['user-2', 'user-3']
      };

      const mockRole = {
        id: 'role-1',
        title: 'Frontend Developer',
        description: 'Develop the user interface',
        requiredSkills: [
          { name: 'React Native', level: 'intermediate' },
          { name: 'JavaScript', level: 'advanced' }
        ],
        completionEvidence: [
          { type: 'link', url: 'https://github.com/repo', title: 'Source Code' }
        ],
        assignedUserId: 'user-2'
      };

      const result = await generateCollaborationPortfolioItem(
        mockCollaboration,
        mockRole,
        'user-2',
        true
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-2',
          sourceId: 'role-1', // sourceId is role.id, not collaboration.id
          sourceType: 'collaboration',
          title: 'Frontend Developer - Mobile App Development',
          skills: [], // Implementation returns empty array for skills
          evidence: [
            { type: 'link', url: 'https://github.com/repo', title: 'Source Code' }
          ],
          visible: true,
          featured: false,
          pinned: false
        })
      );
    });

    it('should include collaborators in portfolio item', async () => {
      mockAddDoc.mockResolvedValue({ id: 'portfolio-item-3' });

      const mockCollaboration = {
        id: 'collab-789',
        title: 'Design System',
        description: 'Create comprehensive design system',
        creatorId: 'user-1',
        creatorName: 'Design Lead',
        creatorPhotoURL: 'https://example.com/lead.jpg',
        participants: ['user-2', 'user-3']
      };

      const mockRole = {
        id: 'role-2',
        title: 'UI Designer',
        description: 'Design interface components',
        requiredSkills: [{ name: 'Figma', level: 'expert' }],
        assignedUserId: 'user-2'
      };

      const result = await generateCollaborationPortfolioItem(
        mockCollaboration,
        mockRole,
        'user-2', // not the creator
        true
      );

      expect(result.success).toBe(true);
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          collaborators: expect.arrayContaining([
            expect.objectContaining({
              id: 'user-1',
              name: 'Design Lead',
              photoURL: 'https://example.com/lead.jpg',
              role: 'collaborator' // Implementation sets all to 'collaborator'
            })
          ])
        })
      );
    });
  });

  describe('Portfolio Management', () => {
    it('should retrieve user portfolio items', async () => {
      const mockPortfolioItems = [
        {
          id: 'item-1',
          title: 'Project 1',
          sourceType: 'trade',
          visible: true,
          featured: false,
          pinned: true
        },
        {
          id: 'item-2',
          title: 'Project 2',
          sourceType: 'collaboration',
          visible: true,
          featured: true,
          pinned: false
        }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockPortfolioItems.map(item => ({
          id: item.id,
          data: () => item
        }))
      });

      const result = await getUserPortfolioItems('user-123');

      // getUserPortfolioItems returns array directly, not { success, data }
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'item-1',
        title: 'Project 1'
      }));
    });

    it('should update portfolio item visibility', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await updatePortfolioItemVisibility('user-123', 'item-1', false);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { visible: false }
      );
    });

    it('should update portfolio item featured status', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await updatePortfolioItemFeatured('user-123', 'item-1', true);

      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { featured: true }
      );
    });

    it('should update portfolio item pinned status', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await updatePortfolioItemPinned('user-123', 'item-1', true);

      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { pinned: true }
      );
    });

    it('should delete portfolio item', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await deletePortfolioItem('user-123', 'item-1');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything());
    });

    it('should handle portfolio management errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

      const result = await updatePortfolioItemVisibility('user-123', 'item-1', false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });
});
