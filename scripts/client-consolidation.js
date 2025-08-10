// Import Firebase v9 SDK
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';

// Your Firebase config (from the running app)
const firebaseConfig = {
  projectId: "tradeya-45ede",
  appId: "1:476911238747:web:e9b73b157f3fa63ba4897e",
  storageBucket: "tradeya-45ede.firebasestorage.app",
  apiKey: "AIzaSyCCr7wxWHJyv4C9pGOJ0Juf7latDmceTew",
  authDomain: "tradeya-45ede.firebaseapp.com",
  messagingSenderId: "476911238747",
  measurementId: "G-XNL1Y7CZWW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function consolidateUser(userName, primaryId, secondaryId) {
  console.log(`\n📝 Consolidating ${userName}...`);
  
  try {
    // Get both documents
    const primaryDocRef = doc(db, 'users', primaryId);
    const secondaryDocRef = doc(db, 'users', secondaryId);
    
    const [primaryDoc, secondaryDoc] = await Promise.all([
      getDoc(primaryDocRef),
      getDoc(secondaryDocRef)
    ]);
    
    if (!primaryDoc.exists()) {
      console.error(`❌ Primary document does not exist for ${userName}`);
      return false;
    }
    
    if (!secondaryDoc.exists()) {
      console.error(`❌ Secondary document does not exist for ${userName}`);
      return false;
    }
    
    const primaryData = primaryDoc.data();
    const secondaryData = secondaryDoc.data();
    
    console.log(`📊 Primary has ${Object.keys(primaryData).length} fields`);
    console.log(`📊 Secondary has ${Object.keys(secondaryData).length} fields`);
    
    // Create merged data
    const mergedData = {
      // Keep primary document base data
      ...primaryData,
      // Add missing fields from secondary
      displayName: secondaryData.displayName || primaryData.displayName || primaryData.name,
      photoURL: secondaryData.photoURL || primaryData.photoURL,
      profilePicture: secondaryData.profilePicture || primaryData.profilePicture || secondaryData.photoURL,
      updatedAt: secondaryData.updatedAt || new Date()
    };
    
    // Remove any 'id' field that might point to another document
    delete mergedData.id;
    
    console.log(`🔄 Merged data will have ${Object.keys(mergedData).length} fields`);
    
    // Update the primary document with merged data
    await setDoc(primaryDocRef, mergedData);
    console.log(`✅ ${userName}: Primary document updated`);
    
    // Delete the secondary document
    await deleteDoc(secondaryDocRef);
    console.log(`🗑️ ${userName}: Secondary document deleted`);
    
    console.log(`🎉 ${userName}: Consolidation completed successfully!`);
    return true;
    
  } catch (error) {
    console.error(`💥 Error consolidating ${userName}:`, error);
    return false;
  }
}

async function consolidateAllUsers() {
  console.log('🚀 Starting user profile consolidation...\n');
  
  const users = [
    {
      name: 'LJ KEONi',
      primary: 'iEcj2FyQqadhvnbOLfztMoHEpF13',
      secondary: 'zOp6TiSHchWpzsFN4ny9'
    },
    {
      name: 'Thalita B',
      primary: 'DQmOXZ76IIWqq188lJyM8iuwLoj2',
      secondary: 'V2M1C8A8HN1fyxo1GcoW'
    },
    {
      name: 'Neal Frazier',
      primary: 'iyifrKcMGTPH80MDNNntTivE7vX2',
      secondary: 'oXYZ6SVOOFIpAc9cX4ZB'
    }
  ];
  
  let successCount = 0;
  
  for (const user of users) {
    const success = await consolidateUser(user.name, user.primary, user.secondary);
    if (success) successCount++;
  }
  
  console.log(`\n📋 Consolidation Complete!`);
  console.log(`✅ Successfully consolidated: ${successCount}/${users.length} users`);
  
  if (successCount === users.length) {
    console.log('🎉 All user profiles have been consolidated!');
    console.log('💡 The affected users should now appear properly in the User Directory and connections system.');
  }
}

// Run the consolidation
consolidateAllUsers()
  .then(() => {
    console.log('\n✅ Script completed');
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
  }); 