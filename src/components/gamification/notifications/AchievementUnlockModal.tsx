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
      color: 'text-slate-400',
      badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    },
    uncommon: {
      color: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    rare: {
      color: 'text-blue-400',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    epic: {
      color: 'text-violet-400',
      badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
    },
    legendary: {
      color: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Modal content */}
          <motion.div
            className={cn(
              'relative w-full max-w-sm mx-auto overflow-hidden',
              'bg-neutral-900/90 backdrop-blur-xl rounded-2xl shadow-xl',
              'border border-white/5'
            )}
            onClick={(e) => e.stopPropagation()}
            {...animations}
          >

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
                className="text-xl font-bold mb-3 text-white"
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Achievement Unlocked
              </motion.h2>

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
                  'w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center text-3xl',
                  'bg-white/5 border border-white/10',
                  rarity.color
                )}>
                  {notification.achievementIcon}
                </div>

                {/* Achievement name */}
                <h3 className="text-base font-semibold text-white">
                  {notification.achievementTitle}
                </h3>

                {/* Description */}
                <p className="text-sm mt-1 text-white/50">
                  {notification.achievementDescription}
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
                  +{notification.xpReward} XP
                </span>
                <span className="text-sm text-muted-foreground">
                  {/* total XP not provided in type; omit */}
                </span>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <motion.button
                onClick={onClose}
                className={cn(
                  'w-full py-2.5 px-4 rounded-lg text-sm font-medium',
                  'bg-white/10 hover:bg-white/20',
                  'text-white',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white/20'
                )}
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={isReducedMotion ? {} : { scale: 1.02 }}
                whileTap={isReducedMotion ? {} : { scale: 0.98 }}
              >
                Awesome
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
