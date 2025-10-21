import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, Timestamp, connectFirestoreEmulator } from 'firebase/firestore';

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

const categories = ['design','development','audio','video','writing','photography','3d','mixed_media','trading','collaboration','community'] as const;
const difficulties = ['beginner','intermediate','advanced','expert'] as const;
const types = ['solo','trade','collaboration'] as const;

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

async function seedChallenges(total = 24) {
  const colRef = collection(db, 'challenges');
  for (let i = 0; i < total; i++) {
    const id = doc(colRef).id;
    const category = pick(categories);
    const difficulty = pick(difficulties);
    const type = pick(types);
    const endInDays = 3 + Math.floor(Math.random() * 21); // 3–24 days
    const rewardsXp = difficulty === 'beginner' ? 100 : difficulty === 'intermediate' ? 200 : difficulty === 'advanced' ? 350 : 500;
    const challenge = {
      id,
      title: `${category.toUpperCase()} ${type.toUpperCase()} Challenge #${i + 1}`,
      description: `A ${difficulty} ${type} challenge in ${category}.` ,
      type,
      category,
      difficulty,
      requirements: [],
      rewards: { xp: rewardsXp },
      startDate: Timestamp.now(),
      endDate: daysFromNow(endInDays),
      status: 'active',
      participantCount: Math.floor(Math.random() * 15),
      completionCount: Math.floor(Math.random() * 10),
      instructions: [],
      objectives: [],
      tags: [category, type, difficulty],
      createdBy: 'seed-script',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    } as any;
    await setDoc(doc(db, 'challenges', id), challenge);
    // eslint-disable-next-line no-console
    console.log(`Seeded challenge ${id} (${challenge.title})`);
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


