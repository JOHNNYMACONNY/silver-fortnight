import React, { useState, useEffect, Children, cloneElement, isValidElement } from 'react';

interface TransitionGroupProps {
  children: React.ReactNode;
  component?: React.ElementType;
  className?: string;
  appear?: boolean;
}

export const TransitionGroup: React.FC<TransitionGroupProps> = ({
  children,
  component: Component = 'div',
  className,
  // appear = false
}) => {
  const [prevChildren, setPrevChildren] = useState<React.ReactNode>(children);
  const [childrenToRender, setChildrenToRender] = useState<React.ReactNode>(children);

  useEffect(() => {
    // When children change, update the state
    if (prevChildren !== children) {
      setPrevChildren(children);

      // Find children that are leaving
      const prevChildrenArray = Children.toArray(prevChildren);
      const nextChildrenArray = Children.toArray(children);

      const prevKeys = new Set(
        prevChildrenArray
          .filter(isValidElement)
          .map(child => child.key)
      );

      const nextKeys = new Set(
        nextChildrenArray
          .filter(isValidElement)
          .map(child => child.key)
      );

      // Find keys that are in prevKeys but not in nextKeys
      const leavingKeys = [...prevKeys].filter(key => !nextKeys.has(key));

      if (leavingKeys.length === 0) {
        // If no children are leaving, just update the children
        setChildrenToRender(children);
      } else {
        // If some children are leaving, keep them in the DOM with show=false
        const leavingChildren = prevChildrenArray
          .filter(isValidElement)
          .filter(child => leavingKeys.includes(child.key));

        const updatedLeavingChildren = leavingChildren.map(child => {
          if (isValidElement(child) && child.props && typeof child.props === 'object' && 'show' in child.props) {
            return cloneElement(child, { show: false } as any);
          }
          return child;
        });

        // Combine the new children with the leaving children
        setChildrenToRender([...nextChildrenArray, ...updatedLeavingChildren]);
      }
    }
  }, [children, prevChildren]);

  return (
    <Component className={className}>
      {childrenToRender}
    </Component>
  );
};
