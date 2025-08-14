/**
 * Enhanced TradeYa Animation System
 * 
 * Core animation hook with performance monitoring, brand integration,
 * and accessibility compliance for TradeYa trading platform.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePerformance } from "../contexts/PerformanceContext";
import { useReducedMotion } from "./useReducedMotion";

// TradeYa Brand Colors
export const TRADEYA_BRAND_COLORS = {
  primary: "#f97316", // TradeYa Orange
  secondary: "#0ea5e9", // TradeYa Blue  
  accent: "#8b5cf6", // TradeYa Purple
} as const;

// Animation Configuration
export const TRADEYA_ANIMATION_CONFIG = {
  brandColors: TRADEYA_BRAND_COLORS,
  
  timing: {
    instant: 0,
    fast: 150,
    standard: 300,
    slow: 500,
    extended: 800,
  },
  
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)", 
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    trading: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Professional, confident
  },
  
  performance: {
    targetFPS: 60,
    maxConcurrentAnimations: 8,
    gpuOptimization: true,
    memoryThreshold: 50,
  },
} as const;

// Animation Types
export type AnimationType = 
  | "hover"
  | "focus" 
  | "click"
  | "loading"
  | "success"
  | "error"
  | "progress"
  | "trading-state"
  | "swipe";

export type AnimationIntensity = "subtle" | "standard" | "enhanced" | "dramatic";
export type BrandColorScheme = "orange" | "blue" | "purple" | "mixed" | "adaptive";
export type TradingContext = "proposal" | "negotiation" | "confirmation" | "completion" | "general";

// Animation Props Interface
export interface MicroInteractionProps {
  type: AnimationType;
  intensity?: AnimationIntensity;
  brandColorScheme?: BrandColorScheme;
  duration?: keyof typeof TRADEYA_ANIMATION_CONFIG.timing | number;
  delay?: number;
  tradingContext?: TradingContext;
  respectMotionPreferences?: boolean;
  /** Optional performance mode hint for mobile adaptations */
  performanceMode?: "standard" | "reduced";
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

// Animation State Interface
export interface AnimationState {
  isAnimating: boolean;
  progress: number;
  currentPhase: "idle" | "entering" | "active" | "exiting";
  performanceMetrics: {
    fps: number;
    memoryUsage: number;
    droppedFrames: number;
  };
}

// Hook Return Type
export interface UseTradeYaAnimationReturn {
  animationState: AnimationState;
  triggerAnimation: () => void;
  resetAnimation: () => void;
  animationStyles: React.CSSProperties;
  isSupported: boolean;
}

/**
 * Enhanced TradeYa Animation Hook
 */
export function useTradeYaAnimation(props: MicroInteractionProps): UseTradeYaAnimationReturn {
  const animationRef = useRef<HTMLElement>(null);
  const performanceRef = useRef({ frameCount: 0, droppedFrames: 0 });
  
  // Integration with existing systems
  const { addBusinessMetric } = usePerformance();
  const prefersReducedMotion = useReducedMotion();
  
  // Determine if animations should run
  const shouldAnimate = props.respectMotionPreferences !== false ? !prefersReducedMotion : true;
  
  // Animation state management
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    progress: 0,
    currentPhase: "idle",
    performanceMetrics: { fps: 60, memoryUsage: 0, droppedFrames: 0 },
  });

  // Brand color selection based on context
  const brandColorForAnimation = useMemo(() => {
    const colors = TRADEYA_ANIMATION_CONFIG.brandColors;
    
    switch (props.brandColorScheme) {
      case "orange":
        return colors.primary;
      case "blue": 
        return colors.secondary;
      case "purple":
        return colors.accent;
      case "mixed":
        // Cycle through colors based on trading context
        switch (props.tradingContext) {
          case "proposal": return colors.primary;
          case "negotiation": return colors.secondary;
          case "confirmation": return colors.accent;
          case "completion": return colors.primary;
          default: return colors.primary;
        }
      case "adaptive":
      default:
        return colors.primary;
    }
  }, [props.brandColorScheme, props.tradingContext]);

  // Animation timing based on context
  const animationTiming = useMemo(() => {
    const baseTiming = typeof props.duration === "number" 
      ? props.duration 
      : TRADEYA_ANIMATION_CONFIG.timing[props.duration || "standard"];
    
    // Adjust timing based on trading context
    switch (props.tradingContext) {
      case "confirmation":
        return baseTiming * 1.2; // Slightly slower for important confirmations
      case "completion":
        return baseTiming * 1.5; // Celebrate completions
      case "negotiation":
        return baseTiming * 0.8; // Faster for active negotiations
      default:
        return baseTiming;
    }
  }, [props.duration, props.tradingContext]);

  // Performance monitoring
  const monitorPerformance = useCallback(() => {
    if (!shouldAnimate) return;

    let frameId: number;
    let startTime = performance.now();
    let frameCount = 0;

    const measureFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - startTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - startTime));
        
        setAnimationState((prev) => ({
          ...prev,
          performanceMetrics: { ...prev.performanceMetrics, fps },
        }));

        addBusinessMetric("animation.fps", fps);

        if (fps < 45) {
          addBusinessMetric("animation.performanceDegradation", fps);
        }

        frameCount = 0;
        startTime = currentTime;
      }

      if (animationState.isAnimating) {
        frameId = requestAnimationFrame(measureFrame);
      }
    };

    frameId = requestAnimationFrame(measureFrame);
    return () => cancelAnimationFrame(frameId);
  }, [shouldAnimate, animationState.isAnimating, addBusinessMetric]);

  // Utility function to convert hex to rgb
  const hexToRgb = useCallback((hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "0, 0, 0";
    
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }, []);

  // Generate animation styles
  const animationStyles = useMemo((): React.CSSProperties => {
    if (!shouldAnimate) {
      return {};
    }

    const baseStyles: React.CSSProperties = {
      transition: `all ${animationTiming}ms ${TRADEYA_ANIMATION_CONFIG.easing.trading}`,
      willChange: "transform, opacity, background-color",
    };

    // Type-specific styling
    switch (props.type) {
      case "hover":
        return {
          ...baseStyles,
          transform: animationState.isAnimating
            ? "translateY(-2px) scale(1.02)"
            : "translateY(0) scale(1)",
          boxShadow: animationState.isAnimating
            ? `0 8px 25px rgba(${hexToRgb(brandColorForAnimation)}, 0.15)`
            : `0 2px 8px rgba(${hexToRgb(brandColorForAnimation)}, 0.1)`,
        };

      case "click":
        return {
          ...baseStyles,
          transform: animationState.isAnimating ? "scale(0.98)" : "scale(1)",
          transition: `transform ${TRADEYA_ANIMATION_CONFIG.timing.fast}ms ${TRADEYA_ANIMATION_CONFIG.easing.easeOut}`,
        };

      case "loading":
        return {
          ...baseStyles,
          opacity: animationState.isAnimating ? 0.7 : 1,
          cursor: animationState.isAnimating ? "wait" : "default",
        };

      case "success":
        return {
          ...baseStyles,
          backgroundColor: animationState.isAnimating
            ? `rgba(34, 197, 94, 0.1)`
            : "transparent",
          borderColor: animationState.isAnimating ? "#22c55e" : "transparent",
        };

      case "error":
        return {
          ...baseStyles,
          backgroundColor: animationState.isAnimating
            ? `rgba(239, 68, 68, 0.1)`
            : "transparent",
          borderColor: animationState.isAnimating ? "#ef4444" : "transparent",
        };

      case "trading-state":
        return {
          ...baseStyles,
          backgroundColor: animationState.isAnimating
            ? `rgba(${hexToRgb(brandColorForAnimation)}, 0.1)`
            : "transparent",
          borderColor: animationState.isAnimating
            ? brandColorForAnimation
            : "transparent",
          transform: animationState.isAnimating ? "scale(1.01)" : "scale(1)",
        };

      default:
        return baseStyles;
    }
  }, [
    shouldAnimate,
    animationTiming,
    props.type,
    animationState.isAnimating,
    brandColorForAnimation,
    hexToRgb,
  ]);

  // Animation trigger
  const triggerAnimation = useCallback(() => {
    if (!shouldAnimate) return;

    // Report animation start metric
    addBusinessMetric("animation.triggered", 1);

    setAnimationState((prev) => ({
      ...prev,
      isAnimating: true,
      currentPhase: "entering",
      progress: 0,
    }));

    props.onAnimationStart?.();

    // Auto-complete animation after duration
    setTimeout(() => {
      setAnimationState((prev) => ({
        ...prev,
        isAnimating: false,
        currentPhase: "idle",
        progress: 1,
      }));
      props.onAnimationComplete?.();
    }, animationTiming);
  }, [shouldAnimate, animationTiming, props, addBusinessMetric]);

  // Reset animation
  const resetAnimation = useCallback(() => {
    setAnimationState({
      isAnimating: false,
      progress: 0,
      currentPhase: "idle",
      performanceMetrics: { fps: 60, memoryUsage: 0, droppedFrames: 0 },
    });
  }, []);

  // Performance monitoring effect
  useEffect(() => {
    if (animationState.isAnimating) {
      return monitorPerformance();
    }
  }, [animationState.isAnimating, monitorPerformance]);

  return {
    animationState,
    triggerAnimation,
    resetAnimation,
    animationStyles,
    isSupported: shouldAnimate,
  };
}
