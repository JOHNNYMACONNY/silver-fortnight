import React, { useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { createConnectionRequest } from '../../../services/firestore-exports';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription, AlertTitle } from '../../ui/Alert';
import { logger } from '@utils/logging/logger';

interface ConnectionRequestFormProps {
  receiverId: string;
  receiverName: string;
  receiverPhotoURL?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ConnectionRequestForm: React.FC<ConnectionRequestFormProps> = ({
  receiverId,
  receiverName,
  onSuccess,
  onCancel
}) => {
  const { currentUser, userProfile } = useAuth();
  const { addToast } = useToast();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    logger.debug('🔍 ConnectionRequestForm: Form submitted', 'COMPONENT');
    logger.debug('🔍 ConnectionRequestForm: Current user:', 'COMPONENT', currentUser?.uid);
    logger.debug('🔍 ConnectionRequestForm: User profile:', 'COMPONENT', !!userProfile);
    logger.debug('🔍 ConnectionRequestForm: Receiver ID:', 'COMPONENT', receiverId);
    logger.debug('🔍 ConnectionRequestForm: Message:', 'COMPONENT', message);

    if (!currentUser || !userProfile) {
      logger.error('❌ ConnectionRequestForm: User not logged in or profile missing', 'COMPONENT');
      setError('You must be logged in to send a connection request');
      return;
    }

    if (currentUser.uid === receiverId) {
      logger.error('❌ ConnectionRequestForm: Trying to connect with self', 'COMPONENT');
      setError('You cannot connect with yourself');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('🚀 ConnectionRequestForm: Calling createConnectionRequest...', 'COMPONENT');
      const result = await createConnectionRequest(currentUser.uid, receiverId, message);

      logger.debug('📄 ConnectionRequestForm: Result received:', 'COMPONENT', result);

      if (result.error || !result.data) {
        logger.error('❌ ConnectionRequestForm: Error in result:', 'COMPONENT', {}, result.error as Error);
        throw new Error(result.error?.message || 'Failed to send connection request');
      }

      logger.debug('✅ ConnectionRequestForm: Success! Connection ID:', 'COMPONENT', result.data);
      addToast('success', 'Connection request sent successfully');
      onSuccess();
    } catch (err: unknown) {
      logger.error('❌ ConnectionRequestForm: Exception caught:', 'COMPONENT', {}, err as Error);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
      logger.debug('🔍 ConnectionRequestForm: Form submission completed', 'COMPONENT');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-4 rounded-lg mb-4">
        <h3 className="text-lg font-medium text-foreground mb-2">Connect with {receiverName}</h3>
        <p className="text-sm text-muted-foreground">
          Send a connection request to start collaborating with this user.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Introduce yourself and explain why you'd like to connect..."
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
          isLoading={loading}
        >
          Send Request
        </Button>
      </div>
    </form>
  );
};

export default ConnectionRequestForm;
