import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  runTransaction, 
  doc, 
  orderBy, 
  writeBatch,
  Timestamp,
  updateDoc,
  deleteDoc,
  CollectionReference,
  and
} from 'firebase/firestore';
import { getDb } from './firebase';
import { UserProfile, Conversation, Message, ConversationType } from '../types/messaging';

interface ConversationOptions {
  type: ConversationType;
  contextId?: string;
  tradeName?: string;
}

/**
 * Creates or retrieves an existing conversation between users
 * @param currentUserId - The ID of the current user
 * @param otherParticipants - Array of other participant IDs
 * @param options - Conversation options including type and context
 * @returns The conversation ID
 */
export async function getOrCreateConversation(
  currentUserId: string,
  otherParticipants: string[],
  options: ConversationOptions = { type: 'direct' }
): Promise<string> {
  try {
    if (!currentUserId || !otherParticipants.length) {
      throw new Error('Current user ID and at least one other participant are required');
    }

    const allParticipants = [currentUserId, ...otherParticipants];
    const participantIds = allParticipants.sort();

    // For direct or group conversations without context, check for existing conversation
    if (options.type === 'direct' || (options.type === 'group' && !options.contextId)) {
      const db = await getDb();
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        and(
          where('participantIds', '==', participantIds),
          where('conversationType', '==', options.type)
        )
      );
      
      const existingConversations = await getDocs(q);
      if (!existingConversations.empty) {
        return existingConversations.docs[0].id;
      }
    }

    // Create conversation data
    const conversationData: any = {
      participants: allParticipants,
      participantIds,
      lastMessage: null,
      lastMessageTimestamp: null,
      unreadCount: Object.fromEntries(allParticipants.map(id => [id, 0])),
      conversationType: options.type,
      updatedAt: serverTimestamp(),
      isTyping: Object.fromEntries(allParticipants.map(id => [id, false]))
    };

    // Only add contextId and tradeName if they are provided
    if (options.contextId) {
      conversationData.contextId = options.contextId;
    }
    if (options.tradeName) {
      conversationData.tradeName = options.tradeName;
    }

    // Create new conversation
    const newConversationRef = await addDoc(collection(await getDb(), 'conversations'), conversationData);
    return newConversationRef.id;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    throw error;
  }
}

/**
 * Starts a direct conversation with another user
 * @param currentUserId - The ID of the current user
 * @param otherUser - The profile of the user to start a conversation with
 * @returns The conversation ID
 */
export async function startConversation(currentUserId: string, otherUser: UserProfile): Promise<string> {
  try {
    if (!currentUserId || !otherUser?.id) {
      throw new Error('Invalid user IDs for conversation');
    }
    
    const conversationId = await getOrCreateConversation(currentUserId, [otherUser.id]);
    return conversationId;
  } catch (error) {
    console.error('Failed to start conversation:', error);
    throw error;
  }
}

/**
 * Creates a new context-specific conversation (trade or project)
 * @param currentUserId - The ID of the current user
 * @param otherParticipants - Array of other participant IDs
 * @param contextType - Type of context ('trade' or 'project')
 * @param contextId - ID of the trade or project
 * @param contextName - Name of the trade or project
 * @returns The conversation ID
 */
export async function createContextConversation(
  currentUserId: string,
  otherParticipants: string[],
  contextType: 'trade' | 'project',
  contextId: string,
  contextName?: string
): Promise<string> {
  return getOrCreateConversation(currentUserId, otherParticipants, {
    type: contextType,
    contextId,
    tradeName: contextName
  });
}
