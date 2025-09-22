/**
 * Mobile Card Component
 * 
 * Optimized card component for mobile devices with touch interactions,
 * haptic feedback, and responsive design.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdvancedTouchInteractions } from '../../hooks/useAdvancedTouchInteractions';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  interactive?: boolean;
  hapticFeedback?: boolean;
  swipeActions?: {
    left?: {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      action: () => void;
      color?: string;
    };
    right?: {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      action: () => void;
      color?: string;
    };
  };
}

const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className = '',
  onClick,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  interactive = true,
  hapticFeedback = true,
  swipeActions,
}) => {
  const { isMobile, isTouchDevice, touchTarget } = useMobileOptimization();
  const [isPressed, setIsPressed] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showSwipeAction, setShowSwipeAction] = useState<'left' | 'right' | null>(null);

  // Touch interaction handlers
  const handleTouchGesture = useCallback((gesture: string, event: any) => {
    switch (gesture) {
      case 'long-press':
        onLongPress?.();
        break;
      case 'swipe-left':
        onSwipeLeft?.();
        if (swipeActions?.left) {
          setShowSwipeAction('left');
          setTimeout(() => setShowSwipeAction(null), 2000);
        }
        break;
      case 'swipe-right':
        onSwipeRight?.();
        if (swipeActions?.right) {
          setShowSwipeAction('right');
          setTimeout(() => setShowSwipeAction(null), 2000);
        }
        break;
    }
  }, [onLongPress, onSwipeLeft, onSwipeRight, swipeActions]);

  const touchInteractions = useAdvancedTouchInteractions(
    {
      hapticEnabled: hapticFeedback,
      hapticIntensity: 'light',
      swipeThreshold: 50,
      longPressDelay: 500,
    },
    {
      onSwipe: (event) => handleTouchGesture(event.type, event),
      onLongPress: (event) => handleTouchGesture('long-press', event),
      onTouchStart: () => setIsPressed(true),
      onTouchEnd: () => setIsPressed(false),
    }
  );

  const handleClick = useCallback(() => {
    if (disabled || loading || !interactive) return;
    onClick?.();
  }, [disabled, loading, interactive, onClick]);

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return 'shadow-lg hover:shadow-xl dark:shadow-gray-900/50';
      case 'outlined':
        return 'border-2 border-gray-200 dark:border-gray-700';
      case 'glass':
        return 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-gray-700/50';
      default:
        return 'bg-white dark:bg-gray-800 shadow-sm hover:shadow-md dark:shadow-gray-900/50';
    }
  };

  // Size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'p-3 rounded-lg';
      case 'lg':
        return 'p-6 rounded-2xl';
      default:
        return 'p-4 rounded-xl';
    }
  };

  // Touch target size
  const getTouchTargetStyles = () => {
    if (!isMobile || !interactive) return {};
    
    return {
      minHeight: `${touchTarget.minSize}px`,
      minWidth: `${touchTarget.minSize}px`,
    };
  };

  return (
    <div className="relative">
      <motion.div
        className={`
          relative overflow-hidden transition-all duration-200
          ${getVariantStyles()}
          ${getSizeStyles()}
          ${interactive && !disabled ? 'cursor-pointer' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        style={getTouchTargetStyles()}
        onClick={handleClick}
        whileTap={interactive && !disabled ? { scale: 0.98 } : {}}
        whileHover={interactive && !disabled ? { scale: 1.02 } : {}}
        animate={{
          x: swipeOffset,
          scale: isPressed ? 0.98 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        {...(interactive ? touchInteractions.handlers : {})}
      >
        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-0">
          {children}
        </div>

        {/* Pressed state overlay */}
        {isPressed && interactive && !disabled && (
          <motion.div
            className="absolute inset-0 bg-black/5 dark:bg-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>

      {/* Swipe Actions */}
      <AnimatePresence>
        {showSwipeAction && (
          <motion.div
            className={`
              absolute inset-y-0 flex items-center justify-center px-4 rounded-xl
              ${showSwipeAction === 'left' 
                ? 'left-0 bg-red-500' 
                : 'right-0 bg-green-500'
              }
            `}
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              x: showSwipeAction === 'left' ? -50 : 50 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              x: showSwipeAction === 'left' ? -50 : 50 
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="text-white text-center">
              {showSwipeAction === 'left' ? (
                <>
                  {swipeActions?.left?.icon && <swipeActions.left.icon className="h-6 w-6 mx-auto mb-1" />}
                  <span className="text-sm font-medium">
                    {swipeActions?.left?.label}
                  </span>
                </>
              ) : (
                <>
                  {swipeActions?.right?.icon && <swipeActions.right.icon className="h-6 w-6 mx-auto mb-1" />}
                  <span className="text-sm font-medium">
                    {swipeActions?.right?.label}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileCard;
