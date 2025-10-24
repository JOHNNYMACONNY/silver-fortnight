import React from 'react';

// Allow columns to be a number or a responsive object
interface GridProps {
  children: React.ReactNode;
  columns?: number | { [key: string]: number };
  gap?: 'xs' | 'sm' | 'sm+' | 'md' | 'md+' | 'lg' | 'xl' | '2xl' | { [key: string]: 'xs' | 'sm' | 'sm+' | 'md' | 'md+' | 'lg' | 'xl' | '2xl' };
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
}

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  'sm+': 'gap-3', // 12px
  md: 'gap-4',
  'md+': 'gap-5', // 20px
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
};

const gapClass = (size: 'xs' | 'sm' | 'sm+' | 'md' | 'md+' | 'lg' | 'xl' | '2xl', prefix = '') => {
  return `${prefix}${gapMap[size]}`;
};

const colClass = (col: number, prefix = '') => {
  // Tailwind supports up to grid-cols-12 by default
  return `${prefix}grid-cols-${col}`;
};

/**
 * Grid - CSS grid layout primitive.
 * Compatible with Tailwind v4 utility classes.
 * Supports polymorphic 'as' prop for different element types (e.g., motion.div).
 */
const Grid: React.FC<GridProps> = ({
  children,
  columns = 1,
  gap = 'md',
  className = '',
  style,
  as: Component = 'div',
}) => {
  let colClasses = '';
  if (typeof columns === 'number') {
    colClasses = colClass(columns);
  } else if (typeof columns === 'object') {
    // e.g., { base: 1, md: 2, lg: 4 }
    colClasses = Object.entries(columns)
      .map(([breakpoint, col]) => {
        if (breakpoint === 'base') return colClass(col);
        return `${breakpoint}:${colClass(col)}`;
      })
      .join(' ');
  }

  let gapClasses = '';
  if (typeof gap === 'string') {
    gapClasses = gapMap[gap];
  } else if (typeof gap === 'object') {
    // e.g., { base: 'md', sm: 'lg', md: 'xl' }
    gapClasses = Object.entries(gap)
      .map(([breakpoint, gapSize]) => {
        if (breakpoint === 'base') return gapClass(gapSize);
        return gapClass(gapSize, `${breakpoint}:`);
      })
      .join(' ');
  }

  const classes = [
    'grid',
    'items-stretch', // Ensure all grid items stretch to same height
    colClasses,
    gapClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} style={style}>
      {children}
    </Component>
  );
};

export default Grid; 