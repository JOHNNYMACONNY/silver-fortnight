import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  getDoc,
  doc
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
  photoURL?: string;
  profilePicture?: string;
  createdAt?: any;
  [key: string]: any;
}

interface DuplicateAnalysis {
  sourceDocId: string;
  targetDocId: string;
  sourceData: UserDocument;
  targetData: UserDocument | null;
  targetExists: boolean;
  dataQuality: {
    sourceFields: number;
    targetFields: number;
    missingTargetFields: string[];
    conflictingFields: string[];
  };
}

interface AnalysisReport {
  totalUsers: number;
  duplicatesFound: number;
  duplicateDetails: DuplicateAnalysis[];
  potentialIssues: string[];
  recommendations: string[];
}

/**
 * Analyzes duplicate user documents without making any changes
 * This is a safe "dry-run" to understand the scope of the problem
 */
async function analyzeUserDuplicates(): Promise<AnalysisReport> {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const report: AnalysisReport = {
    totalUsers: 0,
    duplicatesFound: 0,
    duplicateDetails: [],
    potentialIssues: [],
    recommendations: []
  };

  try {
    console.log('🔍 Analyzing user profile duplicates (READ-ONLY)...');
    console.log('=====================================================\n');
    
    // Get all user documents
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    report.totalUsers = usersSnapshot.size;
    console.log(`📊 Total user documents: ${report.totalUsers}\n`);

    // Find documents with 'id' field (potential duplicates)
    const secondaryDocs: { docId: string; data: UserDocument }[] = [];
    const validDocs: { docId: string; data: UserDocument }[] = [];
    
    usersSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data() as UserDocument;
      
      if (data.id && data.id !== docSnapshot.id) {
        secondaryDocs.push({
          docId: docSnapshot.id,
          data: data
        });
      } else {
        validDocs.push({
          docId: docSnapshot.id,
          data: data
        });
      }
    });

    report.duplicatesFound = secondaryDocs.length;
    console.log(`🔄 Secondary documents found: ${report.duplicatesFound}`);
    console.log(`✅ Valid documents found: ${validDocs.length}\n`);

    if (secondaryDocs.length === 0) {
      console.log('🎉 No duplicate user documents found! Database is clean.');
      return report;
    }

    // Analyze each duplicate
    console.log('📋 Duplicate Analysis Details:');
    console.log('===============================\n');

    for (let i = 0; i < secondaryDocs.length; i++) {
      const secondaryDoc = secondaryDocs[i];
      const targetDocId = secondaryDoc.data.id!;
      const sourceDocId = secondaryDoc.docId;
      
      console.log(`${i + 1}. ${sourceDocId} → ${targetDocId}`);
      
      // Get the target document
      const targetDocRef = doc(db, 'users', targetDocId);
      const targetDocSnap = await getDoc(targetDocRef);
      
      const analysis: DuplicateAnalysis = {
        sourceDocId,
        targetDocId,
        sourceData: secondaryDoc.data,
        targetData: targetDocSnap.exists() ? targetDocSnap.data() as UserDocument : null,
        targetExists: targetDocSnap.exists(),
        dataQuality: {
          sourceFields: 0,
          targetFields: 0,
          missingTargetFields: [],
          conflictingFields: []
        }
      };

      // Count non-empty fields
      const sourceFields = Object.keys(secondaryDoc.data).filter(key => 
        secondaryDoc.data[key] !== undefined && 
        secondaryDoc.data[key] !== null && 
        secondaryDoc.data[key] !== ''
      );
      analysis.dataQuality.sourceFields = sourceFields.length;

      if (analysis.targetExists && analysis.targetData) {
        const targetFields = Object.keys(analysis.targetData).filter(key => 
          analysis.targetData![key] !== undefined && 
          analysis.targetData![key] !== null && 
          analysis.targetData![key] !== ''
        );
        analysis.dataQuality.targetFields = targetFields.length;

        // Find missing fields in target
        sourceFields.forEach(field => {
          if (field !== 'id' && (!analysis.targetData![field] || analysis.targetData![field] === '')) {
            analysis.dataQuality.missingTargetFields.push(field);
          }
        });

        // Find conflicting fields
        sourceFields.forEach(field => {
          if (field !== 'id' && 
              analysis.targetData![field] && 
              secondaryDoc.data[field] && 
              analysis.targetData![field] !== secondaryDoc.data[field]) {
            analysis.dataQuality.conflictingFields.push(field);
          }
        });

        console.log(`   Source fields: ${analysis.dataQuality.sourceFields}`);
        console.log(`   Target fields: ${analysis.dataQuality.targetFields}`);
        console.log(`   Missing in target: ${analysis.dataQuality.missingTargetFields.length} (${analysis.dataQuality.missingTargetFields.join(', ')})`);
        console.log(`   Conflicts: ${analysis.dataQuality.conflictingFields.length} (${analysis.dataQuality.conflictingFields.join(', ')})`);
        
        // User identification
        const sourceUser = secondaryDoc.data.displayName || secondaryDoc.data.name || secondaryDoc.data.email;
        const targetUser = analysis.targetData.displayName || analysis.targetData.name || analysis.targetData.email;
        console.log(`   Source user: ${sourceUser}`);
        console.log(`   Target user: ${targetUser}`);

      } else {
        console.log(`   ❌ Target document does not exist!`);
        report.potentialIssues.push(`Target document ${targetDocId} for source ${sourceDocId} does not exist`);
      }

      console.log(''); // Empty line for readability
      report.duplicateDetails.push(analysis);
    }

    // Generate recommendations
    console.log('💡 Recommendations:');
    console.log('===================\n');

    if (report.duplicatesFound > 0) {
      report.recommendations.push('Run the consolidation script to merge duplicate data');
      
      const highQualityDuplicates = report.duplicateDetails.filter(d => 
        d.targetExists && d.dataQuality.missingTargetFields.length > 3
      ).length;
      
      if (highQualityDuplicates > 0) {
        report.recommendations.push(`${highQualityDuplicates} duplicates contain significant missing data in targets`);
      }

      const conflictingDuplicates = report.duplicateDetails.filter(d => 
        d.dataQuality.conflictingFields.length > 0
      ).length;
      
      if (conflictingDuplicates > 0) {
        report.recommendations.push(`${conflictingDuplicates} duplicates have conflicting data requiring manual review`);
      }
    }

    // Display recommendations
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n📊 Summary:');
    console.log('============');
    console.log(`Total documents: ${report.totalUsers}`);
    console.log(`Duplicates found: ${report.duplicatesFound}`);
    console.log(`Issues detected: ${report.potentialIssues.length}`);
    console.log(`Ready for consolidation: ${report.duplicateDetails.filter(d => d.targetExists).length}`);

    return report;

  } catch (error) {
    console.error('💥 Analysis failed:', error);
    report.potentialIssues.push(`Analysis error: ${error}`);
    return report;
  }
}

// Main execution
async function main() {
  console.log('🔍 User Duplicate Analysis Tool (READ-ONLY)');
  console.log('============================================\n');
  
  try {
    const report = await analyzeUserDuplicates();
    
    if (report.duplicatesFound === 0) {
      console.log('\n✅ Analysis complete - No action needed');
    } else {
      console.log('\n⚠️  Analysis complete - Duplicates found');
      console.log('Next step: Run consolidate-user-profiles.ts to fix duplicates');
    }
    
  } catch (error) {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  }
}

// Run the script automatically
main();

export { analyzeUserDuplicates }; 