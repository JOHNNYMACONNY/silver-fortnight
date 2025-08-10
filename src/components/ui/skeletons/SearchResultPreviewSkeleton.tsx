import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';
import { cn } from '../../../utils/cn';

interface SearchResultPreviewSkeletonProps {
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  showQuickActions?: boolean;
}

export const SearchResultPreviewSkeleton: React.FC<SearchResultPreviewSkeletonProps> = ({
  variant = 'default',
  className,
  showQuickActions = true
}) => {
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const shimmerVariants = {
    animate: {
      x: ['-100%', '100%'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear' as const
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className={cn("group", className)}
    >
      <Card
        variant="glass"
        className={cn(
          "relative overflow-hidden",
          variant === 'compact' ? "h-48" : "h-80"
        )}
      >
        {/* Header Skeleton */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Avatar Skeleton */}
              <div className="relative overflow-hidden rounded-full bg-muted">
                <div className={cn(
                  "bg-muted",
                  variant === 'compact' ? "w-7 h-7" : "w-9 h-9"
                )} />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  variants={shimmerVariants}
                  animate="animate"
                />
              </div>
              
              {/* Title and Creator Skeleton */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="relative overflow-hidden">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    variants={shimmerVariants}
                    animate="animate"
                  />
                </div>
                <div className="relative overflow-hidden">
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    variants={shimmerVariants}
                    animate="animate"
                  />
                </div>
              </div>
            </div>

            {/* Status Badge Skeleton */}
            <div className="relative overflow-hidden">
              <div className="h-6 w-16 bg-muted rounded-full" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmerVariants}
                animate="animate"
              />
            </div>
          </div>
        </CardHeader>

        {/* Content Skeleton */}
        <CardContent className="flex-1">
          {/* Description Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="relative overflow-hidden">
              <div className="h-3 bg-muted rounded w-full" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmerVariants}
                animate="animate"
              />
            </div>
            <div className="relative overflow-hidden">
              <div className="h-3 bg-muted rounded w-5/6" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmerVariants}
                animate="animate"
              />
            </div>
            <div className="relative overflow-hidden">
              <div className="h-3 bg-muted rounded w-4/6" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmerVariants}
                animate="animate"
              />
            </div>
          </div>

          {/* Category Badge Skeleton */}
          <div className="mb-3">
            <div className="relative overflow-hidden inline-block">
              <div className="h-5 w-20 bg-muted rounded-full" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmerVariants}
                animate="animate"
              />
            </div>
          </div>

          {/* Info Grid Skeleton */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="relative overflow-hidden">
                  <div className="w-3.5 h-3.5 bg-muted rounded" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    variants={shimmerVariants}
                    animate="animate"
                  />
                </div>
                <div className="relative overflow-hidden flex-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    variants={shimmerVariants}
                    animate="animate"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Skills Section Skeleton */}
          <div className="flex flex-wrap gap-1.5">
            {[...Array(variant === 'compact' ? 2 : 4)].map((_, index) => (
              <div key={index} className="relative overflow-hidden">
                <div className="h-5 w-16 bg-muted rounded-full" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  variants={shimmerVariants}
                  animate="animate"
                />
              </div>
            ))}
          </div>
        </CardContent>

        {/* Quick Actions Footer Skeleton */}
        {showQuickActions && (
          <CardFooter className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {/* Join Button Skeleton */}
                <div className="relative overflow-hidden">
                  <div className="h-8 w-16 bg-muted rounded" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    variants={shimmerVariants}
                    animate="animate"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Action Buttons Skeleton */}
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="relative overflow-hidden">
                    <div className="h-8 w-8 bg-muted rounded" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      variants={shimmerVariants}
                      animate="animate"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default SearchResultPreviewSkeleton; 