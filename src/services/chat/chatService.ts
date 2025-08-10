/**
 * Chat Service
 * 
 * This service provides real-time chat functionality using Firebase Firestore.
 * 
 * Updated to use unified chat types from src/types/chat.ts
 */

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  getDoc,
  limit,
  startAfter,
  DocumentSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { getSyncFirebaseDb } from '../../firebase-config';
import { ServiceResult } from '../../types/ServiceError';
import { 
  ChatMessage,
  ChatConversation,
  LastMessage,
  CHAT_SCHEMA_VERSION,
  isValidChatMessage,
  isValidChatConversation,
  migrateLegacyConversation,
  migrateLegacyMessage
} from '../../types/chat';

/**
 * Get all conversations for a user
 */
export const getUserConversations = (
  userId: string,
  callback: (conversations: ChatConversation[]) => void
) => {
  const db = getSyncFirebaseDb();
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const conversations: ChatConversation[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data === 'object' && data !== null) {
        let conversation: ChatConversation;
        
        // Migrate legacy data if needed
        if (isValidChatConversation(data)) {
          conversation = { id: doc.id, ...data };
        } else {
          conversation = migrateLegacyConversation({ id: doc.id, ...data });
        }
        
        conversations.push(conversation);
      }
    });
    
    callback(conversations);
  });
};

/**
 * Get or create a direct conversation between two users
 */
export const getOrCreateDirectConversation = async (
  user1: { id: string; name: string; avatar?: string },
  user2: { id: string; name: string; avatar?: string }
): Promise<ChatConversation> => {
  try {
    // Check if conversation already exists
    const db = getSyncFirebaseDb();
    const conversationsRef = collection(db, 'conversations');
    const q1 = query(
      conversationsRef,
      where('type', '==', 'direct'),
      where('participantIds', 'array-contains', user1.id)
    );
    
    const snapshot = await getDocs(q1);
    let existingConversation: ChatConversation | null = null;
    
    snapshot.forEach((doc) => {
      const data = doc.data() as Partial<ChatConversation>;
      if (data.participants && Array.isArray(data.participants) && data.participants.some(p => p.id === user2.id)) {
        const base = (typeof data === 'object' && data !== null && !Array.isArray(data)) ? data : {};
        existingConversation = {
          id: doc.id,
          ...base,
          participants: Array.isArray(data.participants) ? data.participants : [],
          createdAt: data.createdAt ?? Timestamp.now(),
          updatedAt: data.updatedAt ?? Timestamp.now(),
          type: data.type ?? 'direct'
        } as ChatConversation;
      }
    });
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // Create new conversation
    const participants = [
      { id: user1.id, name: user1.name, avatar: user1.avatar || null },
      { id: user2.id, name: user2.name, avatar: user2.avatar || null }
    ];
    
    const newConversation: Omit<ChatConversation, 'id'> = {
      participants,
      participantIds: [user1.id, user2.id],
      type: 'direct',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      schemaVersion: CHAT_SCHEMA_VERSION
    };
    
    const docRef = await addDoc(conversationsRef, newConversation);
    
    return {
      id: docRef.id,
      ...newConversation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
};

/**
 * Create a group conversation
 */
export const createGroupConversation = async (
  title: string,
  participants: { id: string; name: string; avatar?: string }[]
): Promise<ChatConversation> => {
  try {
    const db = getSyncFirebaseDb();
    const conversationsRef = collection(db, 'conversations');
    
    const participantList = participants.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || null
    }));
    
    const newConversation: Omit<ChatConversation, 'id'> = {
      title,
      participants: participantList,
      participantIds: participants.map(p => p.id),
      type: 'group',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      schemaVersion: CHAT_SCHEMA_VERSION
    };
    
    const docRef = await addDoc(conversationsRef, newConversation);
    
    return {
      id: docRef.id,
      ...newConversation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  } catch (error) {
    console.error('Error creating group conversation:', error);
    throw error;
  }
};

/**
 * Get messages for a conversation
 */
export const getConversationMessages = (
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const db = getSyncFirebaseDb();
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data === 'object' && data !== null) {
        let message: ChatMessage;
        
        // Migrate legacy data if needed
        if (isValidChatMessage(data)) {
          message = { id: doc.id, ...data };
        } else {
          message = migrateLegacyMessage({ id: doc.id, ...data });
        }
        
        messages.push(message);
      }
    });
    
    callback(messages);
  });
};

/**
 * Send a message
 */
export const sendMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt' | 'readBy'>): Promise<ChatMessage> => {
  try {
    const db = getSyncFirebaseDb();
    const messagesRef = collection(db, 'conversations', message.conversationId, 'messages');
    
    const messageData: Omit<ChatMessage, 'id'> = {
      ...message,
      createdAt: serverTimestamp(),
      readBy: [],
      schemaVersion: CHAT_SCHEMA_VERSION
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    
    // Update conversation's last message and timestamp
    const conversationRef = doc(db, 'conversations', message.conversationId);
    const lastMessage: LastMessage = {
      content: message.content,
      senderId: message.senderId,
      createdAt: serverTimestamp(),
      type: message.type || 'text'
    };
    
    await updateDoc(conversationRef, {
      lastMessage,
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...messageData,
      createdAt: Timestamp.now(),
      readBy: []
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark messages as read for a user
 */
export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  try {
    const db = getSyncFirebaseDb();
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('readBy', 'not-in', [[userId]])
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        readBy: arrayUnion(userId)
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Add user to group conversation
 */
export const addUserToGroupConversation = async (
  conversationId: string,
  user: { id: string; name: string; avatar?: string }
): Promise<void> => {
  try {
    const db = getSyncFirebaseDb();
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found');
    }
    
    const conversation = conversationSnap.data() as ChatConversation;
    
    if (conversation.type !== 'group') {
      throw new Error('Cannot add user to direct conversation');
    }
    
    if (conversation.participantIds?.includes(user.id) || conversation.participants.some(p => p.id === user.id)) {
      throw new Error('User is already in the conversation');
    }
    
    const newParticipant = { id: user.id, name: user.name, avatar: user.avatar || null };
    
    await updateDoc(conversationRef, {
      participants: [...conversation.participants, newParticipant],
      participantIds: [...(conversation.participantIds || []), user.id],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding user to group conversation:', error);
    throw error;
  }
};

/**
 * Remove user from group conversation
 */
export const removeUserFromGroupConversation = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const db = getSyncFirebaseDb();
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found');
    }
    
    const conversation = conversationSnap.data() as ChatConversation;
    
    if (conversation.type !== 'group') {
      throw new Error('Cannot remove user from direct conversation');
    }
    
    if (!conversation.participantIds?.includes(userId) && !conversation.participants.some(p => p.id === userId)) {
      throw new Error('User is not in the conversation');
    }
    
    await updateDoc(conversationRef, {
      participants: conversation.participants.filter(p => p.id !== userId),
      participantIds: (conversation.participantIds || []).filter(id => id !== userId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing user from group conversation:', error);
    throw error;
  }
};

export const deleteConversation = async (conversationId: string): Promise<ServiceResult<void>> => {
  try {
    // Delete all messages in the conversation
    const db = getSyncFirebaseDb();
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef);
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);

    snapshot.forEach((messageDoc) => {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageDoc.id);
      batch.delete(messageRef);
    });

    // Delete the conversation document
    const conversationRef = doc(db, 'conversations', conversationId);
    await deleteDoc(conversationRef);

    return {
      data: undefined,
      error: null
    };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return {
      data: undefined,
      error: error instanceof Error ? { code: 'delete-failed', message: error.message } : { code: 'delete-failed', message: 'An error occurred' }
    };
  }
};
