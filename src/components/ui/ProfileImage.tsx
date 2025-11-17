import React, { useState, useMemo, useCallback } from 'react';
import { getProfileImageUrl, generateAvatarUrl } from '../../utils/imageUtils';
import ErrorBoundary from './ErrorBoundary';
import { useToast } from '../../contexts/ToastContext';
import LazyImage from './LazyImage';
import { logger } from '@utils/logging/logger';

export interface ProfileImageProps {
  photoURL?: string | null;
  profilePicture?: string | null;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

// Size classes - moved outside component to prevent recreation on each render
const sizeClasses = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

/**
 * Image component with error handling
 */
const ImageWithFallback = React.memo(({
  src,
  alt,
  className,
  onClick,
  onError
}: {
  src: string;
  alt: string;
  className: string;
  onClick?: () => void;
  onError: () => void;
}) => {
  return (
    <LazyImage
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={onError}
      loading="lazy"
      decoding="async"
      fetchPriority="auto"
    />
  );
});

/**
 * ProfileImage component
 *
 * A standardized component for displaying user profile images with proper fallbacks
 * and error handling
 *
 * Performance optimized with:
 * - React.memo to prevent unnecessary re-renders
 * - useMemo for computed values
 * - useCallback for functions
 * - Conditional console logs (only in development)
 */
export const ProfileImage = React.memo<ProfileImageProps>(({
  photoURL,
  profilePicture,
  displayName = 'User',
  size = 'md',
  className = '',
  onClick
}) => {
  const { addToast } = useToast();
  const [useDefaultAvatar, setUseDefaultAvatar] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  // Common classes - memoized to prevent string concatenation on every render
  const imageClasses = useMemo(() => {
    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const baseClasses = 'rounded-full object-cover aspect-square flex-shrink-0';
    return `${sizeClass} ${baseClasses} ${className}`.trim();
  }, [size, className]);

  // Special handling for direct URLs - memoized to prevent recalculation
  const primaryImageUrl = useMemo(() => {
    // Handle external URLs (Google, ui-avatars, etc.) - return as-is
    if (photoURL && (photoURL.includes('googleusercontent.com') ||
                     photoURL.includes('ui-avatars.com') ||
                     photoURL.includes('gravatar.com'))) {
      return photoURL;
    }

    if (profilePicture && (profilePicture.includes('googleusercontent.com') ||
                          profilePicture.includes('ui-avatars.com') ||
                          profilePicture.includes('gravatar.com'))) {
      return profilePicture;
    }

    // Handle Cloudinary URLs with transformations
    if (photoURL?.includes('cloudinary.com') && photoURL?.includes('/c_fill')) {
      return photoURL;
    } else if (profilePicture?.includes('cloudinary.com') && profilePicture?.includes('/c_fill')) {
      return profilePicture;
    } else {
      // Standard processing for Cloudinary URLs or public IDs
      return profilePicture
        ? getProfileImageUrl(profilePicture, 200)
        : getProfileImageUrl((photoURL as any) || generateAvatarUrl(displayName), 200);
    }
  }, [photoURL, profilePicture, displayName]);

  // Handle image load error - memoized to maintain referential equality
  const handleImageError = useCallback(() => {
    // Check if we're already using a generated avatar URL
    const isGeneratedAvatar = primaryImageUrl?.includes('ui-avatars.com');

    // Only log as error and show toast if it's not a generated avatar
    if (!isGeneratedAvatar) {
      // logger.warn('Failed to load profile image, falling back to avatar', 'COMPONENT');
      // addToast('info', 'Using default avatar');
    }

    setUseDefaultAvatar(true);
  }, [primaryImageUrl, addToast]);

  // Generate fallback avatar URL - memoized to prevent recalculation
  const fallbackAvatarUrl = useMemo(() =>
    generateAvatarUrl(displayName),
    [displayName]
  );

  // Fallback UI for error boundary - memoized to prevent recreation
  const fallbackUI = useMemo(() => (
    <LazyImage
      src={fallbackAvatarUrl}
      alt={displayName}
      className={imageClasses}
      onClick={onClick}
      loading="lazy"
      decoding="async"
    />
  ), [fallbackAvatarUrl, displayName, imageClasses, onClick]);

  return (
    <ErrorBoundary fallback={fallbackUI}>
      <ImageWithFallback
        src={useDefaultAvatar ? fallbackAvatarUrl : primaryImageUrl}
        alt={displayName}
        className={imageClasses}
        onClick={onClick}
        onError={handleImageError}
      />
    </ErrorBoundary>
  );
});

// Export both named and default export for backward compatibility
export { ProfileImage as default };
