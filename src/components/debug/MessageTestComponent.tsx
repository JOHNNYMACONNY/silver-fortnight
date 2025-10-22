/**
 * Message Test Component
 * 
 * Simple component to test message loading directly
 * without relying on real-time listeners
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { testMessagesDirectly, testAllConversations } from '../../utils/testMessagesDirectly';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';

export const MessageTestComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSpecificConversation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing specific conversation...');
      const result = await testMessagesDirectly('bcB1UuJ2VHwTXsTFG71g');
      setTestResults(result);
      
      if (result.error) {
        setError(result.error);
      } else {
        console.log('✅ Test completed:', result);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const testAllUserConversations = async () => {
    if (!currentUser) {
      setError('No user logged in');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing all user conversations...');
      const result = await testAllConversations(currentUser.uid);
      setTestResults(result);
      
      if (result.error) {
        setError(result.error);
      } else {
        console.log('✅ All conversations test completed:', result);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('❌ All conversations test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      testSpecificConversation();
    }
  }, [currentUser]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Message Loading Test</h3>
        <Badge variant={testResults?.error ? 'destructive' : 'default'}>
          {testResults?.error ? 'Failed' : 'Ready'}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {testResults && (
        <div className="space-y-2">
          <h4 className="font-medium">Test Results</h4>
          <div className="text-sm space-y-1">
            <div>Conversation Exists: {testResults.conversationExists ? '✅' : '❌'}</div>
            <div>Message Count: {testResults.messageCount}</div>
            <div>Test Time: {testResults.timestamp.toLocaleTimeString()}</div>
            
            {testResults.messages && testResults.messages.length > 0 && (
              <div>
                <strong>Messages:</strong>
                <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
                  {testResults.messages.map((msg: any, index: number) => (
                    <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                      <div><strong>ID:</strong> {msg.id}</div>
                      <div><strong>Text:</strong> {msg.text || msg.content || 'No text'}</div>
                      <div><strong>Sender:</strong> {msg.senderId}</div>
                      <div><strong>Created:</strong> {msg.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={testSpecificConversation} 
          disabled={isLoading}
          variant="outline"
        >
          Test Specific Conversation
        </Button>
        <Button 
          onClick={testAllUserConversations} 
          disabled={isLoading || !currentUser}
          variant="outline"
        >
          Test All Conversations
        </Button>
      </div>

      {isLoading && (
        <div className="text-sm text-gray-500">Running tests...</div>
      )}

      <div className="text-xs text-gray-500">
        <strong>Note:</strong> This component tests direct database queries without real-time listeners.
        If messages appear here but not in the main chat, the issue is with the real-time listeners.
      </div>
    </Card>
  );
};
