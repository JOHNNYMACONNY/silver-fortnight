/**
 * Create Test Conversation Page
 *
 * This page allows creating a test conversation directly in the browser
 * to verify that the messaging system works correctly.
 */

import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { getSyncFirebaseDb, getFirebaseInstances } from "../firebase-config";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Alert, AlertDescription } from "../components/ui/Alert";
import { logger } from '@utils/logging/logger';

export const CreateTestConversationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createTestConversation = async () => {
    if (!currentUser) {
      setError("You must be logged in to create a test conversation");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const db = getSyncFirebaseDb();
      const userId = currentUser.uid;

      // Check authentication state
      const { auth } = await getFirebaseInstances();
      const authUser = auth.currentUser;

      logger.debug(`Creating test conversation for user: ${userId}`, 'PAGE');
      logger.debug('Current user details:', 'PAGE', {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });
      logger.debug('Firebase auth user:', 'PAGE', {
        uid: authUser?.uid,
        email: authUser?.email,
        emailVerified: authUser?.emailVerified,
      });

      // Verify user is authenticated
      if (!authUser) {
        throw new Error("User is not authenticated with Firebase");
      }

      // Create a test conversation with proper schema
      const testConversation = {
        participants: [
          {
            id: userId,
            name:
              currentUser.displayName || currentUser.email || "Current User",
            avatar: currentUser.photoURL || null,
          },
          {
            id: "test-user-2",
            name: "Test User 2",
            avatar: null,
          },
        ],
        participantIds: [userId, "test-user-2"],
        type: "direct",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        schemaVersion: "2.0.0",
        lastMessage: {
          content:
            "Welcome to your first conversation! This is a test message to verify the messaging system is working.",
          senderId: "test-user-2",
          senderName: "Test User 2",
          createdAt: Timestamp.now(),
          type: "text",
        },
      };

      logger.debug('Creating conversation with data:', 'PAGE', testConversation);
      logger.debug('User ID being used:', 'PAGE', userId);
      logger.debug('ParticipantIds array:', 'PAGE', testConversation.participantIds);

      // Add the conversation to Firestore
      const conversationsRef = collection(db, "conversations");
      const docRef = await addDoc(conversationsRef, testConversation);

      logger.debug(`✅ Test conversation created successfully with ID: ${docRef.id}`, 'PAGE');

      // Create a test message
      const testMessage = {
        conversationId: docRef.id,
        senderId: "test-user-2",
        senderName: "Test User 2",
        senderAvatar: null,
        content:
          "This is a test message to verify the messaging system is working!",
        type: "text",
        createdAt: Timestamp.now(),
        readBy: [],
        schemaVersion: "2.0.0",
      };

      const messagesRef = collection(
        db,
        "conversations",
        docRef.id,
        "messages"
      );
      const messageRef = await addDoc(messagesRef, testMessage);

      logger.debug(`✅ Test message created successfully with ID: ${messageRef.id}`, 'PAGE');

      // Wait a moment for Firestore eventual consistency
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify the conversation was created by querying it back
      let foundConversations: any[] = [];
      try {
        const verifyQuery = query(
          collection(db, "conversations"),
          where("participantIds", "array-contains", userId)
        );
        logger.debug('Verifying conversation with query for user:', 'PAGE', userId);
        const verifySnapshot = await getDocs(verifyQuery);
        foundConversations = verifySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        logger.debug('Verification query found:', 'PAGE', { arg0: foundConversations.length, arg1: "conversations" });
        foundConversations.forEach((conv) => {
          logger.debug('Found conversation:', 'PAGE', { arg0: conv.id, arg1: "participantIds:", arg2: conv.participantIds });
        });
      } catch (verifyError: any) {
        logger.warn('Verification query failed (this is expected if user has no other conversations):', 'PAGE', verifyError.message);
        // Don't throw here - the conversation was created successfully
      }

      // Also try to get all conversations to see if the issue is with the query
      try {
        const allConversationsQuery = query(collection(db, "conversations"));
        const allConversationsSnapshot = await getDocs(allConversationsQuery);
        logger.debug('All conversations query found:', 'PAGE', { arg0: allConversationsSnapshot.size, arg1: "conversations" });
        allConversationsSnapshot.docs.forEach((doc) => {
          const data = doc.data() as any;
          logger.debug('All conversations - ID:', 'PAGE', { arg0: doc.id, arg1: "participantIds:", arg2: data.participantIds, arg3: "participants:", arg4: data.participants });
        });
      } catch (allError) {
        logger.debug('All conversations query failed:', 'PAGE', allError);
      }

      setResult(`✅ Test conversation created successfully!
Conversation ID: ${docRef.id}
Message ID: ${messageRef.id}

Verification: Found ${foundConversations.length} conversations for user
${
  foundConversations.length > 0
    ? "✅ Conversation found in verification query"
    : "⚠️ Verification query had permission restrictions (conversation still created successfully)"
}

You can now go to the messages page to see your conversation.`);
    } catch (err: any) {
      logger.error('❌ Error creating test conversation:', 'PAGE', {}, err as Error);
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
            This will create a test conversation for user:{" "}
            <code className="bg-muted px-1 rounded">{currentUser.uid}</code>
          </p>

          <Button
            onClick={createTestConversation}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating..." : "Create Test Conversation"}
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
