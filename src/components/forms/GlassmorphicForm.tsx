/**
 * GlassmorphicForm Component
 * 
 * Advanced glassmorphic form container with sophisticated backdrop filters,
 * multi-layered glass effects, and TradeYa brand integration.
 */

import React from "react";
import { cn } from "../../utils/cn";
import { useMobileOptimization } from "../../hooks/useMobileOptimization";

// Form Props Interface
export interface GlassmorphicFormProps {
  variant?: 'standard' | 'elevated' | 'modal' | 'stepped';
  blurIntensity?: 'sm' | 'md' | 'lg' | 'xl';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
  shadow?: 'beautiful-shadow' | 'form-shadow' | 'elevated-shadow';
  borders?: 'glass-borders' | 'dual-borders' | 'gradient-borders';
  zIndex?: number;
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  id?: string;
}

/**
 * GlassmorphicForm Component
 * 
 * Sophisticated glassmorphic form container with advanced visual effects
 */
export const GlassmorphicForm: React.FC<GlassmorphicFormProps> = ({
  variant = 'standard',
  blurIntensity = 'md',
  brandAccent = 'gradient',
  shadow = 'beautiful-shadow',
  borders = 'glass-borders',
  zIndex = 10,
  children,
  className = '',
  onSubmit,
  id,
}) => {
  const {
    isMobile,
    isTablet,
    shouldUseReducedAnimations,
    getOptimalSpacing,
  } = useMobileOptimization();
  // Form variant styles
  const formVariants = {
    standard: `
      backdrop-blur-md bg-white/70 dark:bg-neutral-800/60
      border border-white/20 dark:border-neutral-700/30
      rounded-2xl p-6
    `,
    elevated: `
      backdrop-blur-lg bg-white/80 dark:bg-neutral-800/70
      border-2 border-white/30 dark:border-neutral-700/40
      rounded-3xl p-8 shadow-2xl
    `,
    modal: `
      backdrop-blur-xl bg-white/90 dark:bg-neutral-800/80
      border border-white/40 dark:border-neutral-700/50
      rounded-2xl p-8 shadow-beautiful
    `,
    stepped: `
      backdrop-blur-md bg-white/75 dark:bg-neutral-800/65
      border-l-4 border-gradient-to-b from-orange-500 to-blue-500
      rounded-r-2xl pl-8 pr-6 py-6
    `
  };

  // Blur intensity classes
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md', 
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  };

  // Brand accent classes
  const brandAccentClasses = {
    orange: 'ring-1 ring-orange-500/20 focus-within:ring-orange-500/40 focus-within:ring-2',
    blue: 'ring-1 ring-blue-500/20 focus-within:ring-blue-500/40 focus-within:ring-2',
    purple: 'ring-1 ring-purple-500/20 focus-within:ring-purple-500/40 focus-within:ring-2',
    gradient: `
      ring-1 ring-gradient-to-r from-orange-500/20 via-blue-500/20 to-purple-500/20
      focus-within:ring-2 focus-within:from-orange-500/40 focus-within:via-blue-500/40 focus-within:to-purple-500/40
    `
  };

  // Shadow classes
  const shadowClasses = {
    'beautiful-shadow': 'shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.24)]',
    'form-shadow': 'shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.16)]',
    'elevated-shadow': 'shadow-[0_12px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.3)]'
  };

  // Border classes
  const borderClasses = {
    'glass-borders': 'border border-white/20 dark:border-neutral-700/30',
    'dual-borders': 'border-2 border-white/30 dark:border-neutral-700/40',
    'gradient-borders': `
      border border-transparent bg-gradient-to-r from-orange-500/20 via-blue-500/20 to-purple-500/20
      bg-clip-border
    `
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  // Mobile-optimized form variants
  const mobileFormVariants = {
    standard: `
      backdrop-blur-sm bg-white/80 dark:bg-neutral-800/70
      border border-white/30 dark:border-neutral-700/40
      rounded-xl p-4
    `,
    elevated: `
      backdrop-blur-md bg-white/85 dark:bg-neutral-800/75
      border-2 border-white/40 dark:border-neutral-700/50
      rounded-2xl p-6 shadow-xl
    `,
    modal: `
      backdrop-blur-lg bg-white/90 dark:bg-neutral-800/80
      border border-white/50 dark:border-neutral-700/60
      rounded-2xl p-6 shadow-2xl
    `,
    stepped: `
      backdrop-blur-md bg-white/75 dark:bg-neutral-800/65
      border border-white/25 dark:border-neutral-700/35
      rounded-xl p-4
    `,
  };

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={cn(
        // Base form styles
        'relative',

        // Mobile-optimized transitions
        shouldUseReducedAnimations() ? 'transition-none' : 'transition-all duration-300 ease-out',

        // Variant-specific styles - use mobile variants on mobile
        isMobile ? mobileFormVariants[variant] : formVariants[variant],

        // Blur intensity (only for standard variant, others have their own blur)
        variant === 'standard' && !isMobile && blurClasses[blurIntensity],

        // Brand accent
        brandAccentClasses[brandAccent],

        // Shadow (only for standard and stepped variants, others have their own shadows)
        (variant === 'standard' || variant === 'stepped') && !isMobile && shadowClasses[shadow],

        // Borders (override variant borders if specified)
        borders !== 'glass-borders' && borderClasses[borders],

        // Mobile-specific optimizations
        isMobile && 'touch-manipulation',

        // Custom className
        className
      )}
      style={{
        zIndex,
        // Mobile-optimized spacing
        ...(isMobile && {
          '--form-spacing': `${getOptimalSpacing(16)}px`,
        })
      }}
    >
      {children}
    </form>
  );
};

/**
 * Form Section Component
 * 
 * Glassmorphic section within a form for organizing content
 */
export interface GlassmorphicFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'subtle';
}

export const GlassmorphicFormSection: React.FC<GlassmorphicFormSectionProps> = ({
  title,
  description,
  children,
  className = '',
  variant = 'default',
}) => {
  const sectionVariants = {
    default: 'bg-white/5 dark:bg-neutral-900/5 border border-white/10 dark:border-neutral-700/20',
    highlighted: 'bg-white/10 dark:bg-neutral-900/10 border border-white/20 dark:border-neutral-700/30',
    subtle: 'bg-white/2 dark:bg-neutral-900/2 border border-white/5 dark:border-neutral-700/10'
  };

  return (
    <div className={cn(
      'rounded-xl p-6 backdrop-blur-sm transition-all duration-300',
      sectionVariants[variant],
      className
    )}>
      {(title || description) && (
        <div className="mb-6 pb-4 border-b border-white/10 dark:border-neutral-700/20">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * Form Actions Component
 * 
 * Glassmorphic action bar for form buttons
 */
export interface GlassmorphicFormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
  variant?: 'default' | 'elevated' | 'floating';
}

export const GlassmorphicFormActions: React.FC<GlassmorphicFormActionsProps> = ({
  children,
  className = '',
  align = 'right',
  variant = 'default',
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  const variantClasses = {
    default: 'pt-6 border-t border-white/10 dark:border-neutral-700/20',
    elevated: `
      pt-6 mt-6 border-t border-white/20 dark:border-neutral-700/30
      bg-white/5 dark:bg-neutral-900/5 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl
    `,
    floating: `
      pt-4 -mx-6 -mb-6 px-6 pb-6
      bg-gradient-to-t from-white/10 to-transparent dark:from-neutral-900/10
      backdrop-blur-sm rounded-b-2xl
    `
  };

  return (
    <div className={cn(
      'flex items-center gap-3',
      alignClasses[align],
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  );
};

export default GlassmorphicForm;
