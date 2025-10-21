import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getSyncFirebaseDb } from '../firebase-config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

interface TestResult {
  name: string;
  result: 'Success' | 'Failed' | 'Not Found';
  details: string;
}

export const SecurityTestPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    const runTests = async () => {
      const testResults: TestResult[] = [];
      
      try {
        // Test 1: Access conversations collection
        try {
          const conversationsRef = collection(getSyncFirebaseDb(), 'conversations');
          const conversationsSnap = await getDocs(conversationsRef);
          testResults.push({
            name: 'Access conversations collection',
            result: 'Success',
            details: `Found ${conversationsSnap.size} conversations`
          });
        } catch (err: unknown) {
          testResults.push({
            name: 'Access conversations collection',
            result: 'Failed',
            details: err instanceof Error ? err.message : String(err)
          });
        }

        // Test 2: Access specific conversation
        const conversationId = 'bcB1UuJ2VHwTXsTFG71g';
        try {
          const conversationRef = doc(getSyncFirebaseDb(), 'conversations', conversationId);
          const conversationSnap = await getDoc(conversationRef);
          testResults.push({
            name: `Access specific conversation (${conversationId})`,
            result: conversationSnap.exists() ? 'Success' : 'Not Found',
            details: conversationSnap.exists() 
              ? `Conversation exists with data: ${JSON.stringify(conversationSnap.data())}`
              : 'Conversation document does not exist'
          });
        } catch (err: unknown) {
          testResults.push({
            name: `Access specific conversation (${conversationId})`,
            result: 'Failed',
            details: err instanceof Error ? err.message : String(err)
          });
        }

        // Test 3: Access messages subcollection
        try {
          const messagesRef = collection(getSyncFirebaseDb(), 'conversations', conversationId, 'messages');
          const messagesSnap = await getDocs(messagesRef);
          testResults.push({
            name: `Access messages subcollection (${conversationId}/messages)`,
            result: 'Success',
            details: `Found ${messagesSnap.size} messages`
          });
        } catch (err: unknown) {
          testResults.push({
            name: `Access messages subcollection (${conversationId}/messages)`,
            result: 'Failed',
            details: err instanceof Error ? err.message : String(err)
          });
        }

        // Test 4: Access flat messages collection (DEPRECATED)
        try {
          const flatMessagesRef = collection(getSyncFirebaseDb(), 'messages');
          const flatMessagesSnap = await getDocs(flatMessagesRef);
          testResults.push({
            name: 'Access flat messages collection (DEPRECATED)',
            result: 'Success',
            details: `Found ${flatMessagesSnap.size} messages (use nested collections instead)`
          });
        } catch (err: unknown) {
          testResults.push({
            name: 'Access flat messages collection (DEPRECATED)',
            result: 'Failed',
            details: `${err instanceof Error ? err.message : String(err)} (flat collection deprecated)`
          });
        }

        setResults(testResults);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err) || 'An error occurred during testing');
      } finally {
        setLoading(false);
      }
    };

    runTests();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">Security Test</h1>
        <div className="bg-warning-background border-l-4 border-warning p-4 mb-6">
          <p className="text-warning-foreground">Please log in to run security tests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-6">Firebase Security Test</h1>
      <p className="mb-4">Testing access to various collections and documents</p>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-border border-t-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive-background border-l-4 border-destructive p-4 mb-6">
          <p className="text-destructive-foreground">{error}</p>
        </div>
      ) : (
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-card-foreground">Test Results</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ran {results.length} security tests</p>
          </div>
          <div className="border-t border-border">
            <ul className="divide-y divide-border">
              {results.map((test, index) => (
                <li key={index} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground">
                      {test.name}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      test.result === 'Success' 
                        ? 'bg-success-background text-success-foreground' 
                        : test.result === 'Not Found'
                          ? 'bg-warning-background text-warning-foreground'
                          : 'bg-destructive-background text-destructive-foreground'
                    }`}>
                      {test.result}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {test.details}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityTestPage;
