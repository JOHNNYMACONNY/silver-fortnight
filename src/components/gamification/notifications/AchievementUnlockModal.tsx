import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AchievementUnlockNotification, NOTIFICATION_ANIMATIONS } from '../../../types/gamificationNotifications';
import { cn } from '../../../utils/cn';

interface AchievementUnlockModalProps {
  notification: AchievementUnlockNotification;
  isOpen: boolean;
  onClose: () => void;
  isReducedMotion?: boolean;
}

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  notification,
  isOpen,
  onClose,
  isReducedMotion = false
}) => {
  const [showGlow, setShowGlow] = useState(false);

  // Trigger glow animation after modal appears
  useEffect(() => {
    if (isOpen && !isReducedMotion) {
      const timer = setTimeout(() => setShowGlow(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isReducedMotion]);

  // Auto-close after 4 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const animations = isReducedMotion 
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
      }
    : NOTIFICATION_ANIMATIONS.achievement;

  // Rarity-based styling
  const rarityConfig = {
    common: {
      gradient: 'from-gray-400 to-gray-600',
      glow: 'shadow-gray-500/50',
      border: 'border-gray-400/30'
    },
    uncommon: {
      gradient: 'from-green-400 to-green-600',
      glow: 'shadow-green-500/50',
      border: 'border-green-400/30'
    },
    rare: {
      gradient: 'from-blue-400 to-blue-600',
      glow: 'shadow-blue-500/50',
      border: 'border-blue-400/30'
    },
    epic: {
      gradient: 'from-purple-400 to-purple-600',
      glow: 'shadow-purple-500/50',
      border: 'border-purple-400/30'
    },
    legendary: {
      gradient: 'from-yellow-400 to-orange-600',
      glow: 'shadow-yellow-500/50',
      border: 'border-yellow-400/30'
    }
  };

  const rarity = rarityConfig[notification.rarity];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-max flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          
          {/* Sparkle effects */}
          {showGlow && !isReducedMotion && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 1,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Modal content */}
          <motion.div
            className={cn(
              'relative w-full max-w-sm mx-auto',
              'bg-card rounded-2xl shadow-2xl',
              'border-2', rarity.border,
              'backdrop-blur-md',
              showGlow && !isReducedMotion && `shadow-2xl ${rarity.glow}`
            )}
            onClick={(e) => e.stopPropagation()}
            {...animations}
          >
            {/* Animated border glow */}
            {showGlow && !isReducedMotion && (
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-2xl',
                  'bg-gradient-to-r', rarity.gradient,
                  'opacity-20 blur-sm -z-10'
                )}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            )}
            
            {/* Header */}
            <div className="text-center pt-8 pb-6 px-6">
              <motion.div
                className="text-5xl mb-4"
                initial={isReducedMotion ? {} : { scale: 0, rotate: -180 }}
                animate={isReducedMotion ? {} : { scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                🏆
              </motion.div>
              
              <motion.h2
                className={cn(
                  'text-2xl font-bold mb-2',
                  'bg-gradient-to-r', rarity.gradient, 'bg-clip-text text-transparent'
                )}
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Achievement Unlocked!
              </motion.h2>
              
              <motion.div
                className={cn(
                  'inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide',
                  'bg-gradient-to-r', rarity.gradient, 'text-primary-foreground'
                )}
                initial={isReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                animate={isReducedMotion ? {} : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                {notification.rarity}
              </motion.div>
            </div>
            
            {/* Achievement details */}
            <div className="px-6 pb-6">
              <motion.div
                className="text-center mb-6"
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {/* Achievement icon */}
                <div className={cn(
                  'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl',
                  'bg-gradient-to-br', rarity.gradient,
                  'shadow-lg', showGlow && !isReducedMotion && rarity.glow
                )}>
                  {notification.achievementIcon}
                </div>
                
                {/* Achievement name */}
                <h3 className="text-lg font-semibold text-foreground">
                  {notification.achievementName}
                </h3>
                
                {/* Description */}
                <p className="text-sm mt-1 text-muted-foreground">
                  {notification.description}
                </p>
              </motion.div>
              
              {/* XP Reward */}
              <motion.div
                className="flex items-center justify-center space-x-2"
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <span className="text-yellow-400 font-bold text-lg">
                  +{notification.xpGained} XP
                </span>
                <span className="text-sm text-muted-foreground">
                  (Total: {notification.newTotalXP})
                </span>
              </motion.div>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-6">
              <motion.button
                onClick={onClose}
                className={cn(
                  'w-full py-2 px-4 rounded-lg text-sm font-medium',
                  'bg-gradient-to-r', rarity.gradient,
                  'text-primary-foreground shadow-lg',
                  'hover:brightness-110',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2'
                )}
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={isReducedMotion ? {} : { scale: 1.02 }}
                whileTap={isReducedMotion ? {} : { scale: 0.98 }}
              >
                Awesome!
              </motion.button>
              
              <p className={cn('text-xs text-center mt-3 text-muted-foreground')}>
                Tap anywhere to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementUnlockModal;
