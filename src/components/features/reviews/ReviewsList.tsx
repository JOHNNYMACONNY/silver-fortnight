import React from 'react';
import { Link } from 'react-router-dom';
import { Review } from '../../../services/firestore-exports';
import { StarRating } from './StarRating';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Skeleton } from '../../ui/skeletons/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { Avatar } from '../../ui/Avatar';
import { getProfileImageUrl } from '../../../utils/imageUtils';
// import { themeClasses } from '../../../utils/themeUtils';

interface ReviewsListProps {
  reviews: Review[];
  loading: boolean;
  emptyMessage?: string;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  loading,
  emptyMessage = 'No reviews yet'
}) => {
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No Reviews Yet"
        description={emptyMessage}
        icon={
          <svg
            className="h-12 w-12 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        }
      />
    );
  }

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="flex items-center">
          <StarRating rating={Math.round(averageRating)} readOnly size="md" />
          <span className="ml-2 text-muted-foreground">
            {averageRating.toFixed(1)} out of 5 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={getProfileImageUrl(review.reviewerPhotoURL ?? null, 32)}
                    alt={review.reviewerName || 'Anonymous'}
                    fallback={(review.reviewerName || 'A').charAt(0).toUpperCase()}
                  />
                  <div className="space-y-1">
                    <Link
                      to={`/profile/${review.reviewerId}`}
                      className="font-semibold hover:underline"
                    >
                      {review.reviewerName}
                    </Link>
                    <StarRating rating={review.rating} readOnly size="sm" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {review.createdAt && formatDate(review.createdAt.toDate())}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
              {review.tradeId && (
                <div className="mt-4 pt-4 border-t">
                  <Link
                    to={`/trades/${review.tradeId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View related trade
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};