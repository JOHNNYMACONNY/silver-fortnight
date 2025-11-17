import { getSyncFirebaseDb } from '../firebase-config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

/**
 * Utility function to fetch a specific message by its path
 */
export const fetchSpecificMessage = async (conversationId = 'bcB1UuJ2VHwTXsTFG71g', messageId = '9U88pB16BSVhy2taDEjH') => {
  try {
    // Only use the nested collection approach
    const messageDocRef = doc(getSyncFirebaseDb(), 'conversations', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageDocRef);

    if (messageDoc.exists()) {
      logger.debug('Found message using nested path:', 'UTILITY', messageDoc.data());
      return { message: messageDoc.data(), found: true, method: 'nested' };
    } else {
      logger.debug('Message not found in nested collection', 'UTILITY');
      return { found: false };
    }
  } catch (error) {
    logger.error('Error fetching message:', 'UTILITY', {}, error as Error);
    return { error, found: false };
  }
};

/**
 * Utility function to fetch a specific conversation
 */
export const fetchSpecificConversation = async (conversationId = 'bcB1UuJ2VHwTXsTFG71g') => {
  try {
    const conversationDocRef = doc(getSyncFirebaseDb(), 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationDocRef);

    if (conversationDoc.exists()) {
      logger.debug('Found conversation:', 'UTILITY', conversationDoc.data());
      return { conversation: conversationDoc.data(), found: true };
    } else {
      logger.debug('Conversation not found', 'UTILITY');
      return { found: false };
    }
  } catch (error) {
    logger.error('Error fetching conversation:', 'UTILITY', {}, error as Error);
    return { error, found: false };
  }
};

/**
 * Utility function to fetch all messages in a conversation
 */
export const fetchAllMessagesInConversation = async (conversationId = 'bcB1UuJ2VHwTXsTFG71g') => {
  try {
    // Only use the nested collection approach
    const nestedMessagesRef = collection(getSyncFirebaseDb(), 'conversations', conversationId, 'messages');
    const nestedMessagesSnapshot = await getDocs(nestedMessagesRef);

    const nestedMessages: Array<any> = [];
    nestedMessagesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data === 'object' && data !== null) {
        nestedMessages.push({
          id: doc.id,
          ...data
        });
      } else {
        nestedMessages.push({ id: doc.id });
      }
    });

    return {
      nestedMessages,
      found: nestedMessages.length > 0
    };
  } catch (error) {
    logger.error('Error fetching all messages:', 'UTILITY', {}, error as Error);
    return { error, found: false };
  }
};
