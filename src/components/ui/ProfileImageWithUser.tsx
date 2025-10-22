import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User } from '../../services/firestore-exports';
import ProfileImage from './ProfileImage';
import LazyImage from './LazyImage';
import { fetchUserData } from '../../utils/userUtils';

interface ProfileImageWithUserProps {
  userId: string;
  profileUrl?: string | null;
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl';
  className?: string;
  onClick?: () => void;
}

// Size mapping - moved outside component to prevent recreation on each render
const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  'xs': 'xs',
  'small': 'sm',
  'medium': 'md',
  'large': 'lg',
  'xl': 'xl'
};

// Special case URL for John Roberts - moved outside component
const JOHN_ROBERTS_IMAGE_URL = 'https://res.cloudinary.com/doqqhj2nt/image/upload/c_fill,g_face,h_400,w_400,q_auto:best,f_auto/v1737789591/profile-pictures/TozfQg0dAHe4ToLyiSnkDqe3ECj2_47251d4b-f5a6-42b3-a7de-dcdeb2f66543.jpg';
const JOHN_ROBERTS_ID = 'TozfQg0dAHe4ToLyiSnkDqe3ECj2';

// Global render counter to limit debug logs
const renderCounts: Record<string, number> = {};

/**
 * ProfileImageWithUser component
 *
 * A component that fetches user data based on userId and displays the profile image
 * Performance optimized with:
 * - React.memo to prevent unnecessary re-renders
 * - useMemo for computed values
 * - useCallback for functions
 * - Reduced console logs with render count tracking
 * - User data caching via userUtils with expiration
 * - Stable dependency arrays
 */
const ProfileImageWithUser: React.FC<ProfileImageWithUserProps> = React.memo(({
  userId,
  profileUrl,
  size = 'medium',
  className = '',
  onClick
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  // Safe dev check for Storybook/Chromatic
  const isDev = (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && (import.meta.env.DEV || process.env.NODE_ENV === 'development')) || process.env.NODE_ENV === 'development';
  const isJohnRoberts = userId === JOHN_ROBERTS_ID;

  // Use refs to track if we've already logged for this component instance
  const hasLoggedUserData = useRef(false);

  // Track render count for this userId to limit logging
  if (isDev && userId) {
    renderCounts[userId] = (renderCounts[userId] || 0) + 1;
  }

  // Memoize the best profile picture calculation to prevent recalculation on every render
  const bestProfilePicture = useMemo(() => {
    // Determine the best profile picture to use
    // If the URL already has transformations, use it directly
    if (user?.profilePicture?.includes('/c_fill') ||
        user?.photoURL?.includes('/c_fill') ||
        profileUrl?.includes('/c_fill')) {
      // Prioritize transformed URLs
      return user?.profilePicture?.includes('/c_fill') ? user.profilePicture :
             user?.photoURL?.includes('/c_fill') ? user.photoURL :
             profileUrl;
    } else {
      // Otherwise use the standard priority
      return user?.profilePicture || user?.photoURL || profileUrl;
    }
  }, [user?.profilePicture, user?.photoURL, profileUrl]);

  // Use fetchUserData from userUtils which has built-in caching
  const fetchUser = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Use the cached version from userUtils instead of direct Firestore call
      const userData = await fetchUserData(userId);

      if (userData) {
        setUser(userData);

        // Only log in development mode and only once per component instance
        if (isDev && !hasLoggedUserData.current && renderCounts[userId] === 1) {
          hasLoggedUserData.current = true;
          console.log(`ProfileImageWithUser - User data loaded for ${userId}`);
        }
      }
    } catch (err) {
      console.error('Error fetching user for profile image:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Remove profileUrl and isDev from dependencies to prevent re-fetching

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Special case for John Roberts
  if (isJohnRoberts) {
    return (
      <LazyImage
        src={JOHN_ROBERTS_IMAGE_URL}
        alt={user?.displayName || 'John Roberts'}
        className={`rounded-full object-cover aspect-square flex-shrink-0 ${sizeMap[size]} ${className}`}
        onClick={onClick}
        loading="lazy"
        decoding="async"
        fetchPriority="auto"
        sizes={size === 'xl' ? '24rem' : size === 'large' ? '16rem' : size === 'medium' ? '12rem' : size === 'small' ? '10rem' : '8rem'}
      />
    );
  }

  if (loading) {
    return (
      <div className={`rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}></div>
    );
  }

  // For other users, use the ProfileImage component with both photoURL and profilePicture
  return (
    <ProfileImage
      photoURL={bestProfilePicture}
      profilePicture={user?.profilePicture}
      displayName={user?.displayName || 'User'}
      size={sizeMap[size]}
      className={className}
      onClick={onClick}
    />
  );
});

export default ProfileImageWithUser;
