/**
 * Swipe Gestures Hook
 * 
 * Mobile swipe gesture system optimized for TradeYa trading workflows
 * with haptic feedback and performance monitoring.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMobileAnimation } from './useMobileAnimation';

// Swipe direction type
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

// Swipe configuration interface
export interface SwipeConfig {
  threshold?: number; // Minimum distance for swipe (default: 50px)
  velocity?: number; // Minimum velocity for swipe (default: 0.3)
  timeout?: number; // Maximum time for swipe (default: 300ms)
  preventScroll?: boolean; // Prevent scroll during swipe
  hapticFeedback?: boolean; // Enable haptic feedback
  onlyHorizontal?: boolean; // Only detect horizontal swipes
  onlyVertical?: boolean; // Only detect vertical swipes
}

// Swipe event interface
export interface SwipeEvent {
  direction: SwipeDirection;
  distance: number;
  velocity: number;
  duration: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
}

// Touch tracking interface
interface TouchTracking {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  isTracking: boolean;
}

// Default swipe configuration
const DEFAULT_SWIPE_CONFIG: Required<SwipeConfig> = {
  threshold: 50,
  velocity: 0.3,
  timeout: 300,
  preventScroll: false,
  hapticFeedback: true,
  onlyHorizontal: false,
  onlyVertical: false,
};

/**
 * Swipe Gestures Hook
 * 
 * Provides swipe gesture detection with trading workflow optimizations
 */
export function useSwipeGestures(
  config: SwipeConfig = {},
  onSwipe?: (event: SwipeEvent) => void
) {
  const finalConfig = { ...DEFAULT_SWIPE_CONFIG, ...config };
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const touchRef = useRef<TouchTracking>({
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    isTracking: false,
  });

  // Mobile animation for haptic feedback
  const { triggerHapticFeedback, isTouchDevice } = useMobileAnimation({
    type: "swipe",
    tradingContext: "general",
    hapticEnabled: finalConfig.hapticFeedback,
  });

  // Calculate swipe distance
  const calculateDistance = useCallback((startX: number, startY: number, endX: number, endY: number): number => {
    return Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  }, []);

  // Calculate swipe velocity
  const calculateVelocity = useCallback((distance: number, duration: number): number => {
    return duration > 0 ? distance / duration : 0;
  }, []);

  // Determine swipe direction
  const getSwipeDirection = useCallback((startX: number, startY: number, endX: number, endY: number): SwipeDirection => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  // Check if swipe meets configuration criteria
  const isValidSwipe = useCallback((direction: SwipeDirection, distance: number, velocity: number): boolean => {
    if (distance < finalConfig.threshold) return false;
    if (velocity < finalConfig.velocity) return false;
    
    if (finalConfig.onlyHorizontal && (direction === 'up' || direction === 'down')) return false;
    if (finalConfig.onlyVertical && (direction === 'left' || direction === 'right')) return false;
    
    return true;
  }, [finalConfig]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice) return;

    const touch = e.touches[0];
    const now = Date.now();

    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isTracking: true,
    };

    setIsSwipeActive(true);
    setSwipeProgress(0);

    // Prevent scroll if configured
    if (finalConfig.preventScroll) {
      e.preventDefault();
    }
  }, [isTouchDevice, finalConfig.preventScroll]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current.isTracking) return;

    const touch = e.touches[0];
    touchRef.current.currentX = touch.clientX;
    touchRef.current.currentY = touch.clientY;

    // Calculate progress for visual feedback
    const distance = calculateDistance(
      touchRef.current.startX,
      touchRef.current.startY,
      touch.clientX,
      touch.clientY
    );
    
    const progress = Math.min(distance / finalConfig.threshold, 1);
    setSwipeProgress(progress);

    // Prevent scroll if configured
    if (finalConfig.preventScroll) {
      e.preventDefault();
    }
  }, [calculateDistance, finalConfig.threshold, finalConfig.preventScroll]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current.isTracking) return;

    const endTime = Date.now();
    const duration = endTime - touchRef.current.startTime;
    
    // Check timeout
    if (duration > finalConfig.timeout) {
      touchRef.current.isTracking = false;
      setIsSwipeActive(false);
      setSwipeProgress(0);
      return;
    }

    const distance = calculateDistance(
      touchRef.current.startX,
      touchRef.current.startY,
      touchRef.current.currentX,
      touchRef.current.currentY
    );

    const velocity = calculateVelocity(distance, duration);
    const direction = getSwipeDirection(
      touchRef.current.startX,
      touchRef.current.startY,
      touchRef.current.currentX,
      touchRef.current.currentY
    );

    // Check if swipe is valid
    if (isValidSwipe(direction, distance, velocity)) {
      // Trigger haptic feedback
      triggerHapticFeedback("light");

      // Create swipe event
      const swipeEvent: SwipeEvent = {
        direction,
        distance,
        velocity,
        duration,
        startPosition: {
          x: touchRef.current.startX,
          y: touchRef.current.startY,
        },
        endPosition: {
          x: touchRef.current.currentX,
          y: touchRef.current.currentY,
        },
      };

      // Call onSwipe callback
      onSwipe?.(swipeEvent);
    }

    // Reset tracking
    touchRef.current.isTracking = false;
    setIsSwipeActive(false);
    setSwipeProgress(0);
  }, [
    finalConfig.timeout,
    calculateDistance,
    calculateVelocity,
    getSwipeDirection,
    isValidSwipe,
    triggerHapticFeedback,
    onSwipe,
  ]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    touchRef.current.isTracking = false;
    setIsSwipeActive(false);
    setSwipeProgress(0);
  }, []);

  return {
    // State
    isSwipeActive,
    swipeProgress,
    isTouchDevice,
    
    // Handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    
    // Configuration
    config: finalConfig,
  };
}

/**
 * Trading-specific swipe configurations
 */

// Trade card swipe configuration
export const TRADE_CARD_SWIPE_CONFIG: SwipeConfig = {
  threshold: 80,
  velocity: 0.4,
  timeout: 400,
  onlyHorizontal: true,
  hapticFeedback: true,
  preventScroll: false,
};

// Navigation swipe configuration
export const NAVIGATION_SWIPE_CONFIG: SwipeConfig = {
  threshold: 60,
  velocity: 0.3,
  timeout: 300,
  hapticFeedback: true,
  preventScroll: true,
};

// Modal dismiss swipe configuration
export const MODAL_SWIPE_CONFIG: SwipeConfig = {
  threshold: 100,
  velocity: 0.5,
  timeout: 500,
  onlyVertical: true,
  hapticFeedback: true,
  preventScroll: true,
};

/**
 * Trading workflow swipe actions
 */
export const TRADING_SWIPE_ACTIONS = {
  // Trade card actions
  ACCEPT_TRADE: 'right' as SwipeDirection,
  DECLINE_TRADE: 'left' as SwipeDirection,
  VIEW_DETAILS: 'up' as SwipeDirection,
  
  // Navigation actions
  NEXT_STEP: 'right' as SwipeDirection,
  PREVIOUS_STEP: 'left' as SwipeDirection,
  
  // Modal actions
  DISMISS: 'down' as SwipeDirection,
  EXPAND: 'up' as SwipeDirection,
} as const;

export default useSwipeGestures;
