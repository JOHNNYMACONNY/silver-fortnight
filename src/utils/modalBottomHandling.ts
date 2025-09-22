/**
 * Modal bottom handling utilities for proper footer positioning and content overflow
 */

import { cn } from './cn';

export interface BottomHandlingConfig {
  /** Whether to use sticky footer */
  useStickyFooter?: boolean;
  /** Whether to use flexbox layout */
  useFlexboxLayout?: boolean;
  /** Footer height in rem */
  footerHeight?: number;
  /** Header height in rem */
  headerHeight?: number;
  /** Whether to prevent content from pushing footer down */
  preventFooterPush?: boolean;
  /** Whether to enable smooth scrolling */
  enableSmoothScrolling?: boolean;
}

export interface BottomHandlingClasses {
  /** Container classes */
  container: string;
  /** Header classes */
  header: string;
  /** Content area classes */
  content: string;
  /** Footer classes */
  footer: string;
  /** Scrollable content classes */
  scrollableContent: string;
}

/**
 * Generate CSS classes for proper bottom handling in modals
 */
export const getBottomHandlingClasses = (
  config: BottomHandlingConfig = {}
): BottomHandlingClasses => {
  const {
    useStickyFooter = false,
    useFlexboxLayout = true,
    footerHeight = 4, // 4rem
    headerHeight = 4, // 4rem
    preventFooterPush = true,
    enableSmoothScrolling = true,
  } = config;

  const headerHeightClass = `h-${Math.round(headerHeight * 4)}`; // Convert rem to Tailwind units
  const footerHeightClass = `h-${Math.round(footerHeight * 4)}`; // Convert rem to Tailwind units

  if (useFlexboxLayout) {
    return {
      container: "flex flex-col h-full",
      header: `flex-shrink-0 ${headerHeightClass}`,
      content: "flex-1 min-h-0", // flex-1 grows, min-h-0 allows shrinking
      footer: `flex-shrink-0 ${footerHeightClass}`,
      scrollableContent: "overflow-y-auto min-h-0",
    };
  }

  if (useStickyFooter) {
    return {
      container: "relative",
      header: `sticky top-0 z-10 ${headerHeightClass}`,
      content: "relative",
      footer: `sticky bottom-0 z-10 ${footerHeightClass}`,
      scrollableContent: "overflow-y-auto",
    };
  }

  // Default layout
  return {
    container: "relative",
    header: `${headerHeightClass}`,
    content: `h-[calc(100%-${headerHeight}rem-${footerHeight}rem)]`,
    footer: `${footerHeightClass}`,
    scrollableContent: "overflow-y-auto h-full",
  };
};

/**
 * Generate CSS-in-JS styles for bottom handling
 */
export const getBottomHandlingStyles = (
  config: BottomHandlingConfig = {}
): React.CSSProperties => {
  const {
    useFlexboxLayout = true,
    footerHeight = 4,
    headerHeight = 4,
    enableSmoothScrolling = true,
  } = config;

  const styles: React.CSSProperties = {};

  if (useFlexboxLayout) {
    styles.display = 'flex';
    styles.flexDirection = 'column';
    styles.height = '100%';
  }

  if (enableSmoothScrolling) {
    styles.scrollBehavior = 'smooth';
  }

  return styles;
};

/**
 * Hook for managing modal bottom handling
 */
export const useModalBottomHandling = (config: BottomHandlingConfig = {}) => {
  const classes = getBottomHandlingClasses(config);
  const styles = getBottomHandlingStyles(config);

  return {
    classes,
    styles,
    config,
  };
};

/**
 * Utility to calculate optimal content height
 */
export const calculateOptimalContentHeight = (
  viewportHeight: number,
  headerHeight: number,
  footerHeight: number,
  additionalMargin: number = 0
): number => {
  return Math.max(
    200, // Minimum 200px
    viewportHeight - headerHeight - footerHeight - additionalMargin
  );
};

/**
 * Utility to detect if content will overflow
 */
export const willContentOverflow = (
  contentHeight: number,
  availableHeight: number,
  threshold: number = 50 // 50px threshold
): boolean => {
  return contentHeight > availableHeight + threshold;
};

/**
 * Utility to get scroll indicators
 */
export const getScrollIndicators = (
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
) => {
  const canScrollUp = scrollTop > 0;
  const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
  const isNearBottom = scrollTop >= scrollHeight - clientHeight - 10;

  return {
    canScrollUp,
    canScrollDown,
    isNearBottom,
    scrollProgress: scrollHeight > clientHeight 
      ? Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100)
      : 0,
  };
};

/**
 * CSS classes for scroll indicators
 */
export const getScrollIndicatorClasses = (
  canScrollUp: boolean,
  canScrollDown: boolean,
  isNearBottom: boolean
) => {
  return {
    topIndicator: cn(
      "absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-primary/20 to-transparent transition-opacity duration-200",
      canScrollUp ? "opacity-100" : "opacity-0"
    ),
    bottomIndicator: cn(
      "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-primary/20 to-transparent transition-opacity duration-200",
      canScrollDown && !isNearBottom ? "opacity-100" : "opacity-0"
    ),
  };
};
