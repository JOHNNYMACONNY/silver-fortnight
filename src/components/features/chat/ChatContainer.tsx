import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import {
  createMessage,
  User
} from '../../../services/firestore-exports';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../../../firebase-config';
import { ConversationList } from './ConversationList';
// import { MessageList } from './MessageList';
import { MessageListNew } from './MessageListNew';
import { MessageInput } from './MessageInput';
import { MessageHeader } from './MessageHeader';
import { fetchMultipleUsers } from '../../../utils/userUtils';
import { useMessageContext } from '../../../contexts/MessageContext';
import { markMessagesAsRead as markConversationAsRead } from '../../../services/chat/chatService';
import { ChatConversation, ChatMessage } from '../../../types/chat';
import { ToastContext } from '../../../contexts/ToastContext';
import { performQuickHealthCheck, getHealthStatus } from '../../../utils/firebaseHealthCheck';
import { createRobustListener, FirebaseConnectionManager } from '../../../utils/firebaseConnectionManager';
import { testMessagesDirectly } from '../../../utils/testMessagesDirectly';
// import { loadMessagesOffline } from '../../../utils/offlineMessageLoader';
// import { resetFirebaseConnections, wasResetRequested, clearResetFlags } from '../../../utils/firebaseConnectionReset';
import { Card } from '../../ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../ui/Alert';
import { Skeleton } from '../../ui/skeletons/Skeleton';
import { Button } from '../../ui/Button';
import { ArrowLeft } from 'lucide-react';
import { themeClasses } from '../../../utils/themeUtils';

export const ChatContainer: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { currentUser } = useAuth();
  const { markMessagesAsRead, isUserParticipant } = useMessageContext();
  const toastContext = React.useContext(ToastContext);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<Record<string, User>>({});
  const [showConversationList, setShowConversationList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMarkAsReadAttemptRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user's conversations with real-time updates
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    // Create a query for the user's conversations
    const conversationsRef = collection(getSyncFirebaseDb(), 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const conversationsList: ChatConversation[] = [];

        snapshot.forEach((doc) => {
          const conversationData = {
            id: doc.id,
            ...(doc.data() as any)
          } as ChatConversation;
          conversationsList.push(conversationData);
        });

        setConversations(conversationsList);

        // If conversationId is provided in URL, set it as active
        if (conversationId) {
          const conversation = conversationsList.find(c => c.id === conversationId);
          if (conversation) {
            setActiveConversation(conversation);
          }
        } else if (conversationsList.length > 0 && !activeConversation) {
          // Otherwise, set the first conversation as active (only if no active conversation)
          setActiveConversation(conversationsList[0]);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to process conversations');
        setLoading(false);
      }
    }, (err: any) => {
      setError(err.message || 'Failed to fetch conversations');
      setLoading(false);
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser, conversationId]);

    // Load messages using offline approach to avoid Firebase internal assertion failures
    useEffect(() => {
      if (!activeConversation || !currentUser) {
        setMessages([]);
        return;
      }

      setLoading(true);
      setError(null);

      // Check if a Firebase reset was recently requested
      // if (wasResetRequested()) {
      //   console.log('ChatContainer: Firebase reset was requested, clearing flags');
      //   clearResetFlags();
      // }

      const loadMessages = async () => {
        try {
          console.log('ChatContainer: Loading messages offline to avoid Firebase internal errors...');
          
          // Use direct message loading instead of real-time listeners
          const result = await testMessagesDirectly(activeConversation.id!);
          
          if (result.success) {
            console.log(`ChatContainer: Successfully loaded ${result.messages.length} messages offline`);
            setMessages(result.messages);
            setLoading(false);
            setError(null);
            
            // Mark messages as read if needed
            if (result.messages.length > 0 && isUserParticipant(activeConversation)) {
              const unreadMessageIds = result.messages
                .filter(msg => !msg.readBy?.includes(currentUser.uid) && msg.senderId !== currentUser.uid)
                .map(msg => msg.id)
                .filter(Boolean);
              
              if (unreadMessageIds.length > 0) {
                const markAsReadDebounced = () => {
                  markConversationAsRead(activeConversation.id!, currentUser.uid)
                    .catch((error: any) => {
                      console.log('Error marking messages as read:', error.message);
                      if (!error.message?.includes('permission') && toastContext) {
                        toastContext.addToast('error', 'Failed to mark messages as read');
                      }
                    });
                };

                if (lastMarkAsReadAttemptRef.current) {
                  clearTimeout(lastMarkAsReadAttemptRef.current);
                }

                lastMarkAsReadAttemptRef.current = setTimeout(markAsReadDebounced, 1000);
              }
            }
          } else {
            console.error('ChatContainer: Offline message loading failed:', result.error);
            setError(result.error || 'Failed to load messages');
            setLoading(false);
          }
        } catch (error: any) {
          console.error('ChatContainer: Error loading messages offline:', error);
          setError(error.message || 'Failed to load messages');
          setLoading(false);
        }
      };

      loadMessages();

      // Clean up timeout on unmount
      return () => {
        if (lastMarkAsReadAttemptRef.current) {
          clearTimeout(lastMarkAsReadAttemptRef.current);
          lastMarkAsReadAttemptRef.current = null;
        }
      };
    }, [activeConversation, currentUser, markMessagesAsRead, isUserParticipant]);

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
        if (conversation.participants && Array.isArray(conversation.participants)) {
          conversation.participants.forEach((participant: { id: string; name: string }) => userIds.add(participant.id));
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
      const missingUserIds = currentUserIds.filter(id => !usersData[id]);
      
      if (missingUserIds.length > 0) {
        // Fetch user data only for missing participants
        const newUsers: Record<string, User> = await fetchMultipleUsers(missingUserIds);
        setUsersData(prevData => ({ ...prevData, ...newUsers }));
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      // Show user-friendly error message for data fetching failures
      if (toastContext) {
        toastContext.addToast('error', 'Failed to load user information');
      }
    }
  }, [conversations, messages, currentUser?.uid, usersData]);

  // Memoize user data dependencies to prevent unnecessary re-fetches
  const userDataDependencies = useMemo(() => ({
    conversationCount: conversations.length,
    messageCount: messages.length,
    currentUserId: currentUser?.uid,
    existingUserIds: Object.keys(usersData)
  }), [conversations.length, messages.length, currentUser?.uid, usersData]);

  // Use a separate useEffect with memoized dependencies
  useEffect(() => {
    fetchParticipantsData();
  }, [userDataDependencies.conversationCount, userDataDependencies.messageCount, userDataDependencies.currentUserId]);

  // Scroll to bottom of messages when new messages are loaded
  // Use a ref to track previous message count to only scroll on new messages
  const prevMessageCountRef = useRef<number>(0);

  useEffect(() => {
    // Only scroll if the number of messages has increased (new message added)
    if (messagesEndRef.current && messages.length > prevMessageCountRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // Update the previous message count
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Handle sending a new message
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!activeConversation) return;
    if (!currentUser) return;

    setSendingMessage(true);
    setError(null);

    try {
      // Get the best profile picture available - we'll get this from usersData instead
      const currentUserData = usersData[currentUser.uid];
      const profilePicture: string | undefined = currentUserData?.profilePicture || currentUserData?.photoURL;

      const messageData = {
        conversationId: activeConversation.id!,
        senderId: currentUser.uid,
        senderName: currentUserData?.displayName || currentUser.email || 'You' as string,
        senderAvatar: profilePicture,
        content: content.trim(),
        read: false,
        status: 'sent' as 'sent' | 'delivered' | 'read' | 'failed',
        type: 'text' as 'text' | 'image' | 'file' | 'link'
      };

      console.log('Sending message with data:', messageData);

      // Call createMessage with conversationId and messageData
      const { error: sendError } = await createMessage(activeConversation.id!, messageData);

      if (sendError) {
        throw new Error(sendError.message);
      }

      // Clear the input after sending
      // The messages will be updated by the real-time listener

    } catch (err: any) {
      console.error('Error sending message:', err);
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      
      // Show user-friendly error toast
      if (toastContext) {
        toastContext.addToast('error', errorMessage);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherParticipant = useCallback(
    (conversation: ChatConversation) => {
      if (!currentUser) return { id: '', name: 'Unknown', avatar: null };

      const otherParticipantId = conversation.participantIds.find(
        (id) => id !== currentUser.uid
      );

      if (otherParticipantId && usersData[otherParticipantId]) {
        const otherUser = usersData[otherParticipantId];
        return {
          id: otherUser.uid,
          name: otherUser.displayName || 'Unknown',
          avatar: otherUser.photoURL || null,
        };
      }

      // Fallback if user data not yet loaded
      const otherParticipantData = conversation.participants?.find(
        (p) => p.id === otherParticipantId
      );
      if (otherParticipantData) {
        return {
          id: otherParticipantData.id,
          name: otherParticipantData.name || 'Unknown',
          avatar: null, // No avatar in this fallback
        };
      }

      return { id: otherParticipantId || '', name: 'Loading...', avatar: null };
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const toggleConversationList = () => {
    setShowConversationList(!showConversationList);
  };

  return (
    <div role="main" aria-label="Chat interface" className="h-full">
      <Card className="h-full flex flex-col md:flex-row overflow-hidden">
        <div
          className={`${
            showConversationList ? 'block' : 'hidden'
          } md:block md:w-1/3 lg:w-1/4 w-full h-full border-r border-border flex flex-col`}
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
            showConversationList ? 'hidden' : 'block'
          } md:block flex-1 flex flex-col h-full`}
          role="main"
          aria-label="Message area"
        >
          {activeConversation ? (
            <>
              <MessageHeader
                conversation={activeConversation}
              />
              <div className="flex-1 overflow-hidden">
                <MessageListNew
                  messages={messages}
                  loading={loading}
                  currentUserId={currentUser?.uid || ''}
                  messagesEndRef={messagesEndRef}
                  usersData={usersData}
                />
              </div>
              <div className="p-4 border-t border-border flex-shrink-0">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={sendingMessage || !isUserParticipant(activeConversation)}
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
