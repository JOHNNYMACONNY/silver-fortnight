import { joinChallenge } from '../challenges';
import { ChallengeDifficulty, ChallengeStatus, ChallengeType } from '../../types/gamification';
import { runTransaction } from 'firebase/firestore';

jest.mock('../../services/threeTierProgression', () => ({
  getUserThreeTierProgress: jest.fn(async () => ({
    success: true,
    data: { unlockedTiers: [] },
  })),
}));

describe('joinChallenge tier gating', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, VITE_ENFORCE_TIER_GATING: 'true' } as any;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('blocks joining when tier-gating is enforced and tier is locked', async () => {
    // Arrange: mock transaction to return an ACTIVE TRADE challenge and no existing userChallenge
    (runTransaction as jest.Mock).mockImplementation(async (_db, fn) => {
      const tx = {
        get: jest.fn(async (_ref) => ({
          exists: () => true,
          data: () => ({
            id: 'c1',
            title: 'Trade Challenge',
            description: '',
            type: ChallengeType.TRADE,
            category: undefined,
            difficulty: ChallengeDifficulty.BEGINNER,
            requirements: [],
            rewards: { xp: 0 },
            status: ChallengeStatus.ACTIVE,
            participantCount: 0,
          }),
        })),
        set: jest.fn(),
        update: jest.fn(),
      } as any;
      return await fn(tx);
    });

    // Act
    const res = await joinChallenge('c1', 'u1');

    // Assert
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Tier locked/i);
  });
});


