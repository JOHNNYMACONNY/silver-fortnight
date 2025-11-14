/**
 * Firebase Debug Panel
 * 
 * A debug component to help diagnose Firebase connection issues
 * and test message loading functionality
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSyncFirebaseDb } from '../../firebase-config';
import { collection, query, orderBy, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getHealthStatus, performQuickHealthCheck } from '../../utils/firebaseHealthCheck';
import { runConnectionTests, getConnectionTestSummary } from '../../utils/testFirebaseConnection';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';

interface DebugInfo {
  healthCheck: any;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  messageCount: number;
  lastError: string | null;
  testResults: {
    basicRead: boolean;
    collectionAccess: boolean;
    realtimeListener: boolean;
  };
}

export const FirebaseDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    healthCheck: null,
    connectionStatus: 'disconnected',
    messageCount: 0,
    lastError: null,
    testResults: {
      basicRead: false,
      collectionAccess: false,
      realtimeListener: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const realtimeListenerRef = useRef<(() => void) | null>(null);
  const cleanupRealtimeListener = useCallback(() => {
    if (realtimeListenerRef.current) {
      realtimeListenerRef.current();
      realtimeListenerRef.current = null;
    }
  }, []);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const healthStatus = await getHealthStatus();
      setDebugInfo(prev => ({
        ...prev,
        healthCheck: healthStatus,
        connectionStatus: healthStatus.isHealthy ? 'connected' : 'error',
        lastError: healthStatus.issues.join(', ') || null
      }));
    } catch (error: any) {
      setDebugInfo(prev => ({
        ...prev,
        connectionStatus: 'error',
        lastError: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testBasicOperations = async () => {
    setIsLoading(true);
    const results = { ...debugInfo.testResults };

    try {
      // Test basic read
      const db = getSyncFirebaseDb();
      const testDoc = doc(db, 'conversations', 'test');
      await getDoc(testDoc);
      results.basicRead = true;
    } catch (error) {
      results.basicRead = false;
      console.error('Basic read test failed:', error);
    }

    try {
      // Test collection access
      const db = getSyncFirebaseDb();
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      results.collectionAccess = true;
      setDebugInfo(prev => ({
        ...prev,
        messageCount: snapshot.size
      }));
    } catch (error) {
      results.collectionAccess = false;
      console.error('Collection access test failed:', error);
    }

    try {
      // Test realtime listener
      const db = getSyncFirebaseDb();
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
      
      cleanupRealtimeListener();
      realtimeListenerRef.current = onSnapshot(q, 
        (snapshot) => {
          results.realtimeListener = true;
          setDebugInfo(prev => ({
            ...prev,
            testResults: results,
            connectionStatus: 'connected'
          }));
          cleanupRealtimeListener();
        },
        (error) => {
          results.realtimeListener = false;
          setDebugInfo(prev => ({
            ...prev,
            testResults: results,
            connectionStatus: 'error',
            lastError: error.message
          }));
          console.error('Realtime listener test failed:', error);
          cleanupRealtimeListener();
        }
      );
    } catch (error) {
      results.realtimeListener = false;
      console.error('Realtime listener setup failed:', error);
    }

    setDebugInfo(prev => ({
      ...prev,
      testResults: results
    }));
    setIsLoading(false);
  };

  const testSpecificConversation = async () => {
    setIsLoading(true);
    try {
      const db = getSyncFirebaseDb();
      const messagesRef = collection(db, 'conversations', 'bcB1UuJ2VHwTXsTFG71g', 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      
      console.log('Specific conversation test:', {
        conversationId: 'bcB1UuJ2VHwTXsTFG71g',
        messageCount: snapshot.size,
        messages: snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      });

      setDebugInfo(prev => ({
        ...prev,
        messageCount: snapshot.size,
        lastError: null
      }));
    } catch (error: any) {
      setDebugInfo(prev => ({
        ...prev,
        lastError: error.message
      }));
      console.error('Specific conversation test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runComprehensiveTests = async () => {
    setIsLoading(true);
    try {
      console.log('Running comprehensive Firebase connection tests...');
      const results = await runConnectionTests();
      const summary = await getConnectionTestSummary();
      
      console.log('Test results:', results);
      console.log('Test summary:', summary);
      
      setDebugInfo(prev => ({
        ...prev,
        lastError: summary.failed > 0 ? `${summary.failed} tests failed` : null,
        messageCount: prev.messageCount
      }));
    } catch (error: any) {
      setDebugInfo(prev => ({
        ...prev,
        lastError: error.message
      }));
      console.error('Comprehensive tests failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  useEffect(() => {
    return () => {
      cleanupRealtimeListener();
    };
  }, [cleanupRealtimeListener]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Firebase Debug Panel</h3>
        <Badge variant={debugInfo.connectionStatus === 'connected' ? 'default' : 'destructive'}>
          {debugInfo.connectionStatus}
        </Badge>
      </div>

      {debugInfo.lastError && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Error:</strong> {debugInfo.lastError}
          </AlertDescription>
        </Alert>
      )}

      {debugInfo.healthCheck && (
        <div className="space-y-2">
          <h4 className="font-medium">Health Check Results</h4>
          <div className="text-sm space-y-1">
            <div>Status: {debugInfo.healthCheck.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}</div>
            {debugInfo.healthCheck.issues.length > 0 && (
              <div>
                <strong>Issues:</strong>
                <ul className="list-disc list-inside ml-4">
                  {debugInfo.healthCheck.issues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {debugInfo.healthCheck.recommendations.length > 0 && (
              <div>
                <strong>Recommendations:</strong>
                <ul className="list-disc list-inside ml-4">
                  {debugInfo.healthCheck.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-medium">Test Results</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>Basic Read: {debugInfo.testResults.basicRead ? '✅' : '❌'}</div>
          <div>Collection Access: {debugInfo.testResults.collectionAccess ? '✅' : '❌'}</div>
          <div>Realtime Listener: {debugInfo.testResults.realtimeListener ? '✅' : '❌'}</div>
        </div>
        <div>Message Count: {debugInfo.messageCount}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={runHealthCheck} 
          disabled={isLoading}
          variant="outline"
        >
          Run Health Check
        </Button>
        <Button 
          onClick={testBasicOperations} 
          disabled={isLoading}
          variant="outline"
        >
          Test Basic Operations
        </Button>
        <Button 
          onClick={testSpecificConversation} 
          disabled={isLoading}
          variant="outline"
        >
          Test Specific Conversation
        </Button>
        <Button 
          onClick={runComprehensiveTests} 
          disabled={isLoading}
          variant="outline"
        >
          Run Comprehensive Tests
        </Button>
      </div>

      {isLoading && (
        <div className="text-sm text-gray-500">Running tests...</div>
      )}
    </Card>
  );
};
