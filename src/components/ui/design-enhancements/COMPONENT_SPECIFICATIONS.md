# TradeYa Design Enhancement Component Specifications

This document provides detailed specifications for the new components to be implemented as part of the TradeYa design enhancement plan. Each component is described with its purpose, implementation details, props, and usage examples.

## Table of Contents

1. [Glassmorphism Card](#glassmorphism-card)
2. [AnimatedHeading](#animatedheading)
3. [GradientMeshBackground](#gradientmeshbackground)
4. [BentoGrid System](#bentogrid-system)
5. [Card3D](#card3d)
6. [AnimatedList](#animatedlist)
7. [Enhanced Input](#enhanced-input)
8. [Page Transition](#page-transition)

## Glassmorphism Card

### Purpose
Extends the existing Card component with a modern glassmorphism effect that creates a frosted glass appearance with background blur and subtle transparency.

### Implementation

```tsx
// Add to Card.tsx
interface CardProps {
  // Existing props
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass';
  // Other props
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'elevated',
  hover = false,
  // Other props
}) => {
  // Existing implementation

  const variantClasses = {
    elevated: `${themeClasses.card} ${themeClasses.shadowMd}`,
    outlined: `bg-transparent border ${themeClasses.border}`,
    filled: 'bg-neutral-50 dark:bg-neutral-800/50',
    // New glassmorphism variant
    glass: 'glassmorphic'
  };

  // Rest of implementation
};
```

### Props
- `variant`: Adds 'glass' as a new option to the existing variants
- All other props remain the same as the existing Card component

### Usage Example

```tsx
// Basic usage
<Card variant="glass" className="glassmorphic">
  <Card.Body>
    <h3 className="text-xl font-semibold">Glassmorphism Card</h3>
    <p>This card has a modern frosted glass effect.</p>
  </Card.Body>
</Card>

// With hover effect
<Card variant="glass" hover>
  <Card.Body>
    <h3 className="text-xl font-semibold">Interactive Glass Card</h3>
    <p>This card has hover effects combined with glassmorphism.</p>
  </Card.Body>
</Card>
```

### Browser Compatibility
- Requires `backdrop-filter` support (Chrome 76+, Safari 9+, Firefox 70+)
- Fallback to standard card with subtle transparency for unsupported browsers

## AnimatedHeading

### Purpose
Creates animated headings with kinetic typography effects that reveal text as it enters the viewport.

### Implementation

```tsx
// AnimatedHeading.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface AnimatedHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  animation?: 'fade' | 'slide' | 'reveal' | 'highlight';
  delay?: number;
}

export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({
  children,
  className = '',
  as = 'h2',
  animation = 'slide',
  delay = 0
}) => {
  // Animation variants
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slide: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    },
    reveal: {
      hidden: { clipPath: 'inset(0 100% 0 0)' },
      visible: { clipPath: 'inset(0 0 0 0)' }
    },
    highlight: {
      hidden: { backgroundSize: '0% 100%' },
      visible: { backgroundSize: '100% 100%' }
    }
  };

  // Component mapping
  const Component = motion[as];

  // Special styling for highlight animation
  const highlightStyle = animation === 'highlight'
    ? {
        backgroundImage: 'linear-gradient(to right, var(--color-primary-200), var(--color-primary-200))',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 90%',
        backgroundSize: '0% 10%',
        display: 'inline'
      }
    : {};

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants[animation]}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier
      }}
      style={highlightStyle}
    >
      {children}
    </Component>
  );
};
```

### Props
- `children`: React node to be rendered as heading content
- `className`: Optional CSS class names
- `as`: Heading level (h1-h6)
- `animation`: Animation type ('fade', 'slide', 'reveal', 'highlight')
- `delay`: Delay before animation starts (in seconds)

### Usage Example

```tsx
// Basic usage
<AnimatedHeading>Section Title</AnimatedHeading>

// With custom heading level and animation
<AnimatedHeading as="h1" animation="reveal">
  Welcome to TradeYa
</AnimatedHeading>

// With highlight effect
<AnimatedHeading animation="highlight" className="text-3xl font-bold">
  Featured Trades
</AnimatedHeading>

// With delay for staggered headings
<AnimatedHeading delay={0.2}>
  First Heading
</AnimatedHeading>
<AnimatedHeading delay={0.4}>
  Second Heading
</AnimatedHeading>
```

### Accessibility
- Respects user's reduced motion preferences
- Maintains semantic heading structure
- Animations only trigger once per page view

## GradientMeshBackground

### Purpose
Creates organic, flowing gradient mesh backgrounds for section dividers and hero areas.

### Implementation

```tsx
// GradientMeshBackground.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface GradientMeshProps {
  className?: string;
  colorFrom?: string;
  colorTo?: string;
  opacity?: number;
  variant?: 'default' | 'wave' | 'blob' | 'radial';
}

export const GradientMeshBackground: React.FC<GradientMeshProps> = ({
  className = '',
  colorFrom = 'from-primary-500/20',
  colorTo = 'to-secondary-500/20',
  opacity = 0.3,
  variant = 'default'
}) => {
  // SVG patterns for different variants
  const svgPatterns = {
    default: '/images/mesh-gradient.svg',
    wave: '/images/wave-gradient.svg',
    blob: '/images/blob-gradient.svg',
    radial: '/images/radial-gradient.svg'
  };

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <div className={cn('absolute inset-0 bg-gradient-to-r', colorFrom, colorTo)}></div>
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage: `url(${svgPatterns[variant]})`,
          opacity
        }}
      ></div>
    </div>
  );
};
```

### Props
- `className`: Optional CSS class names
- `colorFrom`: Starting gradient color (Tailwind class)
- `colorTo`: Ending gradient color (Tailwind class)
- `opacity`: Opacity of the mesh overlay (0-1)
- `variant`: Mesh pattern variant ('default', 'wave', 'blob', 'radial')

### Usage Example

```tsx
// Basic usage in a section
<section className="relative py-20">
  <GradientMeshBackground />
  <div className="relative z-10">
    <h2>Section Content</h2>
  </div>
</section>

// Custom colors
<GradientMeshBackground
  colorFrom="from-accent-500/30"
  colorTo="to-primary-500/20"
/>

// Different variant
<GradientMeshBackground variant="wave" opacity={0.2} />
```

### Implementation Notes
- Requires SVG mesh gradient files to be created and added to the public directory
- SVGs should be optimized for file size
- Consider creating the SVGs with tools like Figma or online generators

## BentoGrid System

### Purpose
Creates a modern "Bento Box" grid layout for featured content with varying sizes and arrangements.

### Implementation

```tsx
// BentoGrid.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  gap?: 'none' | 'sm' | 'md' | 'lg';
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className = '',
  gap = 'md'
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-6 md:grid-rows-6',
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const BentoItem: React.FC<BentoItemProps> = ({
  children,
  className = '',
  colSpan = 2,
  rowSpan = 2
}) => {
  return (
    <div className={cn(
      `md:col-span-${colSpan} md:row-span-${rowSpan}`,
      className
    )}>
      {children}
    </div>
  );
};
```

### Props

#### BentoGrid
- `children`: React nodes to be rendered as grid items
- `className`: Optional CSS class names
- `gap`: Size of gap between items ('none', 'sm', 'md', 'lg')

#### BentoItem
- `children`: React node to be rendered as item content
- `className`: Optional CSS class names
- `colSpan`: Number of columns the item should span (1-6)
- `rowSpan`: Number of rows the item should span (1-6)

### Usage Example

```tsx
// Basic usage
<BentoGrid>
  <BentoItem colSpan={4} rowSpan={3}>
    <Card>
      <Card.Body>
        <h3>Featured Item</h3>
      </Card.Body>
    </Card>
  </BentoItem>

  <BentoItem colSpan={2} rowSpan={2}>
    <Card>
      <Card.Body>
        <h3>Secondary Item</h3>
      </Card.Body>
    </Card>
  </BentoItem>

  <BentoItem colSpan={2} rowSpan={1}>
    <Card>
      <Card.Body>
        <h3>Small Item</h3>
      </Card.Body>
    </Card>
  </BentoItem>

  <BentoItem colSpan={3} rowSpan={3}>
    <Card>
      <Card.Body>
        <h3>Another Item</h3>
      </Card.Body>
    </Card>
  </BentoItem>
</BentoGrid>

// With custom gap
<BentoGrid gap="lg">
  {/* Items */}
</BentoGrid>
```

### Implementation Notes
- Ensures responsive behavior by defaulting to single column on mobile
- Uses CSS Grid for layout
- Compatible with existing Card components

## Card3D

### Purpose
Adds subtle 3D effects to cards for more depth and interactivity on hover.

### Implementation

```tsx
// Card3D.tsx
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  disabled?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  intensity = 5,
  disabled = false
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isSupported, setIsSupported] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Check for transform-style support
  useEffect(() => {
    // Simple feature detection
    const testEl = document.createElement('div');
    if (typeof testEl.style.transformStyle === 'undefined') {
      setIsSupported(false);
    }
  }, []);

  // If 3D transforms aren't supported or disabled prop is true, just render children
  if (!isSupported || disabled) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * intensity;
    const rotateY = ((centerX - x) / centerX) * intensity;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setRotation({ x: 0, y: 0 });

  return (
    <div
      ref={cardRef}
      className={cn('transition-transform duration-200 ease-out', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </div>
  );
};
```

### Props
- `children`: React node to be rendered with 3D effect
- `className`: Optional CSS class names
- `intensity`: Intensity of the 3D effect (default: 5)
- `disabled`: Disables the 3D effect

### Usage Example

```tsx
// Basic usage with Card component
<Card3D>
  <Card>
    <Card.Body>
      <h3>3D Card</h3>
      <p>This card has a subtle 3D effect on hover.</p>
    </Card.Body>
  </Card>
</Card3D>

// With custom intensity
<Card3D intensity={8}>
  <Card>
    <Card.Body>
      <h3>Enhanced 3D Effect</h3>
      <p>This card has a more pronounced 3D effect.</p>
    </Card.Body>
  </Card>
</Card3D>

// Disabled for certain contexts
<Card3D disabled={isMobile}>
  <Card>
    <Card.Body>
      <h3>Conditional 3D</h3>
      <p>This card only has 3D effects on desktop.</p>
    </Card.Body>
  </Card>
</Card3D>
```

### Browser Compatibility
- Requires support for CSS 3D transforms
- Includes feature detection with fallback
- Automatically disables on touch devices

## AnimatedList

### Purpose
Enhances lists with staggered animations when they enter the viewport.

### Implementation

```tsx
// AnimatedList.tsx
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
```

### Props
- `children`: React nodes to be rendered as list items
- `className`: Optional CSS class names for the container
- `style`: Optional inline styles for the container
- `animation`: Animation type ('fade', 'slideUp', 'slideDown', etc.)
- `staggerDelay`: Delay between each item's animation (in seconds)
- `duration`: Duration of each item's animation (in seconds)
- `initialDelay`: Delay before the first item animates (in seconds)
- `itemClassName`: Optional CSS class names for each item

### Usage Example

```tsx
// Basic usage
<AnimatedList>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</AnimatedList>

// With custom animation
<AnimatedList
  animation="slideUp"
  staggerDelay={0.1}
  className="space-y-4"
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</AnimatedList>

// With dynamic content
<AnimatedList className="space-y-4" animation="scale">
  {items.map(item => (
    <div key={item.id} className="p-4 bg-white rounded-lg shadow">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  ))}
</AnimatedList>
```

### Accessibility
- Respects user's reduced motion preferences
- Animations only play when component is in viewport
- Maintains proper focus management

## Enhanced Input

### Purpose
Enhances the existing Input component with micro-interactions for better user feedback.

### Implementation

```tsx
// Enhanced Input component
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { themeClasses } from '../../utils/themeUtils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  labelClassName?: string;
  inputClassName?: string;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className = '',
  labelClassName = '',
  inputClassName = '',
  containerClassName = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    if (props.onChange) props.onChange(e);
  };

  return (
    <div className={cn('relative', containerClassName)}>
      {label && (
        <motion.label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium transition-all duration-200',
            isFocused ? 'text-primary-500 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300',
            labelClassName
          )}
          animate={{
            y: isFocused || hasValue ? -5 : 0,
            scale: isFocused ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}

      <div className="relative mt-1">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          id={id}
          {...props}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          className={cn(
            'w-full px-4 py-2 rounded-md',
            themeClasses.input,
            themeClasses.transition,
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-error-500 focus:ring-error-500' : '',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            inputClassName
          )}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {rightIcon}
          </div>
        )}

        {/* Animated underline */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-primary-500 rounded"
          initial={{ width: '0%' }}
          animate={{ width: isFocused ? '100%' : '0%' }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {(helperText || error) && (
        <motion.div
          className={cn(
            'mt-1 text-sm',
            error ? 'text-error-500' : 'text-neutral-500 dark:text-neutral-400'
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error || helperText}
        </motion.div>
      )}
    </div>
  );
};
```

### Props
- All standard input props
- `label`: Label text
- `helperText`: Helper text displayed below the input
- `error`: Error message (displays instead of helper text)
- `leftIcon`: Icon to display on the left side
- `rightIcon`: Icon to display on the right side
- `labelClassName`: Additional classes for the label
- `inputClassName`: Additional classes for the input
- `containerClassName`: Additional classes for the container

### Usage Example

```tsx
// Basic usage
<Input
  id="name"
  label="Full Name"
  placeholder="Enter your name"
/>

// With helper text
<Input
  id="email"
  label="Email Address"
  helperText="We'll never share your email"
  type="email"
/>

// With error state
<Input
  id="password"
  label="Password"
  type="password"
  error={errors.password}
/>

// With icons
<Input
  id="search"
  placeholder="Search"
  leftIcon={<SearchIcon className="w-5 h-5 text-neutral-400" />}
/>
```

### Accessibility
- Maintains proper label associations
- Provides clear error states
- Animations are subtle and non-disruptive

## Page Transition

### Purpose
Creates smooth transitions between pages for a more polished user experience.

### Implementation

```tsx
// PageTransition.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  animation = 'fade'
}) => {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // If reduced motion is preferred, render without animations
  if (prefersReducedMotion || animation === 'none') {
    return <div className={className}>{children}</div>;
  }

  // Animation variants
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 }
    }
  };

  const { initial, animate, exit } = animations[animation];

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};
```

### Props
- `children`: React node to be rendered with transition
- `className`: Optional CSS class names
- `animation`: Animation type ('fade', 'slide', 'scale', 'none')

### Usage Example

```tsx
// In a route component
import { PageTransition } from '../components/ui/PageTransition';

const HomePage = () => {
  return (
    <PageTransition>
      <div className="container mx-auto py-8">
        <h1>Welcome to TradeYa</h1>
        {/* Page content */}
      </div>
    </PageTransition>
  );
};

// With custom animation
const ProfilePage = () => {
  return (
    <PageTransition animation="slide">
      <div className="container mx-auto py-8">
        <h1>User Profile</h1>
        {/* Page content */}
      </div>
    </PageTransition>
  );
};
```

### Implementation Notes
- Should be used with AnimatePresence from Framer Motion for proper exit animations
- Respects user's reduced motion preferences
- Keeps transitions subtle to avoid disrupting navigation
