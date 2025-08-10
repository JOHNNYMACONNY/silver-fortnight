import React, { useState, useEffect, useRef } from 'react';
import { TRANSITION_DURATION } from '../../../utils/animations';

interface FadeProps {
  children: React.ReactNode;
  show: boolean;
  duration?: number;
  onExited?: () => void;
}

export const Fade: React.FC<FadeProps> = ({
  children,
  show,
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
    
    if (show) {
      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms ease-out`;
      
      // Force a reflow to ensure the transition works
      void element.offsetWidth;
      
      element.style.opacity = '1';
    } else {
      element.style.opacity = '1';
      element.style.transition = `opacity ${duration}ms ease-in`;
      
      // Force a reflow to ensure the transition works
      void element.offsetWidth;
      
      element.style.opacity = '0';
    }
  }, [show, duration]);
  
  if (!shouldRender) return null;
  
  return (
    <div ref={elementRef} style={{ opacity: show ? 1 : 0 }}>
      {children}
    </div>
  );
};
