import { useEffect, useRef, useState, useCallback } from 'react';

export interface IntersectionObserverOptions {
  /** The element that is used as the viewport for checking visibility of the target */
  root?: Element | null;
  /** Margin around the root */
  rootMargin?: string;
  /** Either a single number or an array of numbers which indicate at what percentage of the target's visibility the observer's callback should be executed */
  threshold?: number | number[];
  /** Whether the observer is enabled */
  enabled?: boolean;
}

export interface IntersectionObserverReturn {
  /** Ref to attach to the target element */
  ref: React.RefObject<HTMLElement>;
  /** Whether the target element is intersecting */
  isIntersecting: boolean;
  /** Intersection ratio */
  intersectionRatio: number;
  /** Whether the observer is supported */
  isSupported: boolean;
  /** Disconnect the observer */
  disconnect: () => void;
  /** Reconnect the observer */
  reconnect: () => void;
}

/**
 * Hook for using Intersection Observer API
 * 
 * @param options Intersection Observer options
 * @returns Intersection observer state and controls
 * 
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.1,
 *   rootMargin: '0px 0px -100px 0px'
 * });
 * 
 * return (
 *   <div ref={ref}>
 *     {isIntersecting ? 'Visible' : 'Not visible'}
 *   </div>
 * );
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): IntersectionObserverReturn {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    enabled = true,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check if Intersection Observer is supported
  useEffect(() => {
    setIsSupported('IntersectionObserver' in window);
  }, []);

  // Disconnect observer
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Reconnect observer
  const reconnect = useCallback(() => {
    if (!isSupported || !enabled || !ref.current) return;

    disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsIntersecting(entry.isIntersecting);
          setIntersectionRatio(entry.intersectionRatio);
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observerRef.current.observe(ref.current);
  }, [isSupported, enabled, root, rootMargin, threshold, disconnect]);

  // Set up observer
  useEffect(() => {
    if (!isSupported || !enabled || !ref.current) return;

    reconnect();

    return () => {
      disconnect();
    };
  }, [isSupported, enabled, root, rootMargin, threshold, reconnect, disconnect]);

  return {
    ref,
    isIntersecting,
    intersectionRatio,
    isSupported,
    disconnect,
    reconnect,
  };
}

export default useIntersectionObserver;
