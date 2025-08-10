/**
 * Animation Utilities
 *
 * This file contains optimized utility functions and constants for animations and transitions.
 * It provides both CSS-based animations and Framer Motion compatible configurations.
 */

// Transition durations (in milliseconds)
export const TRANSITION_DURATION = {
  VERY_FAST: 100,
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500,
  VERY_SLOW: 800
};

// Transition timing functions
export const TRANSITION_TIMING = {
  DEFAULT: 'ease',
  LINEAR: 'linear',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  // Custom cubic-bezier timing functions for more natural animations
  BOUNCE: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  ELASTIC: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  SMOOTH: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  SHARP: 'cubic-bezier(0.4, 0, 0.2, 1)',
  ANTICIPATE: 'cubic-bezier(0.38, 0.01, 0.78, 0.13)'
};

// Animation keyframes - using transform and opacity for GPU acceleration
export const KEYFRAMES = {
  FADE_IN: [
    { opacity: 0 },
    { opacity: 1 }
  ],
  FADE_OUT: [
    { opacity: 1 },
    { opacity: 0 }
  ],
  SLIDE_IN_RIGHT: [
    { transform: 'translateX(100%)', opacity: 0 },
    { transform: 'translateX(0)', opacity: 1 }
  ],
  SLIDE_OUT_RIGHT: [
    { transform: 'translateX(0)', opacity: 1 },
    { transform: 'translateX(100%)', opacity: 0 }
  ],
  SLIDE_IN_LEFT: [
    { transform: 'translateX(-100%)', opacity: 0 },
    { transform: 'translateX(0)', opacity: 1 }
  ],
  SLIDE_OUT_LEFT: [
    { transform: 'translateX(0)', opacity: 1 },
    { transform: 'translateX(-100%)', opacity: 0 }
  ],
  SLIDE_IN_UP: [
    { transform: 'translateY(30px)', opacity: 0 },
    { transform: 'translateY(0)', opacity: 1 }
  ],
  SLIDE_OUT_UP: [
    { transform: 'translateY(0)', opacity: 1 },
    { transform: 'translateY(-30px)', opacity: 0 }
  ],
  SLIDE_IN_DOWN: [
    { transform: 'translateY(-30px)', opacity: 0 },
    { transform: 'translateY(0)', opacity: 1 }
  ],
  SLIDE_OUT_DOWN: [
    { transform: 'translateY(0)', opacity: 1 },
    { transform: 'translateY(30px)', opacity: 0 }
  ],
  SCALE_IN: [
    { transform: 'scale(0.95)', opacity: 0 },
    { transform: 'scale(1)', opacity: 1 }
  ],
  SCALE_OUT: [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(0.95)', opacity: 0 }
  ],
  PULSE: [
    { transform: 'scale(1)' },
    { transform: 'scale(1.05)' },
    { transform: 'scale(1)' }
  ],
  POP_IN: [
    { transform: 'scale(0.9) translateY(10px)', opacity: 0 },
    { transform: 'scale(1.02) translateY(-5px)', opacity: 0.7 },
    { transform: 'scale(1) translateY(0)', opacity: 1 }
  ],
  POP_OUT: [
    { transform: 'scale(1) translateY(0)', opacity: 1 },
    { transform: 'scale(1.02) translateY(-5px)', opacity: 0.7 },
    { transform: 'scale(0.9) translateY(10px)', opacity: 0 }
  ]
};

// Animation options with optimized settings
export const ANIMATION_OPTIONS = {
  FADE_IN: {
    keyframes: KEYFRAMES.FADE_IN,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.EASE_OUT,
      fill: 'forwards' as FillMode
    }
  },
  FADE_OUT: {
    keyframes: KEYFRAMES.FADE_OUT,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.EASE_IN,
      fill: 'forwards' as FillMode
    }
  },
  SLIDE_IN_RIGHT: {
    keyframes: KEYFRAMES.SLIDE_IN_RIGHT,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.EASE_OUT,
      fill: 'forwards' as FillMode
    }
  },
  SLIDE_OUT_RIGHT: {
    keyframes: KEYFRAMES.SLIDE_OUT_RIGHT,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.EASE_IN,
      fill: 'forwards' as FillMode
    }
  },
  SCALE_IN: {
    keyframes: KEYFRAMES.SCALE_IN,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.EASE_OUT,
      fill: 'forwards' as FillMode
    }
  },
  SCALE_OUT: {
    keyframes: KEYFRAMES.SCALE_OUT,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.EASE_IN,
      fill: 'forwards' as FillMode
    }
  },
  PULSE: {
    keyframes: KEYFRAMES.PULSE,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.EASE_IN_OUT,
      iterations: 1
    }
  },
  POP_IN: {
    keyframes: KEYFRAMES.POP_IN,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.BOUNCE,
      fill: 'forwards' as FillMode
    }
  },
  POP_OUT: {
    keyframes: KEYFRAMES.POP_OUT,
    options: {
      duration: TRANSITION_DURATION.MEDIUM,
      easing: TRANSITION_TIMING.ANTICIPATE,
      fill: 'forwards' as FillMode
    }
  }
};

// Framer Motion variants for common animations
export const MOTION_VARIANTS = {
  // Fade animations
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },

  // Slide animations
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  },
  slideDown: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  },
  slideLeft: {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  },
  slideRight: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  },

  // Scale animations
  scale: {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  },

  // Combined animations
  popIn: {
    hidden: { scale: 0.9, opacity: 0, y: 10 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    }
  },

  // List item animations (for staggered children)
  listItem: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  },

  // Modal animations
  modal: {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  },

  // Backdrop animations
  backdrop: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    },
    exit: {
      opacity: 0,
      transition: {
        delay: 0.1,
        duration: 0.2
      }
    }
  }
};

// Helper function to animate an element using the Web Animations API
export const animateElement = (
  element: HTMLElement,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions
): Animation => {
  // Use requestAnimationFrame to ensure animations are synchronized with the browser's refresh rate
  return new Promise<Animation>((resolve) => {
    requestAnimationFrame(() => {
      const animation = element.animate(keyframes, options);
      resolve(animation);
    });
  }) as unknown as Animation;
};

// Helper function to add a transition class with optimized timing
export const addTransitionClass = (
  element: HTMLElement,
  className: string,
  duration: number = TRANSITION_DURATION.MEDIUM
): Promise<void> => {
  return new Promise((resolve) => {
    // Use requestAnimationFrame to ensure class changes are synchronized with the browser's refresh rate
    requestAnimationFrame(() => {
      element.classList.add(className);

      // Use setTimeout to wait for the transition to complete
      setTimeout(() => {
        resolve();
      }, duration);
    });
  });
};

// Helper function to remove a transition class with optimized timing
export const removeTransitionClass = (
  element: HTMLElement,
  className: string,
  duration: number = TRANSITION_DURATION.MEDIUM
): Promise<void> => {
  return new Promise((resolve) => {
    // Use requestAnimationFrame to ensure class changes are synchronized with the browser's refresh rate
    requestAnimationFrame(() => {
      element.classList.remove(className);

      // Use setTimeout to wait for the transition to complete
      setTimeout(() => {
        resolve();
      }, duration);
    });
  });
};

// Helper function to create staggered animations for lists
export const createStaggeredAnimation = (
  parent: HTMLElement,
  childSelector: string,
  animation: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions,
  staggerDelay: number = 50
): Animation[] => {
  const children = Array.from(parent.querySelectorAll(childSelector));

  return children.map((child, index) => {
    const staggeredOptions = {
      ...options,
      delay: (options.delay || 0) + (index * staggerDelay)
    };

    return animateElement(child as HTMLElement, animation, staggeredOptions);
  });
};

// Helper function to throttle animations for better performance
export const throttleAnimation = (
  callback: (...args: any[]) => void,
  delay: number = 100
): (...args: any[]) => void => {
  let lastCall = 0;

  return (...args: any[]) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  };
};
