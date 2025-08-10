// Debug script to check notification types in the database
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function debugNotifications() {
  try {
    console.log('🔍 Checking notifications in database...\n');
    
    const notificationsRef = collection(db, 'notifications');
    const snapshot = await getDocs(notificationsRef);
    
    if (snapshot.empty) {
      console.log('❌ No notifications found in database');
      return;
    }
    
    console.log(`📝 Found ${snapshot.size} notifications:\n`);
    
    const typeStats = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const type = data.type || 'undefined';
      
      // Count types
      typeStats[type] = (typeStats[type] || 0) + 1;
      
      console.log(`📄 ${doc.id}:`);
      console.log(`   Type: ${type}`);
      console.log(`   Title: ${data.title || 'N/A'}`);
      console.log(`   User: ${data.userId || 'N/A'}`);
      console.log(`   Read: ${data.read || false}`);
      console.log(`   Created: ${data.createdAt?.toDate?.() || data.createdAt || 'N/A'}`);
      console.log('');
    });
    
    console.log('📊 Type Statistics:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  }
}

debugNotifications().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
});
