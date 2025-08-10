/**
 * Mobile Animation Hook
 * 
 * Mobile-optimized animation system with touch feedback, haptic support,
 * and performance optimizations for TradeYa trading workflows.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTradeYaAnimation, type MicroInteractionProps, type TradingContext } from './useTradeYaAnimation';

// Mobile-specific animation configuration
export const MOBILE_ANIMATION_CONFIG = {
  // Reduced performance targets for mobile devices
  performance: {
    targetFPS: 45, // Lower target for mobile devices
    maxConcurrentAnimations: 4, // Fewer concurrent animations
    memoryThreshold: 30, // Lower memory threshold
    touchResponseTime: 50, // 50ms max response time for touch
  },

  // Mobile-specific timing adjustments
  timing: {
    instant: 0,
    fast: 100, // Faster for touch feedback
    standard: 200, // Shorter than desktop
    slow: 350, // Reduced from 500ms
    extended: 500, // Reduced from 800ms
  },

  // Touch interaction enhancements
  touch: {
    tapFeedback: true, // Visual tap feedback
    touchRipple: true, // Material Design-style ripples
    hapticFeedback: true, // Vibration feedback where supported
    swipeGestures: true, // Swipe-based animations
    pressAndHold: true, // Long press animations
    minTouchTarget: 44, // iOS minimum touch target size
  },
};

// Touch animation props interface
export interface TouchAnimationProps extends MicroInteractionProps {
  touchFeedback?: "subtle" | "standard" | "enhanced";
  hapticEnabled?: boolean;
  rippleEffect?: boolean;
  touchTarget?: "small" | "standard" | "large"; // Affects animation area
  swipeEnabled?: boolean;
  longPressEnabled?: boolean;
}

// Touch position interface
export interface TouchPosition {
  x: number;
  y: number;
}

// Mobile device detection
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Haptic feedback support detection
export const supportsHapticFeedback = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return 'vibrate' in navigator;
};

/**
 * Mobile Animation Hook
 * 
 * Enhanced animation system optimized for mobile touch interactions
 */
export function useMobileAnimation(props: TouchAnimationProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchPosition, setTouchPosition] = useState<TouchPosition>({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [rippleActive, setRippleActive] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice(isMobileDevice());
  }, []);

  // Mobile-optimized animation configuration
  const mobileOptimizedConfig = useMemo((): MicroInteractionProps => {
    if (!isTouchDevice) return props;

    return {
      ...props,
      duration: props.duration === "instant" ? "instant" :
               props.duration === "fast" ? "fast" :
               props.duration === "slow" ? "slow" :
               props.duration === "extended" ? "extended" :
               "standard",
      performanceMode: "standard",
      intensity: props.touchFeedback === "enhanced" ? "enhanced" : "standard",
    };
  }, [isTouchDevice, props]);

  // Get base animation functionality
  const baseAnimation = useTradeYaAnimation(mobileOptimizedConfig);

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((intensity: "light" | "medium" | "heavy" = "light") => {
    if (!props.hapticEnabled || !supportsHapticFeedback()) return;

    const vibrationPattern = {
      light: 10,
      medium: 25,
      heavy: 50,
    };

    navigator.vibrate(vibrationPattern[intensity]);
  }, [props.hapticEnabled]);

  // Touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice) return;

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    
    setTouchPosition({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });

    setIsPressed(true);

    // Trigger haptic feedback
    triggerHapticFeedback("light");

    // Trigger ripple effect
    if (props.rippleEffect) {
      setRippleActive(true);
      setTimeout(() => setRippleActive(false), 300);
    }

    // Trigger base animation
    baseAnimation.triggerAnimation();
  }, [isTouchDevice, props.rippleEffect, triggerHapticFeedback, baseAnimation]);

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Touch cancel handler
  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    setRippleActive(false);
  }, []);

  // Long press handler
  const handleLongPress = useCallback(() => {
    if (!props.longPressEnabled) return;
    
    triggerHapticFeedback("medium");
    // Additional long press logic can be added here
  }, [props.longPressEnabled, triggerHapticFeedback]);

  // Swipe gesture handler
  const handleSwipe = useCallback((direction: "left" | "right" | "up" | "down") => {
    if (!props.swipeEnabled) return;
    
    triggerHapticFeedback("light");
    // Additional swipe logic can be added here
  }, [props.swipeEnabled, triggerHapticFeedback]);

  // Mobile-specific styles
  const mobileStyles = useMemo(() => {
    const baseStyles = baseAnimation.animationStyles;
    
    if (!isTouchDevice) return baseStyles;

    return {
      ...baseStyles,
      touchAction: 'manipulation', // Faster touch response
      userSelect: 'none' as const, // Prevent text selection on touch
      WebkitTapHighlightColor: 'transparent', // Remove iOS tap highlight
      minHeight: props.touchTarget === "large" ? '56px' : 
                props.touchTarget === "small" ? '32px' : '44px', // iOS guidelines
      minWidth: props.touchTarget === "large" ? '56px' : 
               props.touchTarget === "small" ? '32px' : '44px',
      transform: isPressed ? 'scale(0.95)' : baseStyles.transform || 'scale(1)',
      transition: 'transform 0.1s ease-out, ' + (baseStyles.transition || ''),
    };
  }, [baseAnimation.animationStyles, isTouchDevice, props.touchTarget, isPressed]);

  // Ripple effect styles
  const rippleStyles = useMemo(() => {
    if (!rippleActive || !props.rippleEffect) return {};

    return {
      position: 'absolute' as const,
      left: touchPosition.x - 20,
      top: touchPosition.y - 20,
      width: 40,
      height: 40,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
      opacity: 0.1,
      transform: 'scale(0)',
      animation: 'ripple 0.3s ease-out',
      pointerEvents: 'none' as const,
    };
  }, [rippleActive, props.rippleEffect, touchPosition]);

  return {
    // Base animation functionality
    ...baseAnimation,
    
    // Mobile-specific properties
    isTouchDevice,
    touchPosition,
    isPressed,
    rippleActive,
    
    // Mobile-specific handlers
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
    handleLongPress,
    handleSwipe,
    triggerHapticFeedback,
    
    // Mobile-optimized styles
    animationStyles: mobileStyles,
    rippleStyles,
    
    // Mobile configuration
    mobileConfig: MOBILE_ANIMATION_CONFIG,
  };
}

// Trading context-specific mobile configurations
export const getMobileTradingConfig = (context: TradingContext): Partial<TouchAnimationProps> => {
  switch (context) {
    case "proposal":
      return {
        touchFeedback: "enhanced",
        hapticEnabled: true,
        rippleEffect: true,
        touchTarget: "large",
      };
    
    case "negotiation":
      return {
        touchFeedback: "standard",
        hapticEnabled: true,
        rippleEffect: true,
        touchTarget: "standard",
        swipeEnabled: true,
      };
    
    case "confirmation":
      return {
        touchFeedback: "enhanced",
        hapticEnabled: true,
        rippleEffect: true,
        touchTarget: "large",
        longPressEnabled: true,
      };
    
    case "completion":
      return {
        touchFeedback: "enhanced",
        hapticEnabled: true,
        rippleEffect: true,
        touchTarget: "large",
      };
    
    default:
      return {
        touchFeedback: "standard",
        hapticEnabled: false,
        rippleEffect: false,
        touchTarget: "standard",
      };
  }
};

export default useMobileAnimation;
