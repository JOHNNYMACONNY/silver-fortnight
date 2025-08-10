import React, { useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { createReview } from '../../../services/firestore-exports';
import { StarRating } from './StarRating';
import { Card, CardHeader, CardContent, CardFooter } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { Alert, AlertDescription, AlertTitle } from '../../ui/Alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
// import { themeClasses } from '../../../utils/themeUtils';

interface ReviewFormProps {
  tradeId: string;
  tradeName: string;
  receiverId: string;
  receiverName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  tradeId,
  // tradeName,
  receiverId,
  receiverName,
  onSuccess,
  onCancel
}) => {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('You must be logged in to leave a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reviewData = {
        tradeId,
        reviewerId: currentUser.uid,
        reviewerName: currentUser.displayName || currentUser.email || 'Anonymous',
        receiverId,
        receiverName,
        rating,
        comment: comment.trim()
      };

      const { error: reviewError } = await createReview(reviewData);

      if (reviewError) {
        throw new Error(reviewError.message);
      }

      setSuccess(true);
      setComment('');
      setRating(0);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Review Submitted</AlertTitle>
        <AlertDescription>
          Thank you for your feedback! Your review has been submitted successfully.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium">
          Leave a Review for {receiverName}
        </h3>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Rating
            </label>
            <StarRating
              rating={rating}
              onChange={setRating}
              size="lg"
            />
          </div>
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-muted-foreground mb-1">
              Comment
            </label>
            <Textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              placeholder="Share your experience working with this user..."
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
