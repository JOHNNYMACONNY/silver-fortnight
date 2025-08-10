import React from 'react';
import { motion } from 'framer-motion';
import { Achievement, AchievementRarity } from '../../types/gamification';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  showDetails?: boolean;
  className?: string;
  animated?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  unlocked,
  size = 'medium',
  showTooltip = true,
  showDetails = false,
  className = '',
  animated = true
}) => {
  const sizeClasses = {
    small: {
      container: 'w-10 h-10',
      icon: 'text-lg',
      text: 'text-xs'
    },
    medium: {
      container: 'w-14 h-14',
      icon: 'text-2xl',
      text: 'text-sm'
    },
    large: {
      container: 'w-20 h-20',
      icon: 'text-3xl',
      text: 'text-base'
    }
  };

  const rarityColors = {
    [AchievementRarity.COMMON]: {
      bg: 'from-gray-400 to-gray-600',
      border: 'border-gray-400',
      glow: 'shadow-gray-400/50'
    },
    [AchievementRarity.UNCOMMON]: {
      bg: 'from-green-400 to-green-600',
      border: 'border-green-400',
      glow: 'shadow-green-400/50'
    },
    [AchievementRarity.RARE]: {
      bg: 'from-blue-400 to-blue-600',
      border: 'border-blue-400',
      glow: 'shadow-blue-400/50'
    },
    [AchievementRarity.EPIC]: {
      bg: 'from-purple-400 to-purple-600',
      border: 'border-purple-400',
      glow: 'shadow-purple-400/50'
    },
    [AchievementRarity.LEGENDARY]: {
      bg: 'from-yellow-400 to-orange-500',
      border: 'border-yellow-400',
      glow: 'shadow-yellow-400/50'
    }
  };

  const sizes = sizeClasses[size];
  const colors = rarityColors[achievement.rarity];

  const BadgeComponent = (
    <motion.div
      className={`relative inline-flex items-center justify-center ${sizes.container} ${className}`}
      initial={animated && unlocked ? { scale: 0, rotate: -180 } : undefined}
      animate={animated && unlocked ? { scale: 1, rotate: 0 } : undefined}
      transition={animated ? { 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 0.8 
      } : undefined}
      whileHover={animated ? { scale: 1.1 } : undefined}
      whileTap={animated ? { scale: 0.95 } : undefined}
    >
      {/* Background Circle */}
      <div
        className={`absolute inset-0 rounded-full border-2 ${
          unlocked 
            ? `bg-gradient-to-br ${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
            : 'bg-muted border-border'
        }`}
      />
      
      {/* Glow Effect for Unlocked Achievements */}
      {unlocked && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.bg} opacity-30 blur-sm`}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Icon */}
      <div className={`relative z-10 ${sizes.icon} ${
        unlocked 
          ? 'text-white drop-shadow-sm' 
          : 'text-muted-foreground'
      }`}>
        {unlocked ? achievement.icon : '🔒'}
      </div>
      
      {/* Rarity Indicator */}
      {unlocked && achievement.rarity !== AchievementRarity.COMMON && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-card border border-border flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${colors.bg}`} />
        </div>
      )}
    </motion.div>
  );

  if (showDetails) {
    return (
      <div className="flex items-start space-x-3 p-3 bg-card text-card-foreground rounded-lg border border-border">
        {BadgeComponent}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${unlocked ? 'text-card-foreground' : 'text-muted-foreground'} ${sizes.text}`}>
            {unlocked ? achievement.title : '???'}
          </h3>
          <p className={`text-muted-foreground ${sizes.text === 'text-base' ? 'text-sm' : 'text-xs'} mt-1`}>
            {unlocked ? achievement.description : 'Achievement locked'}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              unlocked 
                ? `bg-gradient-to-r ${colors.bg} text-white`
                : 'bg-muted text-muted-foreground'
            }`}>
              {achievement.rarity}
            </span>
            {unlocked && (
              <span className="text-xs text-muted-foreground">
                +{achievement.xpReward} XP
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showTooltip) {
    return (
      <div className="group relative inline-block">
        {BadgeComponent}
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 max-w-xs">
          <div className="font-semibold">
            {unlocked ? achievement.title : 'Locked Achievement'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {unlocked ? achievement.description : 'Complete requirements to unlock'}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs px-2 py-1 rounded ${
              unlocked 
                ? `bg-gradient-to-r ${colors.bg}`
                : 'bg-muted'
            }`}>
              {achievement.rarity}
            </span>
            {unlocked && (
              <span className="text-xs text-yellow-400">
                +{achievement.xpReward} XP
              </span>
            )}
          </div>
          
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
        </div>
      </div>
    );
  }

  return BadgeComponent;
};

/**
 * Achievement Badge variants for different use cases
 */
export const CompactAchievementBadge: React.FC<Omit<AchievementBadgeProps, 'size' | 'showDetails'>> = (props) => (
  <AchievementBadge {...props} size="small" showDetails={false} />
);

export const DetailedAchievementBadge: React.FC<Omit<AchievementBadgeProps, 'size' | 'showDetails'>> = (props) => (
  <AchievementBadge {...props} size="large" showDetails={true} />
);

export default AchievementBadge;
