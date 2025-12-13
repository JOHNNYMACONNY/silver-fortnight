/**
 * Chameleon Mascot Component
 * 
 * Displays the TradeYa chameleon mascot in various poses and states.
 * Uses the logo chameleon as the base and provides animated variants.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useMotion } from '../ui/MotionProvider';

export type ChameleonVariant = 
  | 'default' 
  | 'searching' 
  | 'celebrating' 
  | 'thinking' 
  | 'trading' 
  | 'empty' 
  | 'loading' 
  | 'success' 
  | 'error'
  | 'onboarding';

export type ChameleonSize = 'small' | 'medium' | 'large' | 'xl';

export interface ChameleonMascotProps {
  variant?: ChameleonVariant;
  size?: ChameleonSize;
  animated?: boolean;
  className?: string;
  alt?: string;
}

const sizeClasses: Record<ChameleonSize, string> = {
  small: 'h-16 w-16',
  medium: 'h-24 w-24',
  large: 'h-32 w-32',
  xl: 'h-48 w-48',
};

// Animation variants for different chameleon states
const animationVariants = {
  default: {
    animate: {
      y: [0, -4, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  searching: {
    animate: {
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  celebrating: {
    animate: {
      scale: [1, 1.1, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  thinking: {
    animate: {
      y: [0, -2, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  trading: {
    animate: {
      x: [0, 3, -3, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  empty: {
    animate: {
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  loading: {
    animate: {
      rotate: [0, 360],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },
  success: {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  },
  error: {
    animate: {
      x: [0, -4, 4, -4, 4, 0],
      transition: {
        duration: 0.5,
        repeat: 2,
        ease: "easeInOut"
      }
    }
  },
  onboarding: {
    animate: {
      y: [0, -6, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

/**
 * ChameleonMascot Component
 * 
 * Displays the TradeYa chameleon mascot with optional animations.
 * Uses the logo image as the base and applies variant-specific animations.
 */
export const ChameleonMascot: React.FC<ChameleonMascotProps> = ({
  variant = 'default',
  size = 'medium',
  animated = true,
  className,
  alt = 'TradeYa Chameleon Mascot',
}) => {
  const { isMotionDisabled } = useMotion();
  const shouldAnimate = animated && !isMotionDisabled;
  const variantAnimation = animationVariants[variant];

  // For now, we'll use the logo image. In the future, we can add variant-specific images
  const imageSrc = '/images/optimized/tradeya-logo.png';

  const baseClasses = cn(
    'transition-all duration-300',
    sizeClasses[size],
    className
  );

  if (!shouldAnimate) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={baseClasses}
        aria-label={`${alt} - ${variant} variant`}
      />
    );
  }

  return (
    <motion.div
      className={cn('inline-block', baseClasses)}
      initial={variantAnimation.initial}
      animate={variantAnimation.animate}
      transition={variantAnimation.transition || { duration: 0.3 }}
    >
      <img
        src={imageSrc}
        alt={alt}
        className="w-full h-full object-contain"
        aria-label={`${alt} - ${variant} variant`}
      />
    </motion.div>
  );
};

/**
 * ChameleonMascot with Text
 * 
 * A wrapper component that displays the chameleon with accompanying text.
 */
export interface ChameleonWithTextProps extends ChameleonMascotProps {
  title?: string;
  description?: string;
  textPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const ChameleonWithText: React.FC<ChameleonWithTextProps> = ({
  title,
  description,
  textPosition = 'bottom',
  ...mascotProps
}) => {
  const flexDirection = {
    top: 'flex-col-reverse',
    bottom: 'flex-col',
    left: 'flex-row-reverse',
    right: 'flex-row',
  }[textPosition];

  const textAlignment = {
    top: 'text-center',
    bottom: 'text-center',
    left: 'text-right',
    right: 'text-left',
  }[textPosition];

  return (
    <div className={cn('flex items-center gap-4', flexDirection)}>
      <ChameleonMascot {...mascotProps} />
      {(title || description) && (
        <div className={cn('flex flex-col gap-2', textAlignment)}>
          {title && (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChameleonMascot;

