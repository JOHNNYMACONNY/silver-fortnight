import React, { useState } from 'react';
import { fetchSpecificMessage, fetchSpecificConversation, fetchAllMessagesInConversation } from '../../../utils/fetchMessage';
import Box from '../../layout/primitives/Box';
import Stack from '../../layout/primitives/Stack';
import Cluster from '../../layout/primitives/Cluster';

const MessageFinder: React.FC = () => {
  const [message, setMessage] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [allMessages, setAllMessages] = useState<{nestedMessages: any[], flatMessages: any[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState('bcB1UuJ2VHwTXsTFG71g');
  const [messageId, setMessageId] = useState('9U88pB16BSVhy2taDEjH');

  const handleFetchMessage = async () => {
    setAllMessages(null);
    setLoading(true);
    setError(null);

    try {
      // Fetch the conversation first
      const conversationResult = await fetchSpecificConversation(conversationId);

      if (conversationResult.found) {
        setConversation(conversationResult.conversation);
      }

      // Then fetch the message
      const result = await fetchSpecificMessage(conversationId, messageId);

      if (result.found) {
        setMessage(result.message);
      } else {
        setError('Message not found in the database');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="bg-card shadow rounded-lg p-6 max-w-3xl mx-auto">
      <Stack gap="lg">
        <h2 className="text-2xl font-bold text-foreground">Message Finder</h2>

        <Stack gap="md">
          <Stack gap="xs">
            <label className="block text-sm font-medium text-muted-foreground">
              Conversation ID
            </label>
            <input
              type="text"
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </Stack>

          <Stack gap="xs">
            <label className="block text-sm font-medium text-muted-foreground">
              Message ID
            </label>
            <input
              type="text"
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </Stack>

          <p className="text-muted-foreground">
            Looking for message with path: <code className="bg-muted px-2 py-1 rounded">/conversations/{conversationId}/messages/{messageId}</code>
          </p>

          <Cluster gap="md">
            <button
              onClick={handleFetchMessage}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Find Message'}
            </button>

            <button
              onClick={async () => {
                setMessage(null);
                setLoading(true);
                setError(null);

                try {
                  const result = await fetchAllMessagesInConversation(conversationId);
                  if (result.found) {
                    setAllMessages({
                      nestedMessages: (result as any).nestedMessages || [],
                      flatMessages: (result as any).flatMessages || []
                    });
                  } else {
                    setError('No messages found in this conversation');
                  }
                } catch (err: any) {
                  setError(err.message || 'Failed to fetch all messages');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Find All Messages'}
            </button>
          </Cluster>
        </Stack>

        {error && (
          <Box className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {error}
          </Box>
        )}

        {conversation && (
          <Stack gap="sm">
            <h3 className="text-xl font-semibold text-foreground">Conversation Details</h3>
            <Box className="bg-muted/50 p-4 rounded overflow-auto max-h-60">
              <pre className="text-sm text-foreground">{JSON.stringify(conversation, null, 2)}</pre>
            </Box>
          </Stack>
        )}

        {allMessages && (
          <Stack gap="md">
            <h3 className="text-xl font-semibold text-foreground">All Messages in Conversation</h3>

            <Stack gap="sm">
              <h4 className="text-lg font-medium text-foreground">Nested Messages ({allMessages.nestedMessages.length})</h4>
              {allMessages.nestedMessages.length > 0 ? (
                <Box className="bg-muted/50 p-4 rounded overflow-auto max-h-60">
                  <pre className="text-sm text-foreground">{JSON.stringify(allMessages.nestedMessages, null, 2)}</pre>
                </Box>
              ) : (
                <p className="text-muted-foreground">No messages found in nested collection</p>
              )}
            </Stack>

            <Stack gap="sm">
              <h4 className="text-lg font-medium text-foreground">Flat Messages ({allMessages.flatMessages.length})</h4>
              {allMessages.flatMessages.length > 0 ? (
                <Box className="bg-muted/50 p-4 rounded overflow-auto max-h-60">
                  <pre className="text-sm text-foreground">{JSON.stringify(allMessages.flatMessages, null, 2)}</pre>
                </Box>
              ) : (
                <p className="text-muted-foreground">No messages found in flat collection</p>
              )}
            </Stack>
          </Stack>
        )}

        {message && (
          <Stack gap="sm">
            <h3 className="text-xl font-semibold text-foreground">Message Details</h3>
            <Box className="bg-muted/50 p-4 rounded overflow-auto max-h-60">
              <pre className="text-sm text-foreground">{JSON.stringify(message, null, 2)}</pre>
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default MessageFinder;
