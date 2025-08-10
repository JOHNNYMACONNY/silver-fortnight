import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl'
  };

  const [imgError, setImgError] = React.useState(false);

  const handleError = () => {
    setImgError(true);
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center',
        'bg-neutral-200 dark:bg-neutral-700',
        sizeClasses[size],
        className
      )}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleError}
        />
      ) : (
        <span className="font-medium text-neutral-600 dark:text-neutral-300">
          {fallback || (alt && alt.length > 0 ? alt.charAt(0).toUpperCase() : '?')}
        </span>
      )}
    </div>
  );
};
