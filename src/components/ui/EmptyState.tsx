import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center p-8 rounded-lg',
      'glassmorphic bg-white/5 dark:bg-white/5 border border-dashed border-white/20 dark:border-white/20',
      className
    )}>
      {icon && (
        <div className="mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="glassmorphic" onClick={onAction} className="min-h-[44px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
