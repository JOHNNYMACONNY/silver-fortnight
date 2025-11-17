import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "../AuthContext";
import { ChatConversation } from "../types/chat";
import { useChatError } from "./ChatErrorContext";
import { logger } from '@utils/logging/logger';

interface MessageContextType {
  markMessagesAsRead: (messageIds: string[], userId: string) => Promise<any>;
  isUserParticipant: (conversation: ChatConversation | null) => boolean;
  isProcessing: boolean;
  error: string | null;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const { addError } = useChatError();
  const [_isProcessing, setIsProcessing] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  /**
   * Mark messages as read with proper error handling
   * @param messageIds The IDs of the messages to mark as read (currently unused - using conversationId approach)
   * @param userId The ID of the user marking messages as read
   * @returns A promise that resolves when the operation is complete
   */
  const markMessagesAsRead = useCallback(
    async (messageIds: string[], userId: string) => {
      // If no user is logged in, don't attempt the operation
      if (!currentUser) {
        return { error: { message: "User not authenticated" } };
      }

      // If the user ID doesn't match the current user, don't attempt the operation
      if (userId !== currentUser.uid) {
        return { error: { message: "User ID mismatch" } };
      }

      // NOTE: The current implementation doesn't actually use messageIds
      // Instead, it marks all messages in a conversation as read
      // This should be refactored to handle individual message IDs properly

      try {
        // For now, we'll return success without doing anything
        // The actual read marking happens in the ChatContainer component
        // using the chat service's markMessagesAsRead function
        return { data: null, error: null };
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));

        // Use centralized error handling
        addError(error, "marking messages as read", { messageIds, userId });

        // Return the error but don't update UI state for permission errors
        if (error.message?.includes("Missing or insufficient permissions")) {
          logger.debug('Permission error when marking messages as read (expected):', 'CONTEXT', error.message);
        }

        return { error: { message: error.message || "An error occurred" } };
      }
    },
    [currentUser]
  );

  /**
   * Check if the current user is a participant in the conversation
   * @param conversation The conversation to check
   * @returns True if the user is a participant, false otherwise
   */
  const isUserParticipant = useCallback(
    (conversation: ChatConversation | null): boolean => {
      if (!conversation || !currentUser) return false;

      // Check if the current user's ID exists in the participants array
      return (
        conversation.participants?.some(
          (participant) => participant.id === currentUser.uid
        ) || false
      );
    },
    [currentUser]
  );

  const value = {
    markMessagesAsRead,
    isUserParticipant,
    isProcessing: _isProcessing,
    error: _error,
  };

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};

/**
 * Hook to use the message context
 * @returns The message context
 * @throws Error if used outside of a MessageProvider
 */
export const useMessageContext = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error("useMessageContext must be used within a MessageProvider");
  }
  return context;
};
