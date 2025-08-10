#!/usr/bin/env node

/**
 * Test User Cleanup Script
 * 
 * This script helps identify and remove test users from the Firebase database.
 * It can be run manually to clean up test data.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc, query, where } = require('firebase/firestore');

// Firebase configuration - you'll need to update this with your actual config
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

// Patterns to identify test users
const TEST_USER_PATTERNS = [
  /test.*@.*\.com/i,
  /.*test.*@example\.com/i,
  /demo.*@.*\.com/i,
  /fake.*@.*\.com/i,
  /temp.*@.*\.com/i,
  /.*@test\.com/i,
  /.*@demo\.com/i,
  /.*@fake\.com/i,
  /.*@temp\.com/i
];

// Test display names
const TEST_DISPLAY_NAME_PATTERNS = [
  /test\s*user/i,
  /demo\s*user/i,
  /fake\s*user/i,
  /temp\s*user/i,
  /user\s*\d+/i,
  /anonymous/i
];

/**
 * Identify potential test users
 */
async function identifyTestUsers() {
  try {
    console.log('🔍 Scanning for test users...');
    
    const usersCollection = collection(db, 'users');
    const userDocs = await getDocs(usersCollection);
    
    const testUsers = [];
    const realUsers = [];
    
    userDocs.docs.forEach(doc => {
      const userData = doc.data();
      const email = userData.email || '';
      const displayName = userData.displayName || '';
      
      // Check if user matches test patterns
      const isTestEmail = TEST_USER_PATTERNS.some(pattern => pattern.test(email));
      const isTestDisplayName = TEST_DISPLAY_NAME_PATTERNS.some(pattern => pattern.test(displayName));
      
      // Additional checks for test users
      const hasTestId = doc.id.includes('test') || doc.id.includes('demo');
      const isRecent = userData.createdAt && (Date.now() - userData.createdAt.toDate().getTime()) < (7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      const userInfo = {
        id: doc.id,
        email: email,
        displayName: displayName,
        createdAt: userData.createdAt?.toDate()?.toISOString() || 'Unknown',
        isTestEmail,
        isTestDisplayName,
        hasTestId,
        isRecent
      };
      
      if (isTestEmail || isTestDisplayName || hasTestId) {
        testUsers.push(userInfo);
      } else {
        realUsers.push(userInfo);
      }
    });
    
    console.log(`\n📊 Scan Results:`);
    console.log(`   Total users: ${userDocs.docs.length}`);
    console.log(`   Potential test users: ${testUsers.length}`);
    console.log(`   Real users: ${realUsers.length}`);
    
    if (testUsers.length > 0) {
      console.log(`\n🧪 Potential Test Users:`);
      testUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email || 'No email'} (${user.displayName || 'No name'})`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Created: ${user.createdAt}`);
        console.log(`      Reasons: ${[
          user.isTestEmail && 'test email pattern',
          user.isTestDisplayName && 'test display name',
          user.hasTestId && 'test ID pattern'
        ].filter(Boolean).join(', ')}`);
        console.log('');
      });
    }
    
    return { testUsers, realUsers };
    
  } catch (error) {
    console.error('❌ Error scanning users:', error);
    return { testUsers: [], realUsers: [] };
  }
}

/**
 * Delete test users (with confirmation)
 */
async function deleteTestUsers(testUsers) {
  if (testUsers.length === 0) {
    console.log('✅ No test users found to delete.');
    return;
  }
  
  console.log(`\n⚠️  WARNING: This will permanently delete ${testUsers.length} test users!`);
  console.log('   This action cannot be undone.');
  
  // In a real script, you'd want to add readline for confirmation
  // For now, we'll just log what would be deleted
  console.log('\n🗑️  Users that would be deleted:');
  
  for (const user of testUsers) {
    try {
      console.log(`   Deleting: ${user.email || user.displayName || user.id}`);
      
      // Uncomment the following line to actually delete users
      // await deleteDoc(doc(db, 'users', user.id));
      
      console.log(`   ✅ Would delete user: ${user.id}`);
    } catch (error) {
      console.error(`   ❌ Error deleting user ${user.id}:`, error);
    }
  }
  
  console.log('\n⚠️  To actually delete users, uncomment the deleteDoc line in the script.');
}

/**
 * Main function
 */
async function main() {
  console.log('🧹 TradeYa Test User Cleanup Script');
  console.log('=====================================\n');
  
  const { testUsers, realUsers } = await identifyTestUsers();
  
  if (process.argv.includes('--delete')) {
    await deleteTestUsers(testUsers);
  } else {
    console.log('\n💡 To delete test users, run: node cleanup-test-users.js --delete');
    console.log('   (Make sure to review the list above first!)');
  }
  
  console.log('\n✨ Cleanup scan complete!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { identifyTestUsers, deleteTestUsers };
