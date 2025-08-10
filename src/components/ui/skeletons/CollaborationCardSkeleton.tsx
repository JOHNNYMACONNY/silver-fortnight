import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';
import { Skeleton, SkeletonText, SkeletonCircle } from './Skeleton';

interface CollaborationCardSkeletonProps {
  compact?: boolean;
  className?: string;
  // Enhanced Card customization props for collaboration skeletons
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
}

export const CollaborationCardSkeleton: React.FC<CollaborationCardSkeletonProps> = ({
  compact = false,
  className,
  variant = 'premium', // Default to premium for collaboration importance
  enhanced = true // Enable enhanced effects by default
}) => {
  return (
    <Card
      // Enhanced Card props for collaboration skeleton styling
      variant={variant}
      tilt={enhanced}
      tiltIntensity={2} // Subtle tilt for skeletons (less than regular cards)
      depth="lg"
      glow={enhanced ? "subtle" : "none"}
      glowColor="purple" // Purple for collaboration/creativity theme
      hover={false} // Disable hover for skeletons
      interactive={false} // Disable interaction for skeletons
      className={className}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          {/* Title */}
          <SkeletonText className="h-6 w-3/4" />
          {/* Status Badge */}
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Owner Info */}
        <div className="mt-2 flex items-center">
          <SkeletonCircle className="h-6 w-6 mr-2" />
          <SkeletonText className="h-4 w-32" />
        </div>
      </CardHeader>

      {/* Description (only if not compact) */}
      {!compact && (
        <CardContent>
          <div className="space-y-2">
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-3/4" />
          </div>
        </CardContent>
      )}

      {/* Metadata Grid */}
      <CardContent className="grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <Skeleton className="h-3.5 w-3.5 rounded mr-1" />
          <SkeletonText className="h-3 w-20" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-3.5 w-3.5 rounded mr-1" />
          <SkeletonText className="h-3 w-16" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-3.5 w-3.5 rounded mr-1" />
          <SkeletonText className="h-3 w-18" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-3.5 w-3.5 rounded mr-1" />
          <SkeletonText className="h-3 w-14" />
        </div>
      </CardContent>

      {/* Skills */}
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
          {!compact && (
            <>
              <Skeleton className="h-6 w-18 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </>
          )}
        </div>
      </CardContent>

      {/* Footer with CTA Button */}
      <CardFooter>
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
};

export default CollaborationCardSkeleton; 