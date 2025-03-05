import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTradeRequest,
  createProjectRequest,
  updateRequestStatus,
  getUserRequests
} from '../lib/requests';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn()
  }
}));

describe('Request System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTradeRequest', () => {
    it('should create a trade request successfully', async () => {
      const mockRequestId = 'mock-request-id';
      const mockRequest = {
        senderId: 'user1',
        recipientId: 'user2',
        tradeId: 'trade1',
        tradeName: 'Test Trade',
        type: 'invitation',
        status: 'pending'
      };

      vi.mocked(addDoc).mockResolvedValueOnce({ id: mockRequestId } as any);

      const result = await createTradeRequest(
        mockRequest.senderId,
        mockRequest.recipientId,
        mockRequest.tradeId,
        mockRequest.tradeName,
        mockRequest.type as any,
        'Test message'
      );

      expect(result).toBe(mockRequestId);
      expect(collection).toHaveBeenCalledWith(db, 'tradeRequests');
    });

    it('should prevent sending request to self', async () => {
      await expect(
        createTradeRequest(
          'user1',
          'user1',
          'trade1',
          'Test Trade',
          'invitation'
        )
      ).rejects.toThrow('Cannot send trade request to yourself');
    });
  });

  describe('createProjectRequest', () => {
    it('should create a project request successfully', async () => {
      const mockRequestId = 'mock-request-id';
      const mockRequest = {
        senderId: 'user1',
        recipientId: 'user2',
        projectId: 'project1',
        projectName: 'Test Project',
        positionId: 'position1',
        positionName: 'Developer',
        type: 'application',
        status: 'pending',
        requiredSkills: ['React', 'TypeScript'],
        proposedSkills: ['React']
      };

      vi.mocked(addDoc).mockResolvedValueOnce({ id: mockRequestId } as any);

      const result = await createProjectRequest(
        mockRequest.senderId,
        mockRequest.recipientId,
        mockRequest.projectId,
        mockRequest.projectName,
        mockRequest.positionId,
        mockRequest.positionName,
        mockRequest.type as any,
        mockRequest.requiredSkills,
        mockRequest.proposedSkills
      );

      expect(result).toBe(mockRequestId);
      expect(collection).toHaveBeenCalledWith(db, 'projectRequests');
    });

    it('should validate proposed skills against required skills', async () => {
      await expect(
        createProjectRequest(
          'user1',
          'user2',
          'project1',
          'Test Project',
          'position1',
          'Developer',
          'application',
          ['React', 'TypeScript'],
          ['Angular'] // Invalid skill
        )
      ).rejects.toThrow('Invalid skills provided: Angular');
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status successfully', async () => {
      const mockRequestId = 'request1';
      const mockUserId = 'user1';
      const mockRequest = {
        data: () => ({
          recipientId: mockUserId,
          status: 'pending'
        }),
        exists: () => true
      };

      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockRequest] } as any);

      await updateRequestStatus(
        mockRequestId,
        'tradeRequests',
        'accepted',
        mockUserId
      );

      expect(collection).toHaveBeenCalledWith(db, 'tradeRequests');
    });

    it('should prevent non-recipient from updating status', async () => {
      const mockRequest = {
        data: () => ({
          recipientId: 'user2',
          status: 'pending'
        }),
        exists: () => true
      };

      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockRequest] } as any);

      await expect(
        updateRequestStatus('request1', 'tradeRequests', 'accepted', 'user1')
      ).rejects.toThrow('Only the request recipient can update the status');
    });
  });

  describe('getUserRequests', () => {
    it('should fetch user requests successfully', async () => {
      const mockRequests = [
        {
          id: 'request1',
          data: () => ({
            senderId: 'user1',
            status: 'pending'
          })
        }
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockRequests } as any);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);

      const result = await getUserRequests('user1', 'tradeRequests');

      expect(result).toHaveProperty('received');
      expect(result).toHaveProperty('sent');
      expect(collection).toHaveBeenCalledWith(db, 'tradeRequests');
    });
  });
});
