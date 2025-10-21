/**
 * Mobile Animated Button Component
 * 
 * Mobile-optimized button with touch feedback, haptic support, and
 * enhanced micro-interactions for TradeYa trading workflows.
 */

import React from "react";
import { cn } from "../../utils/cn";
import { useMobileAnimation, getMobileTradingConfig, type TouchAnimationProps } from "../../hooks/useMobileAnimation";
import { type TradingContext } from "../../hooks/useTradeYaAnimation";

// Mobile Button Props Interface
export interface MobileAnimatedButtonProps {
  children: React.ReactNode;
  tradingContext?: TradingContext;
  criticalAction?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  
  // Mobile-specific props
  hapticEnabled?: boolean;
  rippleEffect?: boolean;
  swipeEnabled?: boolean;
  longPressEnabled?: boolean;
  touchFeedback?: "subtle" | "standard" | "enhanced";
}

/**
 * Mobile Animated Button Component
 * 
 * Enhanced button with mobile-optimized animations and touch interactions
 */
export const MobileAnimatedButton: React.FC<MobileAnimatedButtonProps> = ({
  children,
  tradingContext = "general",
  criticalAction = false,
  onClick,
  disabled = false,
  className = "",
  variant = "primary",
  size = "md",
  loading = false,
  type = "button",
  hapticEnabled = true,
  rippleEffect = true,
  swipeEnabled = false,
  longPressEnabled = false,
  touchFeedback = "standard",
}) => {
  // Get mobile trading configuration
  const mobileConfig = getMobileTradingConfig(tradingContext);
  
  // Animation configuration with mobile optimizations
  const animationProps: TouchAnimationProps = {
    type: loading ? "loading" : "click",
    tradingContext,
    intensity: criticalAction ? "enhanced" : "standard",
    brandColorScheme: criticalAction ? "orange" : getBrandColorForVariant(variant),
    respectMotionPreferences: true,
    duration: "standard",
    touchFeedback: touchFeedback || mobileConfig.touchFeedback,
    hapticEnabled: hapticEnabled && mobileConfig.hapticEnabled,
    rippleEffect: rippleEffect && mobileConfig.rippleEffect,
    swipeEnabled: swipeEnabled || mobileConfig.swipeEnabled,
    longPressEnabled: longPressEnabled || mobileConfig.longPressEnabled,
    touchTarget: getTouchTargetSize(size),
  };

  const {
    animationStyles,
    rippleStyles,
    isSupported,
    isTouchDevice,
    rippleActive,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
    triggerAnimation,
  } = useMobileAnimation(animationProps);

  // Handle click with mobile optimizations
  const handleClick = () => {
    if (!disabled && !loading) {
      if (isSupported) {
        triggerAnimation();
      }
      onClick?.();
    }
  };

  // Base button styles with mobile optimizations
  const baseStyles = cn(
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium",
    "ring-offset-background transition-all duration-300 overflow-hidden",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    // Mobile-specific optimizations
    isTouchDevice && [
      "touch-manipulation no-tap-highlight",
      "active:scale-95 transition-transform duration-100",
      getTouchTargetClass(size),
    ],
    getSizeStyles(size),
    getVariantStyles(variant, criticalAction),
    className
  );

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Ripple effect component
  const RippleEffect = () => {
    if (!rippleActive || !rippleEffect) return null;
    
    return (
      <span
        className="absolute pointer-events-none"
        style={rippleStyles}
        aria-hidden="true"
      />
    );
  };

  return (
    <button
      type={type}
      className={baseStyles}
      style={animationStyles}
      onClick={handleClick}
      onTouchStart={isTouchDevice ? handleTouchStart : undefined}
      onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
      onTouchCancel={isTouchDevice ? handleTouchCancel : undefined}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      aria-describedby={criticalAction ? "critical-action-description" : undefined}
    >
      {loading && <LoadingSpinner />}
      {children}
      
      {/* Ripple effect */}
      <RippleEffect />
      
      {/* Screen reader description for critical actions */}
      {criticalAction && (
        <span id="critical-action-description" className="sr-only">
          This is an important action that will affect your trade.
        </span>
      )}
    </button>
  );
};

/**
 * Get brand color scheme based on button variant
 */
function getBrandColorForVariant(variant: string): "orange" | "blue" | "purple" | "mixed" {
  switch (variant) {
    case "primary":
      return "orange";
    case "secondary":
      return "blue";
    case "outline":
      return "purple";
    default:
      return "mixed";
  }
}

/**
 * Get touch target size based on button size
 */
function getTouchTargetSize(size: string): "small" | "standard" | "large" {
  switch (size) {
    case "sm":
      return "small";
    case "lg":
      return "large";
    case "md":
    default:
      return "standard";
  }
}

/**
 * Get touch target CSS class
 */
function getTouchTargetClass(size: string): string {
  switch (size) {
    case "sm":
      return "touch-target-small";
    case "lg":
      return "touch-target-large";
    case "md":
    default:
      return "touch-target-standard";
  }
}

/**
 * Get size-specific styles
 */
function getSizeStyles(size: string): string {
  switch (size) {
    case "sm":
      return "h-9 px-3 text-sm";
    case "lg":
      return "h-12 px-8 text-lg";
    case "md":
    default:
      return "h-10 px-6 text-base";
  }
}

/**
 * Get variant-specific styles
 */
function getVariantStyles(variant: string, criticalAction: boolean): string {
  const criticalStyles = criticalAction 
    ? "ring-2 ring-primary-300 ring-offset-2" 
    : "";

  switch (variant) {
    case "primary":
      return cn(
        "bg-primary-600 text-white hover:bg-primary-700",
        "shadow-md hover:shadow-lg",
        criticalStyles
      );
    
    case "secondary":
      return cn(
        "bg-secondary-600 text-white hover:bg-secondary-700",
        "shadow-md hover:shadow-lg",
        criticalStyles
      );
    
    case "outline":
      return cn(
        "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
        "dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-950",
        criticalStyles
      );
    
    case "ghost":
      return cn(
        "text-primary-600 hover:bg-primary-50",
        "dark:text-primary-400 dark:hover:bg-primary-950",
        criticalStyles
      );
    
    default:
      return cn(
        "bg-primary-600 text-white hover:bg-primary-700",
        "shadow-md hover:shadow-lg",
        criticalStyles
      );
  }
}

/**
 * Specialized Mobile Trading Action Buttons
 */

// Mobile Proposal Submit Button
export const MobileProposalSubmitButton: React.FC<Omit<MobileAnimatedButtonProps, 'tradingContext' | 'criticalAction'>> = (props) => (
  <MobileAnimatedButton
    {...props}
    tradingContext="proposal"
    criticalAction={true}
    variant="primary"
    hapticEnabled={true}
    rippleEffect={true}
    touchFeedback="enhanced"
  />
);

// Mobile Negotiation Response Button
export const MobileNegotiationResponseButton: React.FC<Omit<MobileAnimatedButtonProps, 'tradingContext'>> = (props) => (
  <MobileAnimatedButton
    {...props}
    tradingContext="negotiation"
    variant="secondary"
    hapticEnabled={true}
    rippleEffect={true}
    swipeEnabled={true}
  />
);

// Mobile Confirmation Button
export const MobileConfirmationButton: React.FC<Omit<MobileAnimatedButtonProps, 'tradingContext' | 'criticalAction'>> = (props) => (
  <MobileAnimatedButton
    {...props}
    tradingContext="confirmation"
    criticalAction={true}
    variant="primary"
    hapticEnabled={true}
    rippleEffect={true}
    longPressEnabled={true}
    touchFeedback="enhanced"
  />
);

export default MobileAnimatedButton;
