import React, { useState, useEffect, useRef } from 'react';
import { TRANSITION_DURATION } from '../../../utils/animations';

type Direction = 'left' | 'right' | 'up' | 'down';

interface SlideProps {
  children: React.ReactNode;
  show: boolean;
  direction?: Direction;
  duration?: number;
  onExited?: () => void;
}

export const Slide: React.FC<SlideProps> = ({
  children,
  show,
  direction = 'right',
  duration = TRANSITION_DURATION.MEDIUM,
  onExited
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onExited) onExited();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onExited]);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const getTransformValue = (dir: Direction, isEntering: boolean) => {
      const enterMap = {
        left: 'translateX(-100%)',
        right: 'translateX(100%)',
        up: 'translateY(-100%)',
        down: 'translateY(100%)'
      };
      
      const exitMap = {
        left: 'translateX(100%)',
        right: 'translateX(-100%)',
        up: 'translateY(100%)',
        down: 'translateY(-100%)'
      };
      
      return isEntering ? enterMap[dir] : exitMap[dir];
    };
    
    if (show) {
      element.style.transform = getTransformValue(direction, true);
      element.style.transition = `transform ${duration}ms ease-out`;
      
      // Force a reflow to ensure the transition works
      void element.offsetWidth;
      
      element.style.transform = 'translate(0, 0)';
    } else {
      element.style.transform = 'translate(0, 0)';
      element.style.transition = `transform ${duration}ms ease-in`;
      
      // Force a reflow to ensure the transition works
      void element.offsetWidth;
      
      element.style.transform = getTransformValue(direction, false);
    }
  }, [show, direction, duration]);
  
  if (!shouldRender) return null;
  
  return (
    <div ref={elementRef} style={{ overflow: 'hidden' }}>
      {children}
    </div>
  );
};
