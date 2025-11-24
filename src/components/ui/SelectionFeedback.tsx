import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { semanticClasses, type Topic } from '../../utils/semanticColors';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

export interface SelectionFeedbackProps {
  message: string;
  type?: 'success' | 'info';
  topic?: Topic;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  className?: string;
}

/**
 * SelectionFeedback Component
 * 
 * Animated feedback messages for user selections.
 * Uses Framer Motion for smooth animations and respects reduced motion preferences.
 */
export const SelectionFeedback: React.FC<SelectionFeedbackProps> = ({
  message,
  type = 'success',
  topic = 'success',
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 3000,
  className,
}) => {
  const { shouldUseReducedAnimations } = useMobileOptimization();
  const reducedMotion = shouldUseReducedAnimations();
  const semanticClassesData = semanticClasses(topic);

  React.useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay, onDismiss]);

  const Icon = type === 'success' ? CheckCircle : Info;

  const variants = {
    initial: reducedMotion 
      ? { opacity: 0 }
      : { opacity: 0, y: -10, scale: 0.95 },
    animate: reducedMotion
      ? { opacity: 1 }
      : { opacity: 1, y: 0, scale: 1 },
    exit: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: -10, scale: 0.95 },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg',
        'backdrop-blur-sm border',
        type === 'success'
          ? cn(
              semanticClassesData.bgSubtle,
              'border-success-500/20 text-success-700 dark:text-success-300'
            )
          : cn(
              'bg-blue-50 dark:bg-blue-950/20',
              'border-blue-500/20 text-blue-700 dark:text-blue-300'
            ),
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn(
        'w-5 h-5 flex-shrink-0',
        type === 'success' ? 'text-success-600 dark:text-success-400' : 'text-blue-600 dark:text-blue-400'
      )} />
      <span className="text-sm font-medium flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss feedback"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

