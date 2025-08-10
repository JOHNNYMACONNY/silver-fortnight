import React from 'react';

interface ClusterProps {
  children: React.ReactNode;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  wrap?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
};
const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};
const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

/**
 * Cluster - Horizontal layout primitive for flex row layouts.
 * Compatible with Tailwind v4 utility classes.
 */
const Cluster: React.FC<ClusterProps> = ({
  children,
  gap = 'md',
  justify = 'start',
  align = 'center',
  wrap = false,
  className = '',
  style,
}) => {
  const classes = [
    'flex',
    'flex-row',
    gapMap[gap],
    justifyMap[justify],
    alignMap[align],
    wrap ? 'flex-wrap' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
};

export default Cluster; 