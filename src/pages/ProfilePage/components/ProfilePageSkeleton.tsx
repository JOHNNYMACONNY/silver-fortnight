import React from 'react';
import Box from '../../../components/layout/primitives/Box';
import Stack from '../../../components/layout/primitives/Stack';
import { Card, CardContent } from '../../../components/ui/card';
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

      {/* Profile Header Card Skeleton - Match ProfileHeader structure exactly */}
      <Card
        variant="glass"
        className="relative -mt-4 sm:-mt-6 md:-mt-8 mb-6 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-secondary-500/5"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left Column: Avatar + Basic Info */}
            <div className="lg:col-span-2 flex flex-col items-center gap-4">
              {/* Avatar with glow effect */}
              <div className="relative shrink-0">
                <div className="relative p-1 rounded-full bg-border/50 shadow-xl">
                  <SkeletonAvatar size="xl" variant="glass" />
                </div>
              </div>

              {/* Name, handle, and info - matching exact heights */}
              <Stack gap="sm" className="min-w-0 w-full text-center lg:text-left">
                {/* Name - text-3xl/4xl height (~48px) */}
                <Skeleton height="3rem" width="12rem" className="mx-auto lg:mx-0" variant="glass" />

                {/* Handle with copy button - min-height 44px */}
                <Skeleton height="2.75rem" width="10rem" className="mx-auto lg:mx-0" variant="glass" />

                {/* Reputation badge - ~28px */}
                <Skeleton height="1.75rem" width="8rem" className="mx-auto lg:mx-0" variant="glass" />

                {/* Email (conditional, but reserve space) - ~20px */}
                <Skeleton height="1.25rem" width="14rem" className="mx-auto lg:mx-0" variant="glass" />
              </Stack>
            </div>

            {/* Right Column: Bio, Contact, Skills, Actions, Stats */}
            <div className="lg:col-span-3">
              <Stack gap="md">
                {/* Tagline - text-sm (~20px) */}
                <Skeleton height="1.25rem" width="90%" variant="glass" />

                {/* Bio section - text-sm with Read more (~60px for 3 lines) */}
                <div className="space-y-2">
                  <Skeleton height="1rem" width="100%" variant="glass" />
                  <Skeleton height="1rem" width="95%" variant="glass" />
                  <Skeleton height="1rem" width="85%" variant="glass" />
                </div>

                {/* Contact Info - website, location, joined (~24px) */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <Skeleton height="1.25rem" width="8rem" variant="glass" />
                  <Skeleton height="1.25rem" width="7rem" variant="glass" />
                  <Skeleton height="1.25rem" width="9rem" variant="glass" />
                </div>

                {/* Skills/Tags - flex-wrap (~32px) */}
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      height="1.75rem"
                      width={`${Math.random() * 3 + 4}rem`}
                      rounded="full"
                      variant="glass"
                    />
                  ))}
                </div>

                {/* Social Stats - UserSocialStats compact (~50px) */}
                <div className="flex gap-4">
                  <Skeleton height="3rem" width="8rem" variant="glass" />
                  <Skeleton height="3rem" width="10rem" variant="glass" />
                </div>

                {/* Streak Widgets - compact (~36px) */}
                <Skeleton height="2.25rem" width="100%" rounded="lg" variant="glass" />

                {/* Action Buttons - flex-col sm:flex-row (~40px) */}
                <div className="flex flex-col sm:flex-row gap-2 relative">
                  <SkeletonButton variant="glass" />
                  <SkeletonButton variant="glass" />
                </div>

                {/* Divider - h-px (~1px) */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

                {/* Trade Stats Grid - grid-cols-2 (~60px) */}
                <div className="grid grid-cols-2 gap-3 text-sm w-full">
                  <Skeleton height="3.5rem" rounded="lg" variant="glass" />
                  <Skeleton height="3.5rem" rounded="lg" variant="glass" />
                </div>
              </Stack>
            </div>
          </div>
        </CardContent>
      </Card>

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

