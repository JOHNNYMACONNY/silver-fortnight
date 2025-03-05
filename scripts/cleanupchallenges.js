#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Template challenges for regeneration
const TEMPLATE_CHALLENGES = {
  weekly: {
    title: 'Cross-Discipline Exchange',
    description: 'Complete trades with users from different skill domains. Share your expertise across different fields and learn something new!',
    type: 'weekly',
    requirements: [
      { type: 'trades', count: 2, skillCategory: 'cross-discipline' }
    ],
    rewards: { xp: 250 }
  },
  monthly: {
    title: 'Full Stack Journey',
    description: 'Complete a series of trades covering both frontend and backend development. Become a well-rounded developer!',
    type: 'monthly',
    requirements: [
      { type: 'trades', count: 2, skillCategory: 'frontend' },
      { type: 'trades', count: 2, skillCategory: 'backend' }
    ],
    rewards: { xp: 1000, badge: 'full_stack_master' }
  }
};

// Verify challenge structure
async function verifyChallengeStructure() {
  console.log('Verifying challenge structure...');
  
  const challengesRef = collection(db, 'challenges');
  const snapshot = await getDocs(challengesRef);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Challenge ${doc.id}:`, {
      title: data.title,
      type: data.type,
      status: data.status,
      startDate: data.startDate?.toDate?.(),
      endDate: data.endDate?.toDate?.(),
      requirements: data.requirements,
      participants: data.participants?.length,
      completions: data.completions?.length
    });
  });
}

// Clean up invalid challenges and regenerate
async function cleanupInvalidChallenges() {
  console.log('Cleaning up invalid challenges...');
  
  const batch = writeBatch(db);
  const challengesRef = collection(db, 'challenges');
  
  // Find invalid challenges
  const snapshot = await getDocs(challengesRef);
  let cleanupCount = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.startDate || !data.endDate || !data.requirements || !data.rewards) {
      batch.delete(doc.ref);
      cleanupCount++;
    }
  });
  
  if (cleanupCount > 0) {
    console.log(`Found ${cleanupCount} invalid challenges to clean up`);
    await batch.commit();
    
    // Regenerate challenges
    const now = new Date();
    const newBatch = writeBatch(db);
    
    // Weekly challenge
    const weeklyEndDate = new Date(now);
    weeklyEndDate.setDate(weeklyEndDate.getDate() + 7);
    
    const weeklyDocRef = doc(challengesRef);
    newBatch.set(weeklyDocRef, {
      ...TEMPLATE_CHALLENGES.weekly,
      status: 'pending',
      participants: [],
      completions: [],
      startDate: serverTimestamp(),
      endDate: Timestamp.fromDate(weeklyEndDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Monthly challenge
    const monthlyEndDate = new Date(now);
    monthlyEndDate.setMonth(monthlyEndDate.getMonth() + 1);
    
    const monthlyDocRef = doc(challengesRef);
    newBatch.set(monthlyDocRef, {
      ...TEMPLATE_CHALLENGES.monthly,
      status: 'pending',
      participants: [],
      completions: [],
      startDate: serverTimestamp(),
      endDate: Timestamp.fromDate(monthlyEndDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    await newBatch.commit();
    console.log('Generated new challenges successfully');
  } else {
    console.log('No invalid challenges found');
  }
}

async function main() {
  try {
    console.log('Starting challenge cleanup process...');
    
    console.log('\nVerifying current challenge structure...');
    await verifyChallengeStructure();
    
    console.log('\nCleaning up invalid challenges...');
    await cleanupInvalidChallenges();
    
    console.log('\nVerifying final challenge structure...');
    await verifyChallengeStructure();
    
    console.log('\nCleanup process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});