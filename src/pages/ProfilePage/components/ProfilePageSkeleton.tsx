import React from 'react';
import Box from '../../../components/layout/primitives/Box';
import { Skeleton, SkeletonAvatar, SkeletonText, SkeletonButton } from '../../../components/ui/Skeleton';
import { classPatterns } from '../../../utils/designSystem';

/**
 * ProfilePage Skeleton Loader
 * Phase 3B: CLS Optimization - Exact dimensions to prevent layout shifts
 * 
 * This skeleton matches the exact layout and dimensions of the loaded ProfilePage
 * to ensure zero cumulative layout shift (CLS) during loading.
 */

export const ProfilePageSkeleton: React.FC = () => {
  return (
    <Box className={classPatterns.homepageContainer}>
      {/* Hero Banner Skeleton */}
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/10 h-48 rounded-xl mb-6 will-change-[opacity]" />

      {/* Profile Header Card Skeleton */}
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/10 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left Column: Avatar + Basic Info */}
          <div className="lg:col-span-2 flex flex-col items-center gap-4">
            {/* Avatar with glow effect */}
            <div className="relative shrink-0">
              <div className="relative p-1 rounded-full bg-border/50 shadow-xl">
                <SkeletonAvatar size="xl" variant="glass" />
              </div>
            </div>

            {/* Name and username */}
            <div className="min-w-0 w-full text-center lg:text-left space-y-2">
              <Skeleton height="2rem" width="12rem" className="mx-auto lg:mx-0" variant="glass" />
              <Skeleton height="1.25rem" width="8rem" className="mx-auto lg:mx-0" variant="glass" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap justify-center lg:justify-start">
              <SkeletonButton variant="glass" />
              <SkeletonButton variant="glass" />
            </div>
          </div>

          {/* Right Column: Stats and Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-1">
                  <Skeleton height="1.5rem" width="3rem" className="mx-auto" variant="glass" />
                  <Skeleton height="0.875rem" width="4rem" className="mx-auto" variant="glass" />
                </div>
              ))}
            </div>

            {/* Bio section */}
            <div className="space-y-2">
              <SkeletonText lines={3} variant="glass" />
            </div>

            {/* Skills/Tags */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  height="1.75rem"
                  width={`${Math.random() * 3 + 4}rem`}
                  rounded="full"
                  variant="glass"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/10 rounded-xl mb-6 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              height="2.5rem"
              width="6rem"
              rounded="lg"
              variant="glass"
            />
          ))}
        </div>
      </div>

      {/* Tab Content Skeleton */}
      <div className="space-y-4">
        {/* Portfolio grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border p-4 space-y-3"
            >
              <Skeleton height="8rem" rounded="lg" variant="glass" />
              <Skeleton height="1rem" width="75%" variant="glass" />
              <Skeleton height="1rem" width="50%" variant="glass" />
            </div>
          ))}
        </div>
      </div>
    </Box>
  );
};

/**
 * Minimal skeleton for tab content loading
 */
export const TabContentSkeleton: React.FC<{
  type?: 'grid' | 'list' | 'stats';
}> = ({ type = 'grid' }) => {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-4 space-y-3"
          >
            <Skeleton height="8rem" rounded="lg" variant="glass" />
            <Skeleton height="1rem" width="75%" variant="glass" />
            <Skeleton height="1rem" width="50%" variant="glass" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-4 flex gap-4"
          >
            <SkeletonAvatar size="md" variant="glass" />
            <div className="flex-1 space-y-2">
              <Skeleton height="1rem" width="60%" variant="glass" />
              <Skeleton height="0.875rem" width="80%" variant="glass" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // stats type
  return (
    <div className="space-y-4">
      <Skeleton height="1.5rem" width="10rem" variant="glass" />
      <Skeleton height="8rem" rounded="lg" variant="glass" />
    </div>
  );
};

