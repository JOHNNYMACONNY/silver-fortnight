import { confirmRoleCompletion } from '../roleCompletions';
import { getDoc } from 'firebase/firestore';

describe('roleCompletions edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when role document is missing', async () => {
    // collaboration exists
    (getDoc as unknown as jest.Mock)
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ creatorId: 'creator1' }) })
      // role missing
      .mockResolvedValueOnce({ exists: () => false });

    const res = await confirmRoleCompletion('collab1', 'missingRole', 'req1', 'creator1');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Role not found/i);
  });
});


