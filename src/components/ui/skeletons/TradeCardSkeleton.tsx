/**
 * Enhanced Loading States for TradeCard
 * Safe during migration - purely UI enhancement
 */

import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';
import { motion } from 'framer-motion';

interface TradeCardSkeletonProps {
  // Enhanced Card customization props for trade skeletons
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
  className?: string;
}

export const TradeCardSkeleton: React.FC<TradeCardSkeletonProps> = ({
  variant = 'glass', // Default to glass for trade consistency
  enhanced = true, // Enable enhanced effects by default
  className
}) => {
  const shimmer = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 2,
      ease: 'linear' as const,
      repeat: Infinity,
    }
  };

  return (
    <Card 
      // Enhanced Card props for trade skeleton styling
      variant={variant}
      tilt={enhanced}
      tiltIntensity={2} // Subtle tilt for skeletons (less than regular cards)
      depth="lg"
      glow={enhanced ? "subtle" : "none"}
      glowColor="orange" // Orange for TradeYa brand consistency
      hover={false} // Disable hover for skeletons
      interactive={false} // Disable interaction for skeletons
      className={className}
    >
      <CardHeader>
        <div className="flex items-center space-x-3">
          {/* Creator Avatar */}
          <motion.div 
            className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full"
            style={{
              backgroundSize: '400% 100%',
            }}
            animate={shimmer.animate}
            transition={shimmer.transition}
          />
          
          <div className="flex-1 space-y-2">
            {/* Creator Name */}
            <motion.div 
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded"
              style={{
                backgroundSize: '400% 100%',
                width: '60%'
              }}
              animate={shimmer.animate}
              transition={shimmer.transition}
            />
            
            {/* Location */}
            <motion.div 
              className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded"
              style={{
                backgroundSize: '400% 100%',
                width: '40%'
              }}
              animate={shimmer.animate}
              transition={shimmer.transition}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Title */}
        <motion.div 
          className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded mb-3"
          style={{
            backgroundSize: '400% 100%',
            width: '80%'
          }}
          animate={shimmer.animate}
          transition={shimmer.transition}
        />

        {/* Description */}
        <div className="space-y-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i}
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded"
              style={{
                backgroundSize: '400% 100%',
                width: i === 2 ? '60%' : '100%'
              }}
              animate={shimmer.animate}
              transition={{
                ...shimmer.transition,
                delay: i * 0.1
              }}
            />
          ))}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full"
              style={{
                backgroundSize: '400% 100%',
                width: `${60 + Math.random() * 40}px`
              }}
              animate={shimmer.animate}
              transition={{
                ...shimmer.transition,
                delay: i * 0.05
              }}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-between items-center w-full">
          {/* Date */}
          <motion.div 
            className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded"
            style={{
              backgroundSize: '400% 100%',
              width: '30%'
            }}
            animate={shimmer.animate}
            transition={shimmer.transition}
          />

          {/* Button */}
          <motion.div 
            className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-md"
            style={{
              backgroundSize: '400% 100%',
              width: '100px'
            }}
            animate={shimmer.animate}
            transition={shimmer.transition}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export const TradeListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <TradeCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

export default TradeCardSkeleton;
