import React from 'react';

interface StackProps {
  children: React.ReactNode;
  gap?: 'xs' | 'sm' | 'sm+' | 'md' | 'md+' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  distribute?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
  style?: React.CSSProperties;
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
const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};
const distributeMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

/**
 * Stack - Vertical layout primitive for flex column layouts.
 * Compatible with Tailwind v4 utility classes.
 */
const Stack: React.FC<StackProps> = ({
  children,
  gap = 'md',
  align = 'stretch',
  distribute = 'start',
  wrap = false,
  className = '',
  style,
}) => {
  const classes = [
    'flex',
    'flex-col',
    gapMap[gap],
    alignMap[align],
    distributeMap[distribute],
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

export default Stack; 