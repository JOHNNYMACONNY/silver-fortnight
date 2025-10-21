import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MOTION_VARIANTS } from '../../utils/animations';

// Animation types supported by the component
export type AnimationType =
  | 'fade'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'popIn'
  | 'none';

// Animation direction for list items
export type AnimationDirection = 'up' | 'down' | 'left' | 'right';

interface AnimatedComponentProps {
  children: ReactNode;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AnimatedComponent - A wrapper component that adds animations to any content
 *
 * This component uses Framer Motion to provide smooth, performant animations
 * with minimal configuration. It supports various animation types and can be
 * customized with different durations, delays, and other motion properties.
 *
 * @example
 * // Basic usage with default animation (fade)
 * <AnimatedComponent>
 *   <div>This content will fade in</div>
 * </AnimatedComponent>
 *
 * @example
 * // Custom animation with delay
 * <AnimatedComponent animation="slideUp" delay={0.2}>
 *   <div>This content will slide up after a 0.2s delay</div>
 * </AnimatedComponent>
 */
const AnimatedComponent: React.FC<AnimatedComponentProps> = ({
  children,
  animation = 'fade',
  duration = 0.5,
  delay = 0,
  className = '',
  style = {},
}) => {
  // Skip animation if animation type is 'none'
  if (animation === 'none') {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // Get the appropriate variants based on the animation type
  const selectedVariants = MOTION_VARIANTS[animation];

  // Create custom transition based on duration and delay
  const customTransition = {
    duration,
    delay,
  };

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      variants={selectedVariants}
      transition={customTransition}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedComponent;
