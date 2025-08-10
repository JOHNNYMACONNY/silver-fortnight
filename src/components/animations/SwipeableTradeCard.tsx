/**
 * Swipeable Trade Card Component
 * 
 * Mobile-optimized trade card with swipe gestures for quick actions
 * in TradeYa trading workflows.
 */

import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { useSwipeGestures, TRADE_CARD_SWIPE_CONFIG, TRADING_SWIPE_ACTIONS, type SwipeEvent } from '../../hooks/useSwipeGestures';
import { useMobileAnimation } from '../../hooks/useMobileAnimation';
import { TradeStatusIndicator } from './TradeStatusIndicator';
import { type Trade } from '../../services/firestore-exports';
import { motion } from 'framer-motion';

// Swipe action interface
export interface SwipeAction {
  direction: 'left' | 'right' | 'up' | 'down';
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

// Swipeable trade card props
export interface SwipeableTradeCardProps {
  trade: Trade;
  onAccept?: () => void;
  onDecline?: () => void;
  onViewDetails?: () => void;
  onEdit?: () => void;
  className?: string;
  disabled?: boolean;
  showSwipeHints?: boolean;
}

/**
 * Swipeable Trade Card Component
 * 
 * Trade card with mobile swipe gestures for quick actions
 */
export const SwipeableTradeCard: React.FC<SwipeableTradeCardProps> = ({
  trade,
  onAccept,
  onDecline,
  onViewDetails,
  onEdit,
  className = "",
  disabled = false,
  showSwipeHints = true,
}) => {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isActionTriggered, setIsActionTriggered] = useState(false);

  // Mobile animation for feedback
  const { triggerHapticFeedback, isTouchDevice } = useMobileAnimation({
    type: "swipe",
    tradingContext: "general",
    hapticEnabled: true,
  });

  // Define swipe actions
  const swipeActions: SwipeAction[] = [
    {
      direction: 'right',
      label: 'Accept',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: 'bg-green-500',
      action: () => onAccept?.(),
    },
    {
      direction: 'left',
      label: 'Decline',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      color: 'bg-red-500',
      action: () => onDecline?.(),
    },
    {
      direction: 'up',
      label: 'View Details',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'bg-blue-500',
      action: () => onViewDetails?.(),
    },
  ];

  // Handle swipe gesture
  const handleSwipe = useCallback((swipeEvent: SwipeEvent) => {
    if (disabled || isActionTriggered) return;

    const action = swipeActions.find(a => a.direction === swipeEvent.direction);
    if (!action) return;

    setIsActionTriggered(true);
    setSwipeDirection(swipeEvent.direction);

    // Trigger haptic feedback
    triggerHapticFeedback("medium");

    // Execute action after animation
    setTimeout(() => {
      action.action();
      setIsActionTriggered(false);
      setSwipeDirection(null);
    }, 300);
  }, [disabled, isActionTriggered, swipeActions, triggerHapticFeedback]);

  // Swipe gesture hook
  const {
    isSwipeActive,
    swipeProgress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  } = useSwipeGestures(TRADE_CARD_SWIPE_CONFIG, handleSwipe);

  // Get swipe action for current direction
  const getCurrentSwipeAction = () => {
    if (!swipeDirection) return null;
    return swipeActions.find(a => a.direction === swipeDirection);
  };

  // Card transform based on swipe
  const getCardTransform = () => {
    if (!isSwipeActive && !isActionTriggered) return 'translateX(0)';
    
    if (isActionTriggered && swipeDirection) {
      switch (swipeDirection) {
        case 'left':
          return 'translateX(-100%)';
        case 'right':
          return 'translateX(100%)';
        case 'up':
          return 'translateY(-100%)';
        case 'down':
          return 'translateY(100%)';
        default:
          return 'translateX(0)';
      }
    }

    // Progressive transform during swipe
    const progress = Math.min(swipeProgress, 1);
    return `translateX(${progress * 20}px) scale(${1 - progress * 0.05})`;
  };

  // Action indicator component
  const ActionIndicator = ({ action }: { action: SwipeAction }) => (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center",
      "transition-opacity duration-200",
      action.color,
      "text-white font-semibold",
      swipeDirection === action.direction ? "opacity-90" : "opacity-0"
    )}>
      <div className="flex flex-col items-center space-y-2">
        {action.icon}
        <span className="text-sm">{action.label}</span>
      </div>
    </div>
  );

  // Swipe hints component
  const SwipeHints = () => {
    if (!showSwipeHints || !isTouchDevice) return null;

    return (
      <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-gray-500">
        <span>← Decline</span>
        <span>↑ Details</span>
        <span>Accept →</span>
      </div>
    );
  };

  return (
    <div className={cn(
      "relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden",
      "transition-transform duration-300 ease-out",
      disabled && "opacity-50 pointer-events-none",
      className
    )}>
      {/* Action indicators */}
      {swipeActions.map((action) => (
        <ActionIndicator key={action.direction} action={action} />
      ))}

      {/* Main card */}
      <motion.div
        ref={cardRef}
        className={cn(
          "relative backdrop-blur-md bg-white/80 dark:bg-neutral-800/70 border border-white/20 dark:border-neutral-700/30 rounded-xl shadow-glass overflow-hidden",
          "transition-all duration-300",
          disabled && "opacity-50 pointer-events-none"
        )}
        drag={!disabled}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={getCardTransform()}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Trade header */}
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
            showAnimation={false}
            size="sm"
          />
        </div>

        {/* Trade skills */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400 w-16">Offers:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {trade.offeredSkill}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400 w-16">Wants:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {trade.requestedSkill}
            </span>
          </div>
        </div>

        {/* Trade description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {trade.description}
        </p>

        {/* Trade metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {trade.createdAt ? new Date(trade.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
          </span>
          <span className="capitalize">
            {trade.category}
          </span>
        </div>

        {/* Swipe hints */}
        <SwipeHints />
      </motion.div>

      {/* Swipe progress indicator */}
      {isSwipeActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-primary-500 transition-all duration-100"
            style={{ width: `${swipeProgress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default SwipeableTradeCard;
