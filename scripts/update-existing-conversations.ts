import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { initializeApp } from 'firebase/app';

// Initialize Firebase when running the script
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

/**
 * Updates existing conversations to include the new conversationType field
 */
export async function updateExistingConversations() {
  console.log('Starting conversation updates...');
  
  const conversationsRef = collection(db, 'conversations');
  const snapshot = await getDocs(conversationsRef);
  
  let updatedCount = 0;
  const batchSize = 500;
  let batch = writeBatch(db);
  let operationsInBatch = 0;
  
  for (const conversationDoc of snapshot.docs) {
    const data = conversationDoc.data();
    
    // Skip if conversationType is already set
    if (data.conversationType) {
      continue;
    }
    
    // Determine conversation type
    let conversationType = 'direct';
    if (data.tradeName || data.tradeId) {
      conversationType = 'trade';
    } else if (data.projectName || data.projectId || data.positionId) {
      conversationType = 'project';
    }

    const updates = {
      conversationType,
      contextId: data.tradeId || data.projectId || null,
      contextName: data.tradeName || data.projectName || null,
      positionId: data.positionId || null,
      positionName: data.positionName || null,
      updatedFields: true
    };
    
    batch.update(doc(db, 'conversations', conversationDoc.id), updates);
    operationsInBatch++;
    updatedCount++;
    
    // Commit batch when it reaches the size limit
    if (operationsInBatch >= batchSize) {
      await batch.commit();
      batch = writeBatch(db);
      operationsInBatch = 0;
      console.log(`Processed ${updatedCount} conversations...`);
    }
  }
  
  // Commit any remaining operations
  if (operationsInBatch > 0) {
    await batch.commit();
  }
  
  console.log(`
Update complete!
Total conversations updated: ${updatedCount}
  `);
}

// Execute the script
updateExistingConversations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
