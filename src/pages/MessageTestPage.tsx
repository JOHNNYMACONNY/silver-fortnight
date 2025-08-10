import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase-config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export const MessageTestPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    // Hardcoded conversation ID
    const conversationId = 'bcB1UuJ2VHwTXsTFG71g';
    console.log('Directly testing conversation:', conversationId);

    // Create a direct reference to the messages subcollection
    const messagesRef = collection(db(), 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        console.log('Direct test - snapshot received, empty?', snapshot.empty);
        console.log('Direct test - snapshot size:', snapshot.size);

        const messagesList: any[] = [];

        snapshot.forEach((doc) => {
          const messageData = {
            id: doc.id,
            ...doc.data()
          };
          console.log('Direct test - found message:', doc.id, messageData);
          messagesList.push(messageData);
        });

        console.log('Direct test - total messages found:', messagesList.length);
        setMessages(messagesList);
        setLoading(false);
      } catch (err: any) {
        console.error('Direct test - error processing messages:', err);
        setError(err.message || 'Failed to process messages');
        setLoading(false);
      }
    }, (err) => {
      console.error('Direct test - error fetching messages:', err);
      setError(err.message || 'Failed to fetch messages');
      setLoading(false);
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser, db]);

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
        <h1 className="text-3xl font-bold text-foreground mb-6">Message Test</h1>
        <div className="bg-warning/10 border-l-4 border-warning text-warning-foreground p-4 mb-6">
          <p>Please log in to view messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-6">Direct Message Test</h1>
      <p className="mb-4">Testing conversation ID: <code className="bg-muted px-2 py-1 rounded">bcB1UuJ2VHwTXsTFG71g</code></p>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-border border-t-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-foreground">Messages</h2>
            <p className="mt-1 text-sm text-muted-foreground">Found {messages.length} messages</p>
          </div>
          <div className="border-t border-border">
            {messages.length > 0 ? (
              <ul className="divide-y divide-border">
                {messages.map((message) => (
                  <li key={message.id} className="px-4 py-4">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-foreground">
                        From: {message.senderId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {message.content}
                    </p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground mr-2">
                        Status: {message.status || 'unknown'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Read: {message.read ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:p-6 text-center">
                <p className="text-sm text-muted-foreground">No messages found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTestPage;
