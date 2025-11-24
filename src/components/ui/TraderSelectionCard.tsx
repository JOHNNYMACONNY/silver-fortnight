import React from 'react';
import { ProfileImage } from './ProfileImage';
import { CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

export interface Trader {
  uid: string;
  displayName: string;
  photoURL?: string;
  recentTradeCount?: number;
}

export interface TraderSelectionCardProps {
  trader: Trader;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * TraderSelectionCard Component
 * 
 * Card for selecting traders, displaying their profile image, name, and recent trade count.
 * Uses existing ProfileImage component for consistency.
 */
export const TraderSelectionCard: React.FC<TraderSelectionCardProps> = ({
  trader,
  selected = false,
  onClick,
  disabled = false,
  className,
}) => {
  const { isMobile, getTouchTargetClass, shouldUseReducedAnimations } = useMobileOptimization();
  const reducedMotion = shouldUseReducedAnimations();

  const cardVariants = {
    initial: { scale: 1 },
    hover: reducedMotion ? {} : { scale: 1.02 },
    tap: reducedMotion ? {} : { scale: 0.98 },
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${trader.displayName}${selected ? ' selected' : ''}`}
      className={cn(
        // Base styles
        'relative p-4 rounded-xl glassmorphic border-glass backdrop-blur-xl',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-primary/50',
        // Mobile touch target - ensure 44px minimum
        isMobile ? getTouchTargetClass('standard') : 'min-h-[120px]',
        // Selected state
        selected
          ? 'bg-primary/20 ring-2 ring-primary/50 shadow-md border-primary/30'
          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      variants={cardVariants}
      whileHover={disabled ? undefined : 'hover'}
      whileTap={disabled ? undefined : 'tap'}
      initial="initial"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Profile Image */}
        <div className="relative">
          <ProfileImage
            displayName={trader.displayName}
            photoURL={trader.photoURL}
            size="lg"
            className={cn(
              selected && 'ring-2 ring-primary/50'
            )}
          />
          
          {/* Selected checkmark */}
          {selected && (
            <motion.div
              className="absolute -top-1 -right-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Display Name */}
        <span className="text-sm font-medium text-foreground leading-tight">
          {trader.displayName}
        </span>

        {/* Recent Trade Count */}
        {trader.recentTradeCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            {trader.recentTradeCount} recent {trader.recentTradeCount === 1 ? 'trade' : 'trades'}
          </span>
        )}
      </div>
    </motion.button>
  );
};

