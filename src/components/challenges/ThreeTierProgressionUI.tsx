import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { ThreeTierProgress, TierRequirement } from '../../types/gamification';
import { getUserThreeTierProgress, canAccessTier } from '../../services/threeTierProgression';
import { useAuth } from '../../AuthContext';
import { Lock, CheckCircle, Target, TrendingUp, Users, Zap } from 'lucide-react';

interface ThreeTierProgressionUIProps {
  onTierSelect?: (tier: 'SOLO' | 'TRADE' | 'COLLABORATION') => void;
  className?: string;
}

export const ThreeTierProgressionUI: React.FC<ThreeTierProgressionUIProps> = ({
  onTierSelect,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState<ThreeTierProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<'SOLO' | 'TRADE' | 'COLLABORATION'>('SOLO');

  useEffect(() => {
    const loadProgress = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      const response = await getUserThreeTierProgress(currentUser.uid);
      if (response.success && response.data) {
        setProgress(response.data);
        setSelectedTier(response.data.currentTier);
      }
      setLoading(false);
    };

    loadProgress();
  }, [currentUser]);

  const handleTierClick = async (tier: 'SOLO' | 'TRADE' | 'COLLABORATION') => {
    if (!currentUser) return;
    
    const canAccess = await canAccessTier(currentUser.uid, tier);
    if (canAccess) {
      setSelectedTier(tier);
      onTierSelect?.(tier);
    }
  };

  const getTierIcon = (tier: 'SOLO' | 'TRADE' | 'COLLABORATION') => {
    switch (tier) {
      case 'SOLO': return <Zap className="w-6 h-6" />;
      case 'TRADE': return <TrendingUp className="w-6 h-6" />;
      case 'COLLABORATION': return <Users className="w-6 h-6" />;
    }
  };

  const getTierDescription = (tier: 'SOLO' | 'TRADE' | 'COLLABORATION') => {
    switch (tier) {
      case 'SOLO': return 'Build individual skills and gain confidence';
      case 'TRADE': return 'Exchange skills with other users';
      case 'COLLABORATION': return 'Work together on team projects';
    }
  };

  const getTierColor = (tier: 'SOLO' | 'TRADE' | 'COLLABORATION') => {
    switch (tier) {
      case 'SOLO': return 'from-orange-500 to-orange-600';
      case 'TRADE': return 'from-blue-500 to-blue-600';
      case 'COLLABORATION': return 'from-purple-500 to-purple-600';
    }
  };

  const isUnlocked = (tier: 'SOLO' | 'TRADE' | 'COLLABORATION') => {
    return progress?.unlockedTiers.includes(tier) ?? false;
  };

  const getCompletionCount = (tier: 'SOLO' | 'TRADE' | 'COLLABORATION') => {
    if (!progress) return 0;
    switch (tier) {
      case 'SOLO': return progress.soloCompletions;
      case 'TRADE': return progress.tradeCompletions;
      case 'COLLABORATION': return progress.collaborationCompletions;
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">Challenge Progression</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{progress?.soloCompletions || 0}</div>
            <div className="text-sm text-gray-300">Solo Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{progress?.tradeCompletions || 0}</div>
            <div className="text-sm text-gray-300">Trade Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{progress?.collaborationCompletions || 0}</div>
            <div className="text-sm text-gray-300">Collaboration Completed</div>
          </div>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['SOLO', 'TRADE', 'COLLABORATION'] as const).map((tier) => {
          const unlocked = isUnlocked(tier);
          const completions = getCompletionCount(tier);
          const isSelected = selectedTier === tier;

          return (
            <motion.div
              key={tier}
              whileHover={unlocked ? { scale: 1.02 } : {}}
              whileTap={unlocked ? { scale: 0.98 } : {}}
              className={cn(
                "relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer",
                unlocked 
                  ? "border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/15" 
                  : "border-gray-600 bg-gray-800/50 cursor-not-allowed",
                isSelected && unlocked && "ring-2 ring-white/50"
              )}
              onClick={() => handleTierClick(tier)}
            >
              {/* Background Gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-20",
                getTierColor(tier)
              )} />

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      unlocked ? "bg-white/20" : "bg-gray-700"
                    )}>
                      {getTierIcon(tier)}
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-semibold",
                        unlocked ? "text-white" : "text-gray-400"
                      )}>
                        {tier}
                      </h4>
                      <p className={cn(
                        "text-sm",
                        unlocked ? "text-gray-300" : "text-gray-500"
                      )}>
                        {getTierDescription(tier)}
                      </p>
                    </div>
                  </div>
                  
                  {unlocked ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-500" />
                  )}
                </div>

                {/* Completion Count */}
                <div className="mb-4">
                  <div className={cn(
                    "text-2xl font-bold",
                    unlocked ? "text-white" : "text-gray-500"
                  )}>
                    {completions}
                  </div>
                  <div className={cn(
                    "text-sm",
                    unlocked ? "text-gray-300" : "text-gray-500"
                  )}>
                    Challenges Completed
                  </div>
                </div>

                {/* Unlock Requirements */}
                {!unlocked && progress?.nextTierRequirements?.tier === tier && (
                  <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">Unlock Requirements</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {progress.nextTierRequirements.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Next Tier Progress */}
      {progress?.nextTierRequirements && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h4 className="font-semibold text-white mb-3">Next Tier Progress</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Challenge Completions</span>
                <span className="text-white">
                  {getCompletionCount(progress.currentTier)} / {progress.nextTierRequirements.requiredCompletions}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (getCompletionCount(progress.currentTier) / progress.nextTierRequirements.requiredCompletions) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            {progress.nextTierRequirements.requiredSkillLevel && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Skill Level</span>
                  <span className="text-white">
                    {Math.max(...progress.skillProgression.map(s => s.currentLevel), 1)} / {progress.nextTierRequirements.requiredSkillLevel}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, (Math.max(...progress.skillProgression.map(s => s.currentLevel), 1) / (progress.nextTierRequirements.requiredSkillLevel || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
