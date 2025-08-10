import React from 'react';
import LazyImage from './LazyImage';

/**
 * A specialized component for displaying John Roberts' profile image
 * This is a workaround for the issue with the profile picture not showing
 */
const JohnRobertsProfileImage: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}> = ({ size = 'md', className = '', onClick }) => {
  // Size classes
  const sizeClasses = {
    xs: 'h-8 w-8',
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  // Hardcoded URL for John Roberts' profile picture
  const imageUrl = 'https://res.cloudinary.com/doqqhj2nt/image/upload/c_fill,g_face,h_400,w_400,q_auto:best,f_auto/v1737789591/profile-pictures/TozfQg0dAHe4ToLyiSnkDqe3ECj2_47251d4b-f5a6-42b3-a7de-dcdeb2f66543.jpg';

  return (
    <LazyImage
      src={imageUrl}
      alt="John Roberts"
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      loading="lazy"
      decoding="async"
      fetchPriority="auto"
      sizes={size === 'xl' ? '24rem' : size === 'lg' ? '16rem' : size === 'md' ? '12rem' : size === 'sm' ? '10rem' : '8rem'}
    />
  );
};

export default JohnRobertsProfileImage;
