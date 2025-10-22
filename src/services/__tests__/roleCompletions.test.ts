import { confirmRoleCompletion, rejectRoleCompletion } from '../roleCompletions';
import { CompletionRequestStatus, RoleState } from '../../types/collaboration';
import { getDoc, updateDoc, runTransaction } from 'firebase/firestore';

jest.mock('../notifications', () => ({
  createNotification: jest.fn(async () => undefined),
}));

jest.mock('../collaborationRoles', () => ({
  updateCollaborationRoleCounts: jest.fn(async () => undefined),
}));

jest.mock('../portfolio', () => ({
  generateCollaborationPortfolioItem: jest.fn(async () => ({ success: true, error: null })),
}));

jest.mock('../gamification', () => ({
  awardRoleCompletionXP: jest.fn(async () => undefined),
}));

describe('roleCompletions service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('approves completion when creator confirms', async () => {
    // Arrange order: collaboration -> role -> request
    (getDoc as jest.Mock)
      .mockImplementationOnce(async () => ({
        exists: () => true,
        data: () => ({ creatorId: 'creator1', title: 'Collab', description: '', creatorName: 'Name' }),
      }))
      .mockImplementationOnce(async () => ({
        exists: () => true,
        data: () => ({ id: 'role1', title: 'Role', description: 'Desc', status: RoleState.FILLED, completionStatus: CompletionRequestStatus.PENDING, requiredSkills: [], completionEvidence: [], assignedUserId: 'u2' }),
      }))
      .mockImplementationOnce(async () => ({
        exists: () => true,
        data: () => ({ id: 'req1', requesterId: 'u2', status: CompletionRequestStatus.PENDING }),
      }));

    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    (runTransaction as jest.Mock).mockResolvedValue(undefined);

    // Act
    const res = await confirmRoleCompletion('collab1', 'role1', 'req1', 'creator1');

    // Assert
    expect(res.success).toBe(true);
    expect(updateDoc).toHaveBeenCalled();
  });

  it('rejects completion and updates request status', async () => {
    // Arrange order: collaboration -> role -> request
    (getDoc as jest.Mock)
      .mockImplementationOnce(async () => ({
        exists: () => true,
        data: () => ({ creatorId: 'creator1', title: 'Collab' }),
      }))
      .mockImplementationOnce(async () => ({
        exists: () => true,
        data: () => ({ id: 'role1', title: 'Role', description: 'Desc', completionStatus: CompletionRequestStatus.PENDING }),
      }))
      .mockImplementationOnce(async () => ({
        exists: () => true,
        data: () => ({ id: 'req1', requesterId: 'u2', status: CompletionRequestStatus.PENDING }),
      }));

    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    // Act
    const res = await rejectRoleCompletion('collab1', 'role1', 'req1', 'creator1', 'needs more work');

    // Assert
    expect(res.success).toBe(true);
    expect(updateDoc).toHaveBeenCalled();
  });
});


