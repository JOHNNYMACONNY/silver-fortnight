import { updateUserStreak } from '../services/streaks';

jest.mock('../firebase-config', () => ({
  getSyncFirebaseDb: () => ({}) as any,
}));

// Mock Firestore methods used inside updateUserStreak transaction
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  Timestamp: { fromDate: (d: Date) => ({ toDate: () => d }) },
  runTransaction: async (_db: any, fn: any) => fn({
    get: async () => ({ exists: () => true, data: () => ({
      userId: 'u1', type: 'login', currentStreak: 3, longestStreak: 5,
      lastActivity: { toDate: () => new Date('2025-01-01') },
      freezesUsed: 0, maxFreezes: 1
    }) }),
    set: jest.fn(),
  }),
}));

jest.mock('../services/streakConfig', () => ({
  getStreakMilestoneThresholds: () => [3, 7, 14, 30],
  getStreakMaxFreezes: () => 1,
}));

jest.mock('../services/gamification', () => ({
  awardXPWithLeaderboardUpdate: jest.fn(async () => ({ success: true, xpAwarded: 25 })),
  emitGamificationNotification: jest.fn(),
}));

jest.mock('../services/notifications', () => ({
  createNotification: jest.fn(),
}));

describe('streaks freeze logic', () => {
  it('auto-uses a freeze on a single missed day gap', async () => {
    const when = new Date('2025-01-03'); // Gap of 2 days vs 2025-01-01
    const res = await updateUserStreak('u1', 'login', when);
    expect(res.success).toBe(true);
    expect(res.data?.streak.currentStreak).toBe(4);
    expect(res.data?.streak.freezesUsed).toBe(1);
  });
});


