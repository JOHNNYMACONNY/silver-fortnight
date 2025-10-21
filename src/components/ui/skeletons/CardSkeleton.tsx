import React from 'react';
import { cn } from '../../../utils/cn';
import { Skeleton, SkeletonText, SkeletonCircle } from './Skeleton';
import { Card } from '../Card';

interface CardSkeletonProps {
  hasImage?: boolean;
  hasFooter?: boolean;
  className?: string;
  // Enhanced Card customization props for skeletons
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
  glowColor?: 'orange' | 'blue' | 'purple' | 'auto';
  theme?: 'trade' | 'user' | 'collaboration' | 'default'; // Pre-configured themes
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  hasImage = false,
  hasFooter = false,
  className,
  variant,
  enhanced = true,
  glowColor,
  theme = 'default'
}) => {
  // Apply theme-specific defaults if no explicit props provided
  const getThemeDefaults = () => {
    switch (theme) {
      case 'trade':
        return { variant: 'glass' as const, glowColor: 'orange' as const };
      case 'user':
        return { variant: 'elevated' as const, glowColor: 'blue' as const };
      case 'collaboration':
        return { variant: 'premium' as const, glowColor: 'purple' as const };
      default:
        return { variant: 'default' as const, glowColor: 'auto' as const };
    }
  };

  const themeDefaults = getThemeDefaults();
  const finalVariant = variant || themeDefaults.variant;
  const finalGlowColor = glowColor || themeDefaults.glowColor;

  return (
    <Card
      // Enhanced Card props for skeleton styling
      variant={finalVariant}
      tilt={enhanced}
      tiltIntensity={2} // Subtle tilt for skeletons (less than regular cards)
      depth="md"
      glow={enhanced ? "subtle" : "none"}
      glowColor={finalGlowColor}
      hover={false} // Disable hover for skeletons
      interactive={false} // Disable interaction for skeletons
      className={cn("overflow-hidden", className)}
    >
      {hasImage && (
        <div className="w-full h-48">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}
      
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <SkeletonCircle />
          <div className="space-y-2 flex-1">
            <SkeletonText className="h-5 w-3/4" />
            <SkeletonText className="h-4 w-1/2" />
          </div>
        </div>
        
        <div className="space-y-2">
          <SkeletonText />
          <SkeletonText />
          <SkeletonText className="w-3/4" />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
      
      {hasFooter && (
        <div className="px-6 py-4 border-t border-border bg-neutral-50 dark:bg-neutral-800/30">
          <div className="flex justify-between items-center">
            <SkeletonText className="w-1/3" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      )}
    </Card>
  );
};
