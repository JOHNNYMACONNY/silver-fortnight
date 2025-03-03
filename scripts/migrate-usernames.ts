import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { generateUsername } from '../src/utils/username';

// Initialize Firebase Admin
initializeApp({
  credential: cert(require('../serviceaccount.json'))
});

const db = getFirestore();

async function migrateUsers() {
  try {
    console.log('Starting user profile migration...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs;
    
    console.log(`Found ${users.length} users to process`);
    
    let updatedCount = 0;
    const usedUsernames = new Set<string>();
    
    for (const userDoc of users) {
      const userData = userDoc.data();
      let needsUpdate = false;
      const updates: Record<string, any> = {};
      
      // Add displayNameLower if missing
      if (!userData.displayNameLower && userData.displayName) {
        updates.displayNameLower = userData.displayName.toLowerCase();
        needsUpdate = true;
      }
      
      // Add username if missing
      if (!userData.username) {
        const baseStr = userData.displayName || userData.email?.split('@')[0] || 'user';
        let username = generateUsername(baseStr);
        let suffix = 1;
        
        while (usedUsernames.has(username)) {
          username = generateUsername(baseStr, `-${suffix}`);
          suffix++;
        }
        
        updates.username = username;
        usedUsernames.add(username);
        needsUpdate = true;
      } else {
        usedUsernames.add(userData.username);
      }
      
      if (needsUpdate) {
        updates.updatedAt = new Date();
        await userDoc.ref.update(updates);
        updatedCount++;
        console.log(`Updated user ${userDoc.id}:`, updates);
      }
    }
    
    console.log(`Migration completed successfully. Updated ${updatedCount} users.`);
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers().then(() => process.exit(0));
