import { updateUserStreak } from '../services/streaks';

jest.mock('../firebase-config', () => ({
  getSyncFirebaseDb: () => ({}) as any,
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  Timestamp: { fromDate: (d: Date) => ({ toDate: () => d }) },
  runTransaction: async (_db: any, fn: any) => fn({
    get: async () => ({ exists: () => true, data: () => ({
      userId: 'u1', type: 'login', currentStreak: 5, longestStreak: 7,
      lastActivity: { toDate: () => new Date('2025-01-01') },
      freezesUsed: 0, maxFreezes: 1
    }) }),
    set: jest.fn(),
  }),
}));

// Force auto-freeze preference off
jest.mock('../services/streakConfig', () => ({
  getStreakMilestoneThresholds: () => [3, 7, 14, 30],
  getStreakMaxFreezes: () => 1,
  isAutoFreezeEnabled: () => false,
}));

jest.mock('../services/gamification', () => ({
  awardXPWithLeaderboardUpdate: jest.fn(async () => ({ success: true, xpAwarded: 25 })),
  emitGamificationNotification: jest.fn(),
}));

jest.mock('../services/notifications', () => ({
  createNotification: jest.fn(),
}));

describe('streaks auto-freeze preference', () => {
  it('does not auto-freeze when preference is disabled (resets streak)', async () => {
    const when = new Date('2025-01-03'); // gap of 2 days from Jan 1
    const res = await updateUserStreak('u1', 'login', when);
    expect(res.success).toBe(true);
    expect(res.data?.streak.currentStreak).toBe(1); // reset due to no auto-freeze
    expect(res.data?.streak.freezesUsed).toBe(0);
  });
});


