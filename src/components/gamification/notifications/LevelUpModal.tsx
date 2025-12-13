import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { LevelUpNotification, NOTIFICATION_ANIMATIONS } from '../../../types/gamificationNotifications';
import { LEVEL_TIERS } from '../../../types/gamification';
import { cn } from '../../../utils/cn';
import { LevelBadge } from '../LevelBadge';

interface LevelUpModalProps {
  notification: LevelUpNotification;
  isOpen: boolean;
  onClose: () => void;
  isReducedMotion?: boolean;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  notification,
  isOpen,
  onClose,
  isReducedMotion = false
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const levelTier = LEVEL_TIERS.find(tier => tier.level === notification.newLevel);

  // Trigger confetti animation after modal appears
  useEffect(() => {
    if (isOpen && !isReducedMotion) {
      const timer = setTimeout(() => setShowConfetti(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isReducedMotion]);

  // Auto-close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 5000);
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
    : NOTIFICATION_ANIMATIONS.levelUp;

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Confetti particles */}
          {showConfetti && !isReducedMotion && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    'absolute w-2 h-2 rounded-full',
                    i % 4 === 0 ? 'bg-yellow-400' :
                      i % 4 === 1 ? 'bg-primary' :
                        i % 4 === 2 ? 'bg-purple-500' : 'bg-blue-500'
                  )}
                  initial={{
                    x: '50vw',
                    y: '50vh',
                    scale: 0,
                    rotate: 0
                  }}
                  animate={{
                    x: `${Math.random() * 100}vw`,
                    y: `${Math.random() * 100}vh`,
                    scale: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 0.5,
                    ease: 'easeOut'
                  }}
                />
              ))}
            </div>
          )}

          {/* Modal content */}
          <motion.div
            className={cn(
              'relative w-full max-w-sm mx-auto',
              'bg-neutral-900/90 backdrop-blur-xl rounded-2xl shadow-2xl',
              'border border-white/5'
            )}
            onClick={(e) => e.stopPropagation()}
            {...animations}
          >
            {/* Minimal border - no gradients */}
            <div className="absolute inset-0 rounded-2xl border border-white/5 -z-10" />

            {/* Header */}
            <div className="text-center pt-8 pb-6 px-6">
              <motion.div
                className="mb-4 flex justify-center text-amber-500"
                initial={isReducedMotion ? {} : { scale: 0, rotate: -180 }}
                animate={isReducedMotion ? {} : { scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <PartyPopper className="w-12 h-12 opacity-90" />
              </motion.div>

              <motion.h2
                className="text-2xl font-bold mb-2 text-white"
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Level Up
              </motion.h2>

              <motion.p
                className="text-base text-white/50"
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                You've reached a new tier
              </motion.p>
            </div>

            {/* Level progression */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-center space-x-6 mb-6">
                {/* Previous level */}
                <div className="text-center">
                  <LevelBadge
                    level={notification.previousLevel}
                    size="large"
                    animated={!isReducedMotion}
                  />
                  <p className="text-sm mt-2 text-muted-foreground">
                    Level {notification.previousLevel}
                  </p>
                </div>

                {/* Arrow */}
                <motion.div
                  className="text-2xl text-primary"
                  initial={isReducedMotion ? {} : { x: -20, opacity: 0 }}
                  animate={isReducedMotion ? {} : { x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  →
                </motion.div>

                {/* New level */}
                <div className="text-center">
                  <motion.div
                    initial={isReducedMotion ? {} : { scale: 0 }}
                    animate={isReducedMotion ? {} : { scale: 1 }}
                    transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                  >
                    <LevelBadge
                      level={notification.newLevel}
                      size="large"
                      animated={!isReducedMotion}
                    />
                  </motion.div>
                  <p className="text-sm mt-2 font-semibold text-foreground">
                    Level {notification.newLevel}
                  </p>
                </div>
              </div>

              {/* Level tier info */}
              {levelTier && (
                <motion.div
                  className={cn(
                    'text-center p-4 rounded-lg',
                    'bg-gradient-to-r from-primary/10 to-purple-600/10',
                    'border border-primary/20'
                  )}
                  initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {notification.levelTitle || levelTier.title}
                  </h3>
                  {/* LevelTier has no description field in types; omit */}

                  {notification.benefits && notification.benefits.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2 text-foreground">
                        New Benefits:
                      </p>
                      <ul className="text-sm space-y-1">
                        {notification.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center justify-center text-muted-foreground">
                            <span className="text-green-500 mr-2">✓</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <motion.button
                onClick={onClose}
                className={cn(
                  'w-full py-3 px-4 rounded-lg font-medium text-sm',
                  'bg-amber-500 hover:bg-amber-600',
                  'text-white',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
                )}
                initial={isReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={isReducedMotion ? {} : { scale: 1.02 }}
                whileTap={isReducedMotion ? {} : { scale: 0.98 }}
              >
                Continue
              </motion.button>

              <p className="text-xs text-center mt-3 text-muted-foreground">
                This modal will close automatically in a few seconds
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpModal;
