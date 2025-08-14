import React from 'react';

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  as?: React.ElementType;
}

/**
 * Box - Simple layout primitive for spacing, color, and basic styles.
 * Compatible with Tailwind v4 utility classes.
 * Supports polymorphic 'as' prop for different element types (e.g., motion.div).
 */
const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ children, className = '', style, as: Component = 'div', ...rest }, ref) => (
    <Component ref={ref} className={className} style={style} {...rest}>
      {children}
    </Component>
  )
);

export default Box;