import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { ArrowLeft, Send, User } from 'lucide-react';
import type { Conversation, Message, UserProfile, MessageType, MessageStatus } from '../types/messaging';

export function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    let unsubConversation: (() => void) | undefined;

    // Subscribe to conversation updates
    const initializeConversation = async () => {
      try {
        const db = await getDb();
        unsubConversation = onSnapshot(
          doc(db, 'conversations', id),
          async (snapshot) => {
            if (!snapshot.exists()) {
              console.error('Conversation not found:', id);
              setError('Conversation not found');
              setLoading(false);
              return;
            }

            console.log('Conversation data received:', snapshot.data()); // Debug log

            const conversationData = {
              id: snapshot.id,
              ...snapshot.data()
            } as Conversation;
            setConversation(conversationData);

            // Fetch other participant's profile
            const otherUserId = conversationData.participants.find(
              (pid) => pid !== user.uid
            );
            if (otherUserId) {
              try {
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                if (userDoc.exists()) {
                  setOtherUser({
                    id: userDoc.id,
                    ...userDoc.data()
                  } as UserProfile);
                } else {
                  console.error('User profile not found:', otherUserId);
                  setError('User profile not found');
                }
              } catch (err) {
                console.error('Failed to fetch other user:', err);
                setError('Failed to load user profile');
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching conversation:', error);
            setError('Failed to load conversation');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error setting up conversation listener:', err);
        setError('Failed to load conversation');
        setLoading(false);
      }
    };

    initializeConversation();
      
    // Set up cleanup function
    return () => {
      if (unsubConversation) {
        unsubConversation();
      }
      setConversation(null);
      setMessages([]);
      setOtherUser(null);
    };
  }, [id, user]);

  // Separate effect for messages subscription
  useEffect(() => {
    if (!id || !user) return;

    let unsubMessages: (() => void) | undefined;

    console.log('Setting up messages listener for conversation:', id); // Debug log

    const initializeMessages = async () => {
      const db = await getDb();
      const messagesRef = collection(db, 'conversations', id, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      unsubMessages = onSnapshot(
        q,
        (snapshot) => {
          const newMessages = snapshot.docs.map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
              id: docSnapshot.id,
              conversationId: id,
              senderId: data.senderId,
              content: data.content,
              createdAt: data.createdAt ? (data.createdAt as Timestamp) : null,
              read: data.read || false,
              type: (data.type || 'text') as MessageType,
              status: (data.status || 'sent') as MessageStatus
            };
          });
          setMessages(newMessages);
          setLoading(false);

          // Update read status
          if (newMessages.length > 0) {
            const unreadMessages = newMessages.filter(
              (msg) => !msg.read && msg.senderId !== user.uid
            );

            if (unreadMessages.length > 0) {
              (async () => {
                const db = await getDb();
                await updateDoc(doc(db, 'conversations', id), {
                  [`unreadCount.${user.uid}`]: 0,
                  lastRead: serverTimestamp()
                });

                // Mark messages as read
                for (const msg of unreadMessages) {
                  const messageRef = doc(messagesRef, msg.id);
                  await updateDoc(messageRef, { read: true });
                }
              })().catch((err) => {
                console.error('Error updating read status:', err);
              });
            }
          }
        },
        (error) => {
          console.error('Error fetching messages:', error);
          setError('Failed to load messages');
          setLoading(false);
        }
      );
    };

    initializeMessages();

    return () => {
      if (unsubMessages) {
        unsubMessages();
      }
    };
  }, [id, user]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator with debounce
  const updateTypingStatus = async (isTyping: boolean) => {
    if (!conversation?.id || !user?.uid) return;
    
    const db = await getDb();
    const conversationRef = doc(db, 'conversations', conversation.id);
    try {
      const typingUpdate = {
        [`isTyping.${user.uid}`]: isTyping
      };
      await updateDoc(conversationRef, typingUpdate);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleTyping = async () => {
      if (!conversation?.id || !user?.uid || !newMessage) return;
      
      await updateTypingStatus(true);
      
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Set new timeout to clear typing status
      timeoutId = setTimeout(() => {
        updateTypingStatus(false);
      }, 2000);
    };

    // Call handleTyping whenever newMessage changes
    handleTyping();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        updateTypingStatus(false);
      }
    };
  }, [newMessage, conversation?.id, user?.uid]);

  // Update online status
  useEffect(() => {
    if (!user?.uid) return;

    const updateOnlineStatus = async () => {
      const db = await getDb();
      const userStatusRef = doc(db, 'users', user.uid);
      await updateDoc(userStatusRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
      });
    };

    updateOnlineStatus();

    return () => {
      if (user?.uid) {
        (async () => {
          const db = await getDb();
          const userStatusRef = doc(db, 'users', user.uid);
          await updateDoc(userStatusRef, {
            isOnline: false,
            lastSeen: serverTimestamp()
          });
        })();
      }
    };
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid || !conversation?.id || !id || !otherUser?.id) return;

    const tempMessage = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const db = await getDb();
      // First update conversation metadata to ensure proper ordering
      await updateDoc(doc(db, 'conversations', id), {
        lastMessage: tempMessage,
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCount.${otherUser.id}`]: (conversation.unreadCount?.[otherUser.id] || 0) + 1,
        updatedAt: serverTimestamp()
      });

      // Then add the message
      const messageData = {
        conversationId: id,
        senderId: user.uid,
        content: tempMessage,
        createdAt: serverTimestamp(),
        read: false,
        type: 'text' as MessageType,
        status: 'sent' as MessageStatus
      };

      await addDoc(collection(db, 'conversations', id, 'messages'), messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Only attempt to revert conversation metadata if we managed to update it
      try {
        const db = await getDb();
        await updateDoc(doc(db, 'conversations', id), {
          lastMessage: conversation.lastMessage,
          lastMessageTimestamp: conversation.lastMessageTimestamp,
          [`unreadCount.${otherUser.id}`]: conversation.unreadCount?.[otherUser.id] || 0,
          updatedAt: conversation.updatedAt
        });
      } catch (revertError) {
        console.error('Failed to revert conversation metadata:', revertError);
      }

      setError('Failed to send message. Please try again.');
      setNewMessage(tempMessage); // Restore the message in input for retry
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card overflow-hidden">
          {/* Loading Header */}
          <div className="p-4 border-b border-earth-700 bg-earth-800 flex items-center">
            <div className="animate-pulse flex items-center w-full">
              <div className="h-8 w-8 bg-earth-300 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-earth-300 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-earth-300 rounded w-1/3"></div>
              </div>
            </div>
          </div>

          {/* Loading Messages */}
          <div className="h-[500px] p-4 bg-earth-50">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`flex ${n % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`w-2/3 h-16 rounded-lg ${n % 2 === 0 ? 'bg-accent-sage/20' : 'bg-earth-300'}`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading Input */}
          <div className="p-4 border-t border-earth-700 bg-earth-800">
            <div className="animate-pulse flex gap-2">
              <div className="flex-1 h-10 bg-earth-300 rounded-lg"></div>
              <div className="h-10 w-10 bg-earth-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-4 border border-accent-rust/50">
          <div className="flex items-center gap-2 text-accent-rust">
            <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => navigate('/messages')} />
            <span>Conversation not found</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4">
          <div className="bg-accent-rust/10 border border-accent-rust text-accent-rust px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        </div>
      )}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-earth-700 bg-earth-800 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/messages')}
              className="mr-4 text-text-muted hover:text-text-secondary transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <User className="h-8 w-8 text-text-muted mr-3" />
              <div>
                <div>
                  <h2 className="font-display font-bold text-text-primary">
                    {otherUser?.displayName || 'Unknown User'}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {otherUser?.isOnline ? (
                      <span className="text-accent-sage">● Online</span>
                    ) : otherUser?.lastSeen?.toDate ? (
                      `Last seen ${otherUser.lastSeen.toDate().toLocaleString()}`
                    ) : ''}
                  </p>
                </div>
                {conversation.tradeName && (
                  <p className="text-sm text-accent-moss font-medium">
                    Re: {conversation.tradeName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[500px] overflow-y-auto p-4 bg-earth-50">
          <div className="space-y-4 pb-2">
            {otherUser?.id && conversation?.isTyping?.[otherUser.id] === true && (
              <div className="flex justify-start">
                <div className="bg-earth-800 text-text-secondary border border-earth-700 rounded-lg px-4 py-2">
                  <span className="text-accent-sage text-sm animate-pulse">
                    {otherUser.displayName} is typing...
                  </span>
                </div>
              </div>
            )}
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.uid;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-accent-sage/10 text-text-primary border border-accent-sage/30'
                        : 'bg-earth-800 text-text-primary border border-earth-700'
                    }`}
                  >
                    <p>{message.content}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {message.createdAt?.toDate ? message.createdAt.toDate().toLocaleTimeString() : ''}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-earth-700 bg-earth-800">
          <div className="flex gap-2">
            <input
              type="text"
              name="message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 bg-earth-50 text-text-primary border border-earth-700 rounded-lg 
                         focus:ring-2 focus:ring-accent-sage focus:border-accent-sage placeholder:text-text-muted"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-accent-sage hover:bg-accent-moss text-white font-medium rounded-lg 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
