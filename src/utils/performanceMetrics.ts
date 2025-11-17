/**
 * Performance Metrics Utility
 *
 * This utility provides functions to measure and log performance metrics
 * for the TradeYa application. It uses the Web Performance API and
 * custom measurements to track various performance aspects.
 */

import type { LayoutShiftEntry, FirstInputEntry } from '../types/browser';
import { logger } from '@utils/logging/logger';

// Types for performance metrics
export interface PerformanceMetrics {
  loadTime?: number;
  timeToInteractive?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  componentRenderTimes?: Record<string, number>;
}

/**
 * Performance logging interface
 */
interface PerformanceLogger {
  warn: (message: string, details?: any) => void;
  info: (message: string, details?: any) => void;
  error: (message: string, details?: any) => void;
}

/**
 * Default performance logger that routes to appropriate logging systems
 */
const performanceLogger: PerformanceLogger = {
  warn: (message: string, details?: any) => {
    // In development, log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`[Performance] ${message}`, 'UTILITY', details);
    }
    // In production, this would route to a proper logging service
  },
  
  info: (message: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[Performance] ${message}`, 'UTILITY', details);
    }
  },
  
  error: (message: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      logger.error(`[Performance] ${message}`, 'UTILITY', details);
    }
    // In production, this would route to error tracking service
  }
};

/**
 * Get basic performance metrics using the Web Performance API
 */
export const getBasicPerformanceMetrics = (): Partial<PerformanceMetrics> => {
  if (typeof window === 'undefined' || !window.performance) {
    performanceLogger.warn('Performance API not supported');
    return {};
  }

  const metrics: Partial<PerformanceMetrics> = {};

  // Navigation timing
  const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationTiming) {
    metrics.loadTime = navigationTiming.loadEventEnd - navigationTiming.startTime;
    metrics.timeToInteractive = navigationTiming.domInteractive - navigationTiming.startTime;
  }

  // Paint timing
  const paintEntries = performance.getEntriesByType('paint');
  const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

  if (firstContentfulPaint) {
    metrics.firstContentfulPaint = firstContentfulPaint.startTime;
  }

  return metrics;
};

/**
 * Start measuring component render time
 * @param componentName Name of the component being measured
 */
export const startComponentRenderTimer = (componentName: string): void => {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  performance.mark(`${componentName}-start`);
};

/**
 * End measuring component render time and return the duration
 * @param componentName Name of the component being measured
 * @returns Duration in milliseconds
 */
export const endComponentRenderTimer = (componentName: string): number => {
  if (typeof window === 'undefined' || !window.performance) {
    return 0;
  }

  performance.mark(`${componentName}-end`);
  performance.measure(
    `${componentName}-measure`,
    `${componentName}-start`,
    `${componentName}-end`
  );

  const measures = performance.getEntriesByName(`${componentName}-measure`);
  const duration = measures.length > 0 ? measures[0].duration : 0;

  // Clean up marks and measures
  performance.clearMarks(`${componentName}-start`);
  performance.clearMarks(`${componentName}-end`);
  performance.clearMeasures(`${componentName}-measure`);

  return duration;
};

/**
 * Create a performance observer for Largest Contentful Paint
 * @param callback Function to call with LCP value
 */
export const observeLCP = (callback: (value: number) => void): void => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    performanceLogger.warn('PerformanceObserver not supported');
    return;
  }

  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    callback(lastEntry.startTime);
    lcpObserver.disconnect();
  });

  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
};

/**
 * Create a performance observer for Cumulative Layout Shift
 * @param callback Function to call with CLS value
 */
export const observeCLS = (callback: (value: number) => void): void => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    logger.warn('PerformanceObserver not supported', 'UTILITY');
    return;
  }

  let clsValue = 0;
  const clsObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const layoutShiftEntry = entry as LayoutShiftEntry;
      if (!layoutShiftEntry.hadRecentInput) {
        clsValue += layoutShiftEntry.value;
      }
    }
    callback(clsValue);
  });

  clsObserver.observe({ type: 'layout-shift', buffered: true });
};

/**
 * Create a performance observer for First Input Delay
 * @param callback Function to call with FID value
 */
export const observeFID = (callback: (value: number) => void): void => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    performanceLogger.warn('PerformanceObserver not supported');
    return;
  }

  const fidObserver = new PerformanceObserver((entryList) => {
    const firstInput = entryList.getEntries()[0] as FirstInputEntry;
    callback(firstInput.processingStart - firstInput.startTime);
    fidObserver.disconnect();
  });

  fidObserver.observe({ type: 'first-input', buffered: true });
};

/**
 * Structured performance metrics logging
 * @param metrics Performance metrics object
 * @param pageName Name of the page being measured
 */
export const logPerformanceMetrics = (
  metrics: Partial<PerformanceMetrics>,
  pageName: string
): void => {
  const formattedMetrics: Record<string, string> = {};

  if (metrics.loadTime !== undefined) {
    formattedMetrics.loadTime = `${metrics.loadTime.toFixed(2)}ms`;
  }

  if (metrics.timeToInteractive !== undefined) {
    formattedMetrics.timeToInteractive = `${metrics.timeToInteractive.toFixed(2)}ms`;
  }

  if (metrics.firstContentfulPaint !== undefined) {
    formattedMetrics.firstContentfulPaint = `${metrics.firstContentfulPaint.toFixed(2)}ms`;
  }

  if (metrics.largestContentfulPaint !== undefined) {
    formattedMetrics.largestContentfulPaint = `${metrics.largestContentfulPaint.toFixed(2)}ms`;
  }

  if (metrics.cumulativeLayoutShift !== undefined) {
    formattedMetrics.cumulativeLayoutShift = `${metrics.cumulativeLayoutShift.toFixed(4)}`;
  }

  if (metrics.firstInputDelay !== undefined) {
    formattedMetrics.firstInputDelay = `${metrics.firstInputDelay.toFixed(2)}ms`;
  }

  if (metrics.componentRenderTimes) {
    const componentTimes: Record<string, string> = {};
    Object.entries(metrics.componentRenderTimes).forEach(([component, time]) => {
      componentTimes[component] = `${time.toFixed(2)}ms`;
    });
    formattedMetrics.componentRenderTimes = JSON.stringify(componentTimes);
  }

  performanceLogger.info(`Performance metrics collected for ${pageName}`, {
    page: pageName,
    metrics: formattedMetrics,
    timestamp: Date.now()
  });
};

/**
 * Create a performance measurement hook for React components
 *
 * Usage example:
 *
 * ```tsx
 * const MyComponent = () => {
 *   usePerformanceMeasurement('MyComponent');
 *   return <div>My Component</div>;
 * };
 * ```
 */
export const createPerformanceHook = () => {
  return (componentName: string): void => {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    // This would be implemented as a React hook in a real application
    // For now, we're just providing the structure
    performanceLogger.info(`Performance measurement hook created for ${componentName}`, {
      component: componentName,
      supported: true
    });
  };
};

// Export a hook placeholder (would be implemented with React's useEffect in a real hook)
export const usePerformanceMeasurement = createPerformanceHook();
