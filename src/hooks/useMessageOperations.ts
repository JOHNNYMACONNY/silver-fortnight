import { useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { markMessagesAsRead as markMessagesAsReadService } from '../services/chat/chatService';
import type { ChatConversation as Conversation } from '../types/chat';

/**
 * Custom hook for message operations with proper error handling
 * This hook provides a safe way to perform message operations with proper permission checks
 */
export const useMessageOperations = () => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mark messages as read with proper error handling
   * @param conversationId The ID of the conversation
   * @param userId The ID of the user marking messages as read
   * @returns A promise that resolves when the operation is complete
   */
  const markMessagesAsRead = useCallback(async (conversationId: string, userId: string) => {
    // If no user is logged in, don't attempt the operation
    if (!currentUser) {
      return { error: { message: 'User not authenticated' } };
    }

    // If the user ID doesn't match the current user, don't attempt the operation
    if (userId !== currentUser.uid) {
      return { error: { message: 'User ID mismatch' } };
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Call the service function with proper error handling
      const result = await markMessagesAsReadService(conversationId, userId);
      return result;
    } catch (err: any) {
      // Don't set error state for permission issues - this is expected in some cases
      if (!err.message?.includes('Missing or insufficient permissions')) {
        setError(err.message || 'An error occurred while marking messages as read');
      }
      return { error: { message: err.message || 'An error occurred' } };
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser]);

  /**
   * Check if the current user is a participant in the conversation
   * @param conversation The conversation to check
   * @returns True if the user is a participant, false otherwise
   */
  const isUserParticipant = useCallback((conversation: Conversation | null): boolean => {
    if (!conversation || !currentUser) return false;

    // Check if any participant object's id matches the currentUser.uid
    return conversation.participants.some(participant => participant.id === currentUser.uid);
  }, [currentUser]);

  return {
    markMessagesAsRead,
    isUserParticipant,
    isProcessing,
    error
  };
};
