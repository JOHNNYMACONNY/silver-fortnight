/**
 * Offline-First Message Loading System
 * 
 * Loads messages using direct queries instead of real-time listeners
 * to bypass Firebase SDK internal assertion failures
 */

import { getSyncFirebaseDb } from '../firebase-config';
import { collection, query, orderBy, getDocs, doc, getDoc, limit, addDoc } from 'firebase/firestore';
import { ChatMessage } from '../types/chat';

export interface OfflineMessageResult {
  success: boolean;
  messages: ChatMessage[];
  error?: string;
  timestamp: Date;
  conversationId: string;
}

/**
 * Load messages for a conversation using direct queries (no real-time listeners)
 */
export const loadMessagesOffline = async (conversationId: string): Promise<OfflineMessageResult> => {
  const result: OfflineMessageResult = {
    success: false,
    messages: [],
    timestamp: new Date(),
    conversationId
  };

  try {
    console.log(`📱 Loading messages offline for conversation: ${conversationId}`);
    
    const db = getSyncFirebaseDb();
    if (!db) {
      throw new Error('Firebase database not available');
    }

    // Check if conversation exists
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    console.log('✅ Conversation exists, loading messages...');

    // Load messages using direct query (no real-time listener)
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesQuery = query(
      messagesRef, 
      orderBy('createdAt', 'asc'),
      limit(100) // Limit to prevent large queries
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    console.log(`📊 Found ${messagesSnapshot.size} messages`);

    const messages: ChatMessage[] = [];
    messagesSnapshot.forEach((doc) => {
      const messageData = {
        id: doc.id,
        ...(doc.data() as any)
      } as ChatMessage;
      messages.push(messageData);
    });

    result.messages = messages;
    result.success = true;
    
    console.log(`✅ Successfully loaded ${messages.length} messages offline`);
    return result;

  } catch (error: any) {
    console.error('❌ Offline message loading failed:', error);
    result.error = error.message;
    return result;
  }
};

/**
 * Load conversation list offline
 */
export const loadConversationsOffline = async (userId: string): Promise<{
  success: boolean;
  conversations: any[];
  error?: string;
}> => {
  try {
    console.log(`📱 Loading conversations offline for user: ${userId}`);
    
    const db = getSyncFirebaseDb();
    if (!db) {
      throw new Error('Firebase database not available');
    }

    // Get all conversations
    const conversationsRef = collection(db, 'conversations');
    const conversationsSnapshot = await getDocs(conversationsRef);
    
    const conversations: any[] = [];
    
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversationData = {
        id: conversationDoc.id,
        ...(conversationDoc.data() as any)
      };
      
      // Check if user is a participant
      const participantIds = conversationData.participantIds || [];
      if (participantIds.includes(userId)) {
        conversations.push(conversationData);
      }
    }
    
    console.log(`✅ Loaded ${conversations.length} conversations offline`);
    
    return {
      success: true,
      conversations
    };
    
  } catch (error: any) {
    console.error('❌ Offline conversation loading failed:', error);
    return {
      success: false,
      conversations: [],
      error: error.message
    };
  }
};

/**
 * Create a message offline (without real-time updates)
 */
export const createMessageOffline = async (
  conversationId: string, 
  messageData: Partial<ChatMessage>
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    console.log(`📝 Creating message offline in conversation: ${conversationId}`);
    
    const db = getSyncFirebaseDb();
    if (!db) {
      throw new Error('Firebase database not available');
    }

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const docRef = await addDoc(messagesRef, {
      ...messageData,
      createdAt: new Date(),
      readBy: []
    });
    
    console.log(`✅ Message created offline with ID: ${docRef.id}`);
    
    return {
      success: true,
      messageId: docRef.id
    };
    
  } catch (error: any) {
    console.error('❌ Offline message creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
