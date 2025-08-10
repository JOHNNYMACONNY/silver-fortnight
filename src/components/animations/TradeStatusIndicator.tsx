/**
 * TradeStatusIndicator Component
 * 
 * Animated status indicator for trade states with brand color coordination
 * and smooth state transitions.
 */

import React, { useEffect } from "react";
import { cn } from "../../utils/cn";
import { useTradeYaAnimation, type BrandColorScheme, type TradingContext } from "../../hooks/useTradeYaAnimation";

// Trade Status Types
export type TradeStatus = 
  | "pending" 
  | "negotiating" 
  | "confirmed" 
  | "completed" 
  | "cancelled"
  | "expired";

// Component Props
export interface TradeStatusIndicatorProps {
  status: TradeStatus;
  showAnimation?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

/**
 * TradeStatusIndicator Component
 */
export const TradeStatusIndicator: React.FC<TradeStatusIndicatorProps> = ({
  status,
  showAnimation = true,
  size = "md",
  showLabel = true,
  className = "",
}) => {
  // Get animation configuration for status
  const { animationStyles, triggerAnimation } = useTradeYaAnimation({
    type: "trading-state",
    tradingContext: getStatusTradingContext(status),
    brandColorScheme: getStatusBrandColor(status),
    intensity: status === "completed" ? "dramatic" : "standard",
    duration: getStatusAnimationDuration(status),
    respectMotionPreferences: true,
  });

  // Trigger animation when status changes
  useEffect(() => {
    if (showAnimation) {
      triggerAnimation();
    }
  }, [status, showAnimation, triggerAnimation]);

  // Status icon component
  const StatusIcon = () => {
    const iconSize = getIconSize(size);
    const iconClasses = cn("rounded-full flex-shrink-0", iconSize);
    
    switch (status) {
      case "pending":
        return (
          <div className={cn(iconClasses, "bg-orange-500 animate-pulse")}>
            <div className="w-full h-full rounded-full bg-orange-400 animate-ping opacity-75" />
          </div>
        );
      
      case "negotiating":
        return (
          <div className={cn(iconClasses, "bg-blue-500 relative overflow-hidden")}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse" />
            <div className="absolute inset-1 bg-blue-500 rounded-full" />
          </div>
        );
      
      case "confirmed":
        return (
          <div className={cn(iconClasses, "bg-purple-500 relative")}>
            <svg
              className="w-full h-full p-1 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      
      case "completed":
        return (
          <div className={cn(iconClasses, "bg-green-500 relative")}>
            <svg
              className="w-full h-full p-1 text-white animate-bounce"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      
      case "cancelled":
        return (
          <div className={cn(iconClasses, "bg-red-500 relative")}>
            <svg
              className="w-full h-full p-1 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      
      case "expired":
        return (
          <div className={cn(iconClasses, "bg-gray-400 relative")}>
            <svg
              className="w-full h-full p-1 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      
      default:
        return (
          <div className={cn(iconClasses, "bg-gray-300")} />
        );
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300",
        getStatusClasses(status),
        getSizeClasses(size),
        className
      )}
      style={animationStyles}
      role="status"
      aria-label={`Trade status: ${getStatusLabel(status)}`}
    >
      <StatusIcon />
      {showLabel && (
        <span className="font-medium">
          {getStatusLabel(status)}
        </span>
      )}
    </div>
  );
};

/**
 * Helper Functions
 */

function getStatusBrandColor(status: TradeStatus): BrandColorScheme {
  switch (status) {
    case "pending":
      return "orange";
    case "negotiating":
      return "blue";
    case "confirmed":
      return "purple";
    case "completed":
      return "mixed";
    case "cancelled":
    case "expired":
    default:
      return "mixed";
  }
}

function getStatusTradingContext(status: TradeStatus): TradingContext {
  switch (status) {
    case "pending":
      return "proposal";
    case "negotiating":
      return "negotiation";
    case "confirmed":
      return "confirmation";
    case "completed":
      return "completion";
    default:
      return "general";
  }
}

function getStatusAnimationDuration(status: TradeStatus): "fast" | "standard" | "slow" | "extended" {
  switch (status) {
    case "completed":
      return "extended"; // Celebrate completions
    case "confirmed":
      return "slow"; // Important confirmations
    case "negotiating":
      return "fast"; // Active negotiations
    default:
      return "standard";
  }
}

function getStatusClasses(status: TradeStatus): string {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
    case "negotiating":
      return "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
    case "confirmed":
      return "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800";
    case "completed":
      return "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
    case "expired":
      return "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
  }
}

function getStatusLabel(status: TradeStatus): string {
  switch (status) {
    case "pending":
      return "Pending Review";
    case "negotiating":
      return "In Negotiation";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    default:
      return "Unknown";
  }
}

function getSizeClasses(size: string): string {
  switch (size) {
    case "sm":
      return "text-xs px-2 py-1";
    case "lg":
      return "text-base px-4 py-2";
    case "md":
    default:
      return "text-sm px-3 py-1";
  }
}

function getIconSize(size: string): string {
  switch (size) {
    case "sm":
      return "w-3 h-3";
    case "lg":
      return "w-5 h-5";
    case "md":
    default:
      return "w-4 h-4";
  }
}

export default TradeStatusIndicator;
