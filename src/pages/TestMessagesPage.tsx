/**
 * Test Messages Page
 * 
 * This page tests the messages loading using getDocs instead of onSnapshot
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getSyncFirebaseDb } from '../firebase-config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';

export const TestMessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    if (!currentUser) {
      setError('You must be logged in to load conversations');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const db = getSyncFirebaseDb();
      const userId = currentUser.uid;

      console.log('TestMessagesPage: Loading conversations for user:', userId);

      // Try different query approaches
      let conversations: any[] = [];

      // Approach 1: participantIds query
      try {
        console.log('TestMessagesPage: Trying participantIds query...');
        const participantQuery = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', userId)
        );
        const participantSnapshot = await getDocs(participantQuery);
        console.log('TestMessagesPage: participantIds query found', participantSnapshot.size, 'conversations');
        
        participantSnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          console.log('TestMessagesPage: participantIds conversation:', data);
          conversations.push(data);
        });
      } catch (participantError: any) {
        console.log('TestMessagesPage: participantIds query failed:', participantError.message);
      }

      // Approach 2: participants array query
      if (conversations.length === 0) {
        try {
          console.log('TestMessagesPage: Trying participants array query...');
          const participantsQuery = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', { id: userId })
          );
          const participantsSnapshot = await getDocs(participantsQuery);
          console.log('TestMessagesPage: participants query found', participantsSnapshot.size, 'conversations');
          
          participantsSnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            console.log('TestMessagesPage: participants conversation:', data);
            conversations.push(data);
          });
        } catch (participantsError: any) {
          console.log('TestMessagesPage: participants query failed:', participantsError.message);
        }
      }

      // Approach 3: Get all conversations and filter client-side
      if (conversations.length === 0) {
        try {
          console.log('TestMessagesPage: Trying all conversations query...');
          const allQuery = query(collection(db, 'conversations'));
          const allSnapshot = await getDocs(allQuery);
          console.log('TestMessagesPage: all conversations query found', allSnapshot.size, 'conversations');
          
          allSnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            console.log('TestMessagesPage: all conversation:', data);
            
            // Check if user is participant
            const isParticipant = 
              (data.participantIds && data.participantIds.includes(userId)) ||
              (data.participants && data.participants.some((p: any) => p.id === userId));
            
            if (isParticipant) {
              console.log('TestMessagesPage: User is participant in conversation:', data.id);
              conversations.push(data);
            }
          });
        } catch (allError: any) {
          console.log('TestMessagesPage: all conversations query failed:', allError.message);
        }
      }

      console.log('TestMessagesPage: Final conversations:', conversations);
      setConversations(conversations);

    } catch (err: any) {
      console.error('TestMessagesPage: Error loading conversations:', err);
      setError(`Failed to load conversations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                You must be logged in to test conversations.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Messages Page (getDocs approach)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This page tests loading conversations using getDocs instead of onSnapshot.
            User: <code className="bg-muted px-1 rounded">{currentUser.uid}</code>
          </p>
          
          <Button 
            onClick={loadConversations} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Reload Conversations'}
          </Button>

          {conversations.length > 0 && (
            <Alert>
              <AlertTitle>Found {conversations.length} conversations</AlertTitle>
              <AlertDescription>
                {conversations.map(conv => (
                  <div key={conv.id} className="text-xs p-2 bg-muted rounded mt-2">
                    <div><strong>ID:</strong> {conv.id}</div>
                    <div><strong>Type:</strong> {conv.type || 'unknown'}</div>
                    <div><strong>ParticipantIds:</strong> {JSON.stringify(conv.participantIds || [])}</div>
                    <div><strong>Participants:</strong> {JSON.stringify(conv.participants || [])}</div>
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {conversations.length === 0 && !loading && (
            <Alert>
              <AlertTitle>No conversations found</AlertTitle>
              <AlertDescription>
                No conversations were found for this user. Check the console for detailed logs.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};