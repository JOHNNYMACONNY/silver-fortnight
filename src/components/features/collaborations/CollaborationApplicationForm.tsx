import React, { useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { createCollaborationApplication, Collaboration } from '../../../services/firestore-exports';
import { useToast } from '../../../contexts/ToastContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../ui/Alert';
import { Label } from '../../ui/Label';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { AlertCircle } from 'lucide-react';

interface CollaborationApplicationFormProps {
  collaborationId: string;
  collaborationTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CollaborationApplicationForm: React.FC<CollaborationApplicationFormProps> = ({
  collaborationId,
  collaborationTitle,
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

    if (!currentUser || !userProfile) {
      setError('You must be logged in to apply for a collaboration');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const applicationData = {
        collaborationId,
        roleId: 'general',
        message,
        applicantId: currentUser.uid,
        applicantName: userProfile.displayName || 'Anonymous',
        applicantPhotoURL: userProfile.photoURL,
        skills: userProfile.skills || [],
        status: 'pending' as const
      };

      const result = await createCollaborationApplication(applicationData);

      if (result.error || !result.data) {
        throw new Error(result.error?.message || 'Failed to submit application');
      }

      addToast('success', 'Application submitted successfully');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      addToast('error', err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Apply to "{collaborationTitle}"</CardTitle>
          <CardDescription>
            Introduce yourself and explain why you're a good fit for this collaboration.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message to Collaboration Owner *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              placeholder="Introduce yourself, describe your relevant experience, and explain why you're interested in this collaboration..."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default CollaborationApplicationForm;
