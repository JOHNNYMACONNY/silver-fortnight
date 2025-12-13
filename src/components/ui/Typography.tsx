/**
 * Typography Component System
 * 
 * Provides consistent typography hierarchy following 8-point spacing system
 * and visual hierarchy principles. All text components support dark mode.
 * 
 * Based on UX Principle 1: Visual Hierarchy
 */

import React from 'react';
import { cn } from '../../utils/cn';

// Typography Variant Types
export type TypographyVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'h5' 
  | 'h6' 
  | 'body' 
  | 'body-lg' 
  | 'body-sm' 
  | 'caption' 
  | 'label';

export type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export type TypographyColor = 
  | 'default' 
  | 'muted' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Typography variant - determines size, weight, and line height
   */
  variant?: TypographyVariant;
  
  /**
   * Font weight override
   */
  weight?: TypographyWeight;
  
  /**
   * Text color variant
   */
  color?: TypographyColor;
  
  /**
   * Render as a different HTML element
   */
  as?: keyof JSX.IntrinsicElements;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Children content
   */
  children: React.ReactNode;
}

// Typography variant styles - following 8-point spacing system
const variantStyles: Record<TypographyVariant, string> = {
  h1: 'text-4xl font-bold leading-tight tracking-tight', // 36px, 700, tight
  h2: 'text-3xl font-semibold leading-tight tracking-tight', // 30px, 600, tight
  h3: 'text-2xl font-semibold leading-snug tracking-tight', // 24px, 600, snug
  h4: 'text-xl font-medium leading-snug', // 20px, 500, snug
  h5: 'text-lg font-medium leading-normal', // 18px, 500, normal
  h6: 'text-base font-medium leading-normal', // 16px, 500, normal
  'body-lg': 'text-lg font-normal leading-relaxed', // 18px, 400, relaxed
  body: 'text-base font-normal leading-relaxed', // 16px, 400, relaxed
  'body-sm': 'text-sm font-normal leading-relaxed', // 14px, 400, relaxed
  caption: 'text-xs font-normal leading-relaxed', // 12px, 400, relaxed
  label: 'text-sm font-medium leading-normal', // 14px, 500, normal
};

// Weight overrides
const weightStyles: Record<TypographyWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

// Color variants - theme-aware
const colorStyles: Record<TypographyColor, string> = {
  default: 'text-neutral-900 dark:text-neutral-100',
  muted: 'text-neutral-600 dark:text-neutral-400',
  primary: 'text-primary-600 dark:text-primary-400',
  secondary: 'text-secondary-600 dark:text-secondary-400',
  success: 'text-success-600 dark:text-success-400',
  warning: 'text-warning-600 dark:text-warning-400',
  error: 'text-error-600 dark:text-error-400',
};

// Default HTML elements for each variant
const defaultElements: Record<TypographyVariant, keyof JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  'body-lg': 'p',
  body: 'p',
  'body-sm': 'p',
  caption: 'span',
  label: 'label',
};

/**
 * Typography Component
 * 
 * Provides consistent typography with proper hierarchy, spacing, and theming.
 * 
 * @example
 * <Typography variant="h1">Main Heading</Typography>
 * <Typography variant="body" color="muted">Body text</Typography>
 * <Typography variant="h2" as="h3" weight="bold">Custom heading</Typography>
 */
export const Typography = React.forwardRef<HTMLElement, TypographyProps>(({
  variant = 'body',
  weight,
  color = 'default',
  as,
  className,
  children,
  ...props
}, ref) => {
  const Component = as || defaultElements[variant];
  
  const classes = cn(
    variantStyles[variant],
    weight && weightStyles[weight],
    colorStyles[color],
    className
  );

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/42fd4a06-bebf-4e50-8c84-4d167eb154bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Typography.tsx:147',message:'Creating element',data:{variant,Component,hasRef:!!ref,hasClassName:!!className,mergedClassName:classes},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
  // #endregion
  
  // FIX: Properly forward ref using React.createElement
  return React.createElement(
    Component,
    {
      className: classes,
      ref,
      ...props,
    },
    children
  );
});
Typography.displayName = "Typography";

// Convenience components for common use cases
export const H1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const H2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const H3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const H4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const H5: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h5" {...props} />
);

export const H6: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h6" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const BodyLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body-lg" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body-sm" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Label: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="label" {...props} />
);

