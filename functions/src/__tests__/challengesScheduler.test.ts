import { activateScheduledChallenges, completeExpiredChallenges, scheduleRecurringChallenges } from '../challengesScheduler';

// Build a tiny mock for firebase-admin's firestore
const buildMockDb = (options: {
  challengesDocs?: number;
  activeDocs?: number;
  templatesDocs?: number;
}) => {
  const updates: any[] = [];
  const sets: any[] = [];

  const makeDoc = () => ({ ref: { id: Math.random().toString(36).slice(2) } });
  const makeSnap = (count: number) => ({
    forEach: (cb: (doc: any) => void) => {
      Array.from({ length: count }).forEach(() => cb(makeDoc()));
    },
    docs: Array.from({ length: count }).map(makeDoc),
  });

  const batch = () => ({
    update: (ref: any, payload: any) => updates.push({ ref, payload }),
    set: (ref: any, payload: any) => sets.push({ ref, payload }),
    commit: async () => undefined,
  });

  const col = (name: string) => ({
    where: () => ({
      where: () => ({
        get: async () => {
          if (name === 'challenges') {
            // Return upcoming → to activate, or active → to complete
            const count = (options.challengesDocs ?? 0) + (options.activeDocs ?? 0);
            return makeSnap(count);
          } else if (name === 'challengeTemplates') {
            return makeSnap(options.templatesDocs ?? 0);
          }
          return makeSnap(0);
        },
      }),
      get: async () => makeSnap(options.challengesDocs ?? 0),
    }),
    doc: () => ({ id: Math.random().toString(36).slice(2) }),
    get: async () => makeSnap(options.challengesDocs ?? 0),
  });

  return {
    updates,
    sets,
    firestore: () => ({
      collection: col,
      batch,
    }),
  } as any;
};

jest.mock('firebase-admin', () => {
  let currentDb: any;
  return {
    __esModule: true,
    default: {},
    initializeApp: jest.fn(),
    firestore: () => currentDb.firestore(),
    // helper to set db per test
    __setDb(db: any) {
      currentDb = db;
    },
    // expose Timestamp.now used in code (not needed in these tests)
    firestoreNamespace: {
      Timestamp: { now: () => ({ toMillis: () => Date.now() }) },
    },
  } as any;
});

const admin = require('firebase-admin');

describe('challengesScheduler (functions)', () => {
  it('activates scheduled challenges', async () => {
    const mock = buildMockDb({ challengesDocs: 3 });
    admin.__setDb(mock);
    const res = await activateScheduledChallenges();
    expect(res.error).toBeNull();
    expect(res.activated).toBeGreaterThanOrEqual(1);
  });

  it('completes expired challenges', async () => {
    const mock = buildMockDb({ activeDocs: 2 });
    admin.__setDb(mock);
    const res = await completeExpiredChallenges();
    expect(res.error).toBeNull();
    expect(res.completed).toBeGreaterThanOrEqual(1);
  });

  it('schedules recurring challenges from templates', async () => {
    const mock = buildMockDb({ templatesDocs: 4 });
    admin.__setDb(mock);
    const res = await scheduleRecurringChallenges();
    expect(res.error).toBeNull();
    expect(res.scheduled).toBeGreaterThanOrEqual(1);
  });
});


