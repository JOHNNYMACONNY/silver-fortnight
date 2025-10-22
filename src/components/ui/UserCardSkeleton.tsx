import React from 'react';
import { Card, CardBody } from './Card';
import { Skeleton, SkeletonText, SkeletonCircle } from './skeletons/Skeleton';

interface UserCardSkeletonProps {
  className?: string;
  // Enhanced Card customization props for user skeletons
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
}

const UserCardSkeleton: React.FC<UserCardSkeletonProps> = ({
  className,
  variant = 'elevated', // Default to elevated for user importance
  enhanced = true // Enable enhanced effects by default
}) => (
  <Card
    // Enhanced Card props for user skeleton styling
    variant={variant}
    tilt={enhanced}
    tiltIntensity={2} // Subtle tilt for skeletons (less than regular cards)
    depth="md"
    glow={enhanced ? "subtle" : "none"}
    glowColor="blue" // Blue for user/connection theme
    hover={false} // Disable hover for skeletons
    interactive={false} // Disable interaction for skeletons
    className={className}
  >
    <CardBody className="p-4">
      <div className="flex items-start justify-between space-x-4">
        <div className="flex items-center flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center">
            {/* Profile Image */}
            <SkeletonCircle className="h-12 w-12 mr-4" />
            <div className="min-w-0 flex-1">
              {/* Display Name */}
              <SkeletonText className="h-4 w-32 mb-2" />
              {/* Reputation Badge */}
              <SkeletonText className="h-3 w-20" />
            </div>
          </div>
        </div>

        {/* Connection Button */}
        <div className="flex-shrink-0">
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      {/* Bio */}
      <div className="mt-4">
        <SkeletonText className="h-4 w-full mb-1" />
        <SkeletonText className="h-4 w-3/4" />
      </div>

      {/* Location */}
      <div className="mt-4 flex items-center">
        <Skeleton className="h-4 w-4 rounded-full mr-2" />
        <SkeletonText className="h-4 w-24" />
      </div>

      {/* Skills */}
      <div className="mt-4 flex space-x-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </CardBody>
  </Card>
);

export default UserCardSkeleton;