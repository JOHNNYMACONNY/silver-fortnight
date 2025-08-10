/**
 * ChatConversationList Component
 * 
 * Displays a list of chat conversations.
 */

import React, { useState, useEffect } from 'react';
import { ChatConversation, getUserConversations } from '../services/chat/chatService';
import { useAuth } from '../AuthContext';

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

interface ChatConversationListProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  selectedConversationId?: string;
  onNewConversation: () => void;
}

export const ChatConversationList: React.FC<ChatConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
  onNewConversation
}) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    // Subscribe to user conversations
    const unsubscribe = getUserConversations(currentUser.uid, (fetchedConversations: ChatConversation[]) => {
      setConversations(fetchedConversations);
      setLoading(false);
      
      // Auto-select first conversation if none is selected
      if (fetchedConversations.length > 0 && !selectedConversationId) {
        onSelectConversation(fetchedConversations[0]);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, selectedConversationId, onSelectConversation]);
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => {
    if (searchTerm === '') return true;
    
    // For direct conversations, search in participant names
    if (conversation.type === 'direct') {
      return conversation.participants.some((participant: { id: string; name: string }) =>
        participant.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // For group conversations, search in group name
    return conversation.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Get conversation display name
  const getConversationName = (conversation: ChatConversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
    }
    
    // For direct conversations, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (participant: { id: string; name: string }) => participant.id !== currentUser?.uid
    );
    
    return otherParticipant?.name || 'Unknown';
  };
  
  // Get conversation avatar
  const getConversationAvatar = (conversation: ChatConversation) => {
    if (conversation.type === 'group') {
      // Group avatar placeholder
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      );
    }
    
    // For direct conversations, show the other participant's avatar
    const otherParticipant = conversation.participants.find(
      (participant: { id: string; name: string }) => participant.id !== currentUser?.uid
    );
    
    if (otherParticipant?.avatar) {
      return (
        <img
          src={otherParticipant.avatar}
          alt={otherParticipant.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    
    // Fallback avatar
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-800 font-semibold">
        {otherParticipant?.name.charAt(0).toUpperCase() || '?'}
      </div>
    );
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Today, show time
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        // Yesterday
        return 'Yesterday';
      } else if (diffDays < 7) {
        // This week, show day name
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        // Older, show date
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (err) {
      console.error('Error formatting timestamp:', err);
      return '';
    }
  };
  
  return (
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        
        {/* Search */}
        <div className="mt-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        
        {/* New conversation button */}
        <button
          onClick={onNewConversation}
          className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <PlusIcon />
          <span className="ml-2">New Conversation</span>
        </button>
      </div>
      
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <p className="text-gray-500">
              {searchTerm
                ? 'No conversations match your search'
                : 'No conversations yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNewConversation}
                className="mt-2 text-orange-500 hover:text-orange-600 text-sm font-medium"
              >
                Start a new conversation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer ${conversation.id === selectedConversationId ? 'bg-gray-100' : ''}`}
                onClick={() => onSelectConversation(conversation)}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mr-3">
                  {getConversationAvatar(conversation)}
                </div>

                {/* Conversation info */}
                <div className="flex-1 min-w-0">
                  {/* Conversation name */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {getConversationName(conversation)}
                    </p>
                    {/* Last message timestamp */}
                    {conversation.lastMessageTimestamp && (
                      <p className="text-xs text-gray-500 flex-shrink-0">
                        {formatTimestamp(conversation.lastMessageTimestamp)}
                      </p>
                    )}
                  </div>

                  {/* Last message content or trade link */}
                  <div className="text-sm text-gray-500 truncate mt-1">
                    {conversation.lastMessage ? (
                      <p>{conversation.lastMessage.content}</p>
                    ) : (
                      // Display trade link if available in metadata
                      conversation.metadata?.tradeId && (
                        <a
                          href={`/trades/${conversation.metadata.tradeId}`}
                          onClick={(e) => e.stopPropagation()} // Prevent selecting conversation when clicking link
                          className="text-orange-600 hover:underline"
                        >
                          {conversation.metadata.tradeName || 'View trade'}
                        </a>
                      )
                    )}
                  </div>

                  {/* Unread count */}
                  {conversation.unreadCount && conversation.unreadCount[currentUser?.uid || ''] > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                      {conversation.unreadCount[currentUser?.uid || '']}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
