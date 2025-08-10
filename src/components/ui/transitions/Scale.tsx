import React, { useState, useEffect, useRef } from 'react';
import { TRANSITION_DURATION } from '../../../utils/animations';

interface ScaleProps {
  children: React.ReactNode;
  show: boolean;
  startScale?: number;
  duration?: number;
  onExited?: () => void;
}

export const Scale: React.FC<ScaleProps> = ({
  children,
  show,
  startScale = 0.8,
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
      element.style.transform = `scale(${startScale})`;
      element.style.opacity = '0';
      element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
      
      // Force a reflow to ensure the transition works
      void element.offsetWidth;
      
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
    } else {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
      element.style.transition = `transform ${duration}ms ease-in, opacity ${duration}ms ease-in`;
      
      // Force a reflow to ensure the transition works
      void element.offsetWidth;
      
      element.style.transform = `scale(${startScale})`;
      element.style.opacity = '0';
    }
  }, [show, startScale, duration]);
  
  if (!shouldRender) return null;
  
  return (
    <div ref={elementRef} style={{ opacity: show ? 1 : 0, transform: `scale(${show ? 1 : startScale})` }}>
      {children}
    </div>
  );
};
