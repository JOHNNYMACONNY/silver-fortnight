import { confirmRoleCompletion } from '../roleCompletions';
import { CompletionRequestStatus } from '../../types/collaboration';
import { getDoc } from 'firebase/firestore';

describe('roleCompletions permission checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fails when a non-creator attempts to confirm completion', async () => {
    // collaboration exists but creatorId differs
    (getDoc as unknown as jest.Mock)
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ creatorId: 'creator1' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({}) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ status: CompletionRequestStatus.PENDING }) });

    const res = await confirmRoleCompletion('collab1', 'role1', 'req1', 'notCreator');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Only the collaboration creator/i);
  });
});


