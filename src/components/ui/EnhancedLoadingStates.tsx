/**
 * Enhanced Loading States
 * Comprehensive loading indicators with context-aware messaging and animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Clock, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
  Search,
  Users,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { Progress, CircularProgress } from './Progress';
import { classPatterns } from '../../utils/designSystem';
import { cn } from '../../utils/cn';

// Types
export interface LoadingStateProps {
  type?: 'spinner' | 'progress' | 'skeleton' | 'pulse' | 'dots' | 'bars';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  submessage?: string;
  progress?: number;
  variant?: 'default' | 'glass' | 'minimal' | 'card';
  className?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
  timeout?: number;
  onTimeout?: () => void;
  retryAction?: () => void;
}

export interface ContextualLoadingProps extends LoadingStateProps {
  context: 'search' | 'upload' | 'download' | 'save' | 'load' | 'connect' | 'process' | 'sync';
  estimatedTime?: number;
  stage?: string;
}

// Context-specific configurations
const CONTEXT_CONFIG = {
  search: {
    icon: <Search className="w-5 h-5" />,
    messages: [
      'Searching for matches...',
      'Analyzing skills...',
      'Finding the best trades...',
      'Almost done...'
    ],
    estimatedTime: 3000,
  },
  upload: {
    icon: <Upload className="w-5 h-5" />,
    messages: [
      'Preparing upload...',
      'Uploading files...',
      'Processing content...',
      'Finalizing...'
    ],
    estimatedTime: 5000,
  },
  download: {
    icon: <Download className="w-5 h-5" />,
    messages: [
      'Preparing download...',
      'Fetching data...',
      'Compressing files...',
      'Ready!'
    ],
    estimatedTime: 4000,
  },
  save: {
    icon: <CheckCircle className="w-5 h-5" />,
    messages: [
      'Validating data...',
      'Saving changes...',
      'Updating records...',
      'Complete!'
    ],
    estimatedTime: 2000,
  },
  load: {
    icon: <RefreshCw className="w-5 h-5" />,
    messages: [
      'Loading data...',
      'Fetching updates...',
      'Preparing interface...',
      'Ready!'
    ],
    estimatedTime: 3000,
  },
  connect: {
    icon: <Wifi className="w-5 h-5" />,
    messages: [
      'Establishing connection...',
      'Authenticating...',
      'Syncing data...',
      'Connected!'
    ],
    estimatedTime: 4000,
  },
  process: {
    icon: <Zap className="w-5 h-5" />,
    messages: [
      'Processing request...',
      'Analyzing data...',
      'Generating results...',
      'Complete!'
    ],
    estimatedTime: 6000,
  },
  sync: {
    icon: <RefreshCw className="w-5 h-5" />,
    messages: [
      'Syncing changes...',
      'Updating remote...',
      'Resolving conflicts...',
      'Synchronized!'
    ],
    estimatedTime: 5000,
  },
};

// Basic Loading Spinner
export const LoadingSpinner: React.FC<LoadingStateProps> = ({
  size = 'md',
  message,
  className = '',
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const containerClasses = {
    default: 'flex flex-col items-center justify-center p-4',
    glass: classPatterns.glassCard + ' flex flex-col items-center justify-center p-6',
    minimal: 'flex items-center gap-2',
    card: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center',
  };

  return (
    <div className={cn(containerClasses[variant], className)}>
      <div role="status" aria-label={message ? `${message} loading` : 'loading'}>
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      </div>
      {message && (
        <p className={classPatterns.bodyMedium + ' mt-3 text-center text-muted-foreground'}>
          {message}
        </p>
      )}
    </div>
  );
};

// Contextual Loading with Smart Messaging
const ContextualLoadingComponent: React.FC<ContextualLoadingProps> = ({
  context,
  progress,
  stage,
  estimatedTime,
  variant = 'glass',
  className = '',
  onTimeout,
  retryAction,
  timeout = 30000,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const config = CONTEXT_CONFIG[context];
  const messages = config.messages;
  const defaultEstimatedTime = estimatedTime || config.estimatedTime;

  // Auto-advance messages
  useEffect(() => {
    if (stage) return; // Use provided stage instead

    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => {
        const next = (prev + 1) % messages.length;
        return next;
      });
    }, defaultEstimatedTime / messages.length);

    return () => clearInterval(interval);
  }, [messages.length, defaultEstimatedTime, stage]);

  // Track elapsed time and timeout
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1000;
        if (newTime >= timeout && !isTimedOut) {
          setIsTimedOut(true);
          onTimeout?.();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeout, isTimedOut, onTimeout]);

  const currentMessage = stage || messages[currentMessageIndex];
  const progressValue = progress ?? ((elapsedTime / defaultEstimatedTime) * 100);

  if (isTimedOut) {
    return (
      <div className={cn(classPatterns.glassCard, 'p-6 text-center', className)}>
        <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
        <h3 className={classPatterns.heading4 + ' mb-2'}>Taking longer than expected</h3>
        <p className={classPatterns.bodySmall + ' text-muted-foreground mb-4'}>
          This operation is taking longer than usual. You can wait or try again.
        </p>
        {retryAction && (
          <Button onClick={retryAction} variant="secondary" size="sm">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(classPatterns.glassCard, 'p-6 text-center max-w-sm', className)}
    >
      {/* Icon */}
      <motion.div
        animate={{ rotate: context === 'sync' || context === 'load' ? 360 : 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="text-primary mb-4"
      >
        {config.icon}
      </motion.div>

      {/* Progress */}
      {progress !== undefined ? (
        <div className="mb-4">
          <CircularProgress
            value={progressValue}
            size={80}
            variant="default"
            showLabel={true}
          />
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <p className={classPatterns.bodyMedium + ' mb-2'}>{currentMessage}</p>
        </motion.div>
      </AnimatePresence>

      {/* Time indicator */}
      <div className={classPatterns.caption + ' text-muted-foreground'}>
        <span aria-label="time-indicator">
          {`${Math.round(elapsedTime / 1000)}s elapsed${
            (estimatedTime ?? defaultEstimatedTime) ? ` • ~${Math.round(((estimatedTime ?? defaultEstimatedTime) - elapsedTime) / 1000)}s remaining` : ''
          }`}
        </span>
      </div>
    </motion.div>
  );
};

// Skeleton Loading
const SkeletonLoadingComponent: React.FC<{
  type: 'card' | 'list' | 'profile' | 'table' | 'custom';
  count?: number;
  className?: string;
  children?: React.ReactNode;
}> = ({ type, count = 1, className = '', children }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={classPatterns.glassCard + ' p-6 space-y-4'} role="presentation">
            <div role="presentation" className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4" />
            <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-1/2" />
          </div>
        );
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} role="presentation" className="flex items-center space-x-3">
                <div role="presentation" className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                <div role="presentation" className="flex-1 space-y-2">
                  <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  <div role="presentation" className="h-2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        );
      case 'profile':
        return (
          <div className={classPatterns.glassCard + ' p-6'}>
            <div className="flex items-center space-x-4 mb-4">
              <div role="presentation" className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
              <div role="presentation" className="space-y-2 flex-1">
                <div role="presentation" className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-1/3" />
                <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-1/2" />
              </div>
            </div>
            <div className="space-y-3">
              <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-5/6" />
              <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-4/6" />
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} role="presentation" className="grid grid-cols-4 gap-4">
                <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div role="presentation" className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        );
      case 'custom':
        return children;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={count > 1 ? `mb-4 ${className}` : className}>
          <div aria-label="loading">{renderSkeleton()}</div>
        </div>
      ))}
    </div>
  );
};

// Progressive Loading with Stages
const ProgressiveLoadingComponent: React.FC<{
  stages: Array<{
    name: string;
    description?: string;
    duration?: number;
    completed?: boolean;
  }>;
  currentStage?: number;
  className?: string;
}> = ({ stages, currentStage = 0, className = '' }) => {
  const max = stages.length > 0 ? stages.length - 1 : 0;
  const value = Math.max(0, Math.min(currentStage, max));

  return (
    <div className={cn(classPatterns.glassCard, 'p-6', className)}>
      <div
        role="progressbar"
        aria-label="stages progress"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className="space-y-4">
          {stages.length === 0 ? (
            <div className="text-muted-foreground">No stages</div>
          ) : (
            stages.map((stage, index) => {
              const isCompleted = index < currentStage;
              const isCurrent = index === currentStage;
              return (
                <motion.div
                  key={index}
                  data-stage={stage.name}
                  data-loading={isCurrent ? 'true' : 'false'}
                  data-completed={isCompleted ? 'true' : 'false'}
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: isCompleted || isCurrent ? 1 : 0.5,
                    scale: isCurrent ? 1.02 : 1,
                  }}
                  className={cn('flex items-center space-x-3', isCompleted ? 'completed' : isCurrent ? 'current-stage' : '')}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium',
                      isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle aria-hidden data-completed className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 aria-hidden data-loading className="w-4 h-4 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      classPatterns.bodyMedium,
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {stage.name}
                    </div>
                    {stage.description && (
                      <div className={classPatterns.caption + ' text-muted-foreground'}>
                        {stage.description}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Export all components
export default LoadingSpinner;
export const ContextualLoading = ContextualLoadingComponent;
export const SkeletonLoading = SkeletonLoadingComponent;
export const ProgressiveLoading = ProgressiveLoadingComponent;
