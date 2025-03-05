import { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date | Timestamp;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageStatus?: 'sent' | 'delivered' | 'read';
  lastMessageTimestamp?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tradeName?: string;
  unreadCount: { [userId: string]: number };
  isTyping: { [userId: string]: boolean };
}

export interface UserProfile {
  id: string;
  displayName: string;
  profilePicture?: string;
  isOnline?: boolean;
}
