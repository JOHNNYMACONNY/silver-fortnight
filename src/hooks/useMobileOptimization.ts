import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Mobile optimization hook for responsive design and touch interactions
 */
export interface MobileOptimizationState {
  // Device detection
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  
  // Screen dimensions
  screenSize: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  };
  
  // Performance preferences
  prefersReducedMotion: boolean;
  prefersReducedData: boolean;
  
  // Touch optimization
  touchTarget: {
    size: 'small' | 'standard' | 'large';
    minSize: number;
  };
  
  // Viewport information
  viewport: {
    width: number;
    height: number;
    scale: number;
  };
}

export interface MobileOptimizationUtils {
  // Responsive utilities
  getResponsiveValue: <T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }) => T;
  
  // Touch utilities
  getTouchTargetClass: (size?: 'small' | 'standard' | 'large') => string;
  getOptimalSpacing: (baseSpacing: number) => number;
  
  // Performance utilities
  shouldUseReducedAnimations: () => boolean;
  shouldLazyLoad: () => boolean;
  
  // Layout utilities
  getOptimalColumns: (maxColumns: number) => number;
  getOptimalFontSize: (baseFontSize: string) => string;
  
  // Interaction utilities
  handleTouchFeedback: (element: HTMLElement) => void;
  optimizeScrolling: (container: HTMLElement) => () => void;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

const TOUCH_TARGET_SIZES = {
  small: 32,
  standard: 44,
  large: 56,
} as const;

export const useMobileOptimization = (): MobileOptimizationState & MobileOptimizationUtils => {
  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: {
      width: 0,
      height: 0,
      orientation: 'landscape',
    },
    prefersReducedMotion: false,
    prefersReducedData: false,
    touchTarget: {
      size: 'standard',
      minSize: TOUCH_TARGET_SIZES.standard,
    },
    viewport: {
      width: 0,
      height: 0,
      scale: 1,
    },
  });

  // Update device and screen information
  const updateDeviceInfo = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const isMobile = width < BREAKPOINTS.mobile;
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.tablet;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Determine optimal touch target size based on device
    let touchTargetSize: 'small' | 'standard' | 'large' = 'standard';
    if (isMobile) {
      touchTargetSize = 'large'; // Larger targets for mobile
    } else if (isTablet) {
      touchTargetSize = 'standard';
    } else {
      touchTargetSize = 'small'; // Smaller targets for desktop with mouse
    }

    setState(prev => ({
      ...prev,
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenSize: {
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait',
      },
      touchTarget: {
        size: touchTargetSize,
        minSize: TOUCH_TARGET_SIZES[touchTargetSize],
      },
      viewport: {
        width,
        height,
        scale: window.devicePixelRatio || 1,
      },
    }));
  }, []);

  // Update preferences
  const updatePreferences = useCallback(() => {
    setState(prev => ({
      ...prev,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersReducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,
    }));
  }, []);

  // Initialize and listen for changes
  useEffect(() => {
    updateDeviceInfo();
    updatePreferences();

    const handleResize = () => {
      updateDeviceInfo();
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(updateDeviceInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Listen for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dataQuery = window.matchMedia('(prefers-reduced-data: reduce)');
    
    motionQuery.addEventListener('change', updatePreferences);
    dataQuery.addEventListener('change', updatePreferences);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      motionQuery.removeEventListener('change', updatePreferences);
      dataQuery.removeEventListener('change', updatePreferences);
    };
  }, [updateDeviceInfo, updatePreferences]);

  // Responsive value utility
  const getResponsiveValue = useCallback(<T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }): T => {
    if (state.isMobile && values.mobile !== undefined) {
      return values.mobile;
    }
    if (state.isTablet && values.tablet !== undefined) {
      return values.tablet;
    }
    if (state.isDesktop && values.desktop !== undefined) {
      return values.desktop;
    }
    return values.default;
  }, [state.isMobile, state.isTablet, state.isDesktop]);

  // Touch target class utility
  const getTouchTargetClass = useCallback((size?: 'small' | 'standard' | 'large') => {
    const targetSize = size || state.touchTarget.size;
    return `touch-target-${targetSize}`;
  }, [state.touchTarget.size]);

  // Optimal spacing utility
  const getOptimalSpacing = useCallback((baseSpacing: number) => {
    if (state.isMobile) {
      return Math.max(baseSpacing * 0.75, 8); // Reduce spacing on mobile but maintain minimum
    }
    if (state.isTablet) {
      return baseSpacing * 0.9;
    }
    return baseSpacing;
  }, [state.isMobile, state.isTablet]);

  // Animation optimization
  const shouldUseReducedAnimations = useCallback(() => {
    return state.prefersReducedMotion || (state.isMobile && state.prefersReducedData);
  }, [state.prefersReducedMotion, state.isMobile, state.prefersReducedData]);

  // Lazy loading optimization
  const shouldLazyLoad = useCallback(() => {
    return state.isMobile || state.prefersReducedData;
  }, [state.isMobile, state.prefersReducedData]);

  // Optimal columns utility
  const getOptimalColumns = useCallback((maxColumns: number) => {
    if (state.isMobile) {
      return 1;
    }
    if (state.isTablet) {
      return Math.min(2, maxColumns);
    }
    return maxColumns;
  }, [state.isMobile, state.isTablet]);

  // Optimal font size utility
  const getOptimalFontSize = useCallback((baseFontSize: string) => {
    const sizeMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
      'text-xs': { mobile: 'text-xs', tablet: 'text-xs', desktop: 'text-xs' },
      'text-sm': { mobile: 'text-sm', tablet: 'text-sm', desktop: 'text-sm' },
      'text-base': { mobile: 'text-sm', tablet: 'text-base', desktop: 'text-base' },
      'text-lg': { mobile: 'text-base', tablet: 'text-lg', desktop: 'text-lg' },
      'text-xl': { mobile: 'text-lg', tablet: 'text-xl', desktop: 'text-xl' },
      'text-2xl': { mobile: 'text-xl', tablet: 'text-2xl', desktop: 'text-2xl' },
      'text-3xl': { mobile: 'text-2xl', tablet: 'text-3xl', desktop: 'text-3xl' },
    };

    const mapping = sizeMap[baseFontSize];
    if (!mapping) return baseFontSize;

    return getResponsiveValue({
      mobile: mapping.mobile,
      tablet: mapping.tablet,
      desktop: mapping.desktop,
      default: baseFontSize,
    });
  }, [getResponsiveValue]);

  // Touch feedback utility
  const handleTouchFeedback = useCallback((element: HTMLElement) => {
    if (!state.isTouchDevice) return;

    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.1s ease-out';

    const resetTransform = () => {
      element.style.transform = 'scale(1)';
      element.removeEventListener('touchend', resetTransform);
      element.removeEventListener('touchcancel', resetTransform);
    };

    element.addEventListener('touchend', resetTransform);
    element.addEventListener('touchcancel', resetTransform);
  }, [state.isTouchDevice]);

  // Scroll optimization utility
  const optimizeScrolling = useCallback((container: HTMLElement) => {
    if (!state.isTouchDevice) return () => {};

    // Enable momentum scrolling on iOS
    container.style.webkitOverflowScrolling = 'touch';
    container.style.overflowScrolling = 'touch';

    // Prevent scroll chaining
    container.style.overscrollBehavior = 'contain';

    return () => {
      container.style.webkitOverflowScrolling = '';
      container.style.overflowScrolling = '';
      container.style.overscrollBehavior = '';
    };
  }, [state.isTouchDevice]);

  return {
    ...state,
    getResponsiveValue,
    getTouchTargetClass,
    getOptimalSpacing,
    shouldUseReducedAnimations,
    shouldLazyLoad,
    getOptimalColumns,
    getOptimalFontSize,
    handleTouchFeedback,
    optimizeScrolling,
  };
};

export default useMobileOptimization;
