/**
 * Advanced Swipeable Trade Card Component
 * 
 * Sophisticated trading card with multi-step swipe workflows, contextual actions,
 * and enhanced visual feedback for complex trading interactions.
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useSwipeGestures, type SwipeEvent } from '../../hooks/useSwipeGestures';
import { useMobileAnimation } from '../../hooks/useMobileAnimation';
import { TradeStatusIndicator } from './TradeStatusIndicator';
import { AnimatedSkillBadge } from './AnimatedSkillBadge';
import { type Trade } from '../../services/firestore-exports';

// Multi-step swipe action interface
export interface MultiStepSwipeAction {
  id: string;
  direction: 'left' | 'right' | 'up' | 'down';
  label: string;
  icon: React.ReactNode;
  color: string;
  threshold: number;
  steps: {
    partial: { threshold: number; label: string; color: string };
    complete: { threshold: number; label: string; color: string; action: () => void };
  };
}

// Advanced swipeable trade card props
export interface AdvancedSwipeableTradeCardProps {
  trade: Trade;
  actions: MultiStepSwipeAction[];
  onQuickAction?: (actionId: string) => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  className?: string;
  disabled?: boolean;
  showActionHints?: boolean;
  enableMultiStep?: boolean;
  enableQuickActions?: boolean;
}

// Quick action button interface
interface QuickActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

/**
 * Advanced Swipeable Trade Card Component
 * 
 * Enhanced trade card with sophisticated swipe interactions
 */
export const AdvancedSwipeableTradeCard: React.FC<AdvancedSwipeableTradeCardProps> = ({
  trade,
  actions,
  onQuickAction,
  onLongPress,
  onDoubleTap,
  className = "",
  disabled = false,
  showActionHints = true,
  enableMultiStep = true,
  enableQuickActions = true,
}) => {
  const [currentSwipeAction, setCurrentSwipeAction] = useState<MultiStepSwipeAction | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeStep, setSwipeStep] = useState<'none' | 'partial' | 'complete'>('none');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const lastTapTime = useRef<number>(0);

  // Mobile animation for feedback
  const { triggerHapticFeedback, isTouchDevice } = useMobileAnimation({
    type: "hover",
    tradingContext: "negotiation",
    hapticEnabled: true,
  });

  // Quick action buttons
  const quickActions: QuickActionButton[] = [
    {
      id: 'favorite',
      label: 'Favorite',
      icon: <span>⭐</span>,
      color: 'bg-yellow-500',
      action: () => onQuickAction?.('favorite'),
    },
    {
      id: 'share',
      label: 'Share',
      icon: <span>📤</span>,
      color: 'bg-blue-500',
      action: () => onQuickAction?.('share'),
    },
    {
      id: 'report',
      label: 'Report',
      icon: <span>🚩</span>,
      color: 'bg-red-500',
      action: () => onQuickAction?.('report'),
    },
  ];

  // Handle pan gesture
  const handlePan = useCallback((event: unknown, info: PanInfo) => {
    if (disabled) return;

    const { offset, velocity } = info;
    const distance = Math.sqrt(offset.x ** 2 + offset.y ** 2);
    
    // Determine swipe direction
    let direction: 'left' | 'right' | 'up' | 'down';
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      direction = offset.x > 0 ? 'right' : 'left';
    } else {
      direction = offset.y > 0 ? 'down' : 'up';
    }

    // Find matching action
    const action = actions.find(a => a.direction === direction);
    if (!action) return;

    setCurrentSwipeAction(action);
    
    // Calculate progress
    const progress = Math.min(distance / action.threshold, 1);
    setSwipeProgress(progress);

    // Determine step
    if (progress >= action.steps.complete.threshold / action.threshold) {
      if (swipeStep !== 'complete') {
        setSwipeStep('complete');
        triggerHapticFeedback('medium');
      }
    } else if (progress >= action.steps.partial.threshold / action.threshold) {
      if (swipeStep !== 'partial') {
        setSwipeStep('partial');
        triggerHapticFeedback('light');
      }
    } else {
      setSwipeStep('none');
    }
  }, [disabled, actions, swipeStep, triggerHapticFeedback]);

  // Handle pan end
  const handlePanEnd = useCallback((event: unknown, info: PanInfo) => {
    if (!currentSwipeAction || disabled) return;

    const { offset } = info;
    const distance = Math.sqrt(offset.x ** 2 + offset.y ** 2);
    const progress = distance / currentSwipeAction.threshold;

    // Execute action if threshold met
    if (progress >= currentSwipeAction.steps.complete.threshold / currentSwipeAction.threshold) {
      triggerHapticFeedback('heavy');
      currentSwipeAction.steps.complete.action();
    }

    // Reset state
    setCurrentSwipeAction(null);
    setSwipeProgress(0);
    setSwipeStep('none');
  }, [currentSwipeAction, disabled, triggerHapticFeedback]);

  // Handle long press
  const handleTouchStart = useCallback(() => {
    if (disabled || !onLongPress) return;

    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      triggerHapticFeedback('heavy');
      onLongPress();
    }, 500);
  }, [disabled, onLongPress, triggerHapticFeedback]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPressing(false);

    // Handle double tap
    if (onDoubleTap) {
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        onDoubleTap();
        triggerHapticFeedback('medium');
      }
      lastTapTime.current = now;
    }
  }, [onDoubleTap, triggerHapticFeedback]);

  // Get current action step info
  const getCurrentStepInfo = () => {
    if (!currentSwipeAction) return null;
    
    switch (swipeStep) {
      case 'complete':
        return currentSwipeAction.steps.complete;
      case 'partial':
        return currentSwipeAction.steps.partial;
      default:
        return null;
    }
  };

  // Card transform based on swipe
  const getCardTransform = () => {
    if (!currentSwipeAction) return { x: 0, y: 0, scale: 1 };

    const maxOffset = 50;
    const offset = swipeProgress * maxOffset;
    const scale = 1 - (swipeProgress * 0.05);

    switch (currentSwipeAction.direction) {
      case 'left':
        return { x: -offset, y: 0, scale };
      case 'right':
        return { x: offset, y: 0, scale };
      case 'up':
        return { x: 0, y: -offset, scale };
      case 'down':
        return { x: 0, y: offset, scale };
      default:
        return { x: 0, y: 0, scale: 1 };
    }
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <div className={cn("relative", className)}>
      {/* Action indicators */}
      <AnimatePresence>
        {currentSwipeAction && (
          <motion.div
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-lg",
              stepInfo?.color || currentSwipeAction.color,
              "text-white font-semibold z-0"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: swipeProgress * 0.9 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center space-y-2">
              <motion.div
                className="text-2xl"
                animate={{ 
                  scale: swipeStep === 'complete' ? 1.2 : 1,
                  rotate: swipeStep === 'complete' ? [0, 10, -10, 0] : 0
                }}
                transition={{ duration: 0.3 }}
              >
                {currentSwipeAction.icon}
              </motion.div>
              <span className="text-sm">
                {stepInfo?.label || currentSwipeAction.label}
              </span>
              {enableMultiStep && (
                <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${swipeProgress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card */}
      <motion.div
        ref={cardRef}
        className={cn(
          "relative z-10 glassmorphic overflow-hidden",
          "transition-all duration-300",
          disabled && "opacity-50 pointer-events-none",
          isLongPressing && "shadow-lg ring-2 ring-ring/50"
        )}
        drag={!disabled}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        animate={getCardTransform()}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Card content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                {trade.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {trade.creatorName}
              </p>
            </div>
            <TradeStatusIndicator 
              status={trade.status as any}
              showAnimation={true}
              size="sm"
            />
          </div>

          {/* Skills */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Offers:</span>
              <AnimatedSkillBadge
                skill={(trade as any).offeredSkills?.[0]?.skill ?? (trade as any).offeredSkills?.[0] ?? (trade as any).offeredSkill ?? 'Unknown'}
                size="sm"
                tradingContext="general"
                showLevel={false}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Wants:</span>
              <AnimatedSkillBadge
                skill={(trade as any).requestedSkills?.[0]?.skill ?? (trade as any).requestedSkills?.[0] ?? (trade as any).requestedSkill ?? 'Unknown'}
                size="sm"
                tradingContext="general"
                showLevel={false}
              />
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {trade.description}
          </p>

          {/* Quick actions */}
          <AnimatePresence>
            {enableQuickActions && showQuickActions && (
              <motion.div
                className="flex items-center justify-center space-x-2 mb-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm",
                      action.color,
                      "hover:scale-110 active:scale-95 transition-transform"
                    )}
                    onClick={action.action}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {action.icon}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {trade.createdAt ? new Date(trade.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
            </span>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ⋯
            </button>
          </div>
        </div>

        {/* Action hints */}
        {showActionHints && !currentSwipeAction && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-gray-400 pointer-events-none">
            {actions.map((action) => (
              <span key={action.direction} className="flex items-center space-x-1">
                <span>{action.direction === 'left' ? '←' : action.direction === 'right' ? '→' : action.direction === 'up' ? '↑' : '↓'}</span>
                <span>{action.label}</span>
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdvancedSwipeableTradeCard;
