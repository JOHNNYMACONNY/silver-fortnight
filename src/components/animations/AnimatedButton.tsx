/**
 * AnimatedButton Component
 * 
 * Trading-context aware button component with sophisticated micro-interactions
 * that integrate with TradeYa's brand colors and animation system.
 */

import React from "react";
import { cn } from "../../utils/cn";
import { useTradeYaAnimation, type MicroInteractionProps, type TradingContext } from "../../hooks/useTradeYaAnimation";

// Button Props Interface
export interface AnimatedButtonProps {
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
}

/**
 * AnimatedButton Component
 * 
 * Enhanced button with trading-specific animations and micro-interactions
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
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
}) => {
  // Animation configuration based on props
  const animationProps: MicroInteractionProps = {
    type: loading ? "loading" : "click",
    tradingContext,
    intensity: criticalAction ? "enhanced" : "standard",
    brandColorScheme: criticalAction ? "orange" : getBrandColorForVariant(variant),
    respectMotionPreferences: true,
    duration: "standard",
  };

  const { animationStyles, triggerAnimation, isSupported } = useTradeYaAnimation(animationProps);

  // Handle click with animation
  const handleClick = () => {
    if (!disabled && !loading) {
      if (isSupported) {
        triggerAnimation();
      }
      onClick?.();
    }
  };

  // Base button styles
  const baseStyles = cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium",
    "ring-offset-background transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
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

  return (
    <button
      type={type}
      className={baseStyles}
      style={animationStyles}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      aria-describedby={criticalAction ? "critical-action-description" : undefined}
    >
      {loading && <LoadingSpinner />}
      {children}
      
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
 * Specialized Trading Action Buttons
 */

// Proposal Submit Button
export const ProposalSubmitButton: React.FC<Omit<AnimatedButtonProps, 'tradingContext' | 'criticalAction'>> = (props) => (
  <AnimatedButton
    {...props}
    tradingContext="proposal"
    criticalAction={true}
    variant="primary"
  />
);

// Negotiation Response Button
export const NegotiationResponseButton: React.FC<Omit<AnimatedButtonProps, 'tradingContext'>> = (props) => (
  <AnimatedButton
    {...props}
    tradingContext="negotiation"
    variant="secondary"
  />
);

// Confirmation Button
export const ConfirmationButton: React.FC<Omit<AnimatedButtonProps, 'tradingContext' | 'criticalAction'>> = (props) => (
  <AnimatedButton
    {...props}
    tradingContext="confirmation"
    criticalAction={true}
    variant="primary"
  />
);

// Completion Celebration Button
export const CompletionButton: React.FC<Omit<AnimatedButtonProps, 'tradingContext'>> = (props) => (
  <AnimatedButton
    {...props}
    tradingContext="completion"
    variant="primary"
  />
);

export default AnimatedButton;
