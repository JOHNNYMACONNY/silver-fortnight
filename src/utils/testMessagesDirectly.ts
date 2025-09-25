/**
 * Direct Message Testing Utility
 * 
 * Tests message loading directly without relying on real-time listeners
 * to diagnose the Listen channel 400 error
 */

import { getSyncFirebaseDb } from '../firebase-config';
import { collection, query, orderBy, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';

export interface MessageTestResult {
  conversationExists: boolean;
  messageCount: number;
  messages: any[];
  error?: string;
  timestamp: Date;
}

/**
 * Test messages in a specific conversation using direct queries
 */
export const testMessagesDirectly = async (conversationId: string = 'bcB1UuJ2VHwTXsTFG71g'): Promise<MessageTestResult> => {
  const result: MessageTestResult = {
    conversationExists: false,
    messageCount: 0,
    messages: [],
    timestamp: new Date()
  };

  try {
    console.log(`🔍 Testing messages for conversation: ${conversationId}`);
    
    const db = getSyncFirebaseDb();
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    // Test 1: Check if conversation exists
    console.log('📋 Checking conversation document...');
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      result.error = 'Conversation document not found';
      console.error('❌ Conversation not found:', conversationId);
      return result;
    }
    
    result.conversationExists = true;
    console.log('✅ Conversation exists:', conversationDoc.data());

    // Test 2: Query messages subcollection directly
    console.log('💬 Querying messages subcollection...');
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    result.messageCount = messagesSnapshot.size;
    console.log(`📊 Found ${messagesSnapshot.size} messages`);
    
    // Extract message data
    const messages: any[] = [];
    messagesSnapshot.forEach((doc) => {
      const messageData = {
        id: doc.id,
        ...doc.data()
      };
      messages.push(messageData);
      console.log('📝 Message:', messageData);
    });
    
    result.messages = messages;
    
    if (messages.length === 0) {
      console.log('⚠️ No messages found in conversation');
    } else {
      console.log('✅ Messages loaded successfully');
    }

  } catch (error: any) {
    console.error('❌ Error testing messages:', error);
    result.error = error.message;
  }

  return result;
};

/**
 * Test all conversations for the current user
 */
export const testAllConversations = async (userId: string): Promise<{
  conversations: any[];
  totalMessages: number;
  error?: string;
}> => {
  try {
    console.log(`🔍 Testing all conversations for user: ${userId}`);
    
    const db = getSyncFirebaseDb();
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    // Get all conversations
    const conversationsRef = collection(db, 'conversations');
    const conversationsSnapshot = await getDocs(conversationsRef);
    
    const conversations: any[] = [];
    let totalMessages = 0;
    
    console.log(`📋 Found ${conversationsSnapshot.size} conversations`);
    
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversationData = {
        id: conversationDoc.id,
        ...conversationDoc.data()
      };
      
      // Check if user is a participant
      const participantIds = conversationData.participantIds || [];
      if (participantIds.includes(userId)) {
        conversations.push(conversationData);
        
        // Count messages in this conversation
        try {
          const messagesRef = collection(db, 'conversations', conversationDoc.id, 'messages');
          const messagesSnapshot = await getDocs(messagesRef);
          totalMessages += messagesSnapshot.size;
          
          console.log(`💬 Conversation ${conversationDoc.id}: ${messagesSnapshot.size} messages`);
        } catch (messageError) {
          console.warn(`⚠️ Could not count messages for conversation ${conversationDoc.id}:`, messageError);
        }
      }
    }
    
    console.log(`✅ Found ${conversations.length} conversations with ${totalMessages} total messages`);
    
    return {
      conversations,
      totalMessages
    };
    
  } catch (error: any) {
    console.error('❌ Error testing all conversations:', error);
    return {
      conversations: [],
      totalMessages: 0,
      error: error.message
    };
  }
};

/**
 * Test message creation (if needed)
 */
export const testMessageCreation = async (conversationId: string, testMessage: any): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    console.log(`📝 Testing message creation in conversation: ${conversationId}`);
    
    const db = getSyncFirebaseDb();
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const docRef = await addDoc(messagesRef, {
      ...testMessage,
      createdAt: new Date(),
      readBy: []
    });
    
    console.log(`✅ Message created with ID: ${docRef.id}`);
    
    return {
      success: true,
      messageId: docRef.id
    };
    
  } catch (error: any) {
    console.error('❌ Error creating test message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
