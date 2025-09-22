import React from 'react';
import { motion } from 'framer-motion';
import { TradeSkill } from '../../../services/firestore-exports';
import { cn } from '../../../utils/cn';

interface TradeSkillDisplayProps {
  skill: TradeSkill;
  className?: string;
  variant?: 'offered' | 'requested' | 'default';
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
}

export const TradeSkillDisplay: React.FC<TradeSkillDisplayProps> = ({ 
  skill, 
  className, 
  variant = 'default',
  size = 'md',
  showLevel = true
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    offered: 'border-success/30 bg-success/10 text-success-foreground hover:bg-success/20 hover:border-success/50',
    requested: 'border-info/30 bg-info/10 text-info-foreground hover:bg-info/20 hover:border-info/50',
    default: 'border-primary/30 bg-primary/10 text-primary-foreground hover:bg-primary/20 hover:border-primary/50'
  };

  return (
    <motion.span 
      className={cn(
        "glassmorphic inline-flex items-center rounded-full font-medium border transition-all duration-200",
        "hover:scale-105 hover:shadow-md backdrop-blur-sm",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="font-medium">{skill.name}</span>
      {showLevel && (
        <span className="ml-2 text-xs opacity-75 font-normal">
          ({skill.level})
        </span>
      )}
    </motion.span>
  );
};