import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

interface ChildPropsWithTooltip extends React.HTMLAttributes<HTMLElement> {
  'data-tooltip-trigger'?: 'true';
}

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<ChildPropsWithTooltip>;
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

  // Use a ref to store the event target
  const eventTargetRef = useRef<HTMLElement | null>(null);

  // Handler to capture the target element
  const handleMouseMove = (e: MouseEvent) => {
    if (isVisible && !eventTargetRef.current) {
      // Find the closest element that matches our child component
      let target = e.target as HTMLElement;
      while (target && !target.matches('[data-tooltip-trigger="true"]')) {
        target = target.parentElement as HTMLElement;
      }

      if (target) {
        eventTargetRef.current = target;
      }
    }
  };

  // Add event listener for mouse move
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isVisible]);

  // Position the tooltip
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      // Get the trigger element from the event or find it in the DOM
      const triggerElement = eventTargetRef.current ||
        document.querySelector('[data-tooltip-trigger="true"]');

      if (triggerElement) {
        const triggerRect = triggerElement.getBoundingClientRect();
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
    }

    // Reset the event target ref when tooltip is hidden
    if (!isVisible) {
      eventTargetRef.current = null;
    }
  }, [isVisible, position]);

  const positionClasses = {
    top: 'origin-bottom',
    right: 'origin-left',
    bottom: 'origin-top',
    left: 'origin-right',
  };

  // Merge the child's props with our event handlers and data attribute
  const clonedChild = React.cloneElement<ChildPropsWithTooltip>(children, {
    'data-tooltip-trigger': 'true',
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      // Call the original onMouseEnter if it exists
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      // Call the original onMouseLeave if it exists
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    },
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
            'animate-fade-in scale-95 transition-all duration-200',
            positionClasses[position],
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
