import React from 'react';

// Allow columns to be a number or a responsive object
interface GridProps {
  children: React.ReactNode;
  columns?: number | { [key: string]: number };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
}

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
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

  const classes = [
    'grid',
    'items-stretch', // Ensure all grid items stretch to same height
    colClasses,
    gapMap[gap],
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