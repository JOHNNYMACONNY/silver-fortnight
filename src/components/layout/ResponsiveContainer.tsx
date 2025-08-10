import React from 'react';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  
  // Layout configuration
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Mobile-specific options
  mobileFullWidth?: boolean;
  mobilePadding?: 'none' | 'sm' | 'md' | 'lg';
  
  // Responsive behavior
  centerContent?: boolean;
  adaptiveSpacing?: boolean;
  
  // Performance options
  optimizeForTouch?: boolean;
  enableScrollOptimization?: boolean;
  
  // Container type
  as?: React.ElementType;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
  none: '',
};

const paddingClasses = {
  none: '',
  sm: 'px-2 py-2',
  md: 'px-4 py-4',
  lg: 'px-6 py-6',
  xl: 'px-8 py-8',
};

const mobilePaddingClasses = {
  none: '',
  sm: 'px-2 py-2',
  md: 'px-3 py-3',
  lg: 'px-4 py-4',
};

/**
 * ResponsiveContainer - Adaptive container component that optimizes layout for different screen sizes
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md',
  mobileFullWidth = true,
  mobilePadding,
  centerContent = true,
  adaptiveSpacing = true,
  optimizeForTouch = true,
  enableScrollOptimization = true,
  as: Component = 'div',
}) => {
  const {
    isMobile,
    isTablet,
    getOptimalSpacing,
    shouldUseReducedAnimations,
    optimizeScrolling,
  } = useMobileOptimization();

  const containerRef = React.useRef<HTMLElement>(null);

  // Apply scroll optimization
  React.useEffect(() => {
    if (enableScrollOptimization && containerRef.current) {
      const cleanup = optimizeScrolling(containerRef.current);
      return cleanup;
    }
  }, [enableScrollOptimization, optimizeScrolling]);

  // Determine responsive classes
  const responsiveClasses = React.useMemo(() => {
    const classes = [];

    // Base container classes
    classes.push('w-full');

    // Max width - mobile gets full width if specified
    if (mobileFullWidth && isMobile) {
      classes.push('max-w-full');
    } else {
      classes.push(maxWidthClasses[maxWidth]);
    }

    // Centering
    if (centerContent) {
      classes.push('mx-auto');
    }

    // Padding - use mobile-specific padding if provided
    if (isMobile && mobilePadding) {
      classes.push(mobilePaddingClasses[mobilePadding]);
    } else {
      classes.push(paddingClasses[padding]);
    }

    // Touch optimization
    if (optimizeForTouch && isMobile) {
      classes.push('touch-manipulation');
    }

    // Reduced motion support
    if (shouldUseReducedAnimations()) {
      classes.push('motion-reduce:transform-none');
    }

    return classes;
  }, [
    isMobile,
    maxWidth,
    mobileFullWidth,
    centerContent,
    padding,
    mobilePadding,
    optimizeForTouch,
    shouldUseReducedAnimations,
  ]);

  // Adaptive spacing styles
  const adaptiveStyles = React.useMemo(() => {
    if (!adaptiveSpacing) return {};

    const baseSpacing = 16; // 1rem
    const optimalSpacing = getOptimalSpacing(baseSpacing);

    return {
      '--adaptive-spacing': `${optimalSpacing}px`,
    } as React.CSSProperties;
  }, [adaptiveSpacing, getOptimalSpacing]);

  return (
    <Component
      ref={containerRef}
      className={cn(
        // Base responsive classes
        ...responsiveClasses,
        
        // Custom className
        className
      )}
      style={adaptiveStyles}
    >
      {children}
    </Component>
  );
};

/**
 * ResponsiveGrid - Grid container that adapts columns based on screen size
 */
export interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  
  // Column configuration
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  };
  
  // Gap configuration
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  mobileGap?: 'sm' | 'md' | 'lg';
  
  // Layout options
  autoFit?: boolean;
  minItemWidth?: string;
  
  as?: React.ElementType;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const mobileGapClasses = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  columns = { default: 3 },
  gap = 'md',
  mobileGap,
  autoFit = false,
  minItemWidth = '250px',
  as: Component = 'div',
}) => {
  const { isMobile, isTablet, getOptimalColumns } = useMobileOptimization();

  // Determine grid columns
  const gridColumns = React.useMemo(() => {
    if (autoFit) {
      return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
    }

    let cols = columns.default;
    
    if (isMobile && columns.mobile !== undefined) {
      cols = columns.mobile;
    } else if (isTablet && columns.tablet !== undefined) {
      cols = columns.tablet;
    } else if (columns.desktop !== undefined) {
      cols = columns.desktop;
    }

    // Apply optimal columns calculation
    cols = getOptimalColumns(cols);

    return `repeat(${cols}, 1fr)`;
  }, [isMobile, isTablet, columns, autoFit, minItemWidth, getOptimalColumns]);

  // Determine gap classes
  const gapClass = React.useMemo(() => {
    if (isMobile && mobileGap) {
      return mobileGapClasses[mobileGap];
    }
    return gapClasses[gap];
  }, [isMobile, gap, mobileGap]);

  return (
    <Component
      className={cn(
        'grid',
        'w-full',
        gapClass,
        className
      )}
      style={{
        gridTemplateColumns: gridColumns,
      }}
    >
      {children}
    </Component>
  );
};

/**
 * ResponsiveStack - Vertical stack that adapts spacing for mobile
 */
export interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  
  // Spacing configuration
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  mobileSpacing?: 'sm' | 'md' | 'lg';
  
  // Alignment
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  as?: React.ElementType;
}

const spacingClasses = {
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8',
};

const mobileSpacingClasses = {
  sm: 'space-y-1',
  md: 'space-y-2',
  lg: 'space-y-3',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  className = '',
  spacing = 'md',
  mobileSpacing,
  align = 'stretch',
  as: Component = 'div',
}) => {
  const { isMobile } = useMobileOptimization();

  // Determine spacing class
  const spacingClass = React.useMemo(() => {
    if (isMobile && mobileSpacing) {
      return mobileSpacingClasses[mobileSpacing];
    }
    return spacingClasses[spacing];
  }, [isMobile, spacing, mobileSpacing]);

  return (
    <Component
      className={cn(
        'flex',
        'flex-col',
        'w-full',
        spacingClass,
        alignClasses[align],
        className
      )}
    >
      {children}
    </Component>
  );
};

export default ResponsiveContainer;
