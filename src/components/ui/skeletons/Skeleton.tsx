import React from 'react';
import { cn } from '../../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn('animate-pulse rounded bg-neutral-200 dark:bg-neutral-700', className)} />
  );
};

export const SkeletonText: React.FC<SkeletonProps> = ({ className }) => {
  return <Skeleton className={cn('h-4 w-full', className)} />;
};

export const SkeletonCircle: React.FC<SkeletonProps & { size?: string }> = ({ 
  className, 
  size = 'h-12 w-12' 
}) => {
  return <Skeleton className={cn('rounded-full', size, className)} />;
};

export const SkeletonButton: React.FC<SkeletonProps> = ({ className }) => {
  return <Skeleton className={cn('h-10 w-24 rounded-md', className)} />;
};
