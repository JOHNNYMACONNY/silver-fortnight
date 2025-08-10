/**
 * Unified Chat Type Definitions
 * 
 * This file defines the canonical interfaces for the messaging system.
 * All chat-related components and services should use these standardized types.
 */

import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Schema version for migration tracking
 */
export const CHAT_SCHEMA_VERSION = '2.0.0';

/**
 * Chat participant information
 */
export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string | null;
  // Legacy support
  photoURL?: string | null;
}

/**
 * Chat message attachment
 */
export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
  size?: number;
  thumbnailUrl?: string;
  mimeType?: string;
}

/**
 * Canonical chat message interface
 */
export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  
  // Timestamps - support both Firestore types
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  editedAt?: Timestamp | FieldValue;
  
  // Read status
  readBy: string[];
  
  // Message state
  edited?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  
  // Attachments
  attachments?: ChatAttachment[];
  
  // Metadata
  schemaVersion?: string;
}

/**
 * Last message summary for conversation lists
 */
export interface LastMessage {
  content: string;
  senderId: string;
  createdAt: Timestamp | FieldValue;
  type: 'text' | 'image' | 'file' | 'system';
  // Unified read status (true if current user has read)
  read?: boolean;
}

/**
 * Canonical chat conversation interface
 */
export interface ChatConversation {
  id?: string;
  title?: string;
  type: 'direct' | 'group' | 'trade' | 'collaboration';
  
  // Participant information (canonical format)
  participants: ChatParticipant[];
  
  // Quick access to participant IDs for queries
  participantIds: string[];
  
  // Conversation metadata
  lastMessage?: LastMessage;
  lastActivity?: Timestamp | FieldValue;
  messageCount?: number;
  unreadCount?: { [userId: string]: number };
  
  // Context information
  relatedTradeId?: string;
  relatedCollaborationId?: string;
  
  // Timestamps
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  
  // Schema and migration metadata
  schemaVersion: string;
  
  // Legacy support fields (deprecated, but maintained for backward compatibility)
  participants_legacy?: ChatParticipant[];
}

/**
 * Type guards for runtime type checking
 */
export const isValidChatMessage = (obj: any): obj is ChatMessage => {
  return (
    obj &&
    typeof obj.conversationId === 'string' &&
    typeof obj.senderId === 'string' &&
    typeof obj.content === 'string' &&
    Array.isArray(obj.readBy)
  );
};

export const isValidChatConversation = (obj: any): obj is ChatConversation => {
  return (
    obj &&
    Array.isArray(obj.participants) &&
    Array.isArray(obj.participantIds) &&
    typeof obj.schemaVersion === 'string'
  );
};

/**
 * Migration utilities for backward compatibility
 */
export const migrateLegacyConversation = (legacyData: any): ChatConversation => {
  const participants: ChatParticipant[] = legacyData.participants || [];
  const participantIds = participants.map((p: ChatParticipant) => p.id);
  
  return {
    ...legacyData,
    participants,
    participantIds,
    schemaVersion: CHAT_SCHEMA_VERSION,
    type: legacyData.type || 'direct',
    createdAt: legacyData.createdAt || new Date(),
    updatedAt: legacyData.updatedAt || new Date(),
  };
};

export const migrateLegacyMessage = (legacyData: any): ChatMessage => {
  return {
    ...legacyData,
    readBy: legacyData.readBy || [],
    type: legacyData.type || 'text',
    schemaVersion: CHAT_SCHEMA_VERSION,
  };
};

/**
 * Utility functions for working with chat data
 */
export const getOtherParticipant = (
  conversation: ChatConversation,
  currentUserId: string
): ChatParticipant | undefined => {
  return conversation.participants.find(p => p.id !== currentUserId);
};

export const isUserParticipant = (
  conversation: ChatConversation,
  userId: string
): boolean => {
  return conversation.participantIds.includes(userId);
};

export const getUnreadMessageCount = (
  conversation: ChatConversation,
  userId: string
): number => {
  return conversation.unreadCount?.[userId] || 0;
};
