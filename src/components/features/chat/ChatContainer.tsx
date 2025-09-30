import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  useParams,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../../AuthContext";
import { createMessage, User } from "../../../services/firestore-exports";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { getSyncFirebaseDb } from "../../../firebase-config";
import { ConversationList } from "./ConversationList";
// import { MessageList } from './MessageList';
import { MessageListNew } from "./MessageListNew";
import { MessageInput } from "./MessageInput";
import { MessageHeader } from "./MessageHeader";
import { fetchMultipleUsers } from "../../../utils/userUtils";
import { useListenerPerformance } from "../../../hooks/useListenerPerformance";
import { getProfileImageUrl } from "../../../utils/imageUtils";
import { useMessageContext } from "../../../contexts/MessageContext";
import {
  markMessagesAsRead as markConversationAsRead,
  getConversationMessages,
  getOrCreateDirectConversation,
} from "../../../services/chat/chatService";
import { migrationRegistry } from "../../../services/migration/migrationRegistry";
import { ChatConversation, ChatMessage } from "../../../types/chat";
import { ToastContext } from "../../../contexts/ToastContext";
import {
  performQuickHealthCheck,
  getHealthStatus,
} from "../../../utils/firebaseHealthCheck";
import {
  createRobustListener,
  FirebaseConnectionManager,
} from "../../../utils/firebaseConnectionManager";
import { testMessagesDirectly } from "../../../utils/testMessagesDirectly";
import { usePerformanceMonitoring } from "../../../hooks/usePerformanceMonitoring";
// Chat error handling - using local error state instead of context
// import {
//   useChatError,
//   useChatOperation,
// } from "../../../contexts/ChatErrorContext";
// Rate limiting - using local implementation instead of missing hook
// import {
//   useMessageSendRateLimit,
//   useMessageReadRateLimit,
// } from "../../../hooks/useRateLimiter";
// import { loadMessagesOffline } from '../../../utils/offlineMessageLoader';
// import { resetFirebaseConnections, wasResetRequested, clearResetFlags } from '../../../utils/firebaseConnectionReset';
import { Card } from "../../ui/Card";
import { Alert, AlertDescription, AlertTitle } from "../../ui/Alert";
import { Skeleton } from "../../ui/skeletons/Skeleton";
import { Button } from "../../ui/Button";
import { ArrowLeft } from "lucide-react";
import { themeClasses } from "../../../utils/themeUtils";

export const ChatContainer: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { currentUser } = useAuth();
  const { isUserParticipant } = useMessageContext();
  const toastContext = React.useContext(ToastContext);
  // Local error handling functions
  const addError = (error: Error, operation: string, metadata?: any) => {
    console.error(`Chat error in ${operation}:`, error, metadata);
    if (toastContext) {
      toastContext.addToast("error", `Error in ${operation}: ${error.message}`);
    }
  };

  const executeWithErrorHandling = async (operation: () => Promise<any>) => {
    try {
      return await operation();
    } catch (error) {
      addError(
        error instanceof Error ? error : new Error(String(error)),
        "operation"
      );
      throw error;
    }
  };

  // Local rate limiting implementation
  const sendRateLimit = {
    checkRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
    executeAsyncWithRateLimit: async (
      operation: () => Promise<any>,
      onRateLimited?: (result: any) => void
    ) => {
      return await operation();
    },
  };

  const readRateLimit = {
    executeAsyncWithRateLimit: async (
      operation: () => Promise<any>,
      onRateLimited?: (result: any) => void
    ) => {
      return await operation();
    },
  };

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<Record<string, User>>({});
  const [showConversationList, setShowConversationList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMarkAsReadAttemptRef = useRef<NodeJS.Timeout | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Performance monitoring for real-time listeners
  const messageListenerPerf = useListenerPerformance(
    `messages-${activeConversation?.id || "none"}`,
    {
      maxListeners: 5,
      memoryThreshold: 100, // 100MB
      responseTimeThreshold: 5000,
      enableLogging: false,
    }
  );

  const conversationListenerPerf = useListenerPerformance(
    `conversations-${currentUser?.uid || "none"}`,
    {
      maxListeners: 3,
      memoryThreshold: 50, // 50MB
      responseTimeThreshold: 1500,
      enableLogging: false,
    }
  );

  // Helper: normalize conversation objects from migration/compatibility services
  const normalizeConversation = (c: any): ChatConversation => {
    return {
      // keep existing known properties
      ...c,
      // participants must be an array for our canonical type
      participants: Array.isArray(c?.participants) ? c.participants : [],
      // ensure participantIds exist (fallback to participants' ids)
      participantIds:
        Array.isArray(c?.participantIds) && c.participantIds.length > 0
          ? c.participantIds
          : Array.isArray(c?.participants)
          ? c.participants.map((p: any) => p.id)
          : [],
    } as ChatConversation;
  };

  // Deep-linking: /messages/new?to=<userId>
  useEffect(() => {
    if (!currentUser) return;
    const targetUserId = searchParams.get("to");
    if (!targetUserId) return;

    (async () => {
      try {
        const users = await fetchMultipleUsers([targetUserId]);
        const target = users[targetUserId]
          ? {
              id: targetUserId,
              name: users[targetUserId].displayName || "User",
              avatar:
                users[targetUserId].profilePicture ||
                users[targetUserId].photoURL ||
                null,
            }
          : { id: targetUserId, name: "User" };
        const me = {
          id: currentUser.uid,
          name: currentUser.displayName || "You",
          avatar: (currentUser as any)?.photoURL || null,
        };
        const convo = await getOrCreateDirectConversation(me, target);
        // normalize before putting into state
        setActiveConversation(normalizeConversation(convo));
        try {
          navigate(`/messages/${convo.id}`, { replace: true });
        } catch {}
      } catch (e) {
        console.error(
          "ChatContainer: failed to open deep-linked conversation",
          e
        );
      }
    })();
  }, [currentUser, searchParams, navigate]);

  // Initialize migration registry and fetch user's conversations
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    // Initialize migration registry if not already done
    const db = getSyncFirebaseDb();
    if (!migrationRegistry.isInitialized()) {
      migrationRegistry.initialize(db);
      migrationRegistry.enableMigrationMode();
    }

    // Use ChatCompatibilityService for better error handling
    const fetchConversations = async () => {
      try {
        const chatService = migrationRegistry.chat;
        const list = await chatService.getUserConversations(
          currentUser.uid,
          50
        );

        // normalize all items before setting state (ensures participants is always an array)
        const normalizedList = list.map((c: any) => normalizeConversation(c));

        setConversations(normalizedList);

        if (conversationId) {
          const found = normalizedList.find((c) => c.id === conversationId);
          if (found) setActiveConversation(found);
        } else if (normalizedList.length > 0 && !activeConversation) {
          setActiveConversation(normalizedList[0]);
        }

        setLoading(false);
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Error fetching conversations:", error);

        // Handle permission errors gracefully - they're expected when user has no conversations
        if (error.message?.includes("Missing or insufficient permissions")) {
          // No conversations for user yet; not an error
          setConversations([]);
          setLoading(false);
          setError(null); // Clear error since this is expected
        } else {
          // Use centralized error handling for non-permission errors
          addError(error, "loading conversations", { userId: currentUser.uid });
          setError(error.message || "Failed to load conversations");
          setLoading(false);
        }
      }
    };

    fetchConversations();
  }, [currentUser, conversationId, activeConversation]);

  // Load messages using canonical service
  useEffect(() => {
    if (!activeConversation || !currentUser) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    const startTime = Date.now();
    const unsubscribe = getConversationMessages(
      activeConversation.id!,
      (messagesList) => {
        const responseTime = Date.now() - startTime;
        messageListenerPerf.trackActivity(responseTime);

        try {
          setMessages(messagesList);
          setLoading(false);
          setError(null);

          // Debounced mark-as-read using service (now safe after fix)
          if (
            messagesList.length > 0 &&
            isUserParticipant(activeConversation)
          ) {
            const hasUnread = messagesList.some(
              (msg) =>
                !msg.readBy?.includes(currentUser.uid) &&
                msg.senderId !== currentUser.uid
            );
            if (hasUnread) {
              const markAsReadDebounced = () => {
                // Use rate limiting for read operations
                readRateLimit
                  .executeAsyncWithRateLimit(
                    async () => {
                      await markConversationAsRead(
                        activeConversation.id!,
                        currentUser.uid
                      );
                    },
                    (rateLimitResult) => {
                      // Rate limited, silently ignore in production
                    }
                  )
                  .catch((error: any) => {
                    // Suppress noisy permission logs; errors still tracked centrally
                    if (!error.message?.includes("permission")) {
                      addError(
                        error instanceof Error
                          ? error
                          : new Error(String(error)),
                        "marking messages as read",
                        { conversationId: activeConversation.id }
                      );
                    }
                  });
              };

              if (lastMarkAsReadAttemptRef.current) {
                clearTimeout(lastMarkAsReadAttemptRef.current);
              }

              lastMarkAsReadAttemptRef.current = setTimeout(
                markAsReadDebounced,
                1000
              );
            }
          }
        } catch (err: any) {
          console.error(
            "ChatContainer: Error processing real-time messages:",
            err
          );
          setError(err.message || "Failed to process messages");
          setLoading(false);
          messageListenerPerf.trackError(
            err instanceof Error ? err : new Error(String(err))
          );
        }
      },
      // Add error handler for listener failures
      (error: Error) => {
        console.error("ChatContainer: Message listener error:", error);
        setError(error.message || "Failed to load messages");
        setLoading(false);
        messageListenerPerf.trackError(error);

        // Show user-friendly error for listener failures
        if (toastContext && !error.message?.includes("permission")) {
          toastContext.addToast(
            "error",
            "Connection lost. Trying to reconnect..."
          );
        }
      }
    );

    // Register the listener for performance monitoring
    const cleanupPerformanceMonitoring = () => {
      // Cleanup performance monitoring
      unsubscribe();
    };

    // Clean up on unmount
    return () => {
      if (lastMarkAsReadAttemptRef.current) {
        clearTimeout(lastMarkAsReadAttemptRef.current);
        lastMarkAsReadAttemptRef.current = null;
      }
      cleanupPerformanceMonitoring();
    };
  }, [activeConversation, currentUser, isUserParticipant, toastContext]);

  // Memoize the fetchParticipantsData function to prevent unnecessary re-renders
  const fetchParticipantsData = useCallback(async () => {
    if (!conversations.length || !currentUser) return;

    try {
      // Collect all unique user IDs from conversations
      const userIds = new Set<string>();

      // Add current user
      userIds.add(currentUser.uid);

      // Add all participants from conversations
      conversations.forEach((conversation: ChatConversation) => {
        if (
          conversation.participants &&
          Array.isArray(conversation.participants)
        ) {
          conversation.participants.forEach(
            (participant: { id: string; name: string }) =>
              userIds.add(participant.id)
          );
        }
      });

      // Add message senders from current messages only
      messages.forEach((message: ChatMessage) => {
        if (message.senderId) {
          userIds.add(message.senderId);
        }
      });

      // Only fetch if there are new user IDs to fetch
      const currentUserIds = Array.from(userIds);
      const missingUserIds = currentUserIds.filter((id) => !usersData[id]);

      if (missingUserIds.length > 0) {
        // Fetch user data only for missing participants
        const newUsers: Record<string, User> = await fetchMultipleUsers(
          missingUserIds
        );
        setUsersData((prevData) => ({ ...prevData, ...newUsers }));
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      // Show user-friendly error message for data fetching failures
      if (toastContext) {
        toastContext.addToast("error", "Failed to load user information");
      }
    }
  }, [conversations, messages, currentUser?.uid, usersData]);

  // Memoize user data dependencies to prevent unnecessary re-fetches
  const userDataDependencies = useMemo(
    () => ({
      conversationCount: conversations.length,
      messageCount: messages.length,
      currentUserId: currentUser?.uid,
      existingUserIds: Object.keys(usersData).sort().join(","), // Stable string representation
    }),
    [
      conversations.length,
      messages.length,
      currentUser?.uid,
      Object.keys(usersData).sort().join(","),
    ]
  );

  // Use a separate useEffect with memoized dependencies and proper cleanup
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      await fetchParticipantsData();
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    userDataDependencies.conversationCount,
    userDataDependencies.messageCount,
    userDataDependencies.currentUserId,
    userDataDependencies.existingUserIds,
    fetchParticipantsData,
  ]);

  // Scroll to bottom of messages when new messages are loaded
  // Use a ref to track previous message count to only scroll on new messages
  const prevMessageCountRef = useRef<number>(0);

  useEffect(() => {
    // Only scroll if the number of messages has increased (new message added)
    if (
      messagesEndRef.current &&
      messages.length > prevMessageCountRef.current
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Update the previous message count
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Handle sending a new message
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!activeConversation) return;
    if (!currentUser) return;

    // Check rate limit before proceeding
    const rateLimitResult = sendRateLimit.checkRateLimit();
    if (!rateLimitResult.allowed) {
      const waitTime = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      );
      if (toastContext) {
        toastContext.addToast(
          "info",
          `Please wait ${waitTime} seconds before sending another message.`
        );
      }
      return;
    }

    setSendingMessage(true);
    setError(null);

    try {
      // Execute with rate limiting
      const result = await sendRateLimit.executeAsyncWithRateLimit(
        async () => {
          // Get the best profile picture available - we'll get this from usersData instead
          const currentUserData = usersData[currentUser.uid];
          const profilePicture: string | undefined =
            currentUserData?.profilePicture || currentUserData?.photoURL;

          const messageData = {
            conversationId: activeConversation.id!,
            senderId: currentUser.uid,
            senderName:
              currentUserData?.displayName ||
              currentUser.email ||
              ("You" as string),
            senderAvatar: profilePicture,
            content: content.trim(),
            read: false,
            status: "sent" as "sent" | "delivered" | "read" | "failed",
            type: "text" as "text" | "image" | "file" | "link",
          };

          console.log("Sending message with data:", messageData);

          // Call createMessage with conversationId and messageData
          const { error: sendError } = await createMessage(
            activeConversation.id!,
            messageData
          );

          if (sendError) {
            throw new Error(sendError.message);
          }

          return messageData;
        },
        (rateLimitResult) => {
          const waitTime = Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          );
          if (toastContext) {
            toastContext.addToast(
              "info",
              `Rate limit exceeded. Please wait ${waitTime} seconds.`
            );
          }
        }
      );

      if (!result) {
        // Rate limited or failed
        return;
      }

      // Clear the input after sending
      // The messages will be updated by the real-time listener
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error sending message:", error);

      // Use centralized error handling
      addError(error, "sending message", {
        conversationId: activeConversation?.id || "unknown",
        messageContent: content.trim(),
      });

      setError(error.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherParticipant = useCallback(
    (conversation: ChatConversation) => {
      if (!currentUser) return { id: "", name: "Unknown", avatar: null };

      const otherParticipantId = conversation.participantIds.find(
        (id) => id !== currentUser.uid
      );

      if (otherParticipantId && usersData[otherParticipantId]) {
        const otherUser = usersData[otherParticipantId];
        return {
          id: otherUser.uid,
          name: otherUser.displayName || "Unknown",
          avatar: getProfileImageUrl(otherUser.profilePicture || null, 32),
        };
      }

      // Fallback if user data not yet loaded
      const otherParticipantData = conversation.participants?.find(
        (p) => p.id === otherParticipantId
      );
      if (otherParticipantData) {
        return {
          id: otherParticipantData.id,
          name: otherParticipantData.name || "Unknown",
          avatar: null, // No avatar in this fallback
        };
      }

      return { id: otherParticipantId || "", name: "Loading...", avatar: null };
    },
    [currentUser, usersData]
  );

  if (loading && conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Skeleton className="h-16 w-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Messages</AlertTitle>
          <AlertDescription>
            {error}
            {/* Debug info removed for production cleanliness */}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
          variant="outline"
        >
          Reload Page
        </Button>
      </div>
    );
  }

  // Show helpful message when no conversations exist
  if (!loading && conversations.length === 0) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>No Conversations Yet</AlertTitle>
          <AlertDescription>
            You don't have any conversations yet. Start a conversation with
            another user or create a test conversation to get started.
            {/* Removed debug/test actions and info */}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const toggleConversationList = () => {
    setShowConversationList(!showConversationList);
  };

  return (
    <div role="main" aria-label="Chat interface" className="h-full">
      <Card className="h-full flex flex-col md:flex-row overflow-hidden max-w-full">
        <div
          className={`${
            showConversationList ? "block" : "hidden"
          } md:block md:w-1/3 lg:w-1/4 xl:w-1/5 w-full h-full border-r border-border flex flex-col max-w-sm`}
          role="complementary"
          aria-label="Conversation list"
        >
          <ConversationList
            conversations={conversations}
            activeConversation={activeConversation}
            loading={loading}
            currentUserId={currentUser?.uid}
            onSelectConversation={(conversation) => {
              setActiveConversation(conversation);
              setShowConversationList(false); // Hide on mobile
            }}
            getOtherParticipant={getOtherParticipant}
          />
        </div>

        <div
          className={`${
            showConversationList ? "hidden" : "block"
          } md:block flex-1 flex flex-col h-full min-w-0`}
          role="main"
          aria-label="Message area"
        >
          {activeConversation ? (
            <>
              <MessageHeader conversation={activeConversation} />
              <div className="flex-1 overflow-hidden">
                <MessageListNew
                  messages={messages}
                  loading={loading}
                  currentUserId={currentUser?.uid || ""}
                  messagesEndRef={messagesEndRef}
                  usersData={usersData}
                />
              </div>
              <div className="p-4 border-t border-border flex-shrink-0">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={
                    sendingMessage || !isUserParticipant(activeConversation)
                  }
                  loading={sendingMessage}
                />
                {!isUserParticipant(activeConversation) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    You are no longer a participant in this conversation.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <h2 className={themeClasses.heading5 + " mb-2"}>
                Welcome to your conversations
              </h2>
              <p className="text-muted-foreground mb-4">
                Select a conversation to start messaging.
              </p>
              <Button
                variant="outline"
                className="md:hidden"
                onClick={() => setShowConversationList(true)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View Conversations
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
