/**
 * Advanced Touch Interactions Hook
 * 
 * Comprehensive touch interaction system with gestures, haptics, and
 * mobile-optimized user experience for TradeYa.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Touch interaction types
export type TouchGesture = 'tap' | 'double-tap' | 'long-press' | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pinch' | 'pan';

export interface TouchEvent {
  type: TouchGesture;
  position: { x: number; y: number };
  duration: number;
  velocity?: { x: number; y: number };
  scale?: number;
  timestamp: number;
}

export interface TouchInteractionConfig {
  // Tap configuration
  tapThreshold: number; // Max distance for tap
  tapTimeout: number; // Max time for tap
  doubleTapTimeout: number; // Max time between taps for double tap
  
  // Long press configuration
  longPressDelay: number; // Time to hold for long press
  longPressThreshold: number; // Max distance for long press
  
  // Swipe configuration
  swipeThreshold: number; // Min distance for swipe
  swipeVelocityThreshold: number; // Min velocity for swipe
  swipeTimeout: number; // Max time for swipe
  
  // Pinch configuration
  pinchThreshold: number; // Min scale change for pinch
  
  // Haptic feedback
  hapticEnabled: boolean;
  hapticIntensity: 'light' | 'medium' | 'heavy';
}

const DEFAULT_CONFIG: TouchInteractionConfig = {
  tapThreshold: 10,
  tapTimeout: 300,
  doubleTapTimeout: 500,
  longPressDelay: 500,
  longPressThreshold: 10,
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  swipeTimeout: 300,
  pinchThreshold: 0.1,
  hapticEnabled: true,
  hapticIntensity: 'medium',
};

export interface TouchInteractionState {
  isTouching: boolean;
  touchCount: number;
  lastGesture: TouchGesture | null;
  isLongPressing: boolean;
  isPinching: boolean;
  isPanning: boolean;
  currentScale: number;
  currentRotation: number;
}

export interface TouchInteractionHandlers {
  onTap?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  onSwipe?: (event: TouchEvent) => void;
  onPinch?: (event: TouchEvent) => void;
  onPan?: (event: TouchEvent) => void;
  onTouchStart?: (event: TouchEvent) => void;
  onTouchEnd?: (event: TouchEvent) => void;
  onTouchMove?: (event: TouchEvent) => void;
}

export function useAdvancedTouchInteractions(
  config: Partial<TouchInteractionConfig> = {},
  handlers: TouchInteractionHandlers = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<TouchInteractionState>({
    isTouching: false,
    touchCount: 0,
    lastGesture: null,
    isLongPressing: false,
    isPinching: false,
    isPanning: false,
    currentScale: 1,
    currentRotation: 0,
  });

  // Refs for tracking touch state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const initialDistanceRef = useRef<number | null>(null);
  const initialAngleRef = useRef<number | null>(null);

  // Haptic feedback function
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = finalConfig.hapticIntensity) => {
    if (!finalConfig.hapticEnabled || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
    };
    
    navigator.vibrate(patterns[intensity]);
  }, [finalConfig.hapticEnabled, finalConfig.hapticIntensity]);

  // Calculate distance between two points
  const getDistance = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  // Calculate velocity from touch history
  const getVelocity = useCallback((history: Array<{ x: number; y: number; time: number }>) => {
    if (history.length < 2) return { x: 0, y: 0 };
    
    const recent = history.slice(-3); // Use last 3 points
    const dx = recent[recent.length - 1].x - recent[0].x;
    const dy = recent[recent.length - 1].y - recent[0].y;
    const dt = recent[recent.length - 1].time - recent[0].time;
    
    return {
      x: dt > 0 ? dx / dt : 0,
      y: dt > 0 ? dy / dt : 0,
    };
  }, []);

  // Create touch event object
  const createTouchEvent = useCallback((
    type: TouchGesture,
    position: { x: number; y: number },
    duration: number,
    velocity?: { x: number; y: number },
    scale?: number
  ): TouchEvent => ({
    type,
    position,
    duration,
    velocity,
    scale,
    timestamp: Date.now(),
  }), []);

  // Handle tap detection
  const handleTap = useCallback((position: { x: number; y: number }, duration: number) => {
    const now = Date.now();
    const lastTap = lastTapRef.current;
    
    // Check for double tap
    if (lastTap && 
        now - lastTap.time < finalConfig.doubleTapTimeout &&
        getDistance(position, lastTap) < finalConfig.tapThreshold) {
      
      const event = createTouchEvent('double-tap', position, duration);
      setState(prev => ({ ...prev, lastGesture: 'double-tap' }));
      triggerHaptic('medium');
      handlers.onDoubleTap?.(event);
    } else {
      const event = createTouchEvent('tap', position, duration);
      setState(prev => ({ ...prev, lastGesture: 'tap' }));
      triggerHaptic('light');
      handlers.onTap?.(event);
    }
    
    lastTapRef.current = { ...position, time: now };
  }, [finalConfig, getDistance, createTouchEvent, triggerHaptic, handlers]);

  // Handle long press
  const handleLongPressStart = useCallback((position: { x: number; y: number }) => {
    setState(prev => ({ ...prev, isLongPressing: true }));
    triggerHaptic('heavy');
    handlers.onLongPressStart?.();
  }, [triggerHaptic, handlers]);

  const handleLongPressEnd = useCallback((position: { x: number; y: number }, duration: number) => {
    const event = createTouchEvent('long-press', position, duration);
    setState(prev => ({ ...prev, isLongPressing: false, lastGesture: 'long-press' }));
    handlers.onLongPress?.(event);
    handlers.onLongPressEnd?.();
  }, [createTouchEvent, handlers]);

  // Handle swipe detection
  const handleSwipe = useCallback((
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    duration: number,
    velocity: { x: number; y: number }
  ) => {
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const distance = getDistance(startPos, endPos);
    
    if (distance < finalConfig.swipeThreshold) return;
    
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const absVx = Math.abs(velocity.x);
    const absVy = Math.abs(velocity.y);
    
    let direction: TouchGesture;
    
    if (absDx > absDy && absVx > finalConfig.swipeVelocityThreshold) {
      direction = dx > 0 ? 'swipe-right' : 'swipe-left';
    } else if (absDy > absDx && absVy > finalConfig.swipeVelocityThreshold) {
      direction = dy > 0 ? 'swipe-down' : 'swipe-up';
    } else {
      return; // Not a valid swipe
    }
    
    const event = createTouchEvent(direction, endPos, duration, velocity);
    setState(prev => ({ ...prev, lastGesture: direction }));
    triggerHaptic('light');
    handlers.onSwipe?.(event);
  }, [finalConfig, getDistance, createTouchEvent, triggerHaptic, handlers]);

  // Handle pinch detection
  const handlePinch = useCallback((
    touches: TouchList,
    duration: number
  ) => {
    if (touches.length !== 2) return;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const currentDistance = getDistance(
      { x: touch1.clientX, y: touch1.clientY },
      { x: touch2.clientX, y: touch2.clientY }
    );
    
    if (initialDistanceRef.current === null) {
      initialDistanceRef.current = currentDistance;
      return;
    }
    
    const scale = currentDistance / initialDistanceRef.current;
    const scaleChange = Math.abs(scale - state.currentScale);
    
    if (scaleChange > finalConfig.pinchThreshold) {
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      const event = createTouchEvent('pinch', { x: centerX, y: centerY }, duration, undefined, scale);
      setState(prev => ({ 
        ...prev, 
        lastGesture: 'pinch', 
        isPinching: true,
        currentScale: scale 
      }));
      handlers.onPinch?.(event);
    }
  }, [finalConfig, getDistance, createTouchEvent, state.currentScale, handlers]);

  // Handle pan detection
  const handlePan = useCallback((
    startPos: { x: number; y: number },
    currentPos: { x: number; y: number },
    duration: number,
    velocity: { x: number; y: number }
  ) => {
    const event = createTouchEvent('pan', currentPos, duration, velocity);
    setState(prev => ({ ...prev, lastGesture: 'pan', isPanning: true }));
    handlers.onPan?.(event);
  }, [createTouchEvent, handlers]);

  // Touch start handler
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    const touch = event.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    const time = Date.now();
    
    touchStartRef.current = { ...position, time };
    touchHistoryRef.current = [{ ...position, time }];
    
    setState(prev => ({ 
      ...prev, 
      isTouching: true, 
      touchCount: event.touches.length,
      isPinching: event.touches.length === 2,
      isPanning: false,
    }));
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      if (touchStartRef.current) {
        handleLongPressStart(touchStartRef.current);
      }
    }, finalConfig.longPressDelay);
    
    const touchEvent = createTouchEvent('tap', position, 0);
    handlers.onTouchStart?.(touchEvent);
  }, [finalConfig.longPressDelay, handleLongPressStart, createTouchEvent, handlers]);

  // Touch move handler
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    const touch = event.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    const time = Date.now();
    
    // Update touch history
    touchHistoryRef.current.push({ ...position, time });
    if (touchHistoryRef.current.length > 10) {
      touchHistoryRef.current = touchHistoryRef.current.slice(-10);
    }
    
    const velocity = getVelocity(touchHistoryRef.current);
    
    // Handle pinch for multi-touch
    if (event.touches.length === 2) {
      handlePinch(event.touches as unknown as TouchList, time - (touchStartRef.current?.time || time));
    }
    
    // Handle pan for single touch
    if (event.touches.length === 1 && touchStartRef.current) {
      const duration = time - touchStartRef.current.time;
      handlePan(touchStartRef.current, position, duration, velocity);
    }
    
    const touchEvent = createTouchEvent('tap', position, time - (touchStartRef.current?.time || time), velocity);
    handlers.onTouchMove?.(touchEvent);
  }, [getVelocity, handlePinch, handlePan, createTouchEvent, handlers]);

  // Touch end handler
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (!touchStartRef.current) return;
    
    const touch = event.changedTouches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    const time = Date.now();
    const duration = time - touchStartRef.current.time;
    const velocity = getVelocity(touchHistoryRef.current);
    
    // Determine gesture type
    if (state.isLongPressing) {
      handleLongPressEnd(position, duration);
    } else if (state.isPinching) {
      // Pinch end - reset scale
      setState(prev => ({ ...prev, isPinching: false, currentScale: 1 }));
      initialDistanceRef.current = null;
    } else if (state.isPanning) {
      // Pan end
      setState(prev => ({ ...prev, isPanning: false }));
    } else if (duration < finalConfig.tapTimeout) {
      // Check for tap or swipe
      const distance = getDistance(touchStartRef.current, position);
      if (distance < finalConfig.tapThreshold) {
        handleTap(position, duration);
      } else if (duration < finalConfig.swipeTimeout) {
        handleSwipe(touchStartRef.current, position, duration, velocity);
      }
    }
    
    // Reset state
    setState(prev => ({ 
      ...prev, 
      isTouching: false, 
      touchCount: 0,
      isLongPressing: false,
      isPinching: false,
      isPanning: false,
    }));
    
    touchStartRef.current = null;
    touchHistoryRef.current = [];
    initialDistanceRef.current = null;
    
    const touchEvent = createTouchEvent('tap', position, duration, velocity);
    handlers.onTouchEnd?.(touchEvent);
  }, [
    state.isLongPressing, 
    state.isPinching, 
    state.isPanning, 
    finalConfig, 
    getDistance, 
    handleLongPressEnd, 
    handleTap, 
    handleSwipe, 
    createTouchEvent, 
    handlers
  ]);

  // Touch cancel handler
  const handleTouchCancel = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Reset state
    setState(prev => ({ 
      ...prev, 
      isTouching: false, 
      touchCount: 0,
      isLongPressing: false,
      isPinching: false,
      isPanning: false,
    }));
    
    touchStartRef.current = null;
    touchHistoryRef.current = [];
    initialDistanceRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    triggerHaptic,
    config: finalConfig,
  };
}
