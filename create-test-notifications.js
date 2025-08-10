// Test script to create sample notifications for testing categorization
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXFww5N2iOGAiEWC-cQs4Cx0YG5OWcpf4",
  authDomain: "tradeya-45ede.firebaseapp.com",
  projectId: "tradeya-45ede",
  storageBucket: "tradeya-45ede.firebasestorage.app",
  messagingSenderId: "879169008850",
  appId: "1:879169008850:web:f4f65e7f3c7c1a0e8a7c8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestNotifications() {
  try {
    console.log('🚀 Creating test notifications...\n');
    
    // Use a test user ID - you'll need to replace this with an actual user ID from your system
    const testUserId = 'test-user-id'; // TODO: Replace with actual user ID
    
    const testNotifications = [
      {
        userId: testUserId,
        type: 'trade',
        title: 'Trade Interest Received',
        content: 'Someone is interested in your trade offer',
        message: 'Someone is interested in your trade offer',
        read: false,
        createdAt: Timestamp.now(),
        data: { tradeId: 'test-trade-123' }
      },
      {
        userId: testUserId,
        type: 'project',
        title: 'Project Collaboration Invite',
        content: 'You have been invited to collaborate on a project',
        message: 'You have been invited to collaborate on a project',
        read: false,
        createdAt: Timestamp.now(),
        data: { projectId: 'test-project-456' }
      },
      {
        userId: testUserId,
        type: 'challenge',
        title: 'Challenge Completed',
        content: 'Congratulations! You completed a challenge',
        message: 'Congratulations! You completed a challenge',
        read: false,
        createdAt: Timestamp.now(),
        data: { challengeId: 'test-challenge-789' }
      },
      {
        userId: testUserId,
        type: 'message',
        title: 'New Message',
        content: 'You have received a new message',
        message: 'You have received a new message',
        read: false,
        createdAt: Timestamp.now(),
        data: { conversationId: 'test-conversation-101' }
      },
      {
        userId: testUserId,
        type: 'system',
        title: 'Account Update',
        content: 'Your account information has been updated',
        message: 'Your account information has been updated',
        read: false,
        createdAt: Timestamp.now(),
        data: {}
      }
    ];
    
    const notificationsRef = collection(db, 'notifications');
    
    for (const notification of testNotifications) {
      const docRef = await addDoc(notificationsRef, notification);
      console.log(`✅ Created ${notification.type} notification: ${docRef.id}`);
    }
    
    console.log('\n🎉 All test notifications created successfully!');
    console.log('\n⚠️  Note: Update the testUserId in the script with your actual user ID to see these notifications in the app.');
    
  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  }
}

createTestNotifications().then(() => {
  console.log('\n✅ Test notification creation complete');
  process.exit(0);
});
