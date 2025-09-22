import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMobileOptimization } from './useMobileOptimization';

interface ViewportAwareModalConfig {
  /** Header height in rem units */
  headerHeight?: number;
  /** Footer height in rem units */
  footerHeight?: number;
  /** Additional top margin in rem units */
  topMargin?: number;
  /** Additional bottom margin in rem units */
  bottomMargin?: number;
  /** Minimum content height in rem units */
  minContentHeight?: number;
  /** Maximum content height as percentage of viewport */
  maxContentHeightPercent?: number;
}

interface ViewportAwareModalState {
  /** Calculated safe area dimensions */
  safeArea: {
    top: number;
    bottom: number;
    height: number;
  };
  /** Modal positioning classes */
  positioning: {
    container: string;
    content: string;
  };
  /** Responsive height classes */
  heights: {
    container: string;
    content: string;
    header: string;
    footer: string;
  };
  /** Whether modal should be scrollable */
  isScrollable: boolean;
  /** Layout configuration */
  layout: {
    useFlexbox: boolean;
    headerHeight: string;
    footerHeight: string;
    contentHeight: string;
  };
}

/**
 * Hook for viewport-aware modal positioning and sizing
 * 
 * Features:
 * - Automatically calculates safe viewport areas
 * - Accounts for header/footer heights
 * - Provides responsive positioning classes
 * - Handles mobile vs desktop differences
 * - Prevents viewport overflow
 */
export const useViewportAwareModal = (config: ViewportAwareModalConfig = {}): ViewportAwareModalState => {
  const {
    headerHeight = 4, // 4rem = h-16
    footerHeight = 4, // 4rem estimated
    topMargin = 1, // 1rem additional margin
    bottomMargin = 1, // 1rem additional margin
    minContentHeight = 25, // 25rem minimum
    maxContentHeightPercent = 85, // 85% of viewport max
  } = config;

  const { isMobile, isTablet, isDesktop, viewport } = useMobileOptimization();
  const [safeArea, setSafeArea] = useState({
    top: headerHeight + topMargin,
    bottom: footerHeight + bottomMargin,
    height: 0,
  });

  // Calculate safe area dimensions
  const calculateSafeArea = useCallback(() => {
    const viewportHeight = viewport.height || window.innerHeight;
    const availableHeight = viewportHeight - safeArea.top - safeArea.bottom;
    
    setSafeArea(prev => ({
      ...prev,
      height: Math.max(availableHeight, minContentHeight * 16), // Convert rem to px
    }));
  }, [viewport.height, safeArea.top, safeArea.bottom, minContentHeight]);

  // Update safe area on viewport changes
  useEffect(() => {
    calculateSafeArea();
  }, [calculateSafeArea]);

  // Generate positioning classes with correct navbar heights
  const positioning = useMemo(() => {
    const baseClasses = "absolute left-1/2 transform -translate-x-1/2";
    
    // Mobile: Account for h-14 navbar (3.5rem = 56px)
    if (isMobile) {
      return {
        container: `${baseClasses} top-16 w-[calc(100vw-2rem)]`, // top-16 = 4rem = 64px (56px navbar + 8px margin)
        content: "h-[calc(100vh-8rem)]", // Account for navbar + margins
      };
    }
    
    // Tablet: Account for h-16 navbar (4rem = 64px)
    if (isTablet) {
      return {
        container: `${baseClasses} top-20 w-[calc(100vw-4rem)] max-w-4xl`, // top-20 = 5rem = 80px (64px navbar + 16px margin)
        content: "h-[calc(100vh-10rem)]", // Account for navbar + margins
      };
    }
    
    // Desktop: Account for h-16 navbar (4rem = 64px)
    return {
      container: `${baseClasses} top-20 w-[calc(100vw-4rem)] max-w-6xl`, // top-20 = 5rem = 80px (64px navbar + 16px margin)
      content: "h-[calc(100vh-10rem)]", // Account for navbar + margins
    };
  }, [isMobile, isTablet, isDesktop]);

  // Generate height classes with proper header/footer handling
  const heights = useMemo(() => {
    const maxHeight = `max-h-[${maxContentHeightPercent}vh]`;
    const minHeight = `min-h-[${minContentHeight}rem]`;
    
    // Calculate header and footer heights - match actual modal header/footer
    const headerHeight = isMobile ? 'h-14' : 'h-16'; // Match navbar heights
    const footerHeight = isMobile ? 'h-14' : 'h-16'; // Reasonable footer heights
    
    if (isMobile) {
      return {
        container: `${maxHeight} ${minHeight}`,
        content: "h-[calc(100vh-7rem)]", // Account for navbar (3.5rem) + header (3.5rem)
        header: headerHeight,
        footer: footerHeight,
      };
    }
    
    if (isTablet) {
      return {
        container: `${maxHeight} ${minHeight}`,
        content: "h-[calc(100vh-8rem)]", // Account for navbar (4rem) + header (4rem)
        header: headerHeight,
        footer: footerHeight,
      };
    }
    
    return {
      container: `${maxHeight} ${minHeight}`,
      content: "h-[calc(100vh-8rem)]", // Account for navbar (4rem) + header (4rem)
      header: headerHeight,
      footer: footerHeight,
    };
  }, [isMobile, isTablet, isDesktop, maxContentHeightPercent, minContentHeight]);

  // Generate layout configuration for proper flexbox handling
  const layout = useMemo(() => {
    const headerHeight = isMobile ? '3.5rem' : '4rem'; // Match actual heights
    const footerHeight = isMobile ? '3.5rem' : '4rem'; // Match actual heights
    
    return {
      useFlexbox: true,
      headerHeight,
      footerHeight,
      contentHeight: `calc(100% - ${headerHeight} - ${footerHeight})`,
    };
  }, [isMobile, isTablet, isDesktop]);

  // Determine if content should be scrollable
  const isScrollable = useMemo(() => {
    return safeArea.height < minContentHeight * 16;
  }, [safeArea.height, minContentHeight]);

  return {
    safeArea,
    positioning,
    heights,
    isScrollable,
    layout,
  };
};

/**
 * Utility function to get responsive modal classes
 */
export const getModalClasses = (config: ViewportAwareModalConfig = {}) => {
  const { positioning, heights } = useViewportAwareModal(config);
  
  return {
    container: `${positioning.container} ${heights.container}`,
    content: `${positioning.content} ${heights.content}`,
  };
};
