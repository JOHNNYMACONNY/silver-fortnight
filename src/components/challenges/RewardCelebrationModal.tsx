/**
 * RewardCelebrationModal
 * 
 * Premium glassmorphic celebration modal that displays rewards after challenge completion.
 * Features:
 * - Subtle particle effects using canvas-confetti
 * - Animated XP counter
 * - Achievement badges display
 * - Tier unlock announcements
 * - Smooth framer-motion animations
 * - Auto-dismiss after 5 seconds
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, Award, TrendingUp, Star, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CompletionReward } from '../../types/gamification';

interface RewardCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: CompletionReward;
  challengeTitle: string;
  autoDismissDelay?: number; // milliseconds, default 10000
}

export const RewardCelebrationModal: React.FC<RewardCelebrationModalProps> = ({
  isOpen,
  onClose,
  rewards,
  challengeTitle,
  autoDismissDelay = 10000,
}) => {
  const [displayedXP, setDisplayedXP] = useState(0);
  const hasTriggeredConfetti = useRef(false);
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  const totalXP = rewards.xp + rewards.bonusXP;
  const hasAchievements = rewards.achievements && rewards.achievements.length > 0;
  const hasTierProgress = rewards.tierProgress?.tierUnlocked;

  // Trigger celebration effects when modal opens
  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti.current) {
      // Trigger subtle confetti burst
      triggerGlassmorphicConfetti();
      hasTriggeredConfetti.current = true;

      // Start XP counter animation
      animateXPCounter();

      // Set auto-dismiss timer
      autoDismissTimer.current = setTimeout(() => {
        onClose();
      }, autoDismissDelay);
    }

    // Cleanup
    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [isOpen]);

  // Reset confetti trigger when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasTriggeredConfetti.current = false;
      setDisplayedXP(0);
    }
  }, [isOpen]);

  const triggerGlassmorphicConfetti = () => {
    const duration = 3000; // Increased from 2000 to 3000
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5, // Increased from 3 to 5
        angle: 60,
        spread: 60, // Increased spread
        origin: { x: 0, y: 0.6 },
        colors: ['#ffffff', '#10b981', '#34d399', '#6ee7b7', '#a5b4fc'], // Added green
        shapes: ['circle'],
        gravity: 0.8,
        scalar: 1.0, // Increased from 0.8
        drift: 0,
        ticks: 200, // Increased from 150
        disableForReducedMotion: true,
      });

      confetti({
        particleCount: 5, // Increased from 3 to 5
        angle: 120,
        spread: 60, // Increased spread
        origin: { x: 1, y: 0.6 },
        colors: ['#ffffff', '#10b981', '#34d399', '#6ee7b7', '#a5b4fc'], // Added green
        shapes: ['circle'],
        gravity: 0.8,
        scalar: 1.0, // Increased from 0.8
        drift: 0,
        ticks: 200, // Increased from 150
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const animateXPCounter = () => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = totalXP / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      
      if (step >= steps) {
        setDisplayedXP(totalXP);
        clearInterval(timer);
      } else {
        setDisplayedXP(Math.floor(current));
      }
    }, duration / steps);
  };

  const handleClose = () => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.3 
              }}
              className="pointer-events-auto relative w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glassmorphic Card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl">
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors"
                  aria-label="Close reward modal"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="p-8 space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400/20 to-green-600/20 border border-green-400/30 backdrop-blur-sm"
                    >
                      <Award className="h-8 w-8 text-green-400" />
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold text-white"
                    >
                      Challenge Completed
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-white/70 max-w-md mx-auto"
                    >
                      {challengeTitle}
                    </motion.p>
                  </div>

                  {/* XP Reward */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/30">
                          <Zap className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white/70">XP Earned</p>
                          <p className="text-3xl font-bold text-white">
                            +{displayedXP.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {rewards.bonusXP > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-400"
                        >
                          +{rewards.bonusXP} Bonus
                        </Badge>
                      )}
                    </div>

                    {/* Breakdown if there's bonus XP */}
                    {rewards.bonusXP > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ delay: 1.2 }}
                        className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm"
                      >
                        <div className="flex justify-between text-white/60">
                          <span>Base XP</span>
                          <span>+{rewards.xp}</span>
                        </div>
                        {rewards.specialRewards && rewards.specialRewards.map((reward, i) => (
                          <div key={i} className="flex justify-between text-white/60">
                            <span>{reward.description}</span>
                            <span className="text-green-400">+{reward.value}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Tier Progress */}
                  {hasTierProgress && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400/20 to-purple-500/20 border border-blue-400/30">
                          <TrendingUp className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">New Tier Unlocked</p>
                          <p className="text-xs text-white/60">{rewards.tierProgress.tierUnlocked}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Achievements */}
                  {hasAchievements && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Star className="h-4 w-4 text-yellow-400" />
                        New Achievements
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rewards.achievements.map((achievementId, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300"
                          >
                            {achievementId}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Action Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="pt-4"
                  >
                    <Button
                      onClick={handleClose}
                      variant="glassmorphic"
                      className="w-full shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 ring-1 ring-green-500/20"
                    >
                      Continue
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

