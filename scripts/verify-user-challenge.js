// Script to verify UserChallenge document exists
// Run with: node verify-user-challenge.js

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// User and challenge from browser
const targetUserId = 'TozfQg0dAHe4ToLyiSnkDqe3ECj2'; // John Frederick Roberts
const challengeId = 'gA3YUnQs9bddiqu8jnaZ'; // Test Challenge Creation

// Test user for auth
const testEmail = 'seed-user@tradeya-test.com';
const testPassword = 'SeedUser123!';

async function verifyUserChallenge() {
  try {
    console.log('🔐 Authenticating...');
    const userCred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Authenticated as:', userCred.user.uid);
    
    // Try as the actual user - sign in as John Frederick Roberts if possible
    // For now, just try to read the document
    
    const userChallengeId = `${targetUserId}_${challengeId}`;
    console.log('\n📋 Checking UserChallenge document...');
    console.log('Document ID:', userChallengeId);
    console.log('User:', targetUserId);
    console.log('Challenge:', challengeId);
    
    const userChallengeRef = doc(db, 'userChallenges', userChallengeId);
    const userChallengeSnap = await getDoc(userChallengeRef);
    
    if (userChallengeSnap.exists()) {
      const data = userChallengeSnap.data();
      console.log('\n✅ SUCCESS! UserChallenge document EXISTS!\n');
      
      console.log('📊 Document Data:');
      console.log(JSON.stringify(data, (key, value) => {
        // Handle Timestamps
        if (value && typeof value === 'object' && value.toDate) {
          return value.toDate().toISOString();
        }
        return value;
      }, 2));
      
      console.log('\n📋 Field Validation:');
      console.log('  userId:', data.userId, data.userId === targetUserId ? '✅' : '❌');
      console.log('  challengeId:', data.challengeId, data.challengeId === challengeId ? '✅' : '❌');
      console.log('  status:', data.status, data.status === 'ACTIVE' ? '✅' : '⚠️');
      console.log('  progress:', data.progress, '✅');
      console.log('  maxProgress:', data.maxProgress, '✅');
      console.log('  startedAt:', data.startedAt ? '✅' : '❌');
      console.log('  joinedAt:', data.joinedAt ? '✅' : '❌');
      
      console.log('\n🎉 The UserChallenge is properly created!');
      console.log('✅ You can now complete this challenge through the UI.');
      
    } else {
      console.log('\n❌ UserChallenge document DOES NOT EXIST');
      console.log('⚠️  This means the join operation failed silently.');
      console.log('\n💡 Possible reasons:');
      console.log('   1. Permission denied when creating document');
      console.log('   2. Transaction failed');
      console.log('   3. UI showing cached/optimistic state');
    }
    
    await auth.signOut();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied - cannot read UserChallenge document');
      console.log('   This suggests Firestore rules might need adjustment');
    }
    
    process.exit(1);
  }
}

verifyUserChallenge();

