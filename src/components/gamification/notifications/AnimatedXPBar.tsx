import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface AnimatedXPBarProps {
  currentXP: number;
  maxXP: number;
  previousXP?: number;
  level: number;
  showLabels?: boolean;
  showAnimation?: boolean;
  isReducedMotion?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const AnimatedXPBar: React.FC<AnimatedXPBarProps> = ({
  currentXP,
  maxXP,
  previousXP,
  level,
  showLabels = true,
  showAnimation = true,
  isReducedMotion = false,
  className = '',
  size = 'medium'
}) => {
  const [displayXP, setDisplayXP] = useState(previousXP || currentXP);
  const controls = useAnimation();

  // Size configurations
  const sizeConfig = {
    small: {
      height: 'h-2',
      text: 'text-xs',
      padding: 'px-2 py-1'
    },
    medium: {
      height: 'h-3',
      text: 'text-sm',
      padding: 'px-3 py-1.5'
    },
    large: {
      height: 'h-4',
      text: 'text-base',
      padding: 'px-4 py-2'
    }
  };

  const config = sizeConfig[size];

  // Calculate progress percentage
  const progressPercentage = Math.min((displayXP / maxXP) * 100, 100);
  const targetPercentage = Math.min((currentXP / maxXP) * 100, 100);

  // Animate XP changes
  useEffect(() => {
    if (!showAnimation || isReducedMotion || previousXP === undefined) {
      setDisplayXP(currentXP);
      return;
    }

    const animateXP = async () => {
      // Animate the number counting up
      const duration = Math.min(Math.abs(currentXP - previousXP) * 10, 2000); // Max 2 seconds
      const steps = 60; // 60fps
      const stepDuration = duration / steps;
      const stepSize = (currentXP - previousXP) / steps;

      for (let i = 0; i <= steps; i++) {
        const newXP = previousXP + (stepSize * i);
        setDisplayXP(Math.round(newXP));
        
        if (i < steps) {
          await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
      }
    };

    animateXP();
  }, [currentXP, previousXP, showAnimation, isReducedMotion]);

  // Trigger glow animation when XP increases
  useEffect(() => {
    if (showAnimation && !isReducedMotion && previousXP !== undefined && currentXP > previousXP) {
      controls.start({
        boxShadow: [
          '0 0 0px rgba(249, 115, 22, 0)',
          '0 0 20px rgba(249, 115, 22, 0.6)',
          '0 0 0px rgba(249, 115, 22, 0)'
        ],
        transition: { duration: 1, ease: 'easeInOut' }
      });
    }
  }, [currentXP, previousXP, showAnimation, isReducedMotion, controls]);

  return (
    <div className={cn('w-full', className)}>
      {/* Labels */}
      {showLabels && (
        <div className={cn('flex justify-between items-center mb-2', config.text)}>
          <span className={cn('font-medium', 'text-primary')}>
            Level {level}
          </span>
          <span className={cn('text-muted')}>
            {Math.round(displayXP).toLocaleString()} / {maxXP.toLocaleString()} XP
          </span>
        </div>
      )}

      {/* Progress bar container */}
      <div className={cn(
        'relative w-full rounded-full overflow-hidden',
        config.height,
        'bg-neutral-200 dark:bg-neutral-700',
        'border border-gray-300 dark:border-gray-600'
      )}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
        
        {/* Progress fill */}
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            'bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500',
            'shadow-sm'
          )}
          initial={{ width: `${progressPercentage}%` }}
          animate={{ 
            width: `${targetPercentage}%`,
            ...(!isReducedMotion && showAnimation ? {
              background: [
                'linear-gradient(to right, #f97316, #a855f7, #3b82f6)',
                'linear-gradient(to right, #fb923c, #c084fc, #60a5fa)',
                'linear-gradient(to right, #f97316, #a855f7, #3b82f6)'
              ]
            } : {})
          }}
          transition={{
            width: { duration: isReducedMotion ? 0 : 1, ease: 'easeOut' },
            background: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{ minWidth: targetPercentage > 0 ? '4px' : '0px' }}
        />
        
        {/* Shine effect */}
        {showAnimation && !isReducedMotion && targetPercentage > 0 && (
          <motion.div
            className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut'
            }}
            style={{ width: `${targetPercentage}%` }}
          />
        )}
        
        {/* Glow effect */}
        {showAnimation && !isReducedMotion && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full',
              'bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20'
            )}
            animate={controls}
          />
        )}
      </div>

      {/* XP gain indicator */}
      {showAnimation && !isReducedMotion && previousXP !== undefined && currentXP > previousXP && (
        <motion.div
          className={cn(
            'absolute right-0 top-0 transform -translate-y-full',
            'bg-gradient-to-r from-orange-500 to-purple-600',
            'text-white text-xs font-bold rounded px-2 py-1',
            'shadow-lg'
          )}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: -5, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.8 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          +{currentXP - previousXP} XP
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-orange-500" />
        </motion.div>
      )}
    </div>
  );
};

export default AnimatedXPBar;
