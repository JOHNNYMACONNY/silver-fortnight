/** @jest-environment node */
// New transactional tests with explicit Firestore mocks

describe('awardXP transactional flows', () => {
  const baseFF = () => {
    const state: any = { userXP: null };
    const Timestamp = { now: jest.fn(() => ({ seconds: Date.now() / 1000, toDate: () => new Date() })) } as any;
    const doc = jest.fn((_db: any, coll: string, id?: string) => ({ coll, id }));
    const collection = jest.fn((_db: any, coll: string) => ({ coll }));
    const getDoc = jest.fn(async (ref: any) => {
      if (ref.coll === 'userXP') {
        return state.userXP
          ? { exists: () => true, data: () => state.userXP }
          : { exists: () => false, data: () => null };
      }
      return { exists: () => false, data: () => null };
    });
    const runTransaction = jest.fn(async (_db: any, fn: any) => {
      const tx = {
        get: jest.fn(async (ref: any) => getDoc(ref)),
        set: jest.fn((ref: any, data: any) => {
          if (ref.coll === 'userXP') state.userXP = data;
        }),
      } as any;
      return await fn(tx);
    });
    return { state, Timestamp, doc, collection, getDoc, runTransaction };
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('initializes new user XP and records transaction', async () => {
    const ff = baseFF();
    jest.doMock('firebase/firestore', () => ({
      Timestamp: ff.Timestamp,
      doc: ff.doc,
      collection: ff.collection,
      getDoc: ff.getDoc,
      runTransaction: ff.runTransaction,
      query: jest.fn(),
      where: jest.fn(),
      getDocs: jest.fn(async () => ({ docs: [], size: 0 })),
      orderBy: jest.fn(),
      limit: jest.fn(),
      updateDoc: jest.fn(),
      setDoc: jest.fn(),
    }));
    jest.doMock('../../firebase-config', () => ({ getSyncFirebaseDb: () => ({}) }));
    jest.doMock('../notifications', () => ({ createNotification: jest.fn(async () => undefined) }));

    const { awardXPCore: awardXP, calculateLevelCore } = await import('../gamification.core');
    const { XPSource, LEVEL_TIERS } = await import('../../types/gamification');

    const res = await awardXP('u1', 100, XPSource.TRADE_COMPLETION, 's1', 'desc');
    expect(res.success).toBe(true);
    expect(res.xpAwarded).toBe(100);
    expect(res.leveledUp).toBe(false);
    // ensure state updated
    expect(ff.state.userXP.totalXP).toBe(100);
    expect(ff.state.userXP.currentLevel).toBe(1);
    const expected = calculateLevelCore(100).xpToNextLevel;
    expect(ff.state.userXP.xpToNextLevel).toBe(expected);
  });

  it('levels up existing user when crossing threshold', async () => {
    const ff = baseFF();
    ff.state.userXP = { userId: 'u2', totalXP: 1999, currentLevel: 5, xpToNextLevel: 2, lastUpdated: ff.Timestamp.now(), createdAt: ff.Timestamp.now() };
    jest.doMock('firebase/firestore', () => ({
      Timestamp: ff.Timestamp,
      doc: ff.doc,
      collection: ff.collection,
      getDoc: ff.getDoc,
      runTransaction: ff.runTransaction,
      query: jest.fn(),
      where: jest.fn(),
      getDocs: jest.fn(async () => ({ docs: [], size: 0 })),
      orderBy: jest.fn(),
      limit: jest.fn(),
      updateDoc: jest.fn(),
      setDoc: jest.fn(),
    }));
    jest.doMock('../../firebase-config', () => ({ getSyncFirebaseDb: () => ({}) }));
    jest.doMock('../notifications', () => ({ createNotification: jest.fn(async () => undefined) }));

    const { awardXPCore: awardXP } = await import('../gamification.core');
    const { XPSource } = await import('../../types/gamification');

    const res = await awardXP('u2', 10, XPSource.TRADE_COMPLETION);
    expect(res.success).toBe(true);
    expect(res.leveledUp).toBe(true);
    expect(res.newLevel).toBe(6);
  });

  it('does not fail when leaderboard/reputation updates throw', async () => {
    const ff = baseFF();
    jest.doMock('firebase/firestore', () => ({
      Timestamp: ff.Timestamp,
      doc: ff.doc,
      collection: ff.collection,
      getDoc: ff.getDoc,
      runTransaction: ff.runTransaction,
      query: jest.fn(),
      where: jest.fn(),
      getDocs: jest.fn(async () => ({ docs: [], size: 0 })),
      orderBy: jest.fn(),
      limit: jest.fn(),
      updateDoc: jest.fn(),
      setDoc: jest.fn(),
    }));
    jest.doMock('../../firebase-config', () => ({ getSyncFirebaseDb: () => ({}) }));
    jest.doMock('../notifications', () => ({ createNotification: jest.fn(async () => undefined) }));
    const { awardXPWithLeaderboardUpdateCore } = await import('../gamification.core');
    const { XPSource } = await import('../../types/gamification');

    const res = await awardXPWithLeaderboardUpdateCore('u3', 50, XPSource.TRADE_COMPLETION, undefined, undefined, {
      triggerLeaderboardUpdate: async () => { throw new Error('lb fail'); },
      recomputeUserReputation: async () => { throw new Error('rep fail'); },
    });
    expect(res.success).toBe(true);
    expect(res.xpAwarded).toBe(50);
  });

  it('returns failure gracefully if transaction throws', async () => {
    const ff = baseFF();
    const failingRunTransaction = jest.fn(async () => { throw new Error('tx fail'); });
    jest.doMock('firebase/firestore', () => ({
      Timestamp: ff.Timestamp,
      doc: ff.doc,
      collection: ff.collection,
      getDoc: ff.getDoc,
      runTransaction: failingRunTransaction,
      query: jest.fn(),
      where: jest.fn(),
      getDocs: jest.fn(async () => ({ docs: [], size: 0 })),
      orderBy: jest.fn(),
      limit: jest.fn(),
      updateDoc: jest.fn(),
      setDoc: jest.fn(),
    }));
    jest.doMock('../../firebase-config', () => ({ getSyncFirebaseDb: () => ({}) }));
    jest.doMock('../notifications', () => ({ createNotification: jest.fn(async () => undefined) }));

    const { awardXPCore: awardXP } = await import('../gamification.core');
    const { XPSource } = await import('../../types/gamification');

    const res = await awardXP('u4', 25, XPSource.TRADE_COMPLETION);
    expect(res.success).toBe(false);
    expect(res.xpAwarded).toBe(0);
  });
});

