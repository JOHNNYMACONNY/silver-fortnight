import React from 'react';
import { Card, CardContent } from '../Card';
import { Skeleton, SkeletonText, SkeletonCircle } from './Skeleton';

interface ConnectionCardSkeletonProps {
  className?: string;
  // Enhanced Card customization props for connection skeletons
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
  showActions?: boolean; // Whether to show action buttons
}

export const ConnectionCardSkeleton: React.FC<ConnectionCardSkeletonProps> = ({
  className,
  variant = 'elevated', // Default to elevated for connection importance
  enhanced = true, // Enable enhanced effects by default
  showActions = true
}) => {
  return (
    <Card
      // Enhanced Card props for connection skeleton styling
      variant={variant}
      tilt={enhanced}
      tiltIntensity={2} // Subtle tilt for skeletons (less than regular cards)
      depth="md"
      glow={enhanced ? "subtle" : "none"}
      glowColor="blue" // Blue for connection/trust theme
      hover={false} // Disable hover for skeletons
      interactive={false} // Disable interaction for skeletons
      className={className}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          {/* User Profile Section */}
          <div className="flex items-center">
            <SkeletonCircle className="h-10 w-10 mr-3" />
            <div>
              {/* User Name */}
              <SkeletonText className="h-4 w-32 mb-1" />
              {/* Connection Date */}
              <div className="flex items-center">
                <Skeleton className="h-3.5 w-3.5 rounded mr-1" />
                <SkeletonText className="h-3 w-24" />
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Message Area */}
        <div className="mt-4">
          <div className="space-y-2">
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-3/4" />
          </div>
        </div>

        {/* Actions Section */}
        <div className="mt-4 flex justify-between items-center">
          {/* View Profile Link */}
          <SkeletonText className="h-4 w-20" />

          {/* Action Buttons */}
          {showActions && (
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionCardSkeleton; 