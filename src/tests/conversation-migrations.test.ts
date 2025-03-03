import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '../lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { 
  collection, 
  getDocs, 
  doc,
  writeBatch,
  addDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { consolidateExistingConversations } from '../../scripts/consolidate-conversations';
import { updateExistingConversations } from '../../scripts/update-existing-conversations';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    writeBatch: vi.fn()
  }
}));

// Mock Firestore methods
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  doc: vi.fn(),
  Timestamp: {
    now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
    fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })
  },
  writeBatch: vi.fn(),
  addDoc: vi.fn()
}));

describe('Conversation Migrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Update Conversations', () => {
    const mockConversations = [
      {
        id: 'conv1',
        ref: { id: 'conv1', update: vi.fn() },
        data: () => ({
          participantIds: ['user1', 'user2'],
          tradeName: 'Test Trade',
          tradeId: 'trade1'
        })
      },
      {
        id: 'conv2',
        ref: { id: 'conv2', update: vi.fn() },
        data: () => ({
          participantIds: ['user1', 'user3'],
          projectName: 'Test Project',
          projectId: 'project1',
          positionId: 'pos1',
          positionName: 'Developer'
        })
      },
      {
        id: 'conv3',
        ref: { id: 'conv3', update: vi.fn() },
        data: () => ({
          participantIds: ['user2', 'user3']
        })
      }
    ];

    it('correctly identifies and updates conversation types', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockConversations } as any);

      await updateExistingConversations();

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          conversationType: 'trade',
          contextId: 'trade1',
          contextName: 'Test Trade'
        })
      );

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          conversationType: 'project',
          contextId: 'project1',
          contextName: 'Test Project',
          positionId: 'pos1',
          positionName: 'Developer'
        })
      );

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          conversationType: 'direct',
          contextId: null,
          contextName: null
        })
      );
    });

    it('skips conversations that already have a type', async () => {
      const conversationWithType = {
        id: 'conv4',
        ref: { id: 'conv4', update: vi.fn() },
        data: () => ({
          participantIds: ['user1', 'user2'],
          conversationType: 'direct'
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ 
        docs: [...mockConversations, conversationWithType] 
      } as any);

      await updateExistingConversations();

      expect(mockBatch.update).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'conv4' })
      );
    });
  });

  describe('Consolidate Conversations', () => {
    const mockConversations = [
      {
        id: 'conv1',
        ref: { id: 'conv1', update: vi.fn() },
        data: () => ({
          participantIds: ['user1', 'user2'],
          conversationType: 'trade',
          contextId: 'trade1',
          updatedAt: Timestamp.fromDate(new Date(2024, 1, 1))
        })
      },
      {
        id: 'conv2',
        ref: { id: 'conv2', update: vi.fn() },
        data: () => ({
          participantIds: ['user1', 'user2'],
          conversationType: 'trade',
          contextId: 'trade1',
          updatedAt: Timestamp.fromDate(new Date(2024, 1, 2))
        })
      },
      {
        id: 'conv3',
        ref: { id: 'conv3', update: vi.fn() },
        data: () => ({
          participantIds: ['user1', 'user2'],
          conversationType: 'project',
          contextId: 'project1',
          updatedAt: Timestamp.fromDate(new Date(2024, 1, 1))
        })
      }
    ];

    it('consolidates duplicate conversations respecting context', async () => {
      const mockBatch = { update: vi.fn(), delete: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: mockConversations } as any) // conversations
        .mockResolvedValue({ docs: [] } as any); // messages

      await consolidateExistingConversations();

      // Should consolidate trade conversations
      expect(mockBatch.delete).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'conv2' })
      );

      // Should not consolidate project conversation
      expect(mockBatch.delete).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: 'conv3' })
      );
    });

    it('moves messages to primary conversation', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          ref: { id: 'msg1' },
          data: () => ({
            conversationId: 'conv2',
            text: 'Test message',
            createdAt: Timestamp.now()
          })
        }
      ];

      const mockBatch = { 
        update: vi.fn(), 
        delete: vi.fn(), 
        set: vi.fn(),
        commit: vi.fn() 
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: mockConversations } as any) // conversations
        .mockResolvedValue({ docs: mockMessages } as any); // messages

      await consolidateExistingConversations();

      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          conversationId: 'conv1',
          text: 'Test message'
        })
      );

      expect(mockBatch.delete).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'msg1' })
      );
    });

    it('preserves most recent metadata', async () => {
      const mockBatch = { 
        update: vi.fn(), 
        delete: vi.fn(), 
        set: vi.fn(),
        commit: vi.fn() 
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: mockConversations } as any)
        .mockResolvedValue({ docs: [] } as any);

      await consolidateExistingConversations();

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'conv1' }),
        expect.objectContaining({
          updatedAt: expect.anything()
        })
      );
    });

    it('handles batch commit errors', async () => {
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        set: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('Batch error'))
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: mockConversations } as any)
        .mockResolvedValue({ docs: [] } as any);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await consolidateExistingConversations();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error consolidating conversations'),
        expect.any(Error)
      );
    });
  });
});
