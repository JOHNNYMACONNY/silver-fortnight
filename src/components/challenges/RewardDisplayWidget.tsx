import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { CompletionReward } from '../../services/challengeCompletion';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Award, 
  Star, 
  Zap, 
  Trophy,
  TrendingUp,
  Gift,
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react';

interface RewardDisplayWidgetProps {
  rewards: CompletionReward;
  challengeTitle: string;
  isVisible: boolean;
  onClose?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export const RewardDisplayWidget: React.FC<RewardDisplayWidgetProps> = ({
  rewards,
  challengeTitle,
  isVisible,
  onClose,
  onViewDetails,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Stagger animations
      const timer1 = setTimeout(() => setAnimationStep(1), 300);
      const timer2 = setTimeout(() => setAnimationStep(2), 600);
      const timer3 = setTimeout(() => setAnimationStep(3), 900);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible]);

  const totalXP = rewards.xp + rewards.bonusXP;

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'early_completion': return '⚡';
      case 'perfect_score': return '🎯';
      case 'first_attempt': return '🎪';
      case 'streak_bonus': return '🔥';
      default: return '✨';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-overlay flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn("w-full max-w-md", className)}
          >
            <Card className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md border-purple-500/30 overflow-hidden">
              {/* Header */}
              <div className="relative p-6 text-center">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: animationStep >= 1 ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="relative mb-4"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: animationStep >= 2 ? 1 : 0, scale: animationStep >= 2 ? 1 : 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: animationStep >= 1 ? 1 : 0, y: animationStep >= 1 ? 0 : 20 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xl font-bold text-white mb-2">Challenge Completed!</h3>
                  <p className="text-gray-300 text-sm">{challengeTitle}</p>
                </motion.div>
              </div>

              <CardContent className="space-y-4">
                 {/* Main XP Reward: Base vs Bonus */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: animationStep >= 2 ? 1 : 0, x: animationStep >= 2 ? 0 : -20 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500/30 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Experience Points</div>
                      <div className="text-xs text-gray-300">
                        <span className="text-gray-200">Base:</span> +{rewards.xp}
                        {rewards.bonusXP > 0 && (
                          <>
                            <span className="mx-1 text-gray-500">/</span>
                            <span className="text-green-400">Bonus:</span> +{rewards.bonusXP}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: animationStep >= 3 ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.6 }}
                    className="text-2xl font-bold text-yellow-400"
                  >
                    +{totalXP}
                  </motion.div>
                </motion.div>

                {/* Special Rewards */}
                {rewards.specialRewards && rewards.specialRewards.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: animationStep >= 3 ? 1 : 0, y: animationStep >= 3 ? 0 : 20 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                      <Gift className="w-4 h-4" />
                      <span>Special Bonuses</span>
                    </h4>
                    {rewards.specialRewards.map((reward, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getRewardTypeIcon(reward.type)}</span>
                          <span className="text-sm text-gray-300">{reward.description}</span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          +{reward.value}
                        </Badge>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Tier Progress */}
                {rewards.tierProgress && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: animationStep >= 3 ? 1 : 0, y: animationStep >= 3 ? 0 : 20 }}
                    transition={{ delay: 0.9 }}
                    className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">Tier Progress</span>
                    </div>
                    {rewards.tierProgress.tierUnlocked ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <div className="text-sm text-green-300 font-medium">
                            New Tier Unlocked!
                          </div>
                          <div className="text-xs text-gray-300">
                            {rewards.tierProgress.tierUnlocked} challenges available
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-300">
                        Progress made toward next tier (+{rewards.tierProgress.progressMade})
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Achievements */}
                {rewards.achievements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: animationStep >= 3 ? 1 : 0, y: animationStep >= 3 ? 0 : 20 }}
                    transition={{ delay: 1.0 }}
                    className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">New Achievements</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rewards.achievements.map((achievement, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1 + index * 0.1 }}
                        >
                          <Badge className="bg-purple-500/30 text-purple-200 border-purple-500/40">
                            🏆 {achievement}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: animationStep >= 3 ? 1 : 0, y: animationStep >= 3 ? 0 : 20 }}
                  transition={{ delay: 1.2 }}
                  className="flex space-x-3 pt-2"
                >
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Continue
                  </Button>
                  {onViewDetails && (
                    <Button
                      onClick={onViewDetails}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </motion.div>

                {/* Summary Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showDetails ? 1 : 0 }}
                  className="text-center pt-2 border-t border-gray-600"
                >
                  <Button
                    onClick={() => setShowDetails(!showDetails)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    {showDetails ? 'Hide' : 'Show'} Summary
                  </Button>
                  
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2 text-xs text-gray-400"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="font-medium text-gray-300">Total XP Earned</div>
                            <div className="text-yellow-400">{totalXP}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-300">Bonuses</div>
                            <div className="text-green-400">{rewards.specialRewards?.length || 0}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
