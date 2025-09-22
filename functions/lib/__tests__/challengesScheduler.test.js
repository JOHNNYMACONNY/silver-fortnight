"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const challengesScheduler_1 = require("../challengesScheduler");
// Build a tiny mock for firebase-admin's firestore
const buildMockDb = (options) => {
    const updates = [];
    const sets = [];
    const makeDoc = () => ({ ref: { id: Math.random().toString(36).slice(2) } });
    const makeSnap = (count) => ({
        forEach: (cb) => {
            Array.from({ length: count }).forEach(() => cb(makeDoc()));
        },
        docs: Array.from({ length: count }).map(makeDoc),
    });
    const batch = () => ({
        update: (ref, payload) => updates.push({ ref, payload }),
        set: (ref, payload) => sets.push({ ref, payload }),
        commit: async () => undefined,
    });
    const col = (name) => ({
        where: () => ({
            where: () => ({
                get: async () => {
                    var _a, _b, _c;
                    if (name === 'challenges') {
                        // Return upcoming → to activate, or active → to complete
                        const count = ((_a = options.challengesDocs) !== null && _a !== void 0 ? _a : 0) + ((_b = options.activeDocs) !== null && _b !== void 0 ? _b : 0);
                        return makeSnap(count);
                    }
                    else if (name === 'challengeTemplates') {
                        return makeSnap((_c = options.templatesDocs) !== null && _c !== void 0 ? _c : 0);
                    }
                    return makeSnap(0);
                },
            }),
            get: async () => { var _a; return makeSnap((_a = options.challengesDocs) !== null && _a !== void 0 ? _a : 0); },
        }),
        doc: () => ({ id: Math.random().toString(36).slice(2) }),
        get: async () => { var _a; return makeSnap((_a = options.challengesDocs) !== null && _a !== void 0 ? _a : 0); },
    });
    return {
        updates,
        sets,
        firestore: () => ({
            collection: col,
            batch,
        }),
    };
};
jest.mock('firebase-admin', () => {
    let currentDb;
    return {
        __esModule: true,
        default: {},
        initializeApp: jest.fn(),
        firestore: () => currentDb.firestore(),
        // helper to set db per test
        __setDb(db) {
            currentDb = db;
        },
        // expose Timestamp.now used in code (not needed in these tests)
        firestoreNamespace: {
            Timestamp: { now: () => ({ toMillis: () => Date.now() }) },
        },
    };
});
const admin = require('firebase-admin');
describe('challengesScheduler (functions)', () => {
    it('activates scheduled challenges', async () => {
        const mock = buildMockDb({ challengesDocs: 3 });
        admin.__setDb(mock);
        const res = await (0, challengesScheduler_1.activateScheduledChallenges)();
        expect(res.error).toBeNull();
        expect(res.activated).toBeGreaterThanOrEqual(1);
    });
    it('completes expired challenges', async () => {
        const mock = buildMockDb({ activeDocs: 2 });
        admin.__setDb(mock);
        const res = await (0, challengesScheduler_1.completeExpiredChallenges)();
        expect(res.error).toBeNull();
        expect(res.completed).toBeGreaterThanOrEqual(1);
    });
    it('schedules recurring challenges from templates', async () => {
        const mock = buildMockDb({ templatesDocs: 4 });
        admin.__setDb(mock);
        const res = await (0, challengesScheduler_1.scheduleRecurringChallenges)();
        expect(res.error).toBeNull();
        expect(res.scheduled).toBeGreaterThanOrEqual(1);
    });
});
//# sourceMappingURL=challengesScheduler.test.js.map