/**
 * Enhanced Card Component for TradeYa - Phase 2
 * 
 * Features:
 * - Integrated 3D tilt effects with brand-aware styling
 * - Advanced glassmorphism with multiple depth levels
 * - Brand-colored glows and shadows
 * - Accessibility support (reduced motion, browser compatibility)
 * - Mobile/touch optimizations
 * - Performance optimizations
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Enhanced Card Props Interface
export interface CardProps {
  children: React.ReactNode;
  className?: string;

  // Enhanced Visual Variants
  variant?: 'default' | 'glass' | 'elevated' | 'premium';

  // 3D Effects
  tilt?: boolean;
  tiltIntensity?: number;

  // Depth and Shadows
  depth?: 'sm' | 'md' | 'lg' | 'xl';

  // Brand-colored Glows
  glow?: 'none' | 'subtle' | 'strong';
  glowColor?: 'orange' | 'blue' | 'purple' | 'green' | 'auto';

  // Interaction
  hover?: boolean;
  reducedHover?: boolean; // Disables movement effects but keeps visual feedback
  interactive?: boolean;
  onClick?: () => void;

  // Performance & Accessibility
  reducedMotion?: boolean;
  disabled?: boolean;
}

// Brand-aware shadow and glow configurations
const brandEffects = {
  shadows: {
    orange: 'rgba(249, 115, 22, 0.25)',
    blue: 'rgba(14, 165, 233, 0.2)',
    purple: 'rgba(139, 92, 246, 0.2)',
    green: 'rgba(34, 197, 94, 0.2)', // Added green support
    auto: 'rgba(249, 115, 22, 0.15)' // Default to orange
  },
  glows: {
    subtle: {
      orange: '0 0 20px rgba(249, 115, 22, 0.1)',
      blue: '0 0 20px rgba(14, 165, 233, 0.1)',
      purple: '0 0 20px rgba(139, 92, 246, 0.1)',
      green: '0 0 20px rgba(34, 197, 94, 0.1)', // Emerald glow
      auto: '0 0 20px rgba(249, 115, 22, 0.1)'
    },
    strong: {
      orange: '0 0 30px rgba(249, 115, 22, 0.2), 0 0 60px rgba(249, 115, 22, 0.1)',
      blue: '0 0 30px rgba(14, 165, 233, 0.2), 0 0 60px rgba(14, 165, 233, 0.1)',
      purple: '0 0 30px rgba(139, 92, 246, 0.2), 0 0 60px rgba(139, 92, 246, 0.1)',
      green: '0 0 30px rgba(34, 197, 94, 0.2), 0 0 60px rgba(34, 197, 94, 0.1)', // Emerald strong
      auto: '0 0 30px rgba(249, 115, 22, 0.2), 0 0 60px rgba(249, 115, 22, 0.1)'
    }
  }
};

// Depth configurations
const depthStyles = {
  sm: 'shadow-xs hover:shadow-sm',
  md: 'shadow-md hover:shadow-lg',
  lg: 'shadow-lg hover:shadow-xl',
  xl: 'shadow-xl hover:shadow-2xl'
};

// Enhanced variant styles - Tailwind v4 compatible
const variantStyles = {
  default: 'glassmorphic border-glass text-card-foreground bg-white/5 backdrop-blur-sm', // Enhanced glassmorphic with transparent background
  glass: 'glassmorphic border-glass bg-white/5 backdrop-blur-sm', // Universal glassmorphic utility with transparent background
  elevated: 'glassmorphic border-glass shadow-lg bg-white/5 backdrop-blur-sm', // Enhanced glassmorphic with extra shadow and transparent background
  premium: 'glassmorphic border-glass bg-white/5 backdrop-blur-sm', // Universal glassmorphic utility with transparent background
};

// Browser compatibility check
const supportsTransform3D = () => {
  if (typeof window === 'undefined') return false;

  const testEl = document.createElement('div');
  testEl.style.transformStyle = 'preserve-3d';
  return testEl.style.transformStyle === 'preserve-3d';
};

// Reduced motion preference check
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Touch device detection
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  tilt = false,
  tiltIntensity = 8,
  depth = 'md',
  glow = 'none',
  glowColor = 'auto',
  hover = false,
  reducedHover = false,
  interactive = false,
  onClick,
  reducedMotion,
  disabled = false
}) => {
  // 3D effect state
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Feature detection and accessibility
  const [canUse3D, setCanUse3D] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(true);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setCanUse3D(supportsTransform3D());
    setShouldReduceMotion(reducedMotion ?? prefersReducedMotion());
    setIsTouch(isTouchDevice());
  }, [reducedMotion]);

  // Determine if 3D effects should be active
  const use3D = tilt && canUse3D && !shouldReduceMotion && !isTouch && !disabled && !reducedHover;

  // Throttled mouse move handler for performance
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!use3D || !cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    // Calculate mouse position relative to card center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Calculate rotation based on mouse position and intensity
    const rotateYValue = (mouseX / (rect.width / 2)) * tiltIntensity;
    const rotateXValue = -(mouseY / (rect.height / 2)) * tiltIntensity;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);

    // Calculate glare position for premium variants
    if (variant === 'premium' || variant === 'glass') {
      const glareX = ((e.clientX - rect.left) / rect.width) * 100;
      const glareY = ((e.clientY - rect.top) / rect.height) * 100;
      setGlarePosition({ x: glareX, y: glareY });
    }
  }, [use3D, tiltIntensity, variant]);

  // Reset effects when mouse leaves
  const handleMouseLeave = useCallback(() => {
    if (use3D) {
      setRotateX(0);
      setRotateY(0);
    }
  }, [use3D]);

  // Build dynamic styles
  const baseStyles = 'rounded-lg transition-all duration-300 ease-out relative overflow-hidden';

  const interactionStyles = cn(
    hover && !reducedHover && 'hover:shadow-lg hover:scale-[1.02] transform cursor-pointer',
    reducedHover && 'hover:shadow-lg cursor-pointer transition-shadow',
    interactive && 'cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
    onClick && !reducedHover && 'cursor-pointer hover:shadow-md transition-shadow',
    onClick && reducedHover && 'cursor-pointer transition-shadow'
  );

  // Dynamic glow effect
  const glowEffect = glow !== 'none' ? {
    boxShadow: brandEffects.glows[glow][glowColor]
  } : {};

  // Enhanced animation configuration with better spring physics
  const animationConfig = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.5,
  };

  // Enhanced hover animation for framer-motion
  const hoverAnimation = hover && !reducedHover && !shouldReduceMotion ? {
    y: -4,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    } as any
  } : undefined;

  const tapAnimation = onClick && !shouldReduceMotion ? {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17
    } as any
  } : undefined;

  // Compose final className
  const cardClassName = cn(
    baseStyles,
    variantStyles[variant],
    depthStyles[depth],
    interactionStyles,
    className
  );

  // Render with or without 3D effects based on capability
  if (use3D) {
    return (
      <motion.div
        ref={cardRef}
        className={cardClassName}
        style={{
          // Let Framer Motion compose transform with perspective to avoid overwrite
          transformPerspective: 1000,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          ...glowEffect
        }}
        animate={{
          rotateX: rotateX,
          rotateY: rotateY,
        }}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        transition={animationConfig}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        aria-disabled={disabled}
      >
        {/* Optional glare effect for glass/premium */}
        {(variant === 'glass' || variant === 'premium') && (
          <div
            className="pointer-events-none absolute inset-0 z-card-layer-1"
            style={{
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.18) 0%, transparent 80%)`,
              opacity: 0.5
            }}
          />
        )}
        <div className="relative z-card-layer-2">
          {children}
        </div>
      </motion.div>
    );
  }

  // Non-3D fallback - still use motion.div for hover/tap animations if enabled
  if (hover && !reducedHover && !shouldReduceMotion) {
    return (
      <motion.div
        ref={cardRef}
        style={{ containerType: 'inline-size', ...glowEffect }}
        className={cn(
          'card',
          baseStyles,
          variantStyles[variant],
          depthStyles[depth],
          interactionStyles,
          className
        )}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        aria-disabled={disabled}
      >
        {children}
      </motion.div>
    );
  }

  // Static fallback (no animations)
  return (
    <div
      ref={cardRef}
      style={{ containerType: 'inline-size', ...glowEffect }}
      className={cn(
        'card',
        baseStyles,
        variantStyles[variant],
        depthStyles[depth],
        interactionStyles,
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
};

// Card Header Component
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>;
};

// Card Title Component
export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)}>{children}</h3>;
};

// Card Description Component
export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
};

// Card Content Component
export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div
      className={cn(
        'p-6 pt-0 @container flex flex-col gap-4 @md:flex-row @md:gap-8',
        className
      )}
    >
      {children}
    </div>
  );
};

// Card Body Component (alias for CardContent for backward compatibility)
export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <CardContent className={className}>{children}</CardContent>;
};

// Card Footer Component
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={cn('flex items-center p-6 pt-0', className)}>{children}</div>;
};

export default Card;
