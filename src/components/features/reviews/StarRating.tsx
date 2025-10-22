import React from 'react';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  size = 'md',
  readOnly = false
}) => {
  const maxRating = 5;

  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  // Handle star click
  const handleStarClick = (selectedRating: number) => {
    if (readOnly || !onChange) return;

    // If clicking the same star twice, clear the rating
    if (selectedRating === rating) {
      onChange(0);
    } else {
      onChange(selectedRating);
    }
  };

  // Render stars
  const renderStars = () => {
    const stars = [];

    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleStarClick(i)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} focus:outline-none`}
          disabled={readOnly}
          aria-label={`${i} star${i !== 1 ? 's' : ''}`}
        >
          {i <= rating ? (
            <svg
              className={`${sizeClasses[size]} text-yellow-400`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          ) : (
            <svg
              className={`${sizeClasses[size]} text-text-tertiary`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          )}
        </button>
      );
    }

    return stars;
  };

  return (
    <div className="flex space-x-1">
      {renderStars()}
      {!readOnly && (
        <span className="ml-2 text-sm text-text-muted">
          {rating === 0 ? 'Select a rating' : `${rating} star${rating !== 1 ? 's' : ''}`}
        </span>
      )}
    </div>
  );
};
