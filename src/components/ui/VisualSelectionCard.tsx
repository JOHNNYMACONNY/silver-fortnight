import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { semanticClasses, type Topic } from '../../utils/semanticColors';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

export interface VisualSelectionCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  topic?: Topic;
  disabled?: boolean;
  className?: string;
}

/**
 * VisualSelectionCard Component
 * 
 * A card-based selection button for visual selection groups.
 * Uses glassmorphic styling patterns and semantic colors.
 */
export const VisualSelectionCard: React.FC<VisualSelectionCardProps> = ({
  value,
  label,
  description,
  icon,
  selected = false,
  onClick,
  topic = 'trades',
  disabled = false,
  className,
}) => {
  const { isMobile, getTouchTargetClass, shouldUseReducedAnimations } = useMobileOptimization();
  const semanticClassesData = semanticClasses(topic);
  const reducedMotion = shouldUseReducedAnimations();

  // Animation variants
  const cardVariants = {
    initial: { scale: 1 },
    hover: reducedMotion ? {} : { scale: 1.02 },
    tap: reducedMotion ? {} : { scale: 0.98 },
  };

  const checkmarkVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${label}${selected ? ' selected' : ''}`}
      className={cn(
        // Base styles - using Card styling patterns but as button element
        'relative p-4 rounded-xl glassmorphic border-glass backdrop-blur-xl',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-primary/50',
        // Mobile touch target - ensure 44px minimum
        isMobile ? getTouchTargetClass('standard') : 'min-h-[100px]',
        // Selected state
        selected
          ? cn(
              semanticClassesData.bgSolid,
              'text-white ring-2 ring-primary/50 shadow-md',
              'border-primary/30'
            )
          : cn(
              'bg-white/5 hover:bg-white/10',
              'border-white/10 hover:border-white/20',
              'text-foreground'
            ),
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      variants={cardVariants}
      whileHover={disabled ? undefined : 'hover'}
      whileTap={disabled ? undefined : 'tap'}
      initial="initial"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Icon */}
        {icon && (
          <div
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center',
              'transition-all duration-300',
              selected
                ? 'bg-white/20 text-white'
                : cn(semanticClassesData.bgSubtle, semanticClassesData.text)
            )}
          >
            {icon}
          </div>
        )}

        {/* Label */}
        <span
          className={cn(
            'text-sm font-medium leading-tight',
            selected ? 'text-white' : 'text-foreground'
          )}
        >
          {label}
        </span>

        {/* Description */}
        {description && (
          <span
            className={cn(
              'text-xs leading-tight',
              selected ? 'text-white/80' : 'text-muted-foreground'
            )}
          >
            {description}
          </span>
        )}

        {/* Selected checkmark */}
        {selected && (
          <motion.div
            className="absolute top-2 right-2"
            variants={checkmarkVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center',
                'bg-white text-primary shadow-md'
              )}
            >
              <Check className="w-3 h-3" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

