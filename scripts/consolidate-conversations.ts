import { collection, query, getDocs, writeBatch, doc, orderBy, where } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
 * One-time script to consolidate existing conversations
 */
async function consolidateExistingConversations() {
  // Ensure Firebase is initialized
  if (!app) {
    throw new Error('Firebase app not initialized');
  }
  console.log('Starting conversation consolidation...');
  
  // Get all conversations
  const conversationsRef = collection(db, 'conversations');
  const conversationsSnapshot = await getDocs(conversationsRef);
  
  // Map to store conversations by participant pairs and context
  const conversationMap = new Map<string, any[]>();
  
  // Group conversations by participant pairs and context
  conversationsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const contextKey = data.conversationType === 'direct' 
      ? 'direct'
      : `${data.conversationType}_${data.contextId}_${data.positionId || ''}`;
    const key = `${data.participantIds.join('_')}_${contextKey}`;
    
    if (!conversationMap.has(key)) {
      conversationMap.set(key, []);
    }
    conversationMap.get(key)?.push({
      id: doc.id,
      ...data
    });
  });
  
  let consolidatedCount = 0;
  let totalProcessed = 0;
  
  // Process each group of conversations
  for (const [key, conversations] of conversationMap.entries()) {
    if (conversations.length > 1) {
      const [participantIds, contextKey] = key.split('_direct').length > 1 
        ? [key.split('_direct')[0], 'direct']
        : key.split(/_(?:trade|project)_/);
      
      const contextType = contextKey === 'direct' ? 'direct' : key.includes('_trade_') ? 'trade' : 'project';
      console.log(`Found ${conversations.length} ${contextType} conversations for participants: ${participantIds}`);
      
      try {
        // Sort conversations by updatedAt timestamp
        conversations.sort((a, b) => a.updatedAt?.toMillis() - b.updatedAt?.toMillis());
        
        // Use the oldest conversation as primary
        // For context conversations, use the one with the most messages as primary
        const primaryConversation = contextKey !== 'direct'
          ? await findConversationWithMostMessages(conversations)
          : conversations[0];
        const batch = writeBatch(db);
        
        // Track metadata updates
        let lastMessage = primaryConversation.lastMessage;
        let lastMessageTimestamp = primaryConversation.lastMessageTimestamp;
        let updatedAt = primaryConversation.updatedAt;
        
        // Process each duplicate conversation
        for (let i = 1; i < conversations.length; i++) {
          const conversation = conversations[i];
          
          // Update metadata if needed
          if (conversation.updatedAt?.toMillis() > updatedAt?.toMillis()) {
            updatedAt = conversation.updatedAt;
            lastMessage = conversation.lastMessage;
            lastMessageTimestamp = conversation.lastMessageTimestamp;
          }
          
          // Move messages to primary conversation
          const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversation.id),
            orderBy('createdAt', 'asc')
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          
          messagesSnapshot.docs.forEach(messageDoc => {
            const messageData = messageDoc.data();
            const newMessageRef = doc(collection(db, 'messages'));
            batch.set(newMessageRef, {
              ...messageData,
              conversationId: primaryConversation.id
            });
            batch.delete(messageDoc.ref);
          });
          
          // Delete the duplicate conversation
          batch.delete(doc(db, 'conversations', conversation.id));
        }
        
        // Update primary conversation metadata
        batch.update(doc(db, 'conversations', primaryConversation.id), {
          lastMessage,
          lastMessageTimestamp,
          updatedAt
        });
        
        await batch.commit();
        consolidatedCount++;
        console.log(`Successfully consolidated conversations for participants: ${key}`);
      } catch (error) {
        console.error(`Error consolidating conversations for ${key}:`, error);
      }
    }
    totalProcessed++;
  }
  
  console.log(`
Consolidation complete!
Total conversation groups processed: ${totalProcessed}
Groups requiring consolidation: ${consolidatedCount}
  `);
}

/**
 * Finds the conversation with the most messages
 */
async function findConversationWithMostMessages(conversations: any[]): Promise<any> {
  const results = await Promise.all(
    conversations.map(async conversation => {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversation.id)
      );
      const snapshot = await getDocs(messagesQuery);
      return {
        conversation,
        messageCount: snapshot.size
      };
    })
  );

  // Sort by message count descending
  results.sort((a, b) => b.messageCount - a.messageCount);
  return results[0].conversation;
}

// Execute the script
consolidateExistingConversations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
