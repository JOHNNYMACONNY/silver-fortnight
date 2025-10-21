import React, { useState, useEffect } from 'react';
import { getUserReviews, Review } from '../../../services/firestore-exports';
import { ReviewsList } from './ReviewsList';
import { Alert, AlertDescription, AlertTitle } from '../../ui/Alert';
import { AlertTriangle } from 'lucide-react';
// import { themeClasses } from '../../../utils/themeUtils';

interface ReviewsTabProps {
  userId: string;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ userId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const reviewResult = await getUserReviews(userId);
        if (reviewResult.error) {
          console.error('Error fetching user reviews:', reviewResult.error);
          throw new Error(reviewResult.error.message);
        }
        
        const { data } = reviewResult;

        if (data) {
          // Sort reviews by date (newest first)
          const sortedReviews = data.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          setReviews(sortedReviews);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ReviewsList
        reviews={reviews}
        loading={loading}
        emptyMessage="This user has no reviews yet."
      />
    </div>
  );
};
