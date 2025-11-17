/**
 * Test Firestore Access Page
 * 
 * This page tests basic Firestore access to verify if security rules are the issue
 */

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { getSyncFirebaseDb } from '../firebase-config';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { logger } from '@utils/logging/logger';

export const TestFirestoreAccess: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testFirestoreAccess = async () => {
    if (!currentUser) {
      setError('You must be logged in to test Firestore access');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const db = getSyncFirebaseDb();
      const userId = currentUser.uid;

      logger.debug('TestFirestoreAccess: Testing Firestore access for user:', 'PAGE', userId);

      const results: string[] = [];

      // Test 1: Try to read from a simple collection
      try {
        logger.debug('Test 1: Testing basic read access...', 'PAGE');
        const testRef = collection(db, 'test');
        const testQuery = query(testRef, limit(1));
        const testSnapshot = await getDocs(testQuery);
        results.push(`✅ Test 1 PASSED: Basic read access works (found ${testSnapshot.size} documents)`);
        logger.debug('Test 1: Basic read access works', 'PAGE');
      } catch (testError: any) {
        results.push(`❌ Test 1 FAILED: Basic read access failed - ${testError.message}`);
        logger.debug('Test 1: Basic read access failed:', 'PAGE', testError.message);
      }

      // Test 2: Try to read from conversations collection
      try {
        logger.debug('Test 2: Testing conversations read access...', 'PAGE');
        const conversationsRef = collection(db, 'conversations');
        const conversationsQuery = query(conversationsRef, limit(1));
        const conversationsSnapshot = await getDocs(conversationsQuery);
        results.push(`✅ Test 2 PASSED: Conversations read access works (found ${conversationsSnapshot.size} documents)`);
        logger.debug('Test 2: Conversations read access works', 'PAGE');
      } catch (conversationsError: any) {
        results.push(`❌ Test 2 FAILED: Conversations read access failed - ${conversationsError.message}`);
        logger.debug('Test 2: Conversations read access failed:', 'PAGE', conversationsError.message);
      }

      // Test 3: Try to write to a test collection
      try {
        logger.debug('Test 3: Testing write access...', 'PAGE');
        const testWriteRef = collection(db, 'test');
        const testDoc = {
          userId: userId,
          timestamp: new Date().toISOString(),
          test: true
        };
        const docRef = await addDoc(testWriteRef, testDoc);
        results.push(`✅ Test 3 PASSED: Write access works (created document ${docRef.id})`);
        logger.debug('Test 3: Write access works, created document:', 'PAGE', docRef.id);
      } catch (writeError: any) {
        results.push(`❌ Test 3 FAILED: Write access failed - ${writeError.message}`);
        logger.debug('Test 3: Write access failed:', 'PAGE', writeError.message);
      }

      // Test 4: Try to write to conversations collection
      try {
        logger.debug('Test 4: Testing conversations write access...', 'PAGE');
        const conversationsWriteRef = collection(db, 'conversations');
        const testConversation = {
          participants: [{ id: userId, name: 'Test User' }],
          participantIds: [userId],
          type: 'test',
          createdAt: new Date(),
          test: true
        };
        const convDocRef = await addDoc(conversationsWriteRef, testConversation);
        results.push(`✅ Test 4 PASSED: Conversations write access works (created conversation ${convDocRef.id})`);
        logger.debug('Test 4: Conversations write access works, created conversation:', 'PAGE', convDocRef.id);
      } catch (conversationsWriteError: any) {
        results.push(`❌ Test 4 FAILED: Conversations write access failed - ${conversationsWriteError.message}`);
        logger.debug('Test 4: Conversations write access failed:', 'PAGE', conversationsWriteError.message);
      }

      setResult(`Firestore Access Test Results:

${results.join('\n')}

${results.some(r => r.includes('❌')) ? 
  '❌ Some tests failed - Security rules are blocking access' : 
  '✅ All tests passed - Firestore access is working'}

Next Steps:
${results.some(r => r.includes('❌')) ? 
  '1. Deploy Firestore security rules\n2. Check Firebase Console for missing indexes\n3. Verify authentication status' :
  '1. The issue is not with Firestore access\n2. Check query structure and data format\n3. Check real-time listener configuration'}`);

    } catch (err: any) {
      logger.error('TestFirestoreAccess: Error testing Firestore access:', 'PAGE', {}, err as Error);
      setError(`Failed to test Firestore access: ${err.message}`);
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
                You must be logged in to test Firestore access.
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
          <CardTitle>Test Firestore Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This page tests basic Firestore read/write access to identify if security rules are the issue.
            User: <code className="bg-muted px-1 rounded">{currentUser.uid}</code>
          </p>
          
          <Button 
            onClick={testFirestoreAccess} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Firestore Access'}
          </Button>

          {result && (
            <Alert>
              <AlertTitle>Test Results</AlertTitle>
              <AlertDescription className="whitespace-pre-line text-xs">
                {result}
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