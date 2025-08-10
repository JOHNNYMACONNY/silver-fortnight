/**
 * Error State and Recovery Animations
 * 
 * Animated error handling components for failed trades, network issues,
 * and user input validation with smooth recovery transitions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useTradeYaAnimation } from '../../hooks/useTradeYaAnimation';
import { AnimatedButton } from './AnimatedButton';

// Error type definitions
export type ErrorType = 
  | "network" 
  | "validation" 
  | "trade_failed" 
  | "timeout" 
  | "permission" 
  | "server" 
  | "unknown";

// Error severity levels
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

// Error state interface
export interface ErrorState {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  code?: string;
  retryable?: boolean;
  autoRetry?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

// Error animation props
export interface ErrorAnimationProps {
  error: ErrorState;
  onRetry?: () => void;
  onDismiss?: () => void;
  onRecover?: () => void;
  className?: string;
  showDetails?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

// Error type configurations
const ERROR_TYPE_CONFIG = {
  network: {
    icon: '🌐',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    title: 'Network Error',
  },
  validation: {
    icon: '⚠️',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    title: 'Validation Error',
  },
  trade_failed: {
    icon: '❌',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    title: 'Trade Failed',
  },
  timeout: {
    icon: '⏱️',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    title: 'Request Timeout',
  },
  permission: {
    icon: '🔒',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    title: 'Permission Denied',
  },
  server: {
    icon: '🔧',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    title: 'Server Error',
  },
  unknown: {
    icon: '❓',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    title: 'Unknown Error',
  },
};

/**
 * Error State Animation Component
 * 
 * Displays animated error states with recovery options
 */
export const ErrorStateAnimation: React.FC<ErrorAnimationProps> = ({
  error,
  onRetry,
  onDismiss,
  onRecover,
  className = "",
  showDetails = false,
  autoHide = false,
  autoHideDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetailsState, setShowDetailsState] = useState(showDetails);

  // Animation hook
  const { triggerAnimation } = useTradeYaAnimation({
    type: "error",
    intensity: error.severity === "critical" ? "strong" : "medium",
    tradingContext: "general",
  });

  // Auto-hide effect
  useEffect(() => {
    if (autoHide && error.severity === "low") {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, error.severity, onDismiss]);

  // Get error configuration
  const config = ERROR_TYPE_CONFIG[error.type];

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    triggerAnimation();

    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying, triggerAnimation]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  }, [onDismiss]);

  // Animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9, 
      y: -20,
      transition: { duration: 0.3 }
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.4, 
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: -20,
      transition: { duration: 0.3 }
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        damping: 15 
      }
    },
    shake: {
      x: [-2, 2, -2, 2, 0],
      transition: { 
        duration: 0.5,
        repeat: error.severity === "critical" ? Infinity : 0,
        repeatDelay: 2
      }
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "rounded-lg border p-4 shadow-sm",
            config.bgColor,
            config.borderColor,
            className
          )}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start space-x-3">
            {/* Error icon */}
            <motion.div
              className={cn("flex-shrink-0 text-xl", config.color)}
              variants={iconVariants}
              animate={error.severity === "critical" ? "shake" : "visible"}
            >
              {config.icon}
            </motion.div>

            {/* Error content */}
            <motion.div 
              className="flex-1 min-w-0"
              variants={contentVariants}
            >
              {/* Error title and message */}
              <div className="mb-2">
                <h3 className={cn("text-sm font-semibold", config.color)}>
                  {config.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {error.message}
                </p>
              </div>

              {/* Error details */}
              <AnimatePresence>
                {showDetailsState && error.details && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-3"
                  >
                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-2">
                      {error.details}
                      {error.code && (
                        <div className="mt-1 font-mono">
                          Code: {error.code}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Retry count indicator */}
              {error.retryCount && error.maxRetries && (
                <motion.div
                  className="mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Retry attempt {error.retryCount} of {error.maxRetries}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                    <motion.div
                      className="bg-primary-500 h-1 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(error.retryCount / error.maxRetries) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                {/* Retry button */}
                {error.retryable && onRetry && (
                  <AnimatedButton
                    size="sm"
                    variant="outline"
                    tradingContext="general"
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="text-xs"
                  >
                    {isRetrying ? (
                      <motion.div
                        className="flex items-center space-x-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Retrying...</span>
                      </motion.div>
                    ) : (
                      "Retry"
                    )}
                  </AnimatedButton>
                )}

                {/* Recover button */}
                {onRecover && (
                  <AnimatedButton
                    size="sm"
                    variant="primary"
                    tradingContext="general"
                    onClick={onRecover}
                    className="text-xs"
                  >
                    Recover
                  </AnimatedButton>
                )}

                {/* Details toggle */}
                {error.details && (
                  <button
                    onClick={() => setShowDetailsState(!showDetailsState)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {showDetailsState ? "Hide" : "Show"} Details
                  </button>
                )}

                {/* Dismiss button */}
                {onDismiss && (
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ml-auto"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Trade Error Animation Component
 * 
 * Specialized error animation for trade-specific failures
 */
export const TradeErrorAnimation: React.FC<{
  tradeId: string;
  errorType: "proposal_failed" | "negotiation_failed" | "confirmation_failed" | "completion_failed";
  message: string;
  onRetryTrade?: () => void;
  onCancelTrade?: () => void;
  className?: string;
}> = ({
  tradeId,
  errorType,
  message,
  onRetryTrade,
  onCancelTrade,
  className = "",
}) => {
  const errorState: ErrorState = {
    type: "trade_failed",
    severity: "high",
    message,
    details: `Trade ID: ${tradeId}\nError Type: ${errorType}`,
    retryable: true,
    code: `TRADE_${errorType.toUpperCase()}`,
  };

  return (
    <ErrorStateAnimation
      error={errorState}
      onRetry={onRetryTrade}
      onRecover={onCancelTrade}
      className={className}
      showDetails={true}
    />
  );
};

/**
 * Network Error Animation Component
 * 
 * Specialized error animation for network connectivity issues
 */
export const NetworkErrorAnimation: React.FC<{
  onRetry?: () => void;
  onOfflineMode?: () => void;
  className?: string;
}> = ({
  onRetry,
  onOfflineMode,
  className = "",
}) => {
  const errorState: ErrorState = {
    type: "network",
    severity: "medium",
    message: "Unable to connect to TradeYa servers",
    details: "Please check your internet connection and try again.",
    retryable: true,
    autoRetry: true,
  };

  return (
    <ErrorStateAnimation
      error={errorState}
      onRetry={onRetry}
      onRecover={onOfflineMode}
      className={className}
    />
  );
};

export default ErrorStateAnimation;
