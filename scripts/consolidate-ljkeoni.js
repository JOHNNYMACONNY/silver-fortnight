// Import Firebase v9 SDK
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';

// Your Firebase config
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

async function consolidateLJKeoni() {
  console.log('🔧 Consolidating LJ KEONi profile...');
  console.log('👤 Authenticated user can only update their own documents\n');
  
  // LJ KEONi's documents
  const primaryId = 'iEcj2FyQqadhvnbOLfztMoHEpF13';  // Firebase UID (can update)
  const secondaryId = 'zOp6TiSHchWpzsFN4ny9';        // Secondary document (can delete)
  
  try {
    console.log('📋 Step 1: Getting both documents...');
    
    // Get both documents
    const primaryDocRef = doc(db, 'users', primaryId);
    const secondaryDocRef = doc(db, 'users', secondaryId);
    
    const [primaryDoc, secondaryDoc] = await Promise.all([
      getDoc(primaryDocRef),
      getDoc(secondaryDocRef)
    ]);
    
    if (!primaryDoc.exists()) {
      console.error('❌ Primary document does not exist');
      return false;
    }
    
    if (!secondaryDoc.exists()) {
      console.error('❌ Secondary document does not exist');
      return false;
    }
    
    const primaryData = primaryDoc.data();
    const secondaryData = secondaryDoc.data();
    
    console.log(`📊 Primary document has: ${Object.keys(primaryData).length} fields`);
    console.log(`📊 Secondary document has: ${Object.keys(secondaryData).length} fields`);
    
    console.log('\n📋 Step 2: Merging data...');
    
    // Create merged data - keep primary document's base, add missing fields from secondary
    const mergedData = {
      // Keep all primary document data
      ...primaryData,
      // Add missing fields from secondary document
      displayName: secondaryData.displayName || primaryData.displayName || primaryData.name,
      photoURL: secondaryData.photoURL || primaryData.photoURL,
      profilePicture: secondaryData.profilePicture || primaryData.profilePicture || secondaryData.photoURL,
      updatedAt: secondaryData.updatedAt || new Date()
    };
    
    // Remove any 'id' field that points to another document
    delete mergedData.id;
    
    console.log(`✅ Merged data will have: ${Object.keys(mergedData).length} fields`);
    console.log('📝 Added fields: displayName, photoURL, profilePicture, updatedAt');
    
    console.log('\n📋 Step 3: Updating primary document...');
    
    // Update the primary document with merged data
    await setDoc(primaryDocRef, mergedData);
    console.log('✅ Primary document updated with merged data');
    
    console.log('\n📋 Step 4: Deleting secondary document...');
    
    // Delete the secondary document
    await deleteDoc(secondaryDocRef);
    console.log('✅ Secondary document deleted');
    
    console.log('\n🎉 LJ KEONi profile consolidation completed successfully!');
    console.log('💡 LJ KEONi should now appear properly in the User Directory');
    console.log('💡 Profile picture and display name should now be visible');
    
    return true;
    
  } catch (error) {
    console.error('💥 Error during consolidation:', error);
    console.error('📋 Error details:', error.code, error.message);
    return false;
  }
}

// Run the consolidation
console.log('🚀 LJ KEONi Profile Consolidation Tool');
console.log('======================================\n');
console.log('🔐 Note: This script can only consolidate LJ KEONi\'s profile');
console.log('   because ljkeoni@gmail.com is the authenticated user.\n');

consolidateLJKeoni()
  .then((success) => {
    if (success) {
      console.log('\n✅ Script completed successfully!');
      console.log('🔄 Refresh your app to see LJ KEONi in the User Directory');
    } else {
      console.log('\n❌ Script completed with errors');
    }
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
  }); 