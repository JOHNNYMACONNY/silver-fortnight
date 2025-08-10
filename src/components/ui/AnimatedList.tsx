import React, { ReactNode, useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { MOTION_VARIANTS } from '../../utils/animations';
import { AnimationType } from './AnimatedComponent';
import { cn } from '../../utils/cn';

interface AnimatedListProps {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  animation?: AnimationType;
  staggerDelay?: number;
  duration?: number;
  initialDelay?: number;
  itemClassName?: string;
}

/**
 * AnimatedList - A component for animating lists with staggered animations
 * 
 * This component uses Framer Motion to provide smooth, staggered animations
 * for lists of items. Each child element will animate in sequence with a
 * configurable delay between them.
 * 
 * @example
 * // Basic usage with children
 * <AnimatedList>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </AnimatedList>
 */
const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  style = {},
  animation = 'fade',
  staggerDelay = 0.05,
  duration = 0.5,
  initialDelay = 0,
  itemClassName = '',
}) => {
  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      // Add listener for changes
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Skip animation if animation type is 'none' or reduced motion is preferred
  if (animation === 'none' || prefersReducedMotion) {
    return (
      <div className={cn(className)} style={style}>
        {children}
      </div>
    );
  }

  // Get the appropriate variants based on the animation type
  const itemVariants = MOTION_VARIANTS[animation];

  // Create container variants for staggered animations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  // Convert children to array to ensure proper mapping
  const childrenArray = React.Children.toArray(children);

  return (
    <motion.div
      className={cn(className)}
      style={style}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          className={cn(itemClassName)}
          variants={itemVariants}
          transition={{ duration }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AnimatedList;
