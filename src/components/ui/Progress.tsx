/**
 * Enhanced Progress Component
 *
 * Comprehensive progress indicators with animations, variants, and accessibility
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { classPatterns } from '../../utils/designSystem';
import { semanticClasses, type Topic } from '../../utils/semanticColors';

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  topic?: Topic; // Semantic topic-based styling
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
  topic,
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

  // Get semantic classes if topic is provided
  const semanticClassesForTopic = topic ? semanticClasses(topic) : null;
  
  // Variant configurations with improved contrast and glassmorphic styling
  const variantClasses = {
    default: topic && semanticClassesForTopic 
      ? `bg-gradient-to-r ${semanticClassesForTopic.gradient.replace('bg-gradient-to-r ', '')} shadow-lg shadow-${semanticClassesForTopic.bgSolid.replace('bg-', '').replace('-500', '-500/25')}`
      : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25',
    success: 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25',
    error: 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25',
    gradient: 'bg-gradient-to-r from-orange-500 via-blue-500 to-purple-600 shadow-lg shadow-orange-500/20',
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

      {/* Progress bar container with glassmorphic styling */}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          'bg-white/30 dark:bg-gray-600/60',
          'backdrop-blur-sm border border-white/10 dark:border-gray-700/50',
          'shadow-inner',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        {/* Progress bar fill with premium glassmorphic effects */}
        <motion.div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            'relative overflow-hidden',
            'border border-white/20 dark:border-white/10',
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
                rgba(255,255,255,0.3) 10px,
                rgba(255,255,255,0.3) 20px
              )
            ` : undefined,
          }}
        >
          {/* Subtle shine effect for premium feel */}
          {!indeterminate && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
          )}
        </motion.div>
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
          className="text-gray-100 dark:text-gray-600"
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
  topic?: Topic; // Semantic topic-based styling
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  className = '',
  orientation = 'horizontal',
  topic,
}) => {
  // Check if all steps are completed for "success" state
  const allStepsCompleted = steps.every(step => step.completed);
  
  // Get semantic classes if topic is provided
  const semanticClassesForTopic = topic ? semanticClasses(topic) : null;
  
  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex items-start', className)}>
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step container with circle and label */}
            <div className="flex flex-col items-center relative flex-1">
              {/* Step indicator with clean glassmorphic styling */}
              <div className={cn(
                'flex items-center justify-center rounded-full border transition-all duration-300 ease-out',
                'relative backdrop-blur-sm shadow-sm z-10',
                step.completed ? (allStepsCompleted ? 'bg-green-500/90 border-green-400/50 text-white' : 
                  topic && semanticClassesForTopic ? `${semanticClassesForTopic.bgSolid}/90 border-${semanticClassesForTopic.bgSolid.replace('bg-', '').replace('-500', '-400')}/50 text-white` : 
                  'bg-blue-500/90 border-blue-400/50 text-white') :
                step.current ? (topic && semanticClassesForTopic ? `${semanticClassesForTopic.bgSolid}/90 border-${semanticClassesForTopic.bgSolid.replace('bg-', '').replace('-500', '-400')}/50 text-white` : 'bg-orange-500/90 border-orange-400/50 text-white') :
                step.error ? 'bg-red-500/90 border-red-400/50 text-white' :
                'bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/50 text-gray-600 dark:text-gray-300',
                'w-8 h-8'
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
              <div className="text-center mt-2">
                <div className={cn(
                  'text-sm font-medium',
                  step.current ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                )}
              </div>

              {/* Connector line using pseudo-element - best practice approach */}
              {index < steps.length - 1 && (
                <div 
                  className="absolute top-4 left-1/2 h-0.5 bg-gray-300/60 dark:bg-gray-600/60 rounded-full"
                  style={{ 
                    width: '100%',
                    transform: 'translateX(0)',
                    zIndex: 1
                  }}
                />
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={cn('flex flex-col', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex items-start relative">
            {/* Step indicator with clean glassmorphic styling */}
            <div className={cn(
              'flex items-center justify-center rounded-full border transition-all duration-300 ease-out',
              'relative backdrop-blur-sm shadow-sm z-10',
              step.completed ? (allStepsCompleted ? 'bg-green-500/90 border-green-400/50 text-white' : 
                topic && semanticClassesForTopic ? `${semanticClassesForTopic.bgSolid}/90 border-${semanticClassesForTopic.bgSolid.replace('bg-', '').replace('-500', '-400')}/50 text-white` : 
                'bg-blue-500/90 border-blue-400/50 text-white') :
              step.current ? (topic && semanticClassesForTopic ? `${semanticClassesForTopic.bgSolid}/90 border-${semanticClassesForTopic.bgSolid.replace('bg-', '').replace('-500', '-400')}/50 text-white` : 'bg-orange-500/90 border-orange-400/50 text-white') :
              step.error ? 'bg-red-500/90 border-red-400/50 text-white' :
              'bg-white/20 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/50 text-gray-600 dark:text-gray-300',
              'w-8 h-8 mr-3'
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
            <div className="text-left flex-1">
              <div className={cn(
                'text-sm font-medium',
                step.current ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </div>
              )}
            </div>

            {/* Connector line for vertical layout - using same best practice approach */}
            {index < steps.length - 1 && (
              <div 
                className="absolute left-4 top-1/2 w-0.5 bg-gray-300/60 dark:bg-gray-600/60 rounded-full"
                style={{ 
                  height: '100%',
                  transform: 'translateY(0)',
                  zIndex: 1
                }}
              />
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Progress;