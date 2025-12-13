import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { ChameleonMascot, ChameleonVariant } from '../illustrations/ChameleonMascot';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  // Mascot props
  useMascot?: boolean;
  mascotVariant?: ChameleonVariant;
  mascotSize?: 'small' | 'medium' | 'large' | 'xl';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  useMascot = false,
  mascotVariant = 'empty',
  mascotSize = 'large',
}) => {
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-lg',
        'glassmorphic bg-white/5 dark:bg-white/5 border border-dashed border-white/20 dark:border-white/20',
        className
      )}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {(useMascot || icon) && (
        <motion.div 
          className="mb-4"
          variants={itemVariants}
        >
          {useMascot ? (
            <ChameleonMascot 
              variant={mascotVariant} 
              size={mascotSize}
              animated={true}
            />
          ) : (
            icon
          )}
        </motion.div>
      )}
      <motion.h3 
        className="text-xl font-semibold mb-2"
        variants={itemVariants}
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p 
          className="mb-6 max-w-md text-neutral-500 dark:text-neutral-400"
          variants={itemVariants}
        >
          {description}
        </motion.p>
      )}
      {actionLabel && onAction && (
        <motion.div variants={itemVariants}>
          <Button variant="glassmorphic" onClick={onAction} className="min-h-[44px]">
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
