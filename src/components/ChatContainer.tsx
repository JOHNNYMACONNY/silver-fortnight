/**
 * ChatContainer Component
 * 
 * Main container for the chat feature.
 */

import React, { useState } from 'react';
import { ChatConversationList } from './ChatConversationList';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatConversation } from '../services/chat/chatService';

// Icons
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ChatContainer: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  
  // Handle new conversation
  const handleNewConversation = () => {
    // This would typically open a modal to select users
    alert('New conversation functionality would be implemented here');
  };
  
  // Get conversation display name
  const getConversationName = (conversation: ChatConversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
    }
    
    // For direct conversations, show the other participant's name
    const otherParticipant = conversation.participants.find(
      participant => participant.id !== 'current-user-id' // Replace with actual current user ID
    );
    
    return otherParticipant?.name || 'Unknown';
  };
  
  // Toggle conversation list on mobile
  const toggleConversationList = () => {
    setShowConversationList(!showConversationList);
  };
  
  return (
    <div className="flex h-full bg-card rounded-lg shadow-sm overflow-hidden">
      {/* Conversation list (hidden on mobile when a conversation is selected) */}
      <div className={`w-full md:w-1/3 lg:w-1/4 ${
        showConversationList ? 'block' : 'hidden'
      } md:block`}>
        <ChatConversationList
          onSelectConversation={(conversation) => {
            setSelectedConversation(conversation);
            setShowConversationList(false); // Hide on mobile
          }}
          selectedConversationId={selectedConversation?.id}
          onNewConversation={handleNewConversation}
        />
      </div>
      
      {/* Chat area */}
      <div className={`w-full md:w-2/3 lg:w-3/4 flex flex-col ${
        showConversationList ? 'hidden' : 'block'
      } md:block`}>
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center">
                {/* Back button (mobile only) */}
                <button
                  className="md:hidden mr-2 text-muted-foreground hover:text-foreground"
                  onClick={toggleConversationList}
                >
                  <ArrowLeftIcon />
                </button>
                
                {/* Conversation info */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {getConversationName(selectedConversation)}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.participants.length} participants
                  </p>
                </div>
              </div>
              
              {/* Info button */}
              <button className="text-muted-foreground hover:text-foreground">
                <InfoIcon />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ChatMessageList conversation={selectedConversation} />
            </div>
            
            {/* Input */}
            <ChatInput conversationId={selectedConversation.id!} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">No conversation selected</h3>
            <p className="text-muted-foreground mb-4">
              Select a conversation from the list or start a new one
            </p>
            <button
              onClick={() => setShowConversationList(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              <ArrowLeftIcon />
              <span className="ml-2">View Conversations</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
