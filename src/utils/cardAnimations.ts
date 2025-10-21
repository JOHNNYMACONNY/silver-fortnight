/**
 * Card Animation Utilities for TradeYa Enhanced Card System
 * 
 * Provides pre-configured animation variants and utilities for consistent
 * card animations across the application.
 */

import { Variants } from 'framer-motion';

// Standard card hover animations
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    z: 0,
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.5,
    }
  }
};

// 3D tilt animation variants
export const card3DTiltVariants: Variants = {
  initial: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  },
  animate: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.5,
    }
  }
};

// Entrance animations for cards
export const cardEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    }
  }
};

// Staggered list animations for card grids
export const cardListVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

// Premium card glow animations
export const premiumGlowVariants: Variants = {
  initial: {
    boxShadow: '0 0 0px rgba(249, 115, 22, 0)',
  },
  glow: {
    boxShadow: [
      '0 0 20px rgba(249, 115, 22, 0.1)',
      '0 0 30px rgba(249, 115, 22, 0.15)',
      '0 0 20px rgba(249, 115, 22, 0.1)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }
  }
};

// Utility functions for card animations

/**
 * Calculate 3D rotation based on mouse position
 */
export const calculateTiltRotation = (
  mouseX: number,
  mouseY: number,
  elementRect: DOMRect,
  intensity: number = 10
) => {
  const centerX = elementRect.left + elementRect.width / 2;
  const centerY = elementRect.top + elementRect.height / 2;
  
  const deltaX = mouseX - centerX;
  const deltaY = mouseY - centerY;
  
  const rotateY = (deltaX / (elementRect.width / 2)) * intensity;
  const rotateX = -(deltaY / (elementRect.height / 2)) * intensity;
  
  return { rotateX, rotateY };
};

/**
 * Create smooth spring animation config
 */
export const createSpringConfig = (stiffness: number = 300, damping: number = 30) => ({
  type: 'spring' as const,
  stiffness,
  damping,
  mass: 0.5,
});

/**
 * Get appropriate animation based on card variant
 */
export const getCardAnimationVariant = (variant: string, interactive: boolean) => {
  if (variant === 'premium' || variant === 'glass') {
    return interactive ? premiumGlowVariants : cardHoverVariants;
  }
  
  return cardHoverVariants;
};

/**
 * Brand-specific glow colors
 */
export const brandGlowColors = {
  orange: 'rgba(249, 115, 22, 0.2)',
  blue: 'rgba(14, 165, 233, 0.2)',
  purple: 'rgba(139, 92, 246, 0.2)',
  auto: 'rgba(249, 115, 22, 0.15)', // Default TradeYa orange
};

/**
 * Performance optimized animation settings
 */
export const performanceOptimized = {
  layoutId: undefined, // Disable layout animations for performance
  transition: createSpringConfig(400, 35), // Slightly less intense for better performance
  transformTemplate: ({ rotateX, rotateY, scale }: any) => 
    `perspective(1000px) rotateX(${rotateX || 0}deg) rotateY(${rotateY || 0}deg) scale(${scale || 1})`,
};

export default {
  cardHoverVariants,
  card3DTiltVariants,
  cardEntranceVariants,
  cardListVariants,
  premiumGlowVariants,
  calculateTiltRotation,
  createSpringConfig,
  getCardAnimationVariant,
  brandGlowColors,
  performanceOptimized,
}; 