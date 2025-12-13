import React, { createContext, useContext, useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

// --- Types ---

type SpringConfig = {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass?: number;
};

type TweenConfig = {
  type: 'tween';
  duration: number;
  ease: string | number[];
};

type MotionPreset = {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
  transition: SpringConfig | TweenConfig;
};

type HeroMotionConfig = {
  orbit: {
    degreesPerSecond: number;
    transition: TweenConfig;
  };
  beam: {
    transition: TweenConfig;
    duration: number;
  };
  ripple: {
    transition: SpringConfig;
    lifespan: number;
  };
  spotlight: {
    transition: SpringConfig;
    interval: number;
  };
  token: {
    transition: SpringConfig;
  };
};

interface MotionContextType {
  // Constants
  spring: {
    stiff: SpringConfig;
    bounce: SpringConfig;
    soft: SpringConfig;
    slow: SpringConfig;
  };
  tween: {
    fast: TweenConfig;
    normal: TweenConfig;
    slow: TweenConfig;
  };
  // Presets
  fade: MotionPreset;
  slideUp: MotionPreset;
  scaleIn: MotionPreset;
  hero: HeroMotionConfig;
  // Utilities
  shouldReduceMotion: boolean | null;
  isMotionDisabled: boolean;
}

// --- Constants ---

const springs = {
  stiff: { type: 'spring', stiffness: 400, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 15 },
  soft: { type: 'spring', stiffness: 200, damping: 25 },
  slow: { type: 'spring', stiffness: 100, damping: 20 },
} as const;

const tweens = {
  fast: { type: 'tween', duration: 0.2, ease: 'easeOut' },
  normal: { type: 'tween', duration: 0.4, ease: 'easeInOut' },
  slow: { type: 'tween', duration: 0.8, ease: 'easeInOut' },
} as const;

const heroMotion: HeroMotionConfig = {
  orbit: {
    degreesPerSecond: 6,
    transition: { type: 'tween', duration: 20, ease: 'linear' },
  },
  beam: {
    transition: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
    duration: 600,
  },
  ripple: {
    transition: { type: 'spring', stiffness: 200, damping: 30 },
    lifespan: 2000,
  },
  spotlight: {
    transition: { type: 'spring', stiffness: 220, damping: 24 },
    interval: 8000,
  },
  token: {
    transition: { type: 'spring', stiffness: 260, damping: 28 },
  },
};

// --- Context ---

const MotionContext = createContext<MotionContextType | undefined>(undefined);

/* eslint-disable react-refresh/only-export-components -- file also exports shared hooks */
export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();
  // Allow forcing animations via localStorage for development/testing
  const [forceEnableMotion, setForceEnableMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("force-enable-motion") === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Listen for changes to force-enable-motion
    const handleStorageChange = () => {
      setForceEnableMotion(window.localStorage.getItem("force-enable-motion") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      const current = window.localStorage.getItem("force-enable-motion") === "true";
      if (current !== forceEnableMotion) {
        setForceEnableMotion(current);
      }
    }, 100);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [forceEnableMotion]);

  const isMotionDisabled = forceEnableMotion ? false : Boolean(shouldReduceMotion);

  const value: MotionContextType = {
    spring: springs,
    tween: tweens,
    hero: heroMotion,
    shouldReduceMotion,
    isMotionDisabled,
    // Presets
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: tweens.normal,
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: springs.soft,
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: springs.bounce,
    },
  };

  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  );
};

// --- Hook ---

export const useMotion = () => {
  /* eslint-enable react-refresh/only-export-components */
  const context = useContext(MotionContext);
  if (context === undefined) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
};

