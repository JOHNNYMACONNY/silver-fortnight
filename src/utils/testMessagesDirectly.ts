/**
 * Direct Message Testing Utility
 * 
 * Tests message loading directly without relying on real-time listeners
 * to diagnose the Listen channel 400 error
 */

import { getSyncFirebaseDb } from '../firebase-config';
import { collection, query, orderBy, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

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
    logger.debug(`🔍 Testing messages for conversation: ${conversationId}`, 'UTILITY');
    
    const db = getSyncFirebaseDb();
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    // Test 1: Check if conversation exists
    logger.debug('📋 Checking conversation document...', 'UTILITY');
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      result.error = 'Conversation document not found';
      logger.error('❌ Conversation not found:', 'UTILITY', conversationId);
      return result;
    }
    
    result.conversationExists = true;
    logger.debug('✅ Conversation exists:', 'UTILITY', conversationDoc.data());

    // Test 2: Query messages subcollection directly
    logger.debug('💬 Querying messages subcollection...', 'UTILITY');
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    result.messageCount = messagesSnapshot.size;
    logger.debug(`📊 Found ${messagesSnapshot.size} messages`, 'UTILITY');
    
    // Extract message data
    const messages: any[] = [];
    messagesSnapshot.forEach((doc) => {
      const messageData = {
        id: doc.id,
        ...(doc.data() as any)
      };
      messages.push(messageData);
      logger.debug('📝 Message:', 'UTILITY', messageData);
    });
    
    result.messages = messages;
    
    if (messages.length === 0) {
      logger.debug('⚠️ No messages found in conversation', 'UTILITY');
    } else {
      logger.debug('✅ Messages loaded successfully', 'UTILITY');
    }

  } catch (error: any) {
    logger.error('❌ Error testing messages:', 'UTILITY', {}, error as Error);
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
    logger.debug(`🔍 Testing all conversations for user: ${userId}`, 'UTILITY');
    
    const db = getSyncFirebaseDb();
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    // Get all conversations
    const conversationsRef = collection(db, 'conversations');
    const conversationsSnapshot = await getDocs(conversationsRef);
    
    const conversations: any[] = [];
    let totalMessages = 0;
    
    logger.debug(`📋 Found ${conversationsSnapshot.size} conversations`, 'UTILITY');
    
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversationData = {
        id: conversationDoc.id,
        ...(conversationDoc.data() as any)
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
          
          logger.debug(`💬 Conversation ${conversationDoc.id}: ${messagesSnapshot.size} messages`, 'UTILITY');
        } catch (messageError) {
          logger.warn(`⚠️ Could not count messages for conversation ${conversationDoc.id}:`, 'UTILITY', messageError);
        }
      }
    }
    
    logger.debug(`✅ Found ${conversations.length} conversations with ${totalMessages} total messages`, 'UTILITY');
    
    return {
      conversations,
      totalMessages
    };
    
  } catch (error: any) {
    logger.error('❌ Error testing all conversations:', 'UTILITY', {}, error as Error);
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
    logger.debug(`📝 Testing message creation in conversation: ${conversationId}`, 'UTILITY');
    
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
    
    logger.debug(`✅ Message created with ID: ${docRef.id}`, 'UTILITY');
    
    return {
      success: true,
      messageId: docRef.id
    };
    
  } catch (error: any) {
    logger.error('❌ Error creating test message:', 'UTILITY', {}, error as Error);
    return {
      success: false,
      error: error.message
    };
  }
};
