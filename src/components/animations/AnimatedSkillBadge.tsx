/**
 * Animated Skill Badge Component
 * 
 * Interactive skill badge with hover animations, selection states, and micro-interactions
 * for skill proposals in TradeYa trading workflows.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useTradeYaAnimation, type TradingContext } from '../../hooks/useTradeYaAnimation';
import { useMobileAnimation } from '../../hooks/useMobileAnimation';

// Skill level type
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

// Skill badge props interface
export interface AnimatedSkillBadgeProps {
  skill: string;
  level?: SkillLevel;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  showLevel?: boolean;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  tradingContext?: TradingContext;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  className?: string;
  children?: React.ReactNode;
}

// Skill level configurations
const SKILL_LEVEL_CONFIG = {
  beginner: {
    color: 'bg-green-100 text-green-800 border-green-200',
    darkColor: 'dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    icon: '🌱',
    label: 'Beginner',
  },
  intermediate: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    darkColor: 'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    icon: '⚡',
    label: 'Intermediate',
  },
  advanced: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    darkColor: 'dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    icon: '🚀',
    label: 'Advanced',
  },
  expert: {
    color: 'bg-primary/10 text-primary border-primary/30',
    darkColor: '',
    icon: '👑',
    label: 'Expert',
  },
};

// Size configurations
const SIZE_CONFIG = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    iconSize: 'text-xs',
    height: 'h-6',
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    iconSize: 'text-sm',
    height: 'h-8',
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    iconSize: 'text-base',
    height: 'h-10',
  },
};

/**
 * Animated Skill Badge Component
 * 
 * Interactive skill badge with animations and trading context awareness
 */
export const AnimatedSkillBadge: React.FC<AnimatedSkillBadgeProps> = ({
  skill,
  level = "intermediate",
  isSelected = false,
  isHighlighted = false,
  isDisabled = false,
  showLevel = true,
  showIcon = true,
  size = "md",
  variant = "default",
  tradingContext = "general",
  onClick,
  onHover,
  className = "",
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Animation hooks
  const { animationStyles, triggerAnimation } = useTradeYaAnimation({
    type: "hover",
    intensity: "subtle",
    tradingContext,
  });

  const { 
    animationStyles: mobileStyles, 
    handleTouchStart, 
    handleTouchEnd, 
    handleTouchCancel,
    isTouchDevice,
    triggerHapticFeedback 
  } = useMobileAnimation({
    type: "click",
    tradingContext,
    hapticEnabled: tradingContext !== "general",
    rippleEffect: tradingContext !== "general",
    touchTarget: size === "sm" ? "standard" : "large",
  });

  // Get level configuration
  const levelConfig = SKILL_LEVEL_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];

  // Handle click
  const handleClick = useCallback(() => {
    if (isDisabled || !onClick) return;

    triggerAnimation();
    if (isTouchDevice) {
      triggerHapticFeedback("light");
    }
    onClick();
  }, [isDisabled, onClick, triggerAnimation, isTouchDevice, triggerHapticFeedback]);

  // Handle hover
  const handleMouseEnter = useCallback(() => {
    if (isDisabled) return;
    setIsHovered(true);
    onHover?.(true);
  }, [isDisabled, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover?.(false);
  }, [onHover]);

  // Handle touch events
  const handleTouchStartEvent = useCallback((e: React.TouchEvent) => {
    if (isDisabled) return;
    setIsPressed(true);
    handleTouchStart(e);
  }, [isDisabled, handleTouchStart]);

  const handleTouchEndEvent = useCallback(() => {
    setIsPressed(false);
    handleTouchEnd();
  }, [handleTouchEnd]);

  const handleTouchCancelEvent = useCallback(() => {
    setIsPressed(false);
    handleTouchCancel();
  }, [handleTouchCancel]);

  // Get variant styles
  const getVariantStyles = () => {
    const baseStyles = cn(
      levelConfig.color,
      levelConfig.darkColor,
      'border'
    );

    switch (variant) {
      case "outlined":
        return cn(
          'bg-transparent border-2',
          level === 'beginner' ? 'border-green-300 text-green-700 dark:border-green-600 dark:text-green-300'
          : level === 'intermediate' ? 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300'
          : level === 'advanced' ? 'border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300'
          : 'border-primary/30 text-primary'
        );
      case "filled":
        return cn(
          level === 'beginner' ? 'bg-green-500'
          : level === 'intermediate' ? 'bg-blue-500'
          : level === 'advanced' ? 'bg-purple-500'
          : 'bg-primary',
          'text-white border-transparent'
        );
      default:
        return baseStyles;
    }
  };

  // Animation variants
  const badgeVariants: Variants = {
    initial: { scale: 1, opacity: 1 },
    hover: { 
      scale: 1.05, 
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    pressed: { 
      scale: 0.95, 
      transition: { duration: 0.1, ease: "easeOut" }
    },
    selected: {
      scale: 1.02,
      boxShadow: "0 0 0 2px var(--tw-ring-color)",
      transition: { duration: 0.2, ease: "easeOut" }
    },
    highlighted: {
      scale: 1.1,
      transition: { 
        duration: 0.3, 
        ease: "easeOut",
        repeat: Infinity,
        repeatType: "reverse",
        repeatDelay: 1
      }
    },
  };

  // Get current animation state
  const getCurrentVariant = () => {
    if (isHighlighted) return "highlighted";
    if (isSelected) return "selected";
    if (isPressed) return "pressed";
    if (isHovered && !isDisabled) return "hover";
    return "initial";
  };

  return (
    <motion.div
      className={cn(
        // Base styles
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        "transition-all duration-200 ease-out",
        "select-none cursor-pointer",
        
        // Size styles
        sizeConfig.padding,
        sizeConfig.text,
        sizeConfig.height,
        
        // Variant styles
        getVariantStyles(),
        
        // State styles
        isSelected && "ring-2 ring-ring ring-offset-2 dark:ring-offset-gray-800",
        isDisabled && "opacity-50 cursor-not-allowed",
        onClick && !isDisabled && "hover:shadow-md",
        
        // Mobile styles
        isTouchDevice && "touch-manipulation",
        
        className
      )}
      variants={badgeVariants}
      initial="initial"
      animate={getCurrentVariant()}
      style={{
        ...animationStyles,
        ...mobileStyles,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStartEvent}
      onTouchEnd={handleTouchEndEvent}
      onTouchCancel={handleTouchCancelEvent}
      role="button"
      tabIndex={onClick && !isDisabled ? 0 : -1}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      aria-label={`${skill} skill badge, ${levelConfig.label} level${isSelected ? ', selected' : ''}`}
    >
      {/* Skill icon */}
      {showIcon && (
        <motion.span 
          className={cn("flex-shrink-0", sizeConfig.iconSize)}
          initial={{ rotate: 0 }}
          animate={{ 
            rotate: isHighlighted ? [0, 10, -10, 0] : 0,
          }}
          transition={{ 
            duration: 0.5,
            repeat: isHighlighted ? Infinity : 0,
            repeatDelay: 2
          }}
        >
          {levelConfig.icon}
        </motion.span>
      )}

      {/* Skill name */}
      <span className="flex-1 truncate">
        {skill}
      </span>

      {/* Level indicator */}
      {showLevel && (
        <AnimatePresence>
          <motion.span 
            className={cn(
              "text-xs opacity-75 flex-shrink-0",
              size === "sm" && "hidden"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.75, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {levelConfig.label}
          </motion.span>
        </AnimatePresence>
      )}

      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="w-2 h-2 bg-primary rounded-full flex-shrink-0"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Custom children */}
      {children}
    </motion.div>
  );
};

// Specialized skill badge variants for trading contexts
export const ProposalSkillBadge: React.FC<Omit<AnimatedSkillBadgeProps, 'tradingContext'>> = (props) => (
  <AnimatedSkillBadge {...props} tradingContext="proposal" variant="filled" />
);

export const SelectionSkillBadge: React.FC<Omit<AnimatedSkillBadgeProps, 'tradingContext'>> = (props) => (
  <AnimatedSkillBadge {...props} tradingContext="general" variant="outlined" />
);

export const NegotiationSkillBadge: React.FC<Omit<AnimatedSkillBadgeProps, 'tradingContext'>> = (props) => (
  <AnimatedSkillBadge {...props} tradingContext="negotiation" variant="default" />
);

export default AnimatedSkillBadge;
