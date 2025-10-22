import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, getUserProfile } from '../../services/firestore-exports';
import { getProfileImageUrl, generateAvatarUrl } from '../../utils/imageUtils';
import { cn } from '../../utils/cn';

interface ProfileAvatarButtonProps {
  userId: string;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Clickable profile avatar that navigates to user profile page
 * Used in card headers for consistent navigation behavior
 */
export const ProfileAvatarButton: React.FC<ProfileAvatarButtonProps> = ({
  userId,
  size = 32,
  className = '',
  showTooltip = true
}) => {
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
          console.warn(`Failed to fetch user profile for ${userId}:`, userResult.error);
          setUser(null);
        } else {
          setUser(userResult.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
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
           style={{ width: size, height: size }} />
    );
  }

  // Determine the image URL to use
  const imageUrl = user?.profilePicture 
    ? getProfileImageUrl(user.profilePicture, size)
    : user?.photoURL 
    ? getProfileImageUrl(user.photoURL, size)
    : generateAvatarUrl(user?.displayName || 'Unknown User', size);

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-pointer transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full overflow-hidden flex-shrink-0",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`View ${user?.displayName || 'user'}'s profile`}
      title={showTooltip ? `View ${user?.displayName || 'user'}'s profile` : undefined}
    >
      <img
        src={imageUrl}
        alt={user?.displayName || 'User'}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = generateAvatarUrl(user?.displayName || 'Unknown User', size);
        }}
      />
    </button>
  );
};

export default ProfileAvatarButton; 