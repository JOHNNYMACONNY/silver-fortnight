# TradeYa Visual Enhancement Plan

This document outlines a comprehensive strategy for upgrading the visual design of the TradeYa application. It provides specific implementation guidelines, code examples, and best practices to ensure all visual enhancements integrate seamlessly with existing functionality.

## Table of Contents

- Enhanced Color System
- Typography Improvements
- Component Design Upgrades
- Motion and Animation System
- Empty States and Loading States
- Micro-interactions and Feedback
- Implementation Strategy
- Testing and Quality Assurance
- Compatibility Guidelines

## 1. Enhanced Color System

### Color Palette Expansion

Update the Tailwind configuration with an expanded, cohesive color palette:

```js
// tailwind.config.js
colors: {
  // Primary brand colors with expanded range
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },
  // Secondary color - complementary to orange
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  // Accent color for highlights
  accent: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  // Expanded neutrals for more nuanced grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
}
```

### CSS Variables for Theme Switching

Add these CSS variables to enable smooth theme switching:

```css
/* src/index.css */
:root {
  /* Light mode */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-card: #ffffff;
  --color-text-primary: #1f2937;
  --color-text-secondary: #4b5563;
  --color-border: #e5e7eb;
  --color-shadow: rgba(0, 0, 0, 0.05);

  /* Brand colors */
  --color-primary: #f97316;
  --color-primary-hover: #ea580c;
  --color-secondary: #0ea5e9;
  --color-accent: #8b5cf6;
}

.dark {
  /* Dark mode */
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-bg-card: #1f2937;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-border: #374151;
  --color-shadow: rgba(0, 0, 0, 0.3);

  /* Adjusted brand colors for dark mode */
  --color-primary: #fb923c;
  --color-primary-hover: #f97316;
  --color-secondary: #38bdf8;
  --color-accent: #a78bfa;
}
```

### Updated Theme Utilities

Enhance the themeUtils.ts file with the new color system:

```ts
// src/utils/themeUtils.ts
export const themeClasses = {
  // Backgrounds
  card: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
  page: 'bg-neutral-50 dark:bg-neutral-900',
  input: 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600',

  // Text
  text: 'text-neutral-900 dark:text-neutral-100',
  textMuted: 'text-neutral-500 dark:text-neutral-400',
  textInverse: 'text-white dark:text-neutral-900',

  // Buttons
  primaryButton: 'bg-primary-500 hover:bg-primary-600 text-white',
  secondaryButton: 'bg-secondary-500 hover:bg-secondary-600 text-white',
  tertiaryButton: 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200',

  // Borders
  border: 'border-neutral-200 dark:border-neutral-700',

  // Shadows
  shadowSm: 'shadow-sm dark:shadow-neutral-900/30',
  shadow: 'shadow dark:shadow-neutral-900/30',
  shadowMd: 'shadow-md dark:shadow-neutral-900/30',
  shadowLg: 'shadow-lg dark:shadow-neutral-900/30',

  // Focus
  focus: 'focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-neutral-800',

  // Transitions
  transition: 'transition-all duration-200',
  transitionFast: 'transition-all duration-150',
  transitionSlow: 'transition-all duration-300',

  // Hover effects
  hoverCard: 'hover:shadow-md hover:-translate-y-1 dark:hover:bg-neutral-700/70 dark:hover:shadow-[0_0_12px_rgba(251,146,60,0.15)]',
};
```

## 2. Typography Improvements
### Font Selection
Update the Tailwind configuration with modern, readable fonts:

```js
// tailwind.config.js
fontFamily: {
  sans: [
    'Inter var',
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif'
  ],
  heading: [
    'Outfit',
    'Inter var',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif'
  ],
  mono: [
    'JetBrains Mono',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace'
  ],
}
```

### Font Loading
Add these font imports to your CSS file:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Typography Scale

Refine the font size scale in Tailwind:

```js
// tailwind.config.js
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  'base': ['1rem', { lineHeight: '1.5rem' }],
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1.15' }],
  '6xl': ['3.75rem', { lineHeight: '1.1' }],
  '7xl': ['4.5rem', { lineHeight: '1.05' }],
  '8xl': ['6rem', { lineHeight: '1' }],
  '9xl': ['8rem', { lineHeight: '1' }],
}
```

### Typography Utility Classes

Add these typography classes to your theme utilities:

```ts
// src/utils/themeUtils.ts - Add to themeClasses
export const themeClasses = {
  // Existing classes...

  // Typography
  heading1: 'font-heading font-bold text-4xl md:text-5xl text-neutral-900 dark:text-white',
  heading2: 'font-heading font-semibold text-3xl md:text-4xl text-neutral-900 dark:text-white',
  heading3: 'font-heading font-semibold text-2xl md:text-3xl text-neutral-900 dark:text-white',
  heading4: 'font-heading font-medium text-xl md:text-2xl text-neutral-900 dark:text-white',
  heading5: 'font-heading font-medium text-lg md:text-xl text-neutral-900 dark:text-white',
  heading6: 'font-heading font-medium text-base md:text-lg text-neutral-900 dark:text-white',

  bodyLarge: 'font-sans text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed',
  body: 'font-sans text-base text-neutral-700 dark:text-neutral-300 leading-relaxed',
  bodySmall: 'font-sans text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed',

  caption: 'font-sans text-xs text-neutral-500 dark:text-neutral-500',
  overline: 'font-sans text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 font-medium',

  link: 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline-offset-2 hover:underline',
};
```

### Card Component
```ts
// src/components/ui/Card.tsx
import React from 'react';
import { themeClasses } from '../../utils/themeUtils';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'outlined' | 'filled';
  hover?: boolean;
  interactive?: boolean;
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'elevated',
  hover = false,
  interactive = false,
}) => {
  const baseClasses = 'rounded-xl overflow-hidden';

  const variantClasses = {
    elevated: `${themeClasses.card} ${themeClasses.shadowMd}`,
    outlined: `bg-transparent border ${themeClasses.border}`,
    filled: 'bg-neutral-50 dark:bg-neutral-800/50',
  };

  const hoverClasses = hover
    ? 'transition-all duration-300 hover:shadow-lg dark:hover:shadow-neutral-900/40 hover:-translate-y-1'
    : '';

  const interactiveClasses = interactive
    ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
    : '';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${interactiveClasses} ${className}`}>
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b ${themeClasses.border} ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`px-6 py-5 ${className}`}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t ${themeClasses.border} bg-neutral-50 dark:bg-neutral-800/30 ${className}`}>
    {children}
  </div>
);
```

### Button Component
```ts
// src/components/ui/Button.tsx
import React from 'react';
import { themeClasses } from '../../utils/themeUtils';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = false,
  rounded = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `inline-flex items-center justify-center font-medium focus:outline-none ${themeClasses.transition}`;

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-600 dark:hover:bg-primary-500',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 dark:bg-secondary-600 dark:hover:bg-secondary-500',
    tertiary: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600',
    outline: 'bg-transparent border-2 border-current text-primary-500 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/10',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  );
};
```

## 3. Motion and Animation System

### Enhanced Hover Animations for Dark Mode

Improve hover animations for cards and interactive elements in dark mode:

```ts
// src/utils/themeUtils.ts
// Add to themeClasses
hoverCard: 'hover:shadow-md hover:-translate-y-1 dark:hover:bg-neutral-700/70 dark:hover:shadow-[0_0_12px_rgba(251,146,60,0.15)]',
```

This creates a more visible and appealing hover effect in dark mode by:
- Adding a subtle background color change (`dark:hover:bg-neutral-700/70`)
- Adding a colored glow effect using the primary color (`dark:hover:shadow-[0_0_12px_rgba(251,146,60,0.15)]`)
- Maintaining the elevation effect with `hover:-translate-y-1`

For consistency, this hover effect has been applied to all card components throughout the application, including:

- Home page feature cards
- Project/collaboration cards
- Challenge cards
- Empty state cards

Usage example:

```tsx
// Using directly in a component
<div className={`${themeClasses.card} ${themeClasses.transition} ${themeClasses.hoverCard}`}>
  Card content
</div>

// Using with the cn utility
<div className={cn(
  "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300",
  themeClasses.hoverCard
)}>
  Card content
</div>
```

### Animation Utilities

Add these animation utilities to the Tailwind configuration:

```js
// tailwind.config.js
animation: {
  'fade-in': 'fadeIn 200ms ease-in-out',
  'fade-out': 'fadeOut 200ms ease-in-out',
  'slide-in': 'slideIn 200ms ease-in-out',
  'slide-out': 'slideOut 200ms ease-in-out',
  'zoom-in': 'zoomIn 200ms ease-in-out',
  'zoom-out': 'zoomOut 200ms ease-in-out',
  'bounce-in': 'bounceIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  'spin-slow': 'spin 3s linear infinite',
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
},
keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  fadeOut: {
    '0%': { opacity: '1' },
    '100%': { opacity: '0' },
  },
  slideIn: {
    '0%': { transform: 'translateY(10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  slideOut: {
    '0%': { transform: 'translateY(0)', opacity: '1' },
    '100%': { transform: 'translateY(10px)', opacity: '0' },
  },
  zoomIn: {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  zoomOut: {
    '0%': { transform: 'scale(1)', opacity: '1' },
    '100%': { transform: 'scale(0.95)', opacity: '0' },
  },
  bounceIn: {
    '0%': { transform: 'scale(0.8)', opacity: '0' },
    '80%': { transform: 'scale(1.05)', opacity: '0.8' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
}
```

### Transition Component

Create a reusable Transition component for animations:

```tsx
// src/components/ui/transitions/Transition.tsx
import React, { useState, useEffect } from 'react';
import { cn } from '../../../utils/cn';

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'bounce';

interface TransitionProps {
  show: boolean;
  type?: TransitionType;
  duration?: number;
  children: React.ReactNode;
  className?: string;
}

export const Transition: React.FC<TransitionProps> = ({
  show,
  type = 'fade',
  duration = 200,
  children,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
    else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all';
    const durationClass = `duration-${duration}`;

    const animationClasses = {
      fade: show ? 'opacity-100' : 'opacity-0',
      slide: show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      zoom: show ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
      bounce: show ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
    };

    return cn(baseClasses, durationClass, animationClasses[type]);
  };

  if (!shouldRender && !show) return null;

  return (
    <div className={cn(getAnimationClasses(), className)}>
      {children}
    </div>
  );
};
```

## 4. Empty States and Loading States

### Skeleton Loaders

Create reusable skeleton components for loading states:

```tsx
// src/components/ui/skeletons/Skeleton.tsx
import React from 'react';
import { cn } from '../../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn('animate-pulse rounded bg-neutral-200 dark:bg-neutral-700', className)} />
  );
};

export const SkeletonText: React.FC<SkeletonProps> = ({ className }) => {
  return <Skeleton className={cn('h-4 w-full', className)} />;
};

export const SkeletonCircle: React.FC<SkeletonProps & { size?: string }> = ({
  className,
  size = 'h-12 w-12'
}) => {
  return <Skeleton className={cn('rounded-full', size, className)} />;
};

export const SkeletonButton: React.FC<SkeletonProps> = ({ className }) => {
  return <Skeleton className={cn('h-10 w-24 rounded-md', className)} />;
};
```

### Empty State Component

Create a reusable empty state component:

```tsx
// src/components/ui/EmptyState.tsx
import React from 'react';
import { cn } from '../../utils/cn';
import { themeClasses } from '../../utils/themeUtils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center p-8',
      className
    )}>
      {icon && (
        <div className="mb-4 text-neutral-400 dark:text-neutral-500">
          {icon}
        </div>
      )}
      <h3 className={cn(themeClasses.heading4, 'mb-2')}>{title}</h3>
      {description && (
        <p className={cn(themeClasses.bodySmall, 'mb-6 max-w-md text-neutral-500 dark:text-neutral-400')}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
```

## 5. Micro-interactions and Feedback

### Toast Component

Create a toast notification system for user feedback:

```tsx
// src/components/ui/Toast.tsx
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { themeClasses } from '../../utils/themeUtils';
import { Transition } from './transitions/Transition';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-500 text-success-700 dark:bg-success-900/20 dark:border-success-600 dark:text-success-400';
      case 'warning':
        return 'bg-warning-50 border-warning-500 text-warning-700 dark:bg-warning-900/20 dark:border-warning-600 dark:text-warning-400';
      case 'error':
        return 'bg-error-50 border-error-500 text-error-700 dark:bg-error-900/20 dark:border-error-600 dark:text-error-400';
      case 'info':
      default:
        return 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-600 dark:text-primary-400';
    }
  };

  return (
    <Transition show={show} type="fade" duration={300}>
      <div className={cn(
        'rounded-lg border-l-4 p-4 shadow-md',
        getTypeClasses(),
        themeClasses.transition
      )}>
        <div className="flex items-center justify-between">
          <p className="font-medium">{message}</p>
          <button
            onClick={() => setShow(false)}
            className="ml-4 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  );
};
```

### Tooltip Component

Create a tooltip component for additional information:

```tsx
// src/components/ui/Tooltip.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { themeClasses } from '../../utils/themeUtils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + 8;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - 8;
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const positionClasses = {
    top: 'origin-bottom',
    right: 'origin-left',
    bottom: 'origin-top',
    left: 'origin-right',
  };

  const clonedChild = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  });

  return (
    <>
      {clonedChild}
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-2 py-1 text-xs font-medium rounded shadow-md',
            'bg-neutral-800 text-white dark:bg-neutral-700',
            'animate-fade-in scale-95',
            positionClasses[position],
            themeClasses.transition,
            className
          )}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
```

## 6. Implementation Strategy

### Phased Approach

Implement the visual enhancements in phases to ensure smooth integration:

1. **Phase 1: Foundation**
   - Update color system in Tailwind config
   - Add CSS variables for theming
   - Update typography and font imports
   - Enhance theme utilities

2. **Phase 2: Core Components**
   - Implement Card component
   - Implement Button component
   - Update existing UI components to use new theme classes

3. **Phase 3: Advanced Components**
   - Add animation utilities
   - Implement Transition components
   - Create skeleton loaders and empty states
   - Add micro-interaction components (Toast, Tooltip)

4. **Phase 4: Integration**
   - Apply new components to existing pages
   - Ensure dark mode compatibility
   - Test across different screen sizes
   - Optimize performance

### Component Migration Strategy

When updating existing components:

1. Create the new component version
2. Maintain backward compatibility
3. Gradually replace old component instances
4. Add deprecation warnings to old components
5. Remove old components after full migration

## 7. Testing and Quality Assurance

### Visual Testing Checklist ✅

- [x] Test all components in light mode
- [x] Test all components in dark mode
- [x] Verify responsive behavior on mobile, tablet, and desktop
- [x] Check animations and transitions
- [x] Verify focus states for accessibility
- [x] Test with keyboard navigation
- [x] Verify color contrast meets WCAG standards

### Browser Compatibility ✅

Test the visual enhancements across different browsers:

- [x] Chrome
- [x] Firefox
- [x] Safari
- [x] Edge

### Performance Considerations

- Use `will-change` property sparingly for animations
- Optimize SVG icons for performance
- Lazy load non-critical components
- Monitor bundle size impact of new components

## 8. Compatibility Guidelines

### Backward Compatibility

To maintain compatibility with existing code:

- Keep legacy color classes available
- Provide migration guides for developers
- Use the `cn()` utility to merge old and new classes
- Create wrapper components that adapt old props to new components

### Future-Proofing

Design considerations for future enhancements:

- Use CSS variables for easy theme customization
- Create component APIs that can be extended
- Document component usage and customization options
- Separate presentation from logic for easier updates

### Accessibility Standards

Ensure all components meet accessibility standards:

- Use semantic HTML elements
- Provide appropriate ARIA attributes
- Ensure keyboard navigability
- Maintain sufficient color contrast
- Support screen readers
- Test with accessibility tools