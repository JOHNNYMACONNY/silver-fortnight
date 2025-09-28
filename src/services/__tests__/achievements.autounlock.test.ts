describe('achievements auto-unlock uses aggregated user stats', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const mockFirestore = () => {
    jest.doMock('firebase/firestore', () => ({
      collection: jest.fn((_db: any, _name: string) => ({ name: _name })),
      query: jest.fn((coll: any, ..._rest: any[]) => ({ _name: coll.name })),
      where: jest.fn(),
      getDocs: jest.fn(async () => ({ docs: [], size: 0 })),
      doc: jest.fn(() => ({ id: 'ua1' })),
      runTransaction: jest.fn(async (_db: any, fn: any) => {
        const tx = { set: jest.fn(), get: jest.fn() } as any;
        return await fn(tx);
      }),
      Timestamp: { now: jest.fn(() => ({ seconds: Date.now() / 1000, toDate: () => new Date() })) },
    }));
    jest.doMock('../../firebase-config', () => ({ getSyncFirebaseDb: () => ({}) }));
    jest.doMock('../gamification', () => ({ awardXP: jest.fn(async () => ({ success: true, xpAwarded: 0, leveledUp: false, newAchievements: [] })) }));
    jest.doMock('../notifications', () => ({ createNotification: jest.fn(async () => undefined) }));
  };

  it('unlocks first_trade when tradeCount >= 1', async () => {
    mockFirestore();
    jest.doMock('../userStats', () => ({ getUserStats: jest.fn(async () => ({
      tradeCount: 1,
      roleCount: 0,
      totalXP: 0,
      quickResponses: 0,
      evidenceCount: 0,
    })) }));

    const { checkAndUnlockAchievements } = await import('../achievements');
    const res = await checkAndUnlockAchievements('u1');

    expect(Array.isArray(res)).toBe(true);
    expect(res.some(a => a.id === 'first_trade')).toBe(true);
  });

  it('does not unlock when below thresholds', async () => {
    mockFirestore();
    jest.doMock('../userStats', () => ({ getUserStats: jest.fn(async () => ({
      tradeCount: 0,
      roleCount: 0,
      totalXP: 0,
      quickResponses: 0,
      evidenceCount: 0,
    })) }));

    const { checkAndUnlockAchievements } = await import('../achievements');
    const res = await checkAndUnlockAchievements('u2');

    expect(res.length).toBe(0);
  });
});

