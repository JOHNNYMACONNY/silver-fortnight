import { getGamificationMetrics7d } from '../adminGamificationMetrics';

describe('adminGamificationMetrics.getGamificationMetrics7d', () => {
  const makeTs = (d: Date) => ({ toDate: () => d });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('aggregates 7-day metrics correctly', async () => {
    const now = new Date('2025-01-08T12:00:00Z');
    const sixDaysAgo = new Date('2025-01-02T08:00:00Z');
    const fiveDaysAgo = new Date('2025-01-03T09:00:00Z');

    const docs = (items: any[]) => ({ forEach: (fn: any) => items.forEach((i) => fn({ data: () => i })) });

    const firestoreMock = {
      collection: jest.fn((_db: any, name: string) => ({ name })),
      getDocs: jest.fn(async (q: any) => {
        if (q._name === 'xpTransactions') return docs([
          { createdAt: makeTs(sixDaysAgo), userId: 'u1' },
          { createdAt: makeTs(fiveDaysAgo), userId: 'u1' },
          { createdAt: makeTs(fiveDaysAgo), userId: 'u2' },
        ]);
        if (q._name === 'userAchievements') return docs([
          { unlockedAt: makeTs(fiveDaysAgo) },
          { unlockedAt: makeTs(now) },
        ]);
        if (q._name === 'notifications') return docs([
          { createdAt: makeTs(now), type: 'streak_milestone' },
        ]);
        return docs([]);
      }),
      query: jest.fn((coll: any, ..._rest: any[]) => ({ _name: coll.name })),
      where: jest.fn(),
      Timestamp: { fromDate: jest.fn(() => ({ seconds: now.getTime() / 1000 })) },
    };

    jest.doMock('firebase/firestore', () => firestoreMock);
    jest.doMock('../../firebase-config', () => ({ getSyncFirebaseDb: () => ({}) }));

    const { getGamificationMetrics7d: getMetrics } = await import('../adminGamificationMetrics');
    const res = await getMetrics();

    expect(res.error).toBeNull();
    expect(res.data?.totals.xpAwards).toBe(3);
    expect(res.data?.totals.achievements).toBe(2);
    expect(res.data?.totals.streakMilestones).toBe(1);
    expect(res.data?.totals.uniqueXpRecipients).toBe(2);
  });

  it('returns zeros when there is no data', async () => {
    const firestoreMock = {
      collection: jest.fn((_db: any, name: string) => ({ name })),
      getDocs: jest.fn(async () => ({ forEach: (fn: any) => {} })),
      query: jest.fn((coll: any, ..._rest: any[]) => ({ _name: coll.name })),
      where: jest.fn(),
      Timestamp: { fromDate: jest.fn(() => ({ seconds: 0 })) },
    };
    jest.doMock('firebase/firestore', () => firestoreMock);
    jest.doMock('../../firebase-config', () => ({ getSyncFirebaseDb: () => ({}) }));

    const { getGamificationMetrics7d: getMetrics } = await import('../adminGamificationMetrics');
    const res = await getMetrics();
    expect(res.error).toBeNull();
    expect(res.data?.totals.xpAwards).toBe(0);
    expect(res.data?.totals.achievements).toBe(0);
    expect(res.data?.totals.streakMilestones).toBe(0);
    expect(res.data?.totals.uniqueXpRecipients).toBe(0);
  });
});

