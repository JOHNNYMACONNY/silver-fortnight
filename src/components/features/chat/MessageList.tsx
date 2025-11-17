import React from 'react';
import { ChatMessage } from '../../../types/chat';
import { Avatar } from '../../ui/Avatar';
import { useAuth } from '../../../AuthContext';
import { getProfileImageUrl } from '../../../utils/imageUtils';
import { themeClasses } from '../../../utils/themeUtils';
import { Timestamp } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: string | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  usersData?: Record<string, any>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  currentUserId,
  messagesEndRef,
  usersData = {}
}) => {
  const { userProfile } = useAuth();
  // Debug log for messages
  logger.debug('MessageList received messages:', 'COMPONENT', messages);
  logger.debug('MessageList currentUserId:', 'COMPONENT', currentUserId);
  logger.debug('MessageList usersData:', 'COMPONENT', usersData);
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <div className="p-4">
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-muted border-t-primary"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center text-muted-foreground my-12">
          <p>No messages yet.</p>
          <p className="mt-2 text-sm">
            Send a message to start the conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const isCurrentUser = currentUserId && message.senderId === currentUserId;
            // Derive sender name and avatar from usersData
            const senderData = usersData[message.senderId] || {};
            const senderName = senderData.displayName || `User ${message.senderId?.substring(0, 5) || 'Unknown'}`;
            const senderAvatar = senderData.profilePicture;

            logger.debug('Rendering message:', 'COMPONENT', message);
            logger.debug('Is current user?', 'COMPONENT', isCurrentUser);
            logger.debug('Message sender data:', 'COMPONENT', usersData[message.senderId]);

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2">
                  {!isCurrentUser && (
                    <div className="flex-shrink-0 h-8 w-8">
                      <Avatar
                        src={senderAvatar}
                        alt={senderName}
                        size="sm"
                        fallback={(senderName.charAt(0) || '?').toUpperCase()}
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${themeClasses.transition} ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-medium mb-1 text-foreground">
                        {senderName}
                      </p>
                    )}
                    <p>{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${isCurrentUser ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {message.createdAt && message.createdAt instanceof Timestamp
                          ? formatDate(message.createdAt.toDate())
                          : 'Unknown time'}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs ml-2">
                          {message.readBy.length > 1 ? (
                            <span title="Read">✓✓</span>
                          ) : (
                            <span title="Delivered">✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {isCurrentUser && (
                    <div className="flex-shrink-0 h-8 w-8">
                      <Avatar
                        src={getProfileImageUrl(userProfile?.photoURL || userProfile?.profilePicture || usersData[currentUserId || '']?.profilePicture, 32)}
                        alt="You"
                        size="sm"
                        fallback="Y"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
