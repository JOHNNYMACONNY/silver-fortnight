import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../../utils/cn';

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'bounce';

interface TransitionProps {
  show: boolean;
  type?: TransitionType;
  duration?: number;
  children: React.ReactNode;
  className?: string;
  onExited?: () => void;
}

export const Transition: React.FC<TransitionProps> = ({
  show,
  type = 'fade',
  duration = 400, // Increased duration for more noticeable transitions
  children,
  className = '',
  onExited,
}) => {
  // Initialize shouldRender based on the show prop
  const [shouldRender, setShouldRender] = useState(show);

  // Track if this is the first render
  const isFirstRender = useRef(true);

  useEffect(() => {
    // If this is the first render and show is false, set shouldRender to false immediately
    if (isFirstRender.current && !show) {
      setShouldRender(false);
      isFirstRender.current = false;
      return;
    }

    // After first render, handle transitions normally
    if (show) {
      setShouldRender(true);
      isFirstRender.current = false;
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onExited) onExited();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onExited]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all ease-in-out transform';
    const durationClass = `duration-${duration}`;

    // More pronounced animations with transform origin
    const animationClasses = {
      fade: show ? 'opacity-100' : 'opacity-0',
      slide: show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0',
      zoom: show ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
      bounce: show ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4',
    };

    // Add transform-origin based on animation type
    const originClasses = {
      fade: '',
      slide: 'origin-top',
      zoom: 'origin-center',
      bounce: 'origin-bottom',
    };

    return cn(baseClasses, durationClass, animationClasses[type], originClasses[type]);
  };

  if (!shouldRender && !show) return null;

  return (
    <div className={cn(getAnimationClasses(), className)}>
      {children}
    </div>
  );
};
