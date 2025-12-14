import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Skeleton component for loading states
 * Phase 3B: CLS Optimization - GPU-composited skeleton loaders with exact dimensions
 * 
 * Features:
 * - GPU-composited animations (opacity-only, no layout shifts)
 * - Exact dimensions to prevent CLS
 * - Glassmorphic styling consistent with design system
 * - Accessible loading states
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of skeleton (CSS value or Tailwind class) */
  width?: string;
  /** Height of skeleton (CSS value or Tailwind class) */
  height?: string;
  /** Border radius variant */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show pulsing animation */
  animate?: boolean;
  /** Variant style */
  variant?: 'default' | 'glass' | 'subtle';
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const variantClasses = {
  default: 'bg-muted',
  glass: 'glassmorphic border-glass backdrop-blur-xl bg-white/10',
  subtle: 'bg-muted/50',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = 'md',
  animate = true,
  variant = 'default',
  className,
  style,
  ...props
}) => {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        'relative overflow-hidden',
        variantClasses[variant],
        roundedClasses[rounded],
        animate && 'animate-pulse-glow will-change-[opacity]',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    >
      {/* Shimmer effect overlay (GPU-composited) */}
      {animate && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent will-change-transform"
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Skeleton text line with realistic proportions
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  variant?: 'default' | 'glass' | 'subtle';
}> = ({ lines = 1, className, variant = 'default' }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '75%' : '100%'}
          variant={variant}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton avatar with circular shape
 */
export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'glass' | 'subtle';
}> = ({ size = 'md', className, variant = 'default' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <Skeleton
      rounded="full"
      className={cn(sizeClasses[size], className)}
      variant={variant}
    />
  );
};

/**
 * Skeleton card with header and content
 */
export const SkeletonCard: React.FC<{
  className?: string;
  variant?: 'default' | 'glass' | 'subtle';
}> = ({ className, variant = 'glass' }) => {
  return (
    <div className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
      <Skeleton height="1.5rem" width="60%" variant={variant} />
      <SkeletonText lines={3} variant={variant} />
    </div>
  );
};

/**
 * Skeleton button
 */
export const SkeletonButton: React.FC<{
  className?: string;
  variant?: 'default' | 'glass' | 'subtle';
}> = ({ className, variant = 'default' }) => {
  return (
    <Skeleton
      height="2.5rem"
      width="6rem"
      rounded="md"
      className={className}
      variant={variant}
    />
  );
};

