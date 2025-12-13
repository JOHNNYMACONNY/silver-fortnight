import React from 'react';
import { motion, Transition } from 'framer-motion';
import { LEVEL_TIERS } from '../../types/gamification';

interface LevelBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
  showTooltip?: boolean;
  className?: string;
  animated?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  size = 'medium',
  showTitle = false,
  showTooltip = true,
  className = '',
  animated = true
}) => {
  const levelTier = LEVEL_TIERS.find(tier => tier.level === level) || LEVEL_TIERS[0];

  const sizeClasses = {
    small: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xs',
      badge: 'text-xs px-1 py-0.5'
    },
    medium: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-sm',
      badge: 'text-sm px-2 py-1'
    },
    large: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-base',
      badge: 'text-base px-3 py-1.5'
    }
  };

  const sizes = sizeClasses[size];

  const animationProps = animated ? {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      duration: 0.6
    } as Transition,
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 }
  } : {};

  const BadgeComponent = (
    <motion.div
      className={`relative inline-flex items-center justify-center ${sizes.container} ${className}`}
      {...animationProps}
    >
      {/* Background Circle */}
      <div
        className={`absolute inset-0 rounded-full shadow-lg`}
        style={{
          background: `linear-gradient(135deg, ${levelTier.color}, ${adjustBrightness(levelTier.color, -20)})`
        }}
      />

      {/* Glow Effect */}
      <div
        className={`absolute inset-0 rounded-full opacity-30 blur-sm`}
        style={{
          background: levelTier.color
        }}
      />

      {/* Icon */}
      <div className={`relative z-card-layer-1 text-foreground`}>
        <levelTier.icon className={sizes.icon} />
      </div>

      {/* Level Number */}
      <div className={`absolute -bottom-1 -right-1 bg-background rounded-full border-2 border-background ${sizes.badge} font-bold text-foreground shadow-sm`}>
        {level}
      </div>
    </motion.div>
  );

  if (showTitle) {
    return (
      <div className="flex items-center space-x-2">
        {BadgeComponent}
        <div>
          <div className={`font-semibold text-foreground ${sizes.text}`}>
            Level {level}
          </div>
          <div className={`text-muted-foreground ${sizes.text === 'text-base' ? 'text-sm' : 'text-xs'}`}>
            {levelTier.title}
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
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-tooltip">
          <div className="font-semibold">Level {level} - {levelTier.title}</div>
          <div className="text-xs text-muted-foreground">
            {levelTier.minXP === 0 ? '0' : levelTier.minXP.toLocaleString()} - {levelTier.maxXP === Infinity ? '∞' : levelTier.maxXP.toLocaleString()} XP
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
 * Utility function to adjust color brightness
 */
function adjustBrightness(color: string, amount: number): string {
  // Simple hex color brightness adjustment
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  return color;
}

/**
 * Level Badge variants for different use cases
 */
export const CompactLevelBadge: React.FC<Omit<LevelBadgeProps, 'size' | 'showTitle'>> = (props) => (
  <LevelBadge {...props} size="small" showTitle={false} />
);

export const DetailedLevelBadge: React.FC<Omit<LevelBadgeProps, 'size' | 'showTitle'>> = (props) => (
  <LevelBadge {...props} size="large" showTitle={true} />
);

export default LevelBadge;
