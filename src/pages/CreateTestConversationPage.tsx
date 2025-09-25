/**
 * Create Test Conversation Page
 * 
 * This page allows creating a test conversation directly in the browser
 * to verify that the messaging system works correctly.
 */

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { getSyncFirebaseDb } from '../firebase-config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';

export const CreateTestConversationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createTestConversation = async () => {
    if (!currentUser) {
      setError('You must be logged in to create a test conversation');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const db = getSyncFirebaseDb();
      const userId = currentUser.uid;

      console.log(`Creating test conversation for user: ${userId}`);

      // Create a test conversation
      const testConversation = {
        participants: [
          { 
            id: userId, 
            name: currentUser.displayName || 'Current User', 
            avatar: currentUser.photoURL || null 
          },
          { 
            id: 'test-user-2', 
            name: 'Test User 2', 
            avatar: null 
          }
        ],
        participantIds: [userId, 'test-user-2'],
        type: 'direct',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        schemaVersion: '2.0.0',
        lastMessage: {
          content: 'Welcome to your first conversation!',
          senderId: 'test-user-2',
          createdAt: Timestamp.now(),
          type: 'text'
        }
      };

      // Add the conversation to Firestore
      const conversationsRef = collection(db, 'conversations');
      const docRef = await addDoc(conversationsRef, testConversation);
      
      console.log(`✅ Test conversation created successfully with ID: ${docRef.id}`);

      // Create a test message
      const testMessage = {
        conversationId: docRef.id,
        senderId: 'test-user-2',
        senderName: 'Test User 2',
        senderAvatar: null,
        content: 'This is a test message to verify the messaging system is working!',
        type: 'text',
        createdAt: Timestamp.now(),
        readBy: [],
        schemaVersion: '2.0.0'
      };

      const messagesRef = collection(db, 'conversations', docRef.id, 'messages');
      const messageRef = await addDoc(messagesRef, testMessage);
      
      console.log(`✅ Test message created successfully with ID: ${messageRef.id}`);
      
      setResult(`✅ Test conversation created successfully!
Conversation ID: ${docRef.id}
Message ID: ${messageRef.id}

You can now go to the messages page to see your conversation.`);

    } catch (err: any) {
      console.error('❌ Error creating test conversation:', err);
      setError(`Failed to create test conversation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                You must be logged in to create a test conversation.
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
          <CardTitle>Create Test Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This will create a test conversation for user: <code className="bg-muted px-1 rounded">{currentUser.uid}</code>
          </p>
          
          <Button 
            onClick={createTestConversation} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Test Conversation'}
          </Button>

          {result && (
            <Alert>
              <AlertDescription className="whitespace-pre-line">
                {result}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
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