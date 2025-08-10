// Simple utility to create sample XP data for testing leaderboard
import { db } from './src/firebase-config.js';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

const sampleUsers = [
  { id: 'user1', name: 'Alice Johnson', xp: 2500 },
  { id: 'user2', name: 'Bob Smith', xp: 1800 },
  { id: 'user3', name: 'Carol Davis', xp: 3200 },
  { id: 'user4', name: 'David Wilson', xp: 1200 },
  { id: 'user5', name: 'Eva Martinez', xp: 2900 }
];

async function createSampleData() {
  try {
    console.log('Creating sample XP data...');
    
    for (const user of sampleUsers) {
      // Create userXP document
      await setDoc(doc(db, 'userXP', user.id), {
        userId: user.id,
        userName: user.name,
        totalXP: user.xp,
        level: Math.floor(user.xp / 500) + 1,
        lastUpdated: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      console.log(`✅ Created XP data for ${user.name}`);
    }
    
    console.log('🎉 Sample data created successfully!');
    console.log('You can now test the leaderboard functionality.');
    
  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
  }
}

createSampleData();
