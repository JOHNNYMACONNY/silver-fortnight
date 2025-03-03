import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '../lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { migrateTrades, migrateProjects, runMigration, Migration } from '../../scripts/migrate-to-request-system';
import type { TradeRequest, ProjectPositionRequest } from '../types/requests';
import { createMockTradeRequest, createMockProjectRequest } from './setupTests';

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
  Timestamp: {
    now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
    fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })
  },
  writeBatch: vi.fn(),
  addDoc: vi.fn()
}));

describe('Migration System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Trade Migration', () => {
    const mockTrades = [
      {
        id: 'trade1',
        ref: { id: 'trade1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          ownerName: 'Test Owner',
          title: 'Test Trade',
          pendingParticipants: ['user1', 'user2'],
          migratedToRequestSystem: false
        })
      },
      {
        id: 'trade2',
        ref: { id: 'trade2', update: vi.fn() },
        data: () => ({
          ownerId: 'owner2',
          title: 'Another Trade',
          pendingParticipants: [],
          migratedToRequestSystem: false
        })
      }
    ];

    it('should migrate pending participants to trade requests and set notification status', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockTrades } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      // Create expected request using utility
      const expectedRequest = createMockTradeRequest({
        senderId: 'owner1',
        recipientId: 'user1',
        tradeId: 'trade1',
        tradeName: 'Test Trade',
        status: 'pending',
        type: 'invitation',
        notificationSent: true,
        message: 'Migration: Original trade invitation from Test Owner'
      });

      const results = await migrateTrades();

      expect(results.totalProcessed).toBe(2);
      expect(results.successful).toBe(2);
      expect(results.failed).toBe(0);
      expect(addDoc).toHaveBeenCalledTimes(2); // One for each pending participant
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          senderId: 'owner1',
          recipientId: 'user1',
          tradeId: 'trade1',
          tradeName: 'Test Trade',
          status: 'pending',
          type: 'invitation'
        })
      );
    });

    it('should skip trades without pending participants', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ 
        docs: [mockTrades[1]] 
      } as any);

      const results = await migrateTrades();

      expect(results.totalProcessed).toBe(1);
      expect(results.successful).toBe(1);
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should mark trades as migrated and remove pending participants', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockTrades } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      await migrateTrades();

      expect(mockBatch.update).toHaveBeenCalledWith(
        mockTrades[0].ref,
        expect.objectContaining({
          pendingParticipants: [],
          migratedToRequestSystem: true,
          updatedAt: expect.any(Object)
        })
      );
    });

    it('should handle trades with missing owner information', async () => {
      const mockTradeWithoutOwner = {
        id: 'trade3',
        ref: { id: 'trade3', update: vi.fn() },
        data: () => ({
          ownerId: 'owner3',
          pendingParticipants: ['user1'],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ 
        docs: [mockTradeWithoutOwner] 
      } as any);

      const results = await migrateTrades();

      expect(results.successful).toBe(1);
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tradeName: 'Unnamed Trade'
        })
      );
    });

    it('should maintain batch atomicity', async () => {
      const mockBatch = { 
        update: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('Batch error'))
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockTrades } as any);

      await expect(migrateTrades()).rejects.toThrow('Batch error');
    });
  });

  describe('Project Position Migration', () => {
    const mockProjects = [
      {
        id: 'project1',
        ref: { id: 'project1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          title: 'Test Project',
          positions: [
            {
              id: 'pos1',
              title: 'Developer',
              requiredSkills: ['React', 'TypeScript'],
              pendingApplicants: ['user1']
            },
            {
              id: 'pos2',
              title: 'Designer',
              requiredSkills: ['Figma'],
              pendingApplicants: ['user2', 'user3']
            }
          ],
          migratedToRequestSystem: false
        })
      }
    ];

    it('should migrate pending applicants to position requests and set notification status', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockProjects } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      // Create expected request using utility
      const expectedRequest = createMockProjectRequest({
        senderId: 'user1',
        recipientId: 'owner1',
        projectId: 'project1',
        projectName: 'Test Project',
        positionId: 'pos1',
        positionName: 'Developer',
        requiredSkills: ['React', 'TypeScript'],
        status: 'pending',
        type: 'application',
        notificationSent: true,
        message: 'Migration: Original position application'
      });

      const results = await migrateProjects();

      expect(results.totalProcessed).toBe(1);
      expect(results.successful).toBe(1);
      expect(addDoc).toHaveBeenCalledTimes(3); // One for each pending applicant across positions
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          projectId: 'project1',
          projectName: 'Test Project',
          positionId: 'pos1',
          positionName: 'Developer',
          requiredSkills: ['React', 'TypeScript']
        })
      );
    });

    it('should mark projects as migrated and update positions', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockProjects } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      await migrateProjects();

      expect(mockBatch.update).toHaveBeenCalledWith(
        mockProjects[0].ref,
        expect.objectContaining({
          positions: expect.arrayContaining([
            expect.objectContaining({
              id: 'pos1',
              title: 'Developer',
              requiredSkills: ['React', 'TypeScript'],
              pendingApplicants: [] // Should be cleared
            })
          ]),
          migratedToRequestSystem: true,
          updatedAt: expect.any(Object)
        })
      );
    });

    it('should handle projects without positions', async () => {
      const mockProjectWithoutPositions = {
        id: 'project2',
        ref: { id: 'project2', update: vi.fn() },
        data: () => ({
          ownerId: 'owner2',
          title: 'Empty Project',
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ 
        docs: [mockProjectWithoutPositions] 
      } as any);

      const results = await migrateProjects();

      expect(results.totalProcessed).toBe(1);
      expect(results.successful).toBe(1);
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  describe('Migration Error Handling', () => {
    it('should handle addDoc failures during trade migration', async () => {
      const mockTrade = {
        id: 'trade1',
        ref: { id: 'trade1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          ownerName: 'Test Owner',
          title: 'Test Trade',
          pendingParticipants: ['user1'],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockTrade] } as any);
      vi.mocked(addDoc).mockRejectedValueOnce(new Error('Failed to create request'));

      const results = await migrateTrades();

      expect(results.totalProcessed).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.successful).toBe(0);
      expect(results.errors[0].message).toBe('Failed to create request');
      expect(mockBatch.update).not.toHaveBeenCalled();
    });

    it('should handle addDoc failures during project migration', async () => {
      const mockProject = {
        id: 'project1',
        ref: { id: 'project1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          title: 'Test Project',
          positions: [{
            id: 'pos1',
            title: 'Developer',
            pendingApplicants: ['user1']
          }],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockProject] } as any);
      vi.mocked(addDoc).mockRejectedValueOnce(new Error('Failed to create request'));

      const results = await migrateProjects();

      expect(results.totalProcessed).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.successful).toBe(0);
      expect(results.errors[0].message).toBe('Failed to create request');
      expect(mockBatch.update).not.toHaveBeenCalled();
    });

    it('should track failed migrations separately', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ 
        docs: [{
          id: 'trade1',
          ref: { id: 'trade1', update: vi.fn() },
          data: () => { throw new Error('Data error'); }
        }] 
      } as any);

      const results = await migrateTrades();

      expect(results.totalProcessed).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.successful).toBe(0);
      expect(results.errors[0]).toBeInstanceOf(Error);
      expect(results.errors[0].message).toBe('Data error');
    });

    it('should continue processing after individual failures', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      
      const mockTrades = [
        {
          id: 'trade1',
          ref: { id: 'trade1', update: vi.fn() },
          data: () => { throw new Error('Data error'); }
        },
        {
          id: 'trade2',
          ref: { id: 'trade2', update: vi.fn() },
          data: () => ({
            ownerId: 'owner2',
            title: 'Valid Trade',
            pendingParticipants: ['user1'],
            migratedToRequestSystem: false
          })
        }
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockTrades } as any);

      const results = await migrateTrades();

      expect(results.totalProcessed).toBe(2);
      expect(results.failed).toBe(1);
      expect(results.successful).toBe(1);
    });
  });

  describe('Request Notification Fields', () => {
    it('should set notification fields correctly in trade requests', async () => {
      const mockTrade = {
        id: 'trade1',
        ref: { id: 'trade1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          ownerName: 'Test Owner',
          title: 'Test Trade',
          pendingParticipants: ['user1'],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockTrade] } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      await migrateTrades();

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          notificationSent: true,
          message: 'Migration: Original trade invitation from Test Owner'
        })
      );
    });

    it('should set notification fields correctly in project requests', async () => {
      const mockProject = {
        id: 'project1',
        ref: { id: 'project1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          title: 'Test Project',
          positions: [{
            id: 'pos1',
            title: 'Developer',
            pendingApplicants: ['user1']
          }],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockProject] } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      await migrateProjects();

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          notificationSent: true,
          message: 'Migration: Original position application'
        })
      );
    });
  });

  describe('Project Position Edge Cases', () => {
    it('should handle projects with positions but no pending applicants', async () => {
      const mockProject = {
        id: 'project1',
        ref: { id: 'project1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          title: 'Test Project',
          positions: [{
            id: 'pos1',
            title: 'Developer',
            pendingApplicants: [] // Empty pending applicants
          }],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockProject] } as any);

      const results = await migrateProjects();

      expect(results.totalProcessed).toBe(1);
      expect(results.successful).toBe(1);
      expect(addDoc).not.toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledWith(
        mockProject.ref,
        expect.objectContaining({
          migratedToRequestSystem: true,
          positions: expect.arrayContaining([
            expect.objectContaining({
              id: 'pos1',
              pendingApplicants: []
            })
          ])
        })
      );
    });
  });

  describe('Migration Status Tracking', () => {
    it('should not remigrate already migrated trades', async () => {
      const migratedTrade = {
        id: 'trade1',
        ref: { id: 'trade1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          title: 'Migrated Trade',
          pendingParticipants: ['user1'],
          migratedToRequestSystem: true // Already migrated
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [migratedTrade] } as any);

      const results = await migrateTrades();

      expect(results.totalProcessed).toBe(1);
      expect(results.successful).toBe(1);
      expect(addDoc).not.toHaveBeenCalled();
      expect(mockBatch.update).not.toHaveBeenCalled();
    });

    it('should not remigrate already migrated projects', async () => {
      const migratedProject = {
        id: 'project1',
        ref: { id: 'project1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          title: 'Migrated Project',
          positions: [{
            id: 'pos1',
            title: 'Developer',
            pendingApplicants: ['user1'],
          }],
          migratedToRequestSystem: true // Already migrated
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [migratedProject] } as any);

      const results = await migrateProjects();

      expect(results.totalProcessed).toBe(1);
      expect(results.successful).toBe(1);
      expect(addDoc).not.toHaveBeenCalled();
      expect(mockBatch.update).not.toHaveBeenCalled();
    });
  });

  describe('Console Output', () => {
    let consoleLog: any;
    let consoleError: any;

    beforeEach(() => {
      consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLog.mockRestore();
      consoleError.mockRestore();
    });

    it('should log migration progress and results', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: [] } as any)  // trades
        .mockResolvedValueOnce({ docs: [] } as any); // projects

      await runMigration();

      expect(consoleLog).toHaveBeenCalledWith('Starting migration to request system...');
      expect(consoleLog).toHaveBeenCalledWith('\nTrade Migration Results:');
      expect(consoleLog).toHaveBeenCalledWith('\nProject Migration Results:');
      expect(consoleLog).toHaveBeenCalledWith('\nMigration completed.');
    });

    it('should log errors when migrations fail', async () => {
      const error = new Error('Migration failed');
      vi.mocked(getDocs).mockRejectedValueOnce(error);

      await expect(runMigration()).rejects.toThrow('Migration failed');
      expect(consoleError).toHaveBeenCalledWith('Migration failed:', error);
    });
  });

  describe('Batch Atomicity', () => {
    it('rolls back all changes if batch commit fails', async () => {
      const mockTrade = {
        id: 'trade1',
        ref: { id: 'trade1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          ownerName: 'Test Owner',
          title: 'Test Trade',
          pendingParticipants: ['user1'],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { 
        update: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('Batch commit failed'))
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockTrade] } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      await expect(migrateTrades()).rejects.toThrow('Batch commit failed');

      // Verify update was attempted but rolled back
      expect(mockBatch.update).toHaveBeenCalledWith(
        mockTrade.ref,
        expect.objectContaining({
          pendingParticipants: [],
          migratedToRequestSystem: true
        })
      );
    });

    it('handles partial failures during batch updates', async () => {
      const mockTrades = [
        {
          id: 'trade1',
          ref: { id: 'trade1', update: vi.fn() },
          data: () => ({
            ownerId: 'owner1',
            title: 'Trade 1',
            pendingParticipants: ['user1'],
            migratedToRequestSystem: false
          })
        },
        {
          id: 'trade2',
          ref: { id: 'trade2', update: vi.fn() },
          data: () => ({
            ownerId: 'owner2',
            title: 'Trade 2',
            pendingParticipants: ['user2'],
            migratedToRequestSystem: false
          })
        }
      ];

      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('Partial failure'))
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: mockTrades } as any);
      vi.mocked(addDoc)
        .mockResolvedValueOnce({ id: 'request1' } as any)
        .mockRejectedValueOnce(new Error('Failed to create request'));

      await expect(migrateTrades()).rejects.toThrow('Partial failure');

      // Verify both trades were attempted but rolled back
      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(addDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Messaging Integration', () => {
    it('creates context conversations for migrated trade requests', async () => {
      const mockTrade = {
        id: 'trade1',
        ref: { id: 'trade1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          ownerName: 'Test Owner',
          title: 'Test Trade',
          pendingParticipants: ['user1'],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockTrade] } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      await migrateTrades();

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Migration: Original trade invitation from Test Owner',
          notificationSent: true
        })
      );
    });

    it('creates context conversations for migrated project requests', async () => {
      const mockProject = {
        id: 'project1',
        ref: { id: 'project1', update: vi.fn() },
        data: () => ({
          ownerId: 'owner1',
          title: 'Test Project',
          positions: [{
            id: 'pos1',
            title: 'Developer',
            pendingApplicants: ['user1']
          }],
          migratedToRequestSystem: false
        })
      };

      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [mockProject] } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'request1' } as any);

      await migrateProjects();

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Migration: Original position application',
          notificationSent: true
        })
      );
    });
  });

  describe('Full Migration Process', () => {
    it('should run both trade and project migrations', async () => {
      const mockBatch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      
      // Empty results for simplicity
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: [] } as any)  // trades
        .mockResolvedValueOnce({ docs: [] } as any); // projects

      await runMigration();

      // Verify both migrations were attempted
      expect(collection).toHaveBeenCalledWith(db, 'trades');
      expect(collection).toHaveBeenCalledWith(db, 'projects');
    });
  });
});
