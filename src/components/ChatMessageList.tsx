/**
 * ChatMessageList Component
 *
 * Displays a list of messages in a conversation.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage, ChatConversation, getConversationMessages, markMessagesAsRead } from '../services/chat/chatService';
import { useAuth } from '../AuthContext';
import { Timestamp } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

interface ChatMessageListProps {
  conversation: ChatConversation;
}

// Helper type guard for Firestore Timestamp
function isTimestamp(val: any): val is Timestamp {
  return val && typeof val.toDate === 'function';
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ conversation }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesEndRef]);

  useEffect(() => {
    if (!conversation.id || !currentUser) return;

    setLoading(true);

    // Subscribe to conversation messages
    const unsubscribe = getConversationMessages(conversation.id, (fetchedMessages: ChatMessage[]) => {
      setMessages(fetchedMessages);
      setLoading(false);

      // Mark messages as read
      markMessagesAsRead(conversation.id!, currentUser.uid).catch((error: any) => {
        logger.error('Error marking messages as read:', 'COMPONENT', {}, error as Error);
      });

      // Scroll to bottom
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [conversation.id, currentUser]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: any) => {
    if (!timestamp) return '';

    try {
      const date = isTimestamp(timestamp) ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      logger.error('Error formatting timestamp:', 'COMPONENT', {}, err as Error);
      return '';
    }
  }, []);

  // Group messages by date
  const groupMessagesByDate = useCallback(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    let currentGroup: ChatMessage[] = [];

    messages.forEach(message => {
      let date: Date;
      if (isTimestamp(message.createdAt)) {
        date = message.createdAt.toDate();
      } else if (typeof message.createdAt === 'string' || typeof message.createdAt === 'number') {
        date = new Date(message.createdAt);
      } else {
        // If it's a FieldValue or unknown, skip this message or use a fallback
        return; // skip this message
      }
      const dateString = date.toLocaleDateString();

      if (dateString !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = dateString;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [messages]);

  // Format date for display
  const formatDateForDisplay = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toLocaleDateString()) {
      return 'Today';
    } else if (dateString === yesterday.toLocaleDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    }
  }, []);

  // Get sender avatar
  const getSenderAvatar = useCallback((message: ChatMessage) => {
    if (message.senderAvatar) {
      return (
        <img
          src={message.senderAvatar}
          alt={message.senderName}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }

    // Fallback avatar
    return (
  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
        {message.senderName.charAt(0).toUpperCase()}
      </div>
    );
  }, []);

  // Memoize message groups to avoid recalculation on every render
  const messageGroups = useMemo(() => groupMessagesByDate(), [groupMessagesByDate]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="border-t border-gray-200 flex-grow"></div>
                  <div className="mx-4 text-xs font-medium text-gray-500">
                    {formatDateForDisplay(group.date)}
                  </div>
                  <div className="border-t border-gray-200 flex-grow"></div>
                </div>

                {/* Messages */}
                <div className="space-y-4">
                  {group.messages.map((message, messageIndex) => {
                    const isCurrentUser = message.senderId === currentUser?.uid;

                    return (
                      <div
                        key={message.id || messageIndex}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex max-w-xs md:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-2' : 'mr-2'}`}>
                            {getSenderAvatar(message)}
                          </div>

                          {/* Message content */}
                          <div>
                            {/* Sender name (only for group chats or first message from sender) */}
                            {(conversation.type === 'group' || messageIndex === 0 ||
                              group.messages[messageIndex - 1]?.senderId !== message.senderId) && !isCurrentUser && (
                              <div className="text-xs text-gray-500 mb-1">
                                {message.senderName}
                              </div>
                            )}

                            <div className="flex flex-col">
                              <div
                                className={`px-4 py-2 rounded-lg ${
                                  isCurrentUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {message.content}
                              </div>

                              {/* Timestamp */}
                              <div
                                className={`text-xs text-gray-500 mt-1 ${
                                  isCurrentUser ? 'text-right' : 'text-left'
                                }`}
                              >
                                {formatTimestamp(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
