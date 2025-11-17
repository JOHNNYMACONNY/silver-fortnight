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
import { logger } from '@utils/logging/logger';

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

      logger.debug('TestMessagesPage: Loading conversations for user:', 'PAGE', userId);

      // Try different query approaches
      const conversations: any[] = [];

      // Approach 1: participantIds query
      try {
        logger.debug('TestMessagesPage: Trying participantIds query...', 'PAGE');
        const participantQuery = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', userId)
        );
        const participantSnapshot = await getDocs(participantQuery);
        logger.debug('TestMessagesPage: participantIds query found', 'PAGE', { arg0: participantSnapshot.size, arg1: 'conversations' });
        
        participantSnapshot.forEach((doc) => {
          const data = { id: doc.id, ...(doc.data() as any) };
          logger.debug('TestMessagesPage: participantIds conversation:', 'PAGE', data);
          conversations.push(data);
        });
      } catch (participantError: any) {
        logger.debug('TestMessagesPage: participantIds query failed:', 'PAGE', participantError.message);
      }

      // Approach 2: participants array query
      if (conversations.length === 0) {
        try {
          logger.debug('TestMessagesPage: Trying participants array query...', 'PAGE');
          const participantsQuery = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', { id: userId })
          );
          const participantsSnapshot = await getDocs(participantsQuery);
          logger.debug('TestMessagesPage: participants query found', 'PAGE', { arg0: participantsSnapshot.size, arg1: 'conversations' });
          
          participantsSnapshot.forEach((doc) => {
            const data = { id: doc.id, ...(doc.data() as any) };
            logger.debug('TestMessagesPage: participants conversation:', 'PAGE', data);
            conversations.push(data);
          });
        } catch (participantsError: any) {
          logger.debug('TestMessagesPage: participants query failed:', 'PAGE', participantsError.message);
        }
      }

      // Approach 3: Get all conversations and filter client-side
      if (conversations.length === 0) {
        try {
          logger.debug('TestMessagesPage: Trying all conversations query...', 'PAGE');
          const allQuery = query(collection(db, 'conversations'));
          const allSnapshot = await getDocs(allQuery);
          logger.debug('TestMessagesPage: all conversations query found', 'PAGE', { arg0: allSnapshot.size, arg1: 'conversations' });
          
          allSnapshot.forEach((doc) => {
            const data = { id: doc.id, ...(doc.data() as any) };
            logger.debug('TestMessagesPage: all conversation:', 'PAGE', data);
            
            // Check if user is participant
            const isParticipant = 
              (data.participantIds && data.participantIds.includes(userId)) ||
              (data.participants && data.participants.some((p: any) => p.id === userId));
            
            if (isParticipant) {
              logger.debug('TestMessagesPage: User is participant in conversation:', 'PAGE', data.id);
              conversations.push(data);
            }
          });
        } catch (allError: any) {
          logger.debug('TestMessagesPage: all conversations query failed:', 'PAGE', allError.message);
        }
      }

      logger.debug('TestMessagesPage: Final conversations:', 'PAGE', conversations);
      setConversations(conversations);

    } catch (err: any) {
      logger.error('TestMessagesPage: Error loading conversations:', 'PAGE', {}, err as Error);
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