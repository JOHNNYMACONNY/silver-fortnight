/**
 * Simple Conversation Test Page
 * 
 * This page provides a simple test to check if conversations can be read
 */

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { getSyncFirebaseDb } from '../firebase-config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';

export const SimpleConversationTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConversationRead = async () => {
    if (!currentUser) {
      setError('You must be logged in to test conversations');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const db = getSyncFirebaseDb();
      const userId = currentUser.uid;

      console.log(`Testing conversation read for user: ${userId}`);

      // Test 1: Try to read all conversations
      console.log('Test 1: Reading all conversations...');
      const allConversationsRef = collection(db, 'conversations');
      const allQuery = query(allConversationsRef);
      
      let allConversations: any[] = [];
      try {
        const allSnapshot = await getDocs(allQuery);
        allConversations = allSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));
        console.log('✅ All conversations read successfully:', allConversations.length);
      } catch (allError: any) {
        console.log('❌ All conversations read failed:', allError.message);
        throw allError;
      }

      // Test 2: Try to read conversations with participantIds filter
      console.log('Test 2: Reading conversations with participantIds filter...');
      const participantQuery = query(
        allConversationsRef,
        where('participantIds', 'array-contains', userId)
      );
      
      let participantConversations: any[] = [];
      try {
        const participantSnapshot = await getDocs(participantQuery);
        participantConversations = participantSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));
        console.log('✅ Participant conversations read successfully:', participantConversations.length);
      } catch (participantError: any) {
        console.log('❌ Participant conversations read failed:', participantError.message);
        throw participantError;
      }

      // Test 3: Check if any conversations contain the user
      const userInConversations = allConversations.filter(conv => 
        conv.participantIds && conv.participantIds.includes(userId)
      );

      setResult(`✅ Conversation read test completed!

Test 1 - All conversations: ${allConversations.length} found
Test 2 - Participant filter: ${participantConversations.length} found
Test 3 - Manual filter: ${userInConversations.length} found

All conversations data:
${allConversations.map(conv => 
  `ID: ${conv.id}, participantIds: ${JSON.stringify(conv.participantIds)}, participants: ${JSON.stringify(conv.participants)}`
).join('\n')}

Participant filter results:
${participantConversations.map(conv => 
  `ID: ${conv.id}, participantIds: ${JSON.stringify(conv.participantIds)}`
).join('\n')}

Manual filter results:
${userInConversations.map(conv => 
  `ID: ${conv.id}, participantIds: ${JSON.stringify(conv.participantIds)}`
).join('\n')}`);

    } catch (err: any) {
      console.error('❌ Error testing conversation read:', err);
      setError(`Failed to test conversation read: ${err.message}`);
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
          <CardTitle>Simple Conversation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This will test reading conversations for user: <code className="bg-muted px-1 rounded">{currentUser.uid}</code>
          </p>
          
          <Button 
            onClick={testConversationRead} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Conversation Read'}
          </Button>

          {result && (
            <Alert>
              <AlertDescription className="whitespace-pre-line text-xs">
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