/**
 * Trading Progress Animations
 * 
 * Multi-step workflow visualizations that show progress through
 * proposal → negotiation → confirmation → completion states.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useTradeYaAnimation } from '../../hooks/useTradeYaAnimation';
import { TradeProgressRing } from './TradeProgressRing';

// Trading workflow steps
export type TradingStep = 
  | "proposal" 
  | "negotiation" 
  | "confirmation" 
  | "completion" 
  | "cancelled";

// Step status
export type StepStatus = "pending" | "active" | "completed" | "failed" | "skipped";

// Trading step interface
export interface TradingStepData {
  id: TradingStep;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: StepStatus;
  progress?: number; // 0-100
  estimatedTime?: string;
  completedAt?: Date;
}

// Trading progress props
export interface TradingProgressAnimationProps {
  steps: TradingStepData[];
  currentStep: TradingStep;
  onStepClick?: (step: TradingStep) => void;
  showProgress?: boolean;
  showEstimates?: boolean;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Step configurations
const STEP_CONFIGS = {
  proposal: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-700',
    defaultIcon: '📝',
  },
  negotiation: {
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    defaultIcon: '🤝',
  },
  confirmation: {
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-700',
    defaultIcon: '✅',
  },
  completion: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
    defaultIcon: '🎉',
  },
  cancelled: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-700',
    defaultIcon: '❌',
  },
};

// Status configurations
const STATUS_CONFIGS = {
  pending: {
    color: 'text-gray-400 dark:text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  active: {
    color: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/20',
    borderColor: 'border-primary-300 dark:border-primary-700',
  },
  completed: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  failed: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  skipped: {
    color: 'text-gray-400 dark:text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
};

/**
 * Trading Progress Animation Component
 * 
 * Displays animated progress through trading workflow steps
 */
export const TradingProgressAnimation: React.FC<TradingProgressAnimationProps> = ({
  steps,
  currentStep,
  onStepClick,
  showProgress = true,
  showEstimates = true,
  orientation = "horizontal",
  size = "md",
  className = "",
}) => {
  const [animatingStep, setAnimatingStep] = useState<TradingStep | null>(null);

  // Animation hook
  const { triggerAnimation } = useTradeYaAnimation({
    type: "progress",
    intensity: "standard",
    tradingContext: "general",
  });

  // Animate step transitions
  useEffect(() => {
    setAnimatingStep(currentStep);
    triggerAnimation();
    
    const timer = setTimeout(() => {
      setAnimatingStep(null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentStep, triggerAnimation]);

  // Handle step click
  const handleStepClick = useCallback((step: TradingStepData) => {
    if (step.status === 'pending' || !onStepClick) return;
    onStepClick(step.id);
  }, [onStepClick]);

  // Get size configurations
  const getSizeConfig = () => {
    switch (size) {
      case "sm":
        return {
          stepSize: "w-8 h-8",
          iconSize: "text-sm",
          textSize: "text-xs",
          spacing: orientation === "horizontal" ? "space-x-2" : "space-y-2",
        };
      case "lg":
        return {
          stepSize: "w-16 h-16",
          iconSize: "text-xl",
          textSize: "text-base",
          spacing: orientation === "horizontal" ? "space-x-6" : "space-y-6",
        };
      default:
        return {
          stepSize: "w-12 h-12",
          iconSize: "text-base",
          textSize: "text-sm",
          spacing: orientation === "horizontal" ? "space-x-4" : "space-y-4",
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // Step component
  const StepComponent = ({ step, index }: { step: TradingStepData; index: number }) => {
    const stepConfig = STEP_CONFIGS[step.id];
    const statusConfig = STATUS_CONFIGS[step.status];
    const isAnimating = animatingStep === step.id;
    const isClickable = step.status !== 'pending' && onStepClick;

    return (
      <motion.div
        className={cn(
          "flex items-center",
          orientation === "vertical" ? "flex-col text-center" : "flex-row",
          isClickable && "cursor-pointer"
        )}
        onClick={() => handleStepClick(step)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
      >
        {/* Step circle */}
        <motion.div
          className={cn(
            "relative flex items-center justify-center rounded-full border-2",
            sizeConfig.stepSize,
            sizeConfig.iconSize,
            step.status === 'active' ? stepConfig.bgColor : statusConfig.bgColor,
            step.status === 'active' ? stepConfig.borderColor : statusConfig.borderColor,
            step.status === 'active' ? stepConfig.color : statusConfig.color,
            "transition-all duration-300",
            isClickable && "hover:scale-110"
          )}
          animate={{
            scale: isAnimating ? [1, 1.2, 1] : 1
          }}
          transition={{ duration: 0.6 }}
        >
          {/* Step icon */}
          <motion.div
            animate={{
              rotate: isAnimating ? [0, 360] : 0,
            }}
            transition={{ duration: 0.6 }}
          >
            {step.icon || stepConfig.defaultIcon}
          </motion.div>

          {/* Progress ring for active step */}
          {step.status === 'active' && showProgress && step.progress !== undefined && (
            <div className="absolute inset-0">
              <TradeProgressRing
                progress={step.progress}
                size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"}
                strokeWidth={2}
                showProgress={false}
                tradingContext={
                  step.id === "proposal" ? "proposal" :
                  step.id === "negotiation" ? "negotiation" :
                  step.id === "confirmation" ? "confirmation" :
                  step.id === "completion" ? "completion" : "general"
                }
              />
            </div>
          )}

          {/* Completion checkmark */}
          {step.status === 'completed' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-green-600"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              ✓
            </motion.div>
          )}

          {/* Failure indicator */}
          {step.status === 'failed' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-red-600"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              ✕
            </motion.div>
          )}
        </motion.div>

        {/* Step label and details */}
        <div className={cn(
          orientation === "vertical" ? "mt-2" : "ml-3",
          "flex-1"
        )}>
          <h4 className={cn(
            "font-medium",
            sizeConfig.textSize,
            step.status === 'active' ? stepConfig.color : statusConfig.color
          )}>
            {step.label}
          </h4>
          
          {size !== "sm" && (
            <p className={cn(
              "text-gray-600 dark:text-gray-400 mt-1",
              sizeConfig.textSize === "text-xs" ? "text-xs" : "text-xs"
            )}>
              {step.description}
            </p>
          )}

          {/* Time estimates */}
          {showEstimates && step.estimatedTime && step.status === 'pending' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Est. {step.estimatedTime}
            </p>
          )}

          {/* Completion time */}
          {step.completedAt && step.status === 'completed' && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Completed {step.completedAt.toLocaleTimeString()}
            </p>
          )}

          {/* Progress percentage */}
          {step.status === 'active' && showProgress && step.progress !== undefined && (
            <motion.div
              className="mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className={stepConfig.color}>{step.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                <motion.div
                  className={cn("h-1 rounded-full", stepConfig.bgColor.replace('bg-', 'bg-').replace('/20', ''))}
                  initial={{ width: 0 }}
                  animate={{ width: `${step.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  // Connection line component
  const ConnectionLine = ({ index }: { index: number }) => {
    const prevStep = steps[index];
    const nextStep = steps[index + 1];
    
    if (!nextStep) return null;

    const isCompleted = prevStep.status === 'completed';
    const isActive = prevStep.status === 'active' || nextStep.status === 'active';

    return (
      <motion.div
        className={cn(
          orientation === "horizontal" ? "flex-1 h-0.5 mx-2" : "w-0.5 h-8 my-2 mx-auto",
          isCompleted ? "bg-green-300 dark:bg-green-700" : 
          isActive ? "bg-primary-300 dark:bg-primary-700" : 
          "bg-gray-200 dark:bg-gray-700",
          "transition-colors duration-300"
        )}
        initial={{ scaleX: orientation === "horizontal" ? 0 : 1, scaleY: orientation === "vertical" ? 0 : 1 }}
        animate={{ scaleX: 1, scaleY: 1 }}
        transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
      />
    );
  };

  return (
    <div className={cn(
      "flex",
      orientation === "horizontal" ? "flex-row items-center" : "flex-col",
      sizeConfig.spacing,
      className
    )}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <StepComponent step={step} index={index} />
          <ConnectionLine index={index} />
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Compact Trading Progress Component
 * 
 * Simplified progress indicator for smaller spaces
 */
export const CompactTradingProgress: React.FC<{
  currentStep: TradingStep;
  totalSteps?: number;
  className?: string;
}> = ({
  currentStep,
  totalSteps = 4,
  className = "",
}) => {
  const stepOrder: TradingStep[] = ["proposal", "negotiation", "confirmation", "completion"];
  const currentIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {currentIndex + 1}/{totalSteps}
      </span>
    </div>
  );
};

export default TradingProgressAnimation;
