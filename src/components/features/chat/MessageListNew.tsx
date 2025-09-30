import React, { memo } from "react";
import { ChatMessage } from "../../../types/chat";
import { Avatar } from "../../ui/Avatar";
import { useAuth } from "../../../AuthContext";
import { Timestamp } from "firebase/firestore";
import { getProfileImageUrl } from "../../../utils/imageUtils";
import { themeClasses } from "../../../utils/themeUtils";

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: string | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  usersData?: Record<string, any>;
  otherParticipant?:
    | {
        id: string;
        name: string;
        avatar: string | null;
      }
    | undefined;
}

export const MessageListNew = memo(
  ({
    messages,
    loading,
    currentUserId,
    messagesEndRef,
    usersData = {},
    otherParticipant,
  }: MessageListProps) => {
    const { currentUser } = useAuth();

    // Format date
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
      }).format(date);
    };

    return (
      <div className="h-full overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-muted border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground my-12 space-y-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser =
                currentUserId && message.senderId === currentUserId;

              // Get user data for the message sender
              const senderData = usersData[message.senderId] || {};

              // Derive sender name and avatar from usersData
              const senderName =
                senderData.displayName ||
                `User ${message.senderId?.substring(0, 5) || "Unknown"}`;
              const senderAvatar = senderData.profilePicture;

              // Get user data for the current user
              const currentUserData = usersData[currentUserId || ""] || {};
              const currentUserName = currentUserData.displayName || "You";
              const currentUserAvatar = currentUserData.profilePicture;

              // Get the other participant's name (the one who is not the current user)
              let otherParticipantName = "Unknown User";
              let otherParticipantAvatar = null;

              // If we have the otherParticipant prop, use that
              if (otherParticipant) {
                otherParticipantName = otherParticipant.name;
                otherParticipantAvatar = otherParticipant.avatar;
              } else if (isCurrentUser) {
                // If this is a message from the current user, we need to find the other participant
                // Try to find the other participant in usersData
                Object.entries(usersData).forEach(([userId, userData]) => {
                  if (userId !== currentUserId && userId !== message.senderId) {
                    otherParticipantName =
                      userData.displayName || `User ${userId.substring(0, 5)}`;
                    otherParticipantAvatar = userData.profilePicture;
                  }
                });
              } else {
                // If this is a message from someone else, use their data
                otherParticipantName = senderName;
                otherParticipantAvatar = senderAvatar;
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  } mb-6`}
                >
                  <div className="flex items-start gap-4">
                    {!isCurrentUser && (
                      <div className="flex flex-col items-center">
                        <p className="text-xs font-medium mb-1 text-foreground">
                          {otherParticipantName}
                        </p>
                        <div className="flex-shrink-0 h-8 w-8">
                          <Avatar
                            src={getProfileImageUrl(otherParticipantAvatar, 32)}
                            alt={otherParticipantName}
                            size="sm"
                            fallback={(
                              otherParticipantName.charAt(0) || "?"
                            ).toUpperCase()}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <div
                        className={`max-w-[70%] min-w-[120px] rounded-lg px-4 py-2 ${
                          themeClasses.transition
                        } ${
                          isCurrentUser
                            ? "bg-primary/10 backdrop-blur-md border border-primary/20 text-primary-foreground shadow-lg"
                            : "bg-muted/10 backdrop-blur-md border border-muted/20 text-foreground shadow-lg"
                        }`}
                      >
                        <p>{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p
                            className={`text-xs ${
                              isCurrentUser
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {message.createdAt &&
                            message.createdAt instanceof Timestamp
                              ? formatDate(message.createdAt.toDate())
                              : "Unknown time"}
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
                    </div>
                    {isCurrentUser && (
                      <div className="flex flex-col items-center">
                        <p className="text-xs font-medium mb-1 text-foreground">
                          {currentUserName}
                        </p>
                        <div className="flex-shrink-0 h-8 w-8">
                          <Avatar
                            src={getProfileImageUrl(currentUserAvatar, 32)}
                            alt={currentUserName}
                            size="sm"
                            fallback={(
                              currentUserName.charAt(0) || "Y"
                            ).toUpperCase()}
                          />
                        </div>
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
  }
);
