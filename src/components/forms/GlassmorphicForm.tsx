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
  variant?: "standard" | "elevated" | "modal" | "stepped";
  blurIntensity?: "sm" | "md" | "lg" | "xl";
  brandAccent?: "orange" | "blue" | "purple" | "gradient";
  shadow?: "beautiful-shadow" | "form-shadow" | "elevated-shadow";
  borders?: "glass-borders" | "dual-borders" | "gradient-borders";
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
  variant = "standard",
  blurIntensity = "md",
  brandAccent = "gradient",
  shadow = "beautiful-shadow",
  borders = "glass-borders",
  zIndex = 10,
  children,
  className = "",
  onSubmit,
  id,
}) => {
  const { isMobile, isTablet, shouldUseReducedAnimations, getOptimalSpacing } =
    useMobileOptimization();
  // Form variant styles
  const formVariants = {
    standard: `glassmorphic rounded-2xl p-6`,
    elevated: `glassmorphic rounded-3xl p-8 shadow-2xl`,
    modal: `glassmorphic rounded-2xl p-8 shadow-beautiful`,
    stepped: `glassmorphic rounded-r-2xl pl-8 pr-6 py-6 border-l-4 border-gradient-to-b from-orange-500 to-blue-500`,
  };

  // Blur intensity classes
  const blurClasses = {
    sm: "",
    md: "",
    lg: "",
    xl: "",
  };

  // Brand accent classes
  const brandAccentClasses = {
    orange: "focus-within:ring-1 focus-within:ring-ring",
    blue: "focus-within:ring-1 focus-within:ring-ring",
    purple: "focus-within:ring-1 focus-within:ring-ring",
    gradient: `
      focus-within:ring-1 focus-within:ring-primary/30
    `,
  };

  // Shadow classes
  const shadowClasses = {
    "beautiful-shadow":
      "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.24)]",
    "form-shadow":
      "shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.16)]",
    "elevated-shadow":
      "shadow-[0_12px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.3)]",
  };

  // Border classes
  const borderClasses = {
    "glass-borders": "border-border",
    "dual-borders": "border-2 border-border",
    "gradient-borders": `border border-transparent bg-gradient-to-r from-orange-500/20 via-blue-500/20 to-purple-500/20 bg-clip-border`,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  // Mobile-optimized form variants
  const mobileFormVariants = {
    standard: `glassmorphic rounded-xl p-4`,
    elevated: `glassmorphic rounded-2xl p-6 shadow-xl`,
    modal: `glassmorphic rounded-2xl p-6 shadow-2xl`,
    stepped: `glassmorphic rounded-xl p-4`,
  };

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={cn(
        // Base form styles
        "relative",

        // Mobile-optimized transitions
        shouldUseReducedAnimations()
          ? "transition-none"
          : "transition-all duration-300 ease-out",

        // Variant-specific styles - use mobile variants on mobile
        isMobile ? mobileFormVariants[variant] : formVariants[variant],

        // Blur intensity (now handled by glassmorphic utility)
        variant === "standard" && !isMobile && blurClasses[blurIntensity],

        // Brand accent
        brandAccentClasses[brandAccent],

        // Shadow (only for standard and stepped variants, others have their own shadows)
        (variant === "standard" || variant === "stepped") &&
          !isMobile &&
          shadowClasses[shadow],

        // Borders (override variant borders if specified)
        borders !== "glass-borders" && borderClasses[borders],

        // Mobile-specific optimizations
        isMobile && "touch-manipulation",

        // Custom className
        className
      )}
      style={{
        zIndex,
        // Mobile-optimized spacing
        ...(isMobile && {
          "--form-spacing": `${getOptimalSpacing(16)}px`,
        }),
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
  variant?: "default" | "highlighted" | "subtle";
}

export const GlassmorphicFormSection: React.FC<
  GlassmorphicFormSectionProps
> = ({ title, description, children, className = "", variant = "default" }) => {
  const sectionVariants = {
    default: "glassmorphic",
    highlighted: "glassmorphic border-strong",
    subtle: "glassmorphic border-standard",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-6 transition-all duration-300",
        sectionVariants[variant],
        className
      )}
    >
      {(title || description) && (
        <div className="mb-6 pb-4 border-b border-border">
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
  align?: "left" | "center" | "right" | "between";
  variant?: "default" | "elevated" | "floating";
}

export const GlassmorphicFormActions: React.FC<
  GlassmorphicFormActionsProps
> = ({ children, className = "", align = "right", variant = "default" }) => {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  const variantClasses = {
    default: "pt-6 border-t border-border",
    elevated: `
      pt-6 mt-6 border-t border-border
      glassmorphic -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl
    `,
    floating: `
      pt-4 -mx-6 -mb-6 px-6 pb-6
      glassmorphic rounded-b-2xl
    `,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        alignClasses[align],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassmorphicForm;
