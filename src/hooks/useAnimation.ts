import { useRef, useEffect } from 'react';
import { ANIMATION_OPTIONS } from '../utils/animations';

/**
 * Hook to animate an element when it mounts
 * @param animationName The name of the animation to use
 * @param delay Optional delay before starting the animation
 * @returns A ref to attach to the element
 */
export const useAnimateOnMount = (
  animationName: keyof typeof ANIMATION_OPTIONS,
  delay: number = 0
) => {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const animation = ANIMATION_OPTIONS[animationName];

    const timeoutId = setTimeout(() => {
      element.animate(animation.keyframes, animation.options);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [animationName, delay]);

  return elementRef;
};

/**
 * Hook to animate an element when it unmounts
 * @param animationName The name of the animation to use
 * @returns An object with a ref to attach to the element and a function to trigger the animation
 */
export const useAnimateOnUnmount = (animationName: keyof typeof ANIMATION_OPTIONS) => {
  const elementRef = useRef<HTMLElement | null>(null);

  const triggerAnimation = (): Promise<void> => {
    return new Promise((resolve) => {
      const element = elementRef.current;
      if (!element) {
        resolve();
        return;
      }

      const animation = ANIMATION_OPTIONS[animationName];
      const anim = element.animate(animation.keyframes, animation.options);

      anim.onfinish = () => {
        resolve();
      };
    });
  };

  return { ref: elementRef, triggerAnimation };
};

/**
 * Hook to animate an element when a condition changes
 * @param condition The condition to watch
 * @param trueAnimation The animation to use when the condition is true
 * @param falseAnimation The animation to use when the condition is false
 * @returns A ref to attach to the element
 */
export const useAnimateOnCondition = (
  condition: boolean,
  trueAnimation: keyof typeof ANIMATION_OPTIONS,
  falseAnimation: keyof typeof ANIMATION_OPTIONS
) => {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const animation = condition
      ? ANIMATION_OPTIONS[trueAnimation]
      : ANIMATION_OPTIONS[falseAnimation];

    element.animate(animation.keyframes, animation.options);
  }, [condition, trueAnimation, falseAnimation]);

  return elementRef;
};

/**
 * Hook to create a staggered animation for a list of elements
 * @param animationName The name of the animation to use
 * @param count The number of items in the list
 * @param staggerDelay The delay between each item's animation
 * @returns A function to get the ref for a specific index
 */
export const useStaggeredAnimation = (
  animationName: keyof typeof ANIMATION_OPTIONS,
  count: number,
  staggerDelay: number = 100
) => {
  const itemRefs = useRef<(HTMLElement | null)[]>(Array(count).fill(null));

  useEffect(() => {
    const animation = ANIMATION_OPTIONS[animationName];

    itemRefs.current.forEach((element, index) => {
      if (!element) return;

      const delay = index * staggerDelay;

      setTimeout(() => {
        element.animate(animation.keyframes, {
          ...animation.options,
          delay
        });
      }, 0);
    });
  }, [animationName, count, staggerDelay]);

  const getRef = (index: number) => (element: HTMLElement | null) => {
    itemRefs.current[index] = element;
  };

  return getRef;
};

/**
 * Hook to create a pulse animation when a value changes
 * @param value The value to watch for changes
 * @returns A ref to attach to the element
 */
export const usePulseOnChange = <T>(value: T) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const prevValueRef = useRef<T>(value);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (value !== prevValueRef.current) {
      const animation = ANIMATION_OPTIONS.PULSE;
      element.animate(animation.keyframes, animation.options);
      prevValueRef.current = value;
    }
  }, [value]);

  return elementRef;
};
