/**
 * Messages Page
 *
 * Page for displaying and interacting with chat messages.
 */

import React from 'react';
import { ChatContainer } from '../components/features/chat/ChatContainer';
import { useAuth } from '../AuthContext';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import { MessageProvider } from '../contexts/MessageContext';

import { Button } from '../components/ui/Button';

export const MessagesPage: React.FC = () => {
  const { currentUser, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
      </div>
    );
  }

  // Not logged in state
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to access your messages.
          </p>
          <Button asChild>
            <a href="/login">Log In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Performance monitoring (invisible) */}
      <PerformanceMonitor pageName="MessagesPage" />

      <div className="flex flex-col space-y-6">
        <div className="glassmorphic rounded-xl px-4 py-4 md:px-6 md:py-5">
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        </div>

        {/* Chat container with proper height calculation */}
        <div className="bg-card border border-border rounded-lg shadow-sm transition-all duration-200 overflow-hidden" 
             style={{ height: 'calc(100vh - 16rem)' }}>
          <MessageProvider>
            <ChatContainer />
          </MessageProvider>
        </div>
      </div>
    </>
  );
};
