import fs from 'fs';
import path from 'path';
import { initializeTestEnvironment, assertSucceeds, assertFails, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const projectId = 'demo-tradeya-gami';

beforeAll(async () => {
  const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules }
  });

  // Seed data with admin privileges (rules disabled)
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    // Seed a normal user and an admin user profile docs so isAdmin() works
    await setDoc(doc(db, 'users', 'u1'), { roles: ['user'] });
    await setDoc(doc(db, 'users', 'admin1'), { roles: ['admin'] });

    // xpTransactions seed
    const xpId = 't1';
    await setDoc(doc(db, 'xpTransactions', xpId), { id: xpId, userId: 'u1', amount: 50, source: 'TEST', createdAt: new Date() });

    // userAchievements seed
    const uaId = 'ua1';
    await setDoc(doc(db, 'userAchievements', uaId), { id: uaId, userId: 'u1', achievementId: 'first_trade', unlockedAt: new Date() });

    // notifications seed (recipientId field per services)
    const nId = 'n1';
    await setDoc(doc(db, 'notifications', nId), { id: nId, recipientId: 'u1', type: 'achievement_unlocked', title: 'ok', message: 'ok', createdAt: new Date() });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore security rules for admin gamification reads', () => {
  it('allows admin to read any xpTransactions', async () => {
    const ctx = testEnv.authenticatedContext('admin1');
    const db = ctx.firestore();
    await assertSucceeds(getDoc(doc(db, 'xpTransactions', 't1')));
  });

  it('denies non-owner, non-admin to read others xpTransactions', async () => {
    const ctx = testEnv.authenticatedContext('u2');
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, 'xpTransactions', 't1')));
  });

  it('allows owner to read own xpTransactions', async () => {
    const ctx = testEnv.authenticatedContext('u1');
    const db = ctx.firestore();
    await assertSucceeds(getDoc(doc(db, 'xpTransactions', 't1')));
  });

  it('allows admin to read any userAchievements', async () => {
    const ctx = testEnv.authenticatedContext('admin1');
    const db = ctx.firestore();
    await assertSucceeds(getDoc(doc(db, 'userAchievements', 'ua1')));
  });

  it('denies non-owner, non-admin to read others userAchievements', async () => {
    const ctx = testEnv.authenticatedContext('u2');
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, 'userAchievements', 'ua1')));
  });

  it('allows owner to read own userAchievements', async () => {
    const ctx = testEnv.authenticatedContext('u1');
    const db = ctx.firestore();
    await assertSucceeds(getDoc(doc(db, 'userAchievements', 'ua1')));
  });

  it('allows admin and owner reads for notifications with recipientId', async () => {
    const admin = testEnv.authenticatedContext('admin1').firestore();
    const owner = testEnv.authenticatedContext('u1').firestore();
    const other = testEnv.authenticatedContext('u2').firestore();
    await assertSucceeds(getDoc(doc(admin, 'notifications', 'n1')));
    await assertSucceeds(getDoc(doc(owner, 'notifications', 'n1')));
    await assertFails(getDoc(doc(other, 'notifications', 'n1')));
  });
});

