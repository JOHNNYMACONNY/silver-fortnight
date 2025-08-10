import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/cn';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type AnimationVariant = 'fade' | 'slide' | 'kinetic' | 'wave';

interface AnimatedHeadingProps {
  children: React.ReactNode;
  as?: HeadingLevel;
  className?: string;
  animation?: AnimationVariant;
  delay?: number;
  once?: boolean;
  margin?: string;
}

/**
 * AnimatedHeading component for kinetic typography effects
 * 
 * @param children - The heading content
 * @param as - The heading level (h1-h6)
 * @param className - Additional CSS classes
 * @param animation - The animation variant to use
 * @param delay - Delay before animation starts (in seconds)
 * @param once - Whether to animate only once when in view
 * @param margin - Viewport margin for triggering animation
 */
export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({
  children,
  as = 'h2',
  className = '',
  animation = 'slide',
  delay = 0,
  once = true,
  margin = "-100px",
}) => {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];
  
  // Define animation variants
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slide: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    kinetic: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          type: "spring" as const,
          stiffness: 100,
          damping: 10,
        }
      },
    },
    wave: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
        }
      },
    },
  };

  // Special case for wave animation - we need to wrap each character
  if (animation === 'wave') {
    const text = React.Children.toArray(children)[0];
    
    if (typeof text === 'string') {
      if (shouldReduceMotion) {
        // Render statically if reduced motion is preferred
        return React.createElement(as, { className }, text);
      }
      return (
        <Component
          className={className}
          initial="hidden"
          whileInView="visible"
          viewport={{ once, margin }}
          variants={variants.wave}
        >
          {text.split('').map((char, index) => (
            <motion.span
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring" as const,
                    damping: 10,
                    stiffness: 100,
                    delay: delay + (index * 0.05),
                  }
                }
              }}
              style={{ display: 'inline-block' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </Component>
      );
    }
  }

  if (shouldReduceMotion) {
    // Render statically if reduced motion is preferred
    return React.createElement(as, { className }, children);
  }

  // For other animations
  return (
    <Component
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={variants[animation]}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1],
        delay 
      }}
    >
      {children}
    </Component>
  );
};

export default AnimatedHeading;
