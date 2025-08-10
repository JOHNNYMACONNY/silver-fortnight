import React from 'react';
import { Link } from 'react-router-dom';
import { ChatConversation } from '../../../types/chat';
import { Avatar } from '../../ui/Avatar';
import { Timestamp } from 'firebase/firestore';
import { cn } from '../../../utils/cn';
import { Badge } from '../../ui/Badge';
import { themeClasses } from '../../../utils/themeUtils';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  loading: boolean;
  currentUserId?: string;
  onSelectConversation: (conversation: ChatConversation) => void;
  getOtherParticipant: (conversation: ChatConversation) => { id: string; name: string; avatar: string | null };
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  loading,
  currentUserId,
  onSelectConversation,
  getOtherParticipant
}) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    } else if (date >= yesterday) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className={themeClasses.heading6}>Conversations</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-muted"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <p className="font-medium">No conversations yet</p>
            <p className="text-sm">
              Start a conversation by contacting a trade owner.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isActive = activeConversation?.id === conversation.id;

              return (
                <li
                  key={conversation.id}
                  className={cn(
                    'p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                    isActive && 'bg-muted'
                  )}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={otherParticipant.avatar}
                      alt={otherParticipant.name || 'User'}
                      fallback={
                        otherParticipant.name && otherParticipant.name.length > 0
                          ? otherParticipant.name.charAt(0).toUpperCase()
                          : 'U'
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {otherParticipant.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {typeof conversation.lastMessage === 'string'
                          ? conversation.lastMessage
                          : conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end">
                      <p className="text-xs text-muted-foreground">
                        {conversation.lastActivity && (() => {
                          if (conversation.lastActivity instanceof Timestamp) {
                            return formatDate(conversation.lastActivity.toDate());
                          } else if (typeof conversation.lastActivity === 'string') {
                            return formatDate(new Date(conversation.lastActivity));
                          } else if (conversation.lastActivity instanceof Date) {
                            return formatDate(conversation.lastActivity);
                          }
                          return '';
                        })()}
                      </p>
                      {typeof conversation.unreadCount === 'number' && conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="mt-1">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};