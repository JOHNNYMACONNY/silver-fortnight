/**
 * Enhanced Progress Component
 *
 * Comprehensive progress indicators with animations, variants, and accessibility
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { classPatterns } from '../../utils/designSystem';

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  striped = false,
  indeterminate = false,
}) => {
  const percentage = indeterminate ? 100 : Math.min(100, Math.max(0, (value / max) * 100));

  // Size configurations
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  // Variant configurations
  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    gradient: 'bg-gradient-to-r from-primary via-secondary to-accent',
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className={classPatterns.bodySmall}>
            {label || 'Progress'}
          </span>
          {!indeterminate && (
            <span className={classPatterns.caption}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        {/* Progress bar fill */}
        <motion.div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            variantClasses[variant],
            striped && 'bg-stripes',
            indeterminate && 'animate-pulse'
          )}
          initial={{ width: 0 }}
          animate={{
            width: indeterminate ? '100%' : `${percentage}%`,
            x: indeterminate ? ['-100%', '100%'] : 0,
          }}
          transition={{
            width: { duration: animated ? 0.5 : 0 },
            x: indeterminate ? {
              repeat: Infinity,
              duration: 1.5,
              ease: 'easeInOut',
            } : {},
          }}
          style={{
            background: striped ? `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.2) 10px,
                rgba(255,255,255,0.2) 20px
              )
            ` : undefined,
          }}
        />
      </div>
    </div>
  );
};

// Circular Progress Component
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className = '',
  variant = 'default',
  showLabel = true,
  label,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: '#f97316', // orange
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={classPatterns.heading4}>
              {Math.round(percentage)}%
            </div>
            {label && (
              <div className={classPatterns.caption + ' text-muted-foreground'}>
                {label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Step Progress Component
export interface StepProgressProps {
  steps: Array<{
    label: string;
    description?: string;
    completed?: boolean;
    current?: boolean;
    error?: boolean;
  }>;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  className = '',
  orientation = 'horizontal',
}) => {
  return (
    <div className={cn(
      'flex',
      orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
      className
    )}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={cn(
            'flex items-center',
            orientation === 'vertical' ? 'flex-row' : 'flex-col'
          )}>
            {/* Step indicator */}
            <div className={cn(
              'flex items-center justify-center rounded-full border-2 transition-all duration-200',
              step.completed ? 'bg-green-500 border-green-500 text-white' :
              step.current ? 'bg-primary border-primary text-white' :
              step.error ? 'bg-red-500 border-red-500 text-white' :
              'bg-gray-200 border-gray-300 text-gray-500',
              orientation === 'horizontal' ? 'w-8 h-8 mb-2' : 'w-8 h-8 mr-3'
            )}>
              {step.completed ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : step.error ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            {/* Step content */}
            <div className={cn(
              'text-center',
              orientation === 'vertical' ? 'text-left flex-1' : ''
            )}>
              <div className={cn(
                classPatterns.bodySmall,
                'font-medium',
                step.current ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step.label}
              </div>
              {step.description && (
                <div className={classPatterns.caption + ' text-muted-foreground'}>
                  {step.description}
                </div>
              )}
            </div>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className={cn(
              'bg-gray-300',
              orientation === 'horizontal'
                ? 'flex-1 h-0.5 mx-4'
                : 'w-0.5 h-8 ml-4 my-2'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Progress;