import React, { useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { createConnectionRequest } from '../../../services/firestore-exports';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription, AlertTitle } from '../../ui/Alert';

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

    console.log('🔍 ConnectionRequestForm: Form submitted');
    console.log('🔍 ConnectionRequestForm: Current user:', currentUser?.uid);
    console.log('🔍 ConnectionRequestForm: User profile:', !!userProfile);
    console.log('🔍 ConnectionRequestForm: Receiver ID:', receiverId);
    console.log('🔍 ConnectionRequestForm: Message:', message);

    if (!currentUser || !userProfile) {
      console.error('❌ ConnectionRequestForm: User not logged in or profile missing');
      setError('You must be logged in to send a connection request');
      return;
    }

    if (currentUser.uid === receiverId) {
      console.error('❌ ConnectionRequestForm: Trying to connect with self');
      setError('You cannot connect with yourself');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 ConnectionRequestForm: Calling createConnectionRequest...');
      const result = await createConnectionRequest(currentUser.uid, receiverId, message);

      console.log('📄 ConnectionRequestForm: Result received:', result);

      if (result.error || !result.data) {
        console.error('❌ ConnectionRequestForm: Error in result:', result.error);
        throw new Error(result.error?.message || 'Failed to send connection request');
      }

      console.log('✅ ConnectionRequestForm: Success! Connection ID:', result.data);
      addToast('success', 'Connection request sent successfully');
      onSuccess();
    } catch (err: unknown) {
      console.error('❌ ConnectionRequestForm: Exception caught:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
      console.log('🔍 ConnectionRequestForm: Form submission completed');
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
