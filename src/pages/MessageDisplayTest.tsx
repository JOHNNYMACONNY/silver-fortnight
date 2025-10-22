import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getSyncFirebaseDb } from '../firebase-config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Avatar } from '../components/ui/Avatar';
import { fetchUserData } from '../utils/userUtils';

export const MessageDisplayTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    const fetchMessages = async () => {
      try {
        // Hardcoded conversation ID
        const conversationId = 'bcB1UuJ2VHwTXsTFG71g';
        console.log('Directly testing conversation:', conversationId);

        // Create a direct reference to the messages subcollection
        const messagesRef = collection(getSyncFirebaseDb(), 'conversations', conversationId, 'messages');
        const q = query(messagesRef as any, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);

        console.log('Found messages:', querySnapshot.size);
        
        const messagesList: any[] = [];
        querySnapshot.forEach((doc) => {
          const raw = doc.data();
          const messageData = {
            id: doc.id,
            ...(raw && typeof raw === 'object' ? raw : {})
          };
          console.log('Message data:', messageData);
          messagesList.push(messageData);
        });

        setMessages(messagesList);

        // Fetch user data for all senders
        const userIds = new Set<string>();
        messagesList.forEach(message => {
          if (message.senderId) {
            userIds.add(message.senderId);
          }
        });

        console.log('Fetching user data for IDs:', Array.from(userIds));
        
        const userData: Record<string, any> = {};
        for (const userId of userIds) {
          userData[userId] = await fetchUserData(userId);
        }
        
        console.log('Fetched user data:', userData);
        setUsersData(userData);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setError(err.message || 'Failed to fetch messages');
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentUser]);

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(timestamp.toDate());
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Message Display Test</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">Please log in to view messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Message Display Test</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Messages with User Data</h2>
            <p className="mt-1 text-sm text-gray-500">Found {messages.length} messages</p>
          </div>
          
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">User Data:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(usersData, null, 2)}
            </pre>
          </div>
          
          <div className="border-t border-gray-200">
            <div className="p-4 space-y-4">
              {messages.map((message) => {
                const isCurrentUser = currentUser && message.senderId === currentUser.uid;
                const userData = usersData[message.senderId] || {};
                
                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start gap-2">
                      {!isCurrentUser && (
                        <div className="flex-shrink-0 h-8 w-8">
                          <Avatar
                            src={message.senderAvatar || userData.profilePicture}
                            alt={message.senderName || userData.displayName || 'User'}
                            size="sm"
                            fallback={((message.senderName || userData.displayName || '?').charAt(0) || '?').toUpperCase()}
                          />
                        </div>
                      )}
                      <div>
                        {!isCurrentUser && (
                          <p className="text-xs font-medium mb-1 text-gray-700">
                            {message.senderName || userData.displayName || `User ${message.senderId?.substring(0, 5)}`}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary/20' : 'text-gray-500'}`}>
                            {message.createdAt ? formatDate(message.createdAt) : 'Unknown time'}
                          </p>
                        </div>
                      </div>
                      {isCurrentUser && (
                        <div className="flex-shrink-0 h-8 w-8">
                          <Avatar
                            src={currentUser.photoURL || userData.profilePicture}
                            alt="You"
                            size="sm"
                            fallback="Y"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDisplayTest;
