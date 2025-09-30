import React, { useEffect, useState } from "react";
import { useAuth } from "../../../AuthContext";
import { ChatConversation } from "../../../types/chat";
import { fetchUserData } from "../../../utils/userUtils";
import { Avatar } from "../../ui/Avatar";
import { Timestamp } from "firebase/firestore";
import { themeClasses } from "../../../utils/themeUtils";
import { getProfileImageUrl } from "../../../utils/imageUtils";

interface MessageHeaderProps {
  conversation: ChatConversation | null;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({
  conversation,
}) => {
  const { currentUser } = useAuth();
  // Define a proper type for the other participant
  interface OtherParticipant {
    id: string;
    name: string;
    avatar: string | null;
    conversationId?: string; // Track which conversation this participant belongs to
  }

  const [otherParticipant, setOtherParticipant] =
    useState<OtherParticipant | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversation || !currentUser) return;

    // Store conversation ID in a ref to prevent unnecessary fetches
    const conversationId = conversation.id;

    // Check if we already have the participant data for this conversation
    if (
      otherParticipant &&
      otherParticipant.conversationId === conversationId
    ) {
      return; // Skip fetching if we already have data for this conversation
    }

    const getOtherParticipant = async () => {
      setLoading(true);
      try {
        // Find the other participant ID
        let otherUserId = "";

        if (
          conversation.participants &&
          Array.isArray(conversation.participants)
        ) {
          // Find the participant whose ID is not the current user's UID
          const otherParticipantObj = conversation.participants.find(
            (participant: { id: string }) => participant.id !== currentUser.uid
          );
          otherUserId = otherParticipantObj ? otherParticipantObj.id : "";
          console.log("Found other participant ID:", otherUserId);
        }

        if (!otherUserId) {
          console.log("Could not find other participant ID");
          setLoading(false);
          return;
        }

        // Fetch the other participant's data
        const userData = await fetchUserData(otherUserId);
        console.log("Fetched other participant data:", userData);

        setOtherParticipant({
          id: otherUserId,
          name: userData.displayName || `User ${otherUserId.substring(0, 5)}`,
          avatar:
            getProfileImageUrl(userData.profilePicture || null, 40) || null,
          conversationId: conversationId, // Store the conversation ID to prevent unnecessary fetches
        });
      } catch (error) {
        console.error("Error getting other participant:", error);
      } finally {
        setLoading(false);
      }
    };

    getOtherParticipant();
  }, [conversation?.id, currentUser?.uid]);

  if (!conversation) {
    return (
      <div
        className={`p-4 border-b ${themeClasses.border} ${themeClasses.transition}`}
      >
        <h2 className={themeClasses.heading6}>Messages</h2>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border-b ${themeClasses.border} ${themeClasses.transition}`}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-pulse h-10 w-10 rounded-full bg-muted mr-3"></div>
          <div className="animate-pulse h-4 w-24 bg-muted rounded"></div>
        </div>
      ) : otherParticipant ? (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 mr-3">
            <Avatar
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              size="md"
              fallback={(otherParticipant.name.charAt(0) || "?").toUpperCase()}
            />
          </div>
          <div>
            <h2 className={themeClasses.heading6}>{otherParticipant.name}</h2>
            <p className={themeClasses.bodySmall}>
              {conversation.lastActivity &&
              conversation.lastActivity instanceof Timestamp
                ? `Last active ${conversation.lastActivity
                    .toDate()
                    .toLocaleString()}`
                : "No recent activity"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mr-3">
            ?
          </div>
          <h2 className={themeClasses.heading6}>Unknown User</h2>
        </div>
      )}
    </div>
  );
};
