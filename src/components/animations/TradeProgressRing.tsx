/**
 * TradeProgressRing Component
 * 
 * Animated progress ring for trade completion workflows with
 * TradeYa brand gradient and smooth progress transitions.
 */

import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { useTradeYaAnimation, type TradingContext } from "../../hooks/useTradeYaAnimation";

// Component Props
export interface TradeProgressRingProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg" | "xl";
  showProgress?: boolean;
  label?: string;
  tradingContext?: TradingContext;
  strokeWidth?: number;
  className?: string;
  showAnimation?: boolean;
  children?: React.ReactNode;
}

/**
 * TradeProgressRing Component
 */
export const TradeProgressRing: React.FC<TradeProgressRingProps> = ({
  progress,
  size = "md",
  showProgress = true,
  label,
  tradingContext = "general",
  strokeWidth,
  className = "",
  showAnimation = true,
  children,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Clamp progress to 0-100 range
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Size configurations
  const sizeConfig = getSizeConfig(size);
  const finalStrokeWidth = strokeWidth || sizeConfig.strokeWidth;

  // Calculate circle properties
  const center = sizeConfig.size / 2;
  const radius = center - finalStrokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  // Animation configuration
  const { animationStyles, triggerAnimation } = useTradeYaAnimation({
    type: "progress",
    tradingContext,
    brandColorScheme: "mixed",
    duration: "extended",
    respectMotionPreferences: true,
  });

  // Trigger animation on mount and progress changes
  useEffect(() => {
    if (showAnimation) {
      triggerAnimation();
    }
  }, [clampedProgress, showAnimation, triggerAnimation]);

  // Animate progress changes
  useEffect(() => {
    if (!showAnimation) {
      setAnimatedProgress(clampedProgress);
      return;
    }

    const startProgress = animatedProgress;
    const endProgress = clampedProgress;
    const duration = 1000; // 1 second animation
    const startTime = Date.now();

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progressRatio, 3);
      const currentProgress = startProgress + (endProgress - startProgress) * easeOutCubic;

      setAnimatedProgress(currentProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(animateProgress);
      }
    };

    requestAnimationFrame(animateProgress);
  }, [clampedProgress, showAnimation, animatedProgress]);

  // Progress color based on completion
  const getProgressColor = () => {
    if (animatedProgress >= 100) return "#22c55e"; // Green for complete
    if (animatedProgress >= 75) return "#8b5cf6"; // Purple for near complete
    if (animatedProgress >= 50) return "#0ea5e9"; // Blue for halfway
    return "#f97316"; // Orange for starting
  };

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={animationStyles}
      role="progressbar"
      aria-valuenow={Math.round(clampedProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progress: ${Math.round(clampedProgress)}%`}
    >
      <svg
        width={sizeConfig.size}
        height={sizeConfig.size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={finalStrokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Gradient definitions */}
        <defs>
          <linearGradient
            id="tradeya-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Completion gradient */}
          <linearGradient
            id="completionGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>

        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#tradeya-gradient)"
          strokeWidth={finalStrokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: animatedProgress >= 100 ? "drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))" : "none"
          }}
        />

        {/* Completion checkmark */}
        {clampedProgress >= 100 && (
          <path
            d="M9 12l2 2 4-4"
            stroke="#22c55e"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
            transform={`translate(${center - 8}, ${center - 8})`}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <div className="text-center">
            {label && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {label}
              </div>
            )}
            {showProgress && (
              <div
                className={cn(
                  "font-bold text-gray-900 dark:text-gray-100",
                  sizeConfig.textSize
                )}
              >
                {Math.round(clampedProgress)}%
              </div>
            )}
            {clampedProgress >= 100 && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">
                Complete!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completion celebration effect */}
      {clampedProgress >= 100 && showAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-green-300 opacity-30 animate-ping animation-delay-150" />
        </div>
      )}
    </div>
  );
};

/**
 * Size Configuration Helper
 */
function getSizeConfig(size: string) {
  switch (size) {
    case "sm":
      return {
        size: 60,
        strokeWidth: 4,
        textSize: "text-sm",
      };
    case "lg":
      return {
        size: 120,
        strokeWidth: 8,
        textSize: "text-xl",
      };
    case "xl":
      return {
        size: 160,
        strokeWidth: 10,
        textSize: "text-2xl",
      };
    case "md":
    default:
      return {
        size: 80,
        strokeWidth: 6,
        textSize: "text-lg",
      };
  }
}

/**
 * Specialized Progress Ring Variants
 */

// Trade Proposal Progress
export const TradeProposalProgress: React.FC<Omit<TradeProgressRingProps, 'tradingContext'>> = (props) => (
  <TradeProgressRing
    {...props}
    tradingContext="proposal"
  />
);

// Trade Negotiation Progress
export const TradeNegotiationProgress: React.FC<Omit<TradeProgressRingProps, 'tradingContext'>> = (props) => (
  <TradeProgressRing
    {...props}
    tradingContext="negotiation"
  />
);

// Trade Confirmation Progress
export const TradeConfirmationProgress: React.FC<Omit<TradeProgressRingProps, 'tradingContext'>> = (props) => (
  <TradeProgressRing
    {...props}
    tradingContext="confirmation"
  />
);

// Trade Completion Progress
export const TradeCompletionProgress: React.FC<Omit<TradeProgressRingProps, 'tradingContext'>> = (props) => (
  <TradeProgressRing
    {...props}
    tradingContext="completion"
  />
);

export default TradeProgressRing;
