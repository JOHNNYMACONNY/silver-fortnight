/**
 * Modal positioning utilities following modern best practices
 */

import React from 'react';

export interface ModalPositioningConfig {
  /** Whether to use safe area insets */
  useSafeArea?: boolean;
  /** Custom header height in rem */
  headerHeight?: number;
  /** Custom footer height in rem */
  footerHeight?: number;
  /** Whether to center vertically */
  centerVertically?: boolean;
  /** Maximum width as percentage of viewport */
  maxWidthPercent?: number;
  /** Whether to prevent body scroll */
  preventBodyScroll?: boolean;
}

export interface ModalDimensions {
  /** Container positioning classes */
  container: string;
  /** Content area classes */
  content: string;
  /** Whether content should scroll */
  scrollable: boolean;
  /** Safe area measurements in pixels */
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Calculate modal positioning based on viewport and configuration
 */
export const calculateModalPositioning = (
  viewport: { width: number; height: number },
  config: ModalPositioningConfig = {}
): ModalDimensions => {
  const {
    useSafeArea = true,
    headerHeight = 4, // 4rem
    footerHeight = 4, // 4rem
    centerVertically = false,
    maxWidthPercent = 90,
    preventBodyScroll = true,
  } = config;

  // Convert rem to pixels (assuming 16px = 1rem)
  const remToPx = (rem: number) => rem * 16;
  
  const headerPx = remToPx(headerHeight);
  const footerPx = remToPx(footerHeight);
  
  // Calculate safe areas
  const safeArea = {
    top: useSafeArea ? headerPx : 0,
    bottom: useSafeArea ? footerPx : 0,
    left: 16, // 1rem margin
    right: 16, // 1rem margin
  };

  // Calculate available space
  const availableWidth = viewport.width - safeArea.left - safeArea.right;
  const availableHeight = viewport.height - safeArea.top - safeArea.bottom;
  
  // Calculate modal dimensions
  const maxWidth = Math.min(availableWidth, (viewport.width * maxWidthPercent) / 100);
  const maxHeight = availableHeight;
  
  // Generate positioning classes
  const containerClasses = [
    'absolute',
    'left-1/2',
    'transform',
    '-translate-x-1/2',
    centerVertically ? 'top-1/2 -translate-y-1/2' : `top-${Math.round(headerHeight)}`,
    `w-[${Math.round(maxWidth)}px]`,
    `max-w-[${maxWidthPercent}vw]`,
    `max-h-[${Math.round(maxHeight)}px]`,
    'overflow-hidden',
  ].join(' ');

  const contentClasses = [
    'flex',
    'flex-col',
    `h-[${Math.round(maxHeight)}px]`,
    'min-h-0', // Allow flex shrinking
  ].join(' ');

  return {
    container: containerClasses,
    content: contentClasses,
    scrollable: maxHeight < 400, // Scroll if less than 400px height
    safeArea,
  };
};

/**
 * Get responsive modal classes for different screen sizes
 */
export const getResponsiveModalClasses = (
  viewport: { width: number; height: number },
  config: ModalPositioningConfig = {}
) => {
  const isMobile = viewport.width < 768;
  const isTablet = viewport.width >= 768 && viewport.width < 1024;
  const isDesktop = viewport.width >= 1024;

  const baseConfig = {
    ...config,
    maxWidthPercent: isMobile ? 95 : isTablet ? 90 : 85,
    centerVertically: isMobile ? false : isTablet ? false : true,
  };

  return calculateModalPositioning(viewport, baseConfig);
};

/**
 * CSS-in-JS styles for modal positioning
 */
export const getModalStyles = (
  viewport: { width: number; height: number },
  config: ModalPositioningConfig = {}
): React.CSSProperties => {
  const dimensions = calculateModalPositioning(viewport, config);
  
  return {
    position: 'absolute',
    left: '50%',
    top: config.centerVertically ? '50%' : `${dimensions.safeArea.top}px`,
    transform: config.centerVertically 
      ? 'translate(-50%, -50%)' 
      : 'translateX(-50%)',
    width: `min(${config.maxWidthPercent || 90}vw, ${dimensions.safeArea.left + dimensions.safeArea.right}px)`,
    maxHeight: `${viewport.height - dimensions.safeArea.top - dimensions.safeArea.bottom}px`,
    overflow: 'hidden',
  };
};

/**
 * Hook for managing body scroll prevention
 */
export const useBodyScrollLock = (isLocked: boolean) => {
  React.useEffect(() => {
    if (isLocked) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isLocked]);
};
