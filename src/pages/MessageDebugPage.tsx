import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase-config';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export const MessageDebugPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({
    conversations: [],
    specificConversation: null,
    nestedMessages: [],
    flatMessages: []
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const results: any = {
          conversations: [],
          specificConversation: null,
          nestedMessages: [],
          flatMessages: []
        };

        // 1. Check for all conversations
        console.log('Checking for all conversations for user:', currentUser.uid);
        const conversationsRef = collection(db(), 'conversations');
        const conversationsQuery = query(
          conversationsRef,
          where('participantIds', 'array-contains', currentUser.uid),
          orderBy('updatedAt', 'desc')
        );

        const conversationsSnapshot = await getDocs(conversationsQuery);
        console.log('Found conversations:', conversationsSnapshot.size);

        conversationsSnapshot.forEach(doc => {
          const data = { id: doc.id, ...doc.data() };
          console.log('Conversation:', doc.id, data);
          results.conversations.push(data);
        });

        // 2. Check for specific conversation
        const specificConversationId = 'bcB1UuJ2VHwTXsTFG71g';
        console.log('Checking for specific conversation:', specificConversationId);
        
        const conversationRef = doc(db(), 'conversations', specificConversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (conversationSnap.exists()) {
          const data = { id: conversationSnap.id, ...conversationSnap.data() };
          console.log('Found specific conversation:', data);
          results.specificConversation = data;
          
          // 3. Check for nested messages
          const nestedMessagesRef = collection(db(), 'conversations', specificConversationId, 'messages');
          const nestedMessagesQuery = query(nestedMessagesRef, orderBy('createdAt', 'asc'));
          const nestedMessagesSnap = await getDocs(nestedMessagesQuery);
          
          console.log('Nested messages count:', nestedMessagesSnap.size);
          nestedMessagesSnap.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            console.log('Nested message:', doc.id, data);
            results.nestedMessages.push(data);
          });
          
          // 4. Check for flat messages
          const flatMessagesRef = collection(db(), 'messages');
          const flatMessagesQuery = query(
            flatMessagesRef,
            where('conversationId', '==', specificConversationId),
            orderBy('createdAt', 'asc')
          );
          const flatMessagesSnap = await getDocs(flatMessagesQuery);
          
          console.log('Flat messages count:', flatMessagesSnap.size);
          flatMessagesSnap.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            console.log('Flat message:', doc.id, data);
            results.flatMessages.push(data);
          });
        } else {
          console.log('Specific conversation not found');
        }

        setDebugInfo(results);
        setLoading(false);
      } catch (err: any) {
        console.error('Error in debug page:', err);
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, db]);

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">Message Debug</h1>
        <div className="bg-warning/10 border-l-4 border-warning text-warning-foreground p-4 mb-6">
          <p>Please log in to debug messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-6">Message Debug</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-border border-t-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Conversations */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-foreground">Conversations</h2>
              <p className="mt-1 text-sm text-muted-foreground">Found {debugInfo.conversations.length} conversations</p>
            </div>
            <div className="border-t border-border px-4 py-5 sm:p-0">
              <div className="sm:divide-y sm:divide-border">
                {debugInfo.conversations.length > 0 ? (
                  debugInfo.conversations.map((conversation: any) => (
                    <div key={conversation.id} className="px-4 py-4 sm:px-6">
                      <p className="text-sm font-medium text-foreground">ID: {conversation.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Participants: {conversation.participantIds?.join(', ')}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Last Message: {conversation.lastMessage || 'None'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 sm:px-6">
                    <p className="text-sm text-muted-foreground">No conversations found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specific Conversation */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-foreground">Specific Conversation</h2>
              <p className="mt-1 text-sm text-muted-foreground">ID: bcB1UuJ2VHwTXsTFG71g</p>
            </div>
            <div className="border-t border-border px-4 py-5 sm:p-0">
              {debugInfo.specificConversation ? (
                <div className="px-4 py-4 sm:px-6">
                  <pre className="text-sm overflow-auto bg-muted p-4 rounded">
                    {JSON.stringify(debugInfo.specificConversation, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="px-4 py-4 sm:px-6">
                  <p className="text-sm text-muted-foreground">Conversation not found</p>
                </div>
              )}
            </div>
          </div>

          {/* Nested Messages */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-foreground">Nested Messages</h2>
              <p className="mt-1 text-sm text-muted-foreground">Found {debugInfo.nestedMessages.length} messages in nested collection</p>
            </div>
            <div className="border-t border-border px-4 py-5 sm:p-0">
              <div className="sm:divide-y sm:divide-border">
                {debugInfo.nestedMessages.length > 0 ? (
                  debugInfo.nestedMessages.map((message: any) => (
                    <div key={message.id} className="px-4 py-4 sm:px-6">
                      <p className="text-sm font-medium text-foreground">ID: {message.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Content: {message.content}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sender: {message.senderId}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Read: {message.read ? 'Yes' : 'No'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 sm:px-6">
                    <p className="text-sm text-muted-foreground">No nested messages found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flat Messages */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-foreground">Flat Messages</h2>
              <p className="mt-1 text-sm text-muted-foreground">Found {debugInfo.flatMessages.length} messages in flat collection</p>
            </div>
            <div className="border-t border-border px-4 py-5 sm:p-0">
              <div className="sm:divide-y sm:divide-border">
                {debugInfo.flatMessages.length > 0 ? (
                  debugInfo.flatMessages.map((message: any) => (
                    <div key={message.id} className="px-4 py-4 sm:px-6">
                      <p className="text-sm font-medium text-foreground">ID: {message.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Content: {message.content}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sender: {message.senderId}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Read: {message.read ? 'Yes' : 'No'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 sm:px-6">
                    <p className="text-sm text-muted-foreground">No flat messages found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDebugPage;
