import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';

// Firebase configuration - matches your project config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'tradeya-45ede.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'tradeya-45ede',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'tradeya-45ede.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'your-sender-id',
  appId: process.env.VITE_FIREBASE_APP_ID || 'your-app-id'
};

interface UserDocument {
  id?: string;
  email?: string;
  displayName?: string;
  name?: string;
  [key: string]: any;
}

interface ConsolidationReport {
  totalUsers: number;
  duplicatesFound: number;
  duplicatesConsolidated: number;
  errors: string[];
  consolidatedUsers: string[];
}

/**
 * Consolidates duplicate user profile documents in Firestore
 * 
 * Strategy:
 * 1. Find all documents with 'id' field pointing to another document
 * 2. Merge complete profile data into the Firebase UID document
 * 3. Remove secondary documents after successful merge
 * 4. Generate detailed report
 */
async function consolidateUserProfiles(): Promise<ConsolidationReport> {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const report: ConsolidationReport = {
    totalUsers: 0,
    duplicatesFound: 0,
    duplicatesConsolidated: 0,
    errors: [],
    consolidatedUsers: []
  };

  try {
    console.log('🔍 Starting user profile consolidation...');
    
    // Get all user documents
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    report.totalUsers = usersSnapshot.size;
    console.log(`📊 Found ${report.totalUsers} total user documents`);

    // Find documents with 'id' field (potential duplicates)
    const secondaryDocs: { docId: string; data: UserDocument }[] = [];
    
    usersSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data() as UserDocument;
      
      if (data.id && data.id !== docSnapshot.id) {
        secondaryDocs.push({
          docId: docSnapshot.id,
          data: data
        });
      }
    });

    report.duplicatesFound = secondaryDocs.length;
    console.log(`🔄 Found ${report.duplicatesFound} potential duplicates to consolidate`);

    // Process each duplicate
    for (const secondaryDoc of secondaryDocs) {
      try {
        const targetDocId = secondaryDoc.data.id!;
        const sourceDocId = secondaryDoc.docId;
        
        console.log(`\n📝 Processing: ${sourceDocId} → ${targetDocId}`);
        
        // Get the target document (Firebase UID document)
        const targetDocRef = doc(db, 'users', targetDocId);
        const targetDocSnap = await getDoc(targetDocRef);
        
        if (!targetDocSnap.exists()) {
          report.errors.push(`Target document ${targetDocId} does not exist for source ${sourceDocId}`);
          continue;
        }

        const targetData = targetDocSnap.data() as UserDocument;
        const sourceData = secondaryDoc.data;

        // Merge data - prioritize complete profile data from secondary document
        const mergedData: UserDocument = {
          ...targetData, // Start with target data
          ...sourceData, // Overlay with source data (more complete)
          id: undefined // Remove the 'id' field from secondary document
        };

        // Ensure we keep the correct document ID structure
        delete mergedData.id;

        // Update the target document with merged data
        await setDoc(targetDocRef, mergedData);
        console.log(`✅ Merged data into ${targetDocId}`);

        // Remove the secondary document
        const sourceDocRef = doc(db, 'users', sourceDocId);
        await deleteDoc(sourceDocRef);
        console.log(`🗑️ Removed secondary document ${sourceDocId}`);

        report.duplicatesConsolidated++;
        report.consolidatedUsers.push(`${sourceDocId} → ${targetDocId}`);

      } catch (error) {
        const errorMsg = `Failed to consolidate ${secondaryDoc.docId}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        report.errors.push(errorMsg);
      }
    }

    console.log('\n📋 Consolidation Report:');
    console.log(`Total users: ${report.totalUsers}`);
    console.log(`Duplicates found: ${report.duplicatesFound}`);
    console.log(`Duplicates consolidated: ${report.duplicatesConsolidated}`);
    console.log(`Errors: ${report.errors.length}`);
    
    if (report.consolidatedUsers.length > 0) {
      console.log('\n✅ Successfully consolidated:');
      report.consolidatedUsers.forEach(user => console.log(`  ${user}`));
    }
    
    if (report.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      report.errors.forEach(error => console.log(`  ${error}`));
    }

    return report;

  } catch (error) {
    console.error('💥 Fatal error during consolidation:', error);
    report.errors.push(`Fatal error: ${error}`);
    return report;
  }
}

/**
 * Validate user profiles after consolidation
 */
async function validateUserProfiles(): Promise<void> {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('\n🔍 Validating user profiles...');
  
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);
  
  let validProfiles = 0;
  let invalidProfiles = 0;
  
  usersSnapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data() as UserDocument;
    
    // Check if document still has 'id' field pointing elsewhere
    if (data.id && data.id !== docSnapshot.id) {
      console.log(`⚠️  Still has invalid 'id' field: ${docSnapshot.id} → ${data.id}`);
      invalidProfiles++;
    } else {
      validProfiles++;
    }
  });
  
  console.log(`✅ Valid profiles: ${validProfiles}`);
  console.log(`❌ Invalid profiles: ${invalidProfiles}`);
  
  if (invalidProfiles === 0) {
    console.log('🎉 All user profiles are now properly consolidated!');
  }
}

// Main execution
async function main() {
  console.log('🚀 User Profile Consolidation Tool');
  console.log('=====================================\n');
  
  try {
    // Step 1: Consolidate duplicates
    const report = await consolidateUserProfiles();
    
    // Step 2: Validate results
    await validateUserProfiles();
    
    console.log('\n🏁 Consolidation process completed!');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script automatically
main();

export { consolidateUserProfiles, validateUserProfiles }; 