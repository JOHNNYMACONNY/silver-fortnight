import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
          
          // Glassmorphism effect
          'backdrop-blur-md bg-[--glass-bg]',
          'border-border-secondary',
          
          // Hover and interaction states
          'hover:bg-[--glass-bg-hover]',
          'cursor-pointer transition-all duration-200',
          
          // Custom className
          className
        )}
        onClick={onClose}
        {...animations}
        layout={!isReducedMotion}
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20 -z-10" />
        
        {/* Source icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-orange-500 to-purple-600',
          'text-white text-lg font-bold shadow-md'
        )}>
          {sourceConfig.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={cn(
              'text-lg font-bold',
              'bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent'
            )}>
              +{notification.amount} XP
            </span>
            
            {/* XP gain animation effect */}
            {!isReducedMotion && (
              <motion.div
                className="text-orange-500"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                ✨
              </motion.div>
            )}
          </div>
          
          <p className={cn(
            'text-sm font-medium',
            'text-text-primary'
          )}>
            {sourceConfig.displayName}
          </p>
          
          {notification.description && (
            <p className={cn(
              'text-xs mt-1 truncate',
              'text-text-muted'
            )}>
              {notification.description}
            </p>
          )}
        </div>
        
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
            'hover:bg-interactive-secondary-hover',
            'transition-colors duration-150',
            'text-text-muted',
            'hover:text-text-primary'
          )}
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Progress bar for auto-dismiss */}
        {!isReducedMotion && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-500 to-purple-600 rounded-b-lg"
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
