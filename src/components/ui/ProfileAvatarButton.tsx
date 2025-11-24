import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, getUserProfile } from '../../services/firestore-exports';
import { getProfileImageUrl, generateAvatarUrl } from '../../utils/imageUtils';
import { cn } from '../../utils/cn';
import { logger } from '@utils/logging/logger';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

interface ProfileAvatarButtonProps {
  userId: string;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Clickable profile avatar that navigates to user profile page
 * Used in card headers for consistent navigation behavior
 * 
 * Mobile-optimized: Ensures minimum 44px touch target on mobile devices
 */
export const ProfileAvatarButton: React.FC<ProfileAvatarButtonProps> = ({
  userId,
  size,
  className = '',
  showTooltip = true
}) => {
  const { isMobile, touchTarget } = useMobileOptimization();
  
  // Ensure minimum 44px on mobile, otherwise use provided size or default 32px
  const effectiveSize = size 
    ? (isMobile ? Math.max(size, 44) : size)
    : (isMobile ? 44 : 32);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userResult = await getUserProfile(userId);
        // Proper ServiceResult error handling
        if (userResult.error || !userResult.data) {
          logger.warn('Failed to fetch user profile for ${userId}:', 'COMPONENT', userResult.error);
          setUser(null);
        } else {
          setUser(userResult.data);
        }
      } catch (error) {
        logger.error('Error fetching user profile:', 'COMPONENT', {}, error as Error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/profile/${userId}`);
    }
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse bg-muted rounded-full", className)} 
           style={{ width: effectiveSize, height: effectiveSize }} />
    );
  }

  // Determine the image URL to use
  const imageUrl = user?.profilePicture 
    ? getProfileImageUrl(user.profilePicture, effectiveSize)
    : user?.photoURL 
    ? getProfileImageUrl(user.photoURL, effectiveSize)
    : generateAvatarUrl(user?.displayName || 'Unknown User', effectiveSize);

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-pointer transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full overflow-hidden flex-shrink-0",
        isMobile && "min-w-[44px] min-h-[44px]",
        className
      )}
      style={{ width: effectiveSize, height: effectiveSize }}
      aria-label={`View ${user?.displayName || 'user'}'s profile`}
      title={showTooltip ? `View ${user?.displayName || 'user'}'s profile` : undefined}
    >
      <img
        src={imageUrl}
        alt={user?.displayName || 'User'}
        width={effectiveSize}
        height={effectiveSize}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = generateAvatarUrl(user?.displayName || 'Unknown User', effectiveSize);
        }}
      />
    </button>
  );
};

export default ProfileAvatarButton; 