import React, { useState, useRef, useEffect } from "react";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { themeClasses } from "../../../utils/themeUtils";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  loading: boolean;
}

const MAX_MESSAGE_LENGTH = 1000; // Reasonable limit for chat messages

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  loading,
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || disabled || loading) return;

    onSendMessage(message.trim());
    setMessage("");
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Enforce character limit
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
      setIsTyping(value.length > 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow Enter to submit, but prevent on Shift+Enter for future multi-line support
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const isMessageValid =
    message.trim().length > 0 && message.trim().length <= MAX_MESSAGE_LENGTH;
  const characterCount = message.length;
  const isNearLimit = characterCount > MAX_MESSAGE_LENGTH * 0.9;

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 relative min-w-0 bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg">
          <Input
            ref={inputRef}
            id="message-input"
            name="message"
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="pr-12 min-w-[200px] bg-transparent border-0 focus:ring-0 focus:border-0"
            disabled={disabled || loading}
            aria-label="Message input"
            aria-describedby="message-help"
          />
          {isNearLimit && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <span
                className={`text-xs ${
                  isNearLimit ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {characterCount}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={!isMessageValid || disabled || loading}
          isLoading={loading}
          className="flex-shrink-0"
          aria-label="Send message"
        >
          Send
        </Button>
      </form>

      {/* Help text */}
      <div id="message-help" className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line (coming soon)
      </div>

      {/* Character limit warning */}
      {characterCount > MAX_MESSAGE_LENGTH && (
        <div className="text-xs text-destructive">
          Message too long. Please shorten your message.
        </div>
      )}
    </div>
  );
};
