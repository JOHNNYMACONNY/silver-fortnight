/**
 * ChatInput Component
 *
 * Input component for sending messages in a chat.
 */

import React, { useState, useRef, useCallback } from 'react';
import { sendMessage } from '../services/chat/chatService';
import { useAuth } from '../AuthContext';

// Icons
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const EmojiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AttachmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

interface ChatInputProps {
  conversationId: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ conversationId }) => {
  const { currentUser, userProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !currentUser || !userProfile || sending) return;

    setSending(true);

    try {
      await sendMessage({
        conversationId,
        senderId: currentUser.uid,
        senderName: userProfile.displayName || 'Unknown User',
        senderAvatar: userProfile.photoURL,
        content: message.trim()
      });

      // Clear input
      setMessage('');

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [message, currentUser, userProfile, sending, conversationId, setMessage, setSending, inputRef]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [setMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-end space-x-2">
        {/* Attachment button */}
        <button
          type="button"
          className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <AttachmentIcon />
        </button>

        {/* Emoji button */}
        <button
          type="button"
          className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <EmojiIcon />
        </button>

        {/* Message input */}
        <div className="flex-1 min-w-0 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="block w-full py-2 px-3 border-0 resize-none focus:ring-0 focus:outline-none sm:text-sm"
            rows={1}
            style={{ maxHeight: '150px' }}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!message.trim() || sending}
          className={`flex-shrink-0 inline-flex items-center justify-center p-2 rounded-full ${
            message.trim() && !sending
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          } focus:outline-none`}
        >
          {sending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <SendIcon />
          )}
        </button>
      </div>
    </div>
  );
};
