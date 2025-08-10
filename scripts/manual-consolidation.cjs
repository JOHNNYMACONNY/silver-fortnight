const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using the Firebase CLI authentication
if (!admin.apps.length) {
  // Try to use Firebase CLI authentication
  try {
    admin.initializeApp({
      projectId: 'tradeya-45ede'
    });
  } catch (error) {
    console.log('Trying alternative initialization...');
    // If that fails, try with explicit config
    admin.initializeApp({
      projectId: 'tradeya-45ede',
      credential: admin.credential.applicationDefault()
    });
  }
}

const db = admin.firestore();

async function consolidateLJKeoni() {
  console.log('🔧 Manually consolidating LJ KEONi profile...');
  
  try {
    // Get both documents
    const primaryDocRef = db.collection('users').doc('iEcj2FyQqadhvnbOLfztMoHEpF13');
    const secondaryDocRef = db.collection('users').doc('zOp6TiSHchWpzsFN4ny9');
    
    const [primaryDoc, secondaryDoc] = await Promise.all([
      primaryDocRef.get(),
      secondaryDocRef.get()
    ]);
    
    if (!primaryDoc.exists) {
      console.error('❌ Primary document does not exist');
      return;
    }
    
    if (!secondaryDoc.exists) {
      console.error('❌ Secondary document does not exist');
      return;
    }
    
    const primaryData = primaryDoc.data();
    const secondaryData = secondaryDoc.data();
    
    console.log('📊 Primary document fields:', Object.keys(primaryData));
    console.log('📊 Secondary document fields:', Object.keys(secondaryData));
    
    // Create merged data
    const mergedData = {
      // Keep primary document base data
      ...primaryData,
      // Add missing fields from secondary
      displayName: secondaryData.displayName,
      photoURL: secondaryData.photoURL,
      profilePicture: secondaryData.profilePicture,
      updatedAt: secondaryData.updatedAt || admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Remove any 'id' field that might have been copied
    delete mergedData.id;
    
    console.log('🔄 Merged data will contain fields:', Object.keys(mergedData));
    
    // Update the primary document
    await primaryDocRef.set(mergedData);
    console.log('✅ Primary document updated with merged data');
    
    // Delete the secondary document
    await secondaryDocRef.delete();
    console.log('🗑️ Secondary document deleted');
    
    console.log('🎉 LJ KEONi profile consolidation completed successfully!');
    
  } catch (error) {
    console.error('💥 Error during consolidation:', error);
  }
}

async function consolidateAllUsers() {
  console.log('🚀 Starting manual consolidation for all 3 users...\n');
  
  const consolidations = [
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
  
  for (const user of consolidations) {
    console.log(`\n📝 Processing ${user.name}...`);
    
    try {
      // Get both documents
      const primaryDocRef = db.collection('users').doc(user.primary);
      const secondaryDocRef = db.collection('users').doc(user.secondary);
      
      const [primaryDoc, secondaryDoc] = await Promise.all([
        primaryDocRef.get(),
        secondaryDocRef.get()
      ]);
      
      if (!primaryDoc.exists) {
        console.error(`❌ Primary document does not exist for ${user.name}`);
        continue;
      }
      
      if (!secondaryDoc.exists) {
        console.error(`❌ Secondary document does not exist for ${user.name}`);
        continue;
      }
      
      const primaryData = primaryDoc.data();
      const secondaryData = secondaryDoc.data();
      
      // Create merged data
      const mergedData = {
        // Keep primary document base data
        ...primaryData,
        // Add missing fields from secondary
        displayName: secondaryData.displayName || primaryData.displayName || primaryData.name,
        photoURL: secondaryData.photoURL || primaryData.photoURL,
        profilePicture: secondaryData.profilePicture || primaryData.profilePicture || secondaryData.photoURL,
        updatedAt: secondaryData.updatedAt || admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Remove any 'id' field
      delete mergedData.id;
      
      // Update the primary document
      await primaryDocRef.set(mergedData);
      console.log(`✅ ${user.name}: Primary document updated`);
      
      // Delete the secondary document
      await secondaryDocRef.delete();
      console.log(`🗑️ ${user.name}: Secondary document deleted`);
      
      console.log(`🎉 ${user.name}: Consolidation completed!`);
      
    } catch (error) {
      console.error(`💥 Error consolidating ${user.name}:`, error);
    }
  }
  
  console.log('\n🏁 All consolidations completed!');
}

// Run the consolidation
consolidateAllUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 