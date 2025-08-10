// Debug script to test leaderboard permissions and data
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDHNgZjOsQdMqYCfFiJKcTIKPLsJEhP7oE",
  authDomain: "tradeya-45ede.firebaseapp.com",
  projectId: "tradeya-45ede",
  storageBucket: "tradeya-45ede.firebasestorage.app",
  messagingSenderId: "306470130308",
  appId: "1:306470130308:web:e3d6dc3da6d8cd1cb91f57",
  measurementId: "G-33WLQWFME6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testLeaderboardPermissions() {
  try {
    console.log('🔐 Signing in anonymously...');
    await signInAnonymously(auth);
    console.log('✅ Signed in successfully');

    // Test userXP collection
    console.log('\n📊 Testing userXP collection...');
    try {
      const userXPQuery = query(
        collection(db, 'userXP'),
        orderBy('totalXP', 'desc'),
        limit(5)
      );
      const userXPSnapshot = await getDocs(userXPQuery);
      console.log(`✅ userXP: Found ${userXPSnapshot.size} documents`);
      
      userXPSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${data.userName || 'Unknown'}: ${data.totalXP || 0} XP`);
      });
    } catch (error) {
      console.log(`❌ userXP error: ${error.message}`);
    }

    // Test leaderboardStats collection
    console.log('\n📈 Testing leaderboardStats collection...');
    try {
      const leaderboardStatsSnapshot = await getDocs(collection(db, 'leaderboardStats'));
      console.log(`✅ leaderboardStats: Found ${leaderboardStatsSnapshot.size} documents`);
      
      if (leaderboardStatsSnapshot.size > 0) {
        const firstDoc = leaderboardStatsSnapshot.docs[0].data();
        console.log(`  Sample document:`, firstDoc);
      }
    } catch (error) {
      console.log(`❌ leaderboardStats error: ${error.message}`);
    }

    // Test userStats collection
    console.log('\n📊 Testing userStats collection...');
    try {
      const userStatsSnapshot = await getDocs(collection(db, 'userStats'));
      console.log(`✅ userStats: Found ${userStatsSnapshot.size} documents`);
      
      if (userStatsSnapshot.size > 0) {
        const firstDoc = userStatsSnapshot.docs[0].data();
        console.log(`  Sample document:`, firstDoc);
      }
    } catch (error) {
      console.log(`❌ userStats error: ${error.message}`);
    }

    console.log('\n🎯 Leaderboard permissions test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLeaderboardPermissions();
