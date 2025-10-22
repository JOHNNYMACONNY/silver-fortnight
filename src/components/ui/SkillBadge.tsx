import React from 'react';
import { cn } from '../../utils/cn';
import Box from '../layout/primitives/Box';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillBadgeProps {
  skill: string;
  level?: SkillLevel;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  removable?: boolean;
  onRemove?: () => void;
}

const levelColors: Record<SkillLevel, string> = {
  beginner: 'bg-info/20 text-info-foreground border-info/30',
  intermediate: 'bg-success/20 text-success-foreground border-success/30',
  advanced: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  expert: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1'
};

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  level = 'intermediate',
  size = 'md',
  onClick,
  className,
  removable = false,
  onRemove
}) => {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <Box
      className={cn(
        'flex items-center rounded-full border font-medium transition-colors',
        levelColors[level],
        sizeClasses[size],
        onClick ? 'cursor-pointer hover:opacity-80' : '',
        className
      )}
      onClick={onClick}
    >
      {skill}
      {removable && onRemove && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-background-tertiary focus:outline-none transition-colors duration-200"
        >
          <span className="sr-only">Remove</span>
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </Box>
  );
};

export default SkillBadge;
