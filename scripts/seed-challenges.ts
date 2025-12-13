import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, Timestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { demoSoloChallenges, demoTradeChallenges, demoCollaborationChallenges } from '../src/data/demoTierChallenges';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Optional: connect to emulators for local seeding if requested
if (process.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    // eslint-disable-next-line no-console
    console.log('[seed] Connected to Firebase emulators');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[seed] Failed to connect to Firebase emulators (continuing):', e);
  }
}

const categories = ['design', 'development', 'audio', 'video', 'writing', 'photography', '3d', 'mixed_media', 'trading', 'collaboration', 'community'] as const;
const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const types = ['solo', 'trade', 'collaboration'] as const;

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return Timestamp.fromDate(d);
}

async function ensureAuth(): Promise<void> {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;
  if (email && password) {
    // eslint-disable-next-line no-console
    console.log('[seed] Signing in with seed user');
    await signInWithEmailAndPassword(auth, email, password);
    return;
  }
  // Try anonymous auth as a fallback (requires Anonymous provider enabled)
  try {
    // eslint-disable-next-line no-console
    console.log('[seed] No seed credentials provided; attempting anonymous sign-in');
    await signInAnonymously(auth);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[seed] Anonymous sign-in failed. Provide SEED_USER_EMAIL and SEED_USER_PASSWORD env vars.');
    throw e;
  }
}

async function seedChallenges() {
  const colRef = collection(db, 'challenges');
  const allChallenges = [
    ...demoSoloChallenges,
    ...demoTradeChallenges,
    ...demoCollaborationChallenges
  ];

  console.log(`[seed] Starting to seed ${allChallenges.length} challenges...`);

  for (const challengeData of allChallenges) {
    // challenges in demo data already have IDs, but we can potentially overwrite or let firestore gen if needed.
    // The demo data has 'id' property. Let's use it to ensure idempotency if possible, or generate new ones.
    // Force new IDs to bypass permission lock on old docs (version 2)
    const id = (challengeData.id ? `${challengeData.id}_v2` : doc(colRef).id);

    // Map demo data to Firestore schema
    // Note: demo data keys might slightly differ or need defaults.
    // The demo data has 'duration' string, 'estimatedHours' number, etc.
    // It has 'coverImage' which is what we want.

    const firestoreChallenge = {
      ...challengeData,
      id,
      creatorId: auth.currentUser?.uid, // Essential for permissions!
      startDate: Timestamp.now(),
      endDate: daysFromNow(30), // Default to 30 days out
      status: 'active',
      participantCount: Math.floor(Math.random() * 50),
      completionCount: Math.floor(Math.random() * 20),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Ensure specific fields key for the UI
      coverImage: (challengeData as any).coverImage || null,
      rewards: (challengeData as any).rewards || { xp: 100 },
      tags: (challengeData as any).tags || [],
      instructions: (challengeData as any).instructions || [],
      objectives: (challengeData as any).objectives || [],
      category: (challengeData as any).category || 'development',
    };

    // Clean up undefineds if any
    Object.keys(firestoreChallenge).forEach(key =>
      (firestoreChallenge as any)[key] === undefined && delete (firestoreChallenge as any)[key]
    );

    await setDoc(doc(db, 'challenges', id), firestoreChallenge);
    // eslint-disable-next-line no-console
    console.log(`Seeded challenge ${id} (${challengeData.title})`);
  }
}

ensureAuth().then(() => seedChallenges()).then(() => {
  // eslint-disable-next-line no-console
  console.log('Challenge seed complete');
  process.exit(0);
}).catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Challenge seed failed', e);
  process.exit(1);
});


