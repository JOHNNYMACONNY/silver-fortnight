import React from 'react';
import { cn } from '../../utils/cn';
// import { themeClasses } from '../../utils/themeUtils';

export interface ReputationBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Determines the reputation level based on the score
 */
export const getReputationLevel = (score: number): {
  label: string;
  color: string;
  textColor: string;
  borderColor: string;
} => {
  if (score >= 90) {
    return {
      label: 'Elite',
      color: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-800 dark:text-purple-300',
      borderColor: 'border-purple-200 dark:border-purple-800'
    };
  } else if (score >= 75) {
    return {
      label: 'Expert',
      color: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-800 dark:text-orange-300',
      borderColor: 'border-orange-200 dark:border-orange-800'
    };
  } else if (score >= 60) {
    return {
      label: 'Advanced',
      color: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-300',
      borderColor: 'border-green-200 dark:border-green-800'
    };
  } else if (score >= 40) {
    return {
      label: 'Intermediate',
      color: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-800'
    };
  } else {
    return {
      label: 'Beginner',
      color: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-800 dark:text-gray-300',
      borderColor: 'border-gray-200 dark:border-gray-700'
    };
  }
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1'
};

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className
}) => {
  const { label, color, textColor, borderColor } = getReputationLevel(score);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-colors duration-200',
        color,
        textColor,
        borderColor,
        sizeClasses[size],
        className
      )}
      title={`Reputation Score: ${score}`}
    >
      <span className="font-bold">{score}</span>
      {showLabel && <span className="ml-1">• {label}</span>}
    </span>
  );
};

export default ReputationBadge;
