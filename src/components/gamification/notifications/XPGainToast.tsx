import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { XPGainNotification, XP_SOURCE_DISPLAY_CONFIG, NOTIFICATION_ANIMATIONS } from '../../../types/gamificationNotifications';
import { cn } from '../../../utils/cn';

interface XPGainToastProps {
  notification: XPGainNotification;
  onClose: () => void;
  isReducedMotion?: boolean;
  className?: string;
}

export const XPGainToast: React.FC<XPGainToastProps> = ({
  notification,
  onClose,
  isReducedMotion = false,
  className = ''
}) => {
  const sourceConfig = XP_SOURCE_DISPLAY_CONFIG[notification.source];

  // Use reduced motion animations if preferred
  const animations = isReducedMotion
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    }
    : NOTIFICATION_ANIMATIONS.xpGain;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          // Base styling
          'relative flex items-center space-x-3 p-4 rounded-lg shadow-lg border',
          'min-w-[280px] max-w-[400px]',

          // Glassmorphism effect - Dark & Minimal
          'bg-neutral-900/80 backdrop-blur-md',
          'border-transparent', // Handled by inner div

          // Hover and interaction states
          'hover:bg-neutral-800',
          'cursor-pointer transition-all duration-200',

          // Custom className
          className
        )}
        onClick={onClose}
        {...animations}
        layout={!isReducedMotion}
      >
        {/* Minimal border - no gradients */}
        <div className="absolute inset-0 rounded-lg border border-white/10 -z-10" />

        {/* Source icon - simplified */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
          'bg-amber-500/10 text-amber-500',
          'border border-amber-500/20'
        )}>
          <sourceConfig.icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-base font-semibold text-white tracking-tight">
              +{notification.amount} XP
            </span>
          </div>

          <p className="text-xs text-white/60">
            {sourceConfig.displayName}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Progress bar - minimal */}
        {!isReducedMotion && (
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-amber-500/50 rounded-b-lg"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default XPGainToast;
