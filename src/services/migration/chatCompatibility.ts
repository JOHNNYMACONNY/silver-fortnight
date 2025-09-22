import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  QueryConstraint,
  Firestore,
  collectionGroup
} from 'firebase/firestore';

/**
 * Chat participant information
 */
export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  photoURL?: string;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
  readBy?: string[];
  edited?: boolean;
  editedAt?: any;
}

/**
 * Chat conversation interface for migration compatibility
 */
export interface ChatConversation {
  id: string;
  title?: string;
  type: 'direct' | 'group' | 'trade' | 'collaboration';
  
  // NEW FORMAT (primary)
  participantIds: string[];
  
  // LEGACY FORMAT (for backward compatibility)
  participants?: ChatParticipant[];
  participants_legacy?: ChatParticipant[];
  
  // Conversation metadata
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: any;
  };
  lastActivity?: any;
  messageCount?: number;
  unreadCount?: { [userId: string]: number };
  
  // Context information
  relatedTradeId?: string;
  relatedCollaborationId?: string;
  
  // Timestamps
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  
  // Migration metadata
  schemaVersion?: string;
  compatibilityLayerUsed?: boolean;
}

/**
 * Chat Compatibility Service
 * 
 * Handles transition from complex participant objects to simple ID arrays
 * and provides seamless chat functionality during migration.
 */
export class ChatCompatibilityService {
  private db: Firestore;
  
  constructor(firestoreInstance: Firestore) {
    this.db = firestoreInstance;
  }
  
  /**
   * Normalize conversation data to support both formats
   * 
   * @param data - Raw document data from Firestore
   * @returns Normalized ChatConversation object
   * @throws Error if data is null or invalid
   */
  static normalizeConversationData(data: DocumentData): ChatConversation {
    if (!data) {
      throw new Error('Conversation data is null or undefined');
    }

    try {
      let participantIds: string[] = [];
      let participants: ChatParticipant[] = [];
      
      if (data.participantIds && Array.isArray(data.participantIds)) {
        // New format: simple ID array
        participantIds = data.participantIds.filter(id => typeof id === 'string' && id.length > 0);
        
        // If we have legacy participant data, preserve it. Otherwise, create
        // basic participant objects from IDs but avoid dropping optional
        // legacy fields like `status` when present.
        if (data.participants_legacy && Array.isArray(data.participants_legacy)) {
          participants = data.participants_legacy;
        } else if (data.participants && Array.isArray(data.participants)) {
          participants = data.participants.map((p: any) => ({
            id: p.id || p.userId || '',
            name: p.name ?? p.displayName ?? '',
            avatar: p.avatar ?? p.photoURL ?? '',
            // preserve other legacy keys
            ...p
          })).filter((p: any) => p.id);
        } else {
          // Create basic participant objects from IDs
          participants = participantIds.map(id => ({
            id,
            name: '',
            avatar: ''
          }));
        }
      } else if (data.participants && Array.isArray(data.participants)) {
        // Legacy format: preserve original participant objects as-is where
        // possible (including optional fields like `status`). Ensure each
        // participant has an `id` field; skip entries without an id.
        participants = data.participants
          .map((p: any) => {
            const id = p.id || p.userId || '';
            if (!id) return null;
            // Return the original object but guarantee `id` is set
            return { ...p, id } as ChatParticipant;
          })
          .filter((p: any) => p !== null) as ChatParticipant[];

        participantIds = participants.map(p => p.id);
      }

      // Validate that we have at least one participant
      if (participantIds.length === 0) {
        throw new Error('Conversation must have at least one participant');
      }

      return {
        ...data,
        participantIds,
        participants,
        participants_legacy: data.participants_legacy || data.participants,
        type: data.type || 'direct',
        schemaVersion: data.schemaVersion || '1.0',
        compatibilityLayerUsed: true
      } as ChatConversation;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error normalizing conversation data:', error);
      throw new Error(`Failed to normalize conversation data: ${message}`);
    }
  }

  /**
   * Normalize message data to support both formats
   * 
   * @param data - Raw message document data
   * @returns Normalized ChatMessage object
   */
  static normalizeMessageData(data: DocumentData): ChatMessage {
    if (!data) {
      throw new Error('Message data is null or undefined');
    }

    try {
      return {
        id: data.id,
        conversationId: data.conversationId || data.chatId || '',
        senderId: data.senderId || data.userId || data.authorId || '',
        senderName: data.senderName || data.userName || data.authorName,
        content: data.content || data.message || data.text || '',
        type: data.type || 'text',
        createdAt: data.createdAt || data.timestamp,
        updatedAt: data.updatedAt,
        readBy: data.readBy || [],
        edited: data.edited || false,
        editedAt: data.editedAt
      } as ChatMessage;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error normalizing message data:', error);
      throw new Error(`Failed to normalize message data: ${message}`);
    }
  }

  /**
   * Get single conversation with compatibility normalization
   * 
   * @param conversationId - Conversation document ID
   * @returns Promise resolving to normalized conversation or null
   */
  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    if (!conversationId || typeof conversationId !== 'string') {
      throw new Error('Conversation ID must be a non-empty string');
    }

    try {
      const docRef = doc(this.db, 'conversations', conversationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return ChatCompatibilityService.normalizeConversationData({
        id: docSnap.id,
        ...(docSnap.data() as Record<string, unknown>)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching conversation ${conversationId}:`, error);
      throw new Error(`Failed to fetch conversation: ${message}`);
    }
  }

  /**
   * Get user conversations (supports both participant formats)
   * 
   * @param userId - User ID to search for
   * @param limitCount - Maximum number of conversations to return
   * @returns Promise resolving to array of normalized conversations
   */
  async getUserConversations(userId: string, limitCount: number = 50): Promise<ChatConversation[]> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }

    if (limitCount <= 0 || limitCount > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    try {
      const conversations: ChatConversation[] = [];
      const seenConversationIds = new Set<string>();
      
      // Try new format first
      try {
        const newFormatQuery = query(
          collection(this.db, 'conversations'),
          where('participantIds', 'array-contains', userId),
          orderBy('updatedAt', 'desc'),
          limit(limitCount)
        );
        
        const newFormatSnapshot = await getDocs(newFormatQuery);
        const newFormatConversations = newFormatSnapshot.docs.map(doc => {
          try {
            return ChatCompatibilityService.normalizeConversationData({
              id: doc.id,
              ...(doc.data() as Record<string, unknown>)
            });
          } catch (normalizeError) {
            console.error(`Error normalizing conversation ${doc.id}:`, normalizeError);
            return null;
          }
        }).filter(conv => conv !== null) as ChatConversation[];
        
        newFormatConversations.forEach(conv => {
          if (!seenConversationIds.has(conv.id)) {
            conversations.push(conv);
            seenConversationIds.add(conv.id);
          }
        });
      } catch (newFormatError) {
        const message = newFormatError instanceof Error ? newFormatError.message : String(newFormatError);
        console.log('New format query failed, trying legacy format:', message);
      }
      
      // Try legacy format as fallback if we don't have enough results
      if (conversations.length < limitCount) {
        try {
          // For legacy format, we need to query for participants array containing user object
          // This is more complex and may require a different approach
          const legacyQuery = query(
            collection(this.db, 'conversations'),
            orderBy('updatedAt', 'desc'),
            limit(limitCount * 2) // Get more to filter locally
          );
          
          const legacySnapshot = await getDocs(legacyQuery);
          const legacyConversations = legacySnapshot.docs
            .map(doc => {
              try {
                const data = doc.data() as Record<string, unknown>;
                // Check if user is in legacy participants format
                if (data.participants && Array.isArray(data.participants)) {
                  const isParticipant = data.participants.some((p: any) => 
                    p.id === userId || p.userId === userId
                  );
                  
                  if (isParticipant) {
                    return ChatCompatibilityService.normalizeConversationData({
                      id: doc.id,
                      ...(data as Record<string, unknown>)
                    });
                  }
                }
                return null;
              } catch (normalizeError) {
                console.error(`Error normalizing legacy conversation ${doc.id}:`, normalizeError);
                return null;
              }
            })
            .filter(conv => conv !== null) as ChatConversation[];
          
          legacyConversations.forEach(conv => {
            if (!seenConversationIds.has(conv.id) && conversations.length < limitCount) {
              conversations.push(conv);
              seenConversationIds.add(conv.id);
            }
          });
        } catch (legacyError) {
          const message = legacyError instanceof Error ? legacyError.message : String(legacyError);
          console.log('Legacy format query also failed:', message);
        }
      }
      
      // Sort by last activity (newest first)
      conversations.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?.getTime?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?.getTime?.() || 0;
        return bTime - aTime;
      });
      
      return conversations.slice(0, limitCount);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error getting conversations for user ${userId}:`, error);
      throw new Error(`Failed to get user conversations: ${message}`);
    }
  }

  /**
   * Get messages for a conversation
   * 
   * @param conversationId - Conversation ID
   * @param limitCount - Maximum number of messages to return
   * @param beforeMessageId - Get messages before this message ID (for pagination)
   * @returns Promise resolving to array of normalized messages
   */
  async getMessages(
    conversationId: string, 
    limitCount: number = 50,
    beforeMessageId?: string
  ): Promise<ChatMessage[]> {
    if (!conversationId || typeof conversationId !== 'string') {
      throw new Error('Conversation ID must be a non-empty string');
    }

    if (limitCount <= 0 || limitCount > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    try {
      let q = query(
        collection(this.db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Add pagination if beforeMessageId is provided
      if (beforeMessageId) {
        const beforeDocRef = doc(this.db, 'conversations', conversationId, 'messages', beforeMessageId);
        const beforeDoc = await getDoc(beforeDocRef);
        if (beforeDoc.exists()) {
          const beforeData = beforeDoc.data() as Record<string, any>;
          q = query(q, where('createdAt', '<', beforeData.createdAt));
        }
      }
      
      const querySnapshot = await getDocs(q);
      
      const messages = querySnapshot.docs.map(doc => {
        try {
            const raw = doc.data() as Record<string, unknown>;
            return ChatCompatibilityService.normalizeMessageData({
              id: doc.id,
              conversationId,
              ...raw
            });
        } catch (normalizeError) {
          console.error(`Error normalizing message ${doc.id}:`, normalizeError);
          // Return a basic message as fallback
          return {
            id: doc.id,
            conversationId,
            senderId: 'unknown',
            content: 'Error loading message',
            type: 'system' as const,
            createdAt: new Date()
          } as ChatMessage;
        }
      });
      
      // Messages come in desc order, reverse to get chronological order
      return messages.reverse();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error getting messages for conversation ${conversationId}:`, error);
      throw new Error(`Failed to get messages: ${message}`);
    }
  }

  /**
   * Search conversations by participant name or conversation title
   * 
   * @param userId - Current user ID
   * @param searchTerm - Search term
   * @returns Promise resolving to array of matching conversations
   */
  async searchConversations(userId: string, searchTerm: string): Promise<ChatConversation[]> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      return [];
    }

    try {
      // Get user's conversations first
      const userConversations = await this.getUserConversations(userId, 100);
      
      // Filter by search term (case-insensitive)
      const searchLower = searchTerm.toLowerCase().trim();
      
      return userConversations.filter(conversation => {
        // Search in conversation title
        if (conversation.title && conversation.title.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in participant names
        if (conversation.participants) {
          return conversation.participants.some(participant => 
            participant.name && participant.name.toLowerCase().includes(searchLower)
          );
        }
        
        return false;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error searching conversations for user ${userId}:`, error);
      throw new Error(`Failed to search conversations: ${message}`);
    }
  }

  /**
   * Get conversation between specific users
   * 
   * @param userIds - Array of user IDs (should be exactly 2 for direct conversations)
   * @returns Promise resolving to existing conversation or null
   */
  async getDirectConversation(userIds: string[]): Promise<ChatConversation | null> {
    if (!Array.isArray(userIds) || userIds.length !== 2) {
      throw new Error('Direct conversation requires exactly 2 user IDs');
    }

    const [userId1, userId2] = userIds;
    if (!userId1 || !userId2 || userId1 === userId2) {
      throw new Error('Invalid user IDs for direct conversation');
    }

    try {
      // Try new format first
      const newFormatQuery = query(
        collection(this.db, 'conversations'),
        where('type', '==', 'direct'),
        where('participantIds', 'array-contains', userId1)
      );
      
      const querySnapshot = await getDocs(newFormatQuery);
      
      for (const doc of querySnapshot.docs) {
        try {
          const conversation = ChatCompatibilityService.normalizeConversationData({
            id: doc.id,
            ...(doc.data() as Record<string, unknown>)
          });
          
          // Check if both users are participants
          if (conversation.participantIds.includes(userId2)) {
            return conversation;
          }
      } catch (normalizeError) {
        console.error(`Error normalizing conversation ${doc.id}:`, normalizeError);
        }
      }
      
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error finding direct conversation between ${userId1} and ${userId2}:`, error);
      throw new Error(`Failed to find direct conversation: ${message}`);
    }
  }

  /**
   * Validate conversation data structure
   * 
   * @param conversation - Conversation object to validate
   * @returns Boolean indicating if conversation is valid
   */
  static validateConversation(conversation: any): conversation is ChatConversation {
    try {
      return (
        conversation &&
        typeof conversation === 'object' &&
        typeof conversation.id === 'string' &&
        Array.isArray(conversation.participantIds) &&
        conversation.participantIds.length > 0 &&
        conversation.participantIds.every((id: any) => typeof id === 'string')
      );
    } catch {
      return false;
    }
  }

  /**
   * Validate message data structure
   * 
   * @param message - Message object to validate
   * @returns Boolean indicating if message is valid
   */
  static validateMessage(message: any): message is ChatMessage {
    try {
      return (
        message &&
        typeof message === 'object' &&
        typeof message.id === 'string' &&
        typeof message.conversationId === 'string' &&
        typeof message.senderId === 'string' &&
        typeof message.content === 'string'
      );
    } catch {
      return false;
    }
  }
}

// Export static methods for use without instantiation
export const { 
  normalizeConversationData, 
  normalizeMessageData, 
  validateConversation, 
  validateMessage 
} = ChatCompatibilityService;
