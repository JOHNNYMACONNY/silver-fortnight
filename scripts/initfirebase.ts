import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeChallenges } from '../src/lib/ai-challenges';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin if it hasn't been initialized
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY environment variable is required');
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

async function initializeFirebase() {
  try {
    console.log('🚀 Initializing Firebase...');

    // Initialize challenges
    console.log('📅 Initializing challenges...');
    await initializeChallenges();
    console.log('✅ Challenges initialized successfully');

    console.log('🎉 Firebase initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    process.exit(1);
  }
}

initializeFirebase().then(() => process.exit(0));