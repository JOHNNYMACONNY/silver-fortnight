import { trace, type Trace } from 'firebase/performance';
import { getPerformance } from '@/config/firebase';

/**
 * Performance Trace Helper
 * 
 * Provides a simple API for creating and managing Firebase Performance traces.
 * 
 * Usage:
 * ```typescript
 * const dataFetchTrace = createTrace('profile_data_fetch');
 * dataFetchTrace.start();
 * 
 * // ... do work ...
 * 
 * dataFetchTrace.putAttribute('user_id', userId);
 * dataFetchTrace.incrementMetric('items_fetched', items.length);
 * dataFetchTrace.stop();
 * ```
 */

interface PerformanceTraceWrapper {
  start: () => void;
  stop: () => void;
  incrementMetric: (metricName: string, value?: number) => void;
  putAttribute: (attribute: string, value: string) => void;
  putMetric: (metricName: string, value: number) => void;
}

/**
 * Create a Firebase Performance trace
 * 
 * @param traceName - Name of the trace (e.g., 'profile_data_fetch')
 * @returns Trace wrapper with helper methods
 */
export const createTrace = (traceName: string): PerformanceTraceWrapper => {
  const performance = getPerformance();
  
  // If performance is not available (SSR, test, or initialization failed), return no-op
  if (!performance) {
    return {
      start: () => {},
      stop: () => {},
      incrementMetric: () => {},
      putAttribute: () => {},
      putMetric: () => {},
    };
  }

  const t: Trace = trace(performance, traceName);

  return {
    start: () => {
      try {
        t.start();
      } catch (error) {
        console.warn(`[Performance] Failed to start trace "${traceName}":`, error);
      }
    },
    
    stop: () => {
      try {
        t.stop();
      } catch (error) {
        console.warn(`[Performance] Failed to stop trace "${traceName}":`, error);
      }
    },
    
    incrementMetric: (metricName: string, value: number = 1) => {
      try {
        t.incrementMetric(metricName, value);
      } catch (error) {
        console.warn(`[Performance] Failed to increment metric "${metricName}" on trace "${traceName}":`, error);
      }
    },
    
    putAttribute: (attribute: string, value: string) => {
      try {
        t.putAttribute(attribute, value);
      } catch (error) {
        console.warn(`[Performance] Failed to put attribute "${attribute}" on trace "${traceName}":`, error);
      }
    },
    
    putMetric: (metricName: string, value: number) => {
      try {
        t.putMetric(metricName, value);
      } catch (error) {
        console.warn(`[Performance] Failed to put metric "${metricName}" on trace "${traceName}":`, error);
      }
    },
  };
};

/**
 * Measure the execution time of an async function
 * 
 * @param traceName - Name of the trace
 * @param fn - Async function to measure
 * @returns Result of the function
 */
export const measureAsync = async <T>(
  traceName: string,
  fn: () => Promise<T>
): Promise<T> => {
  const t = createTrace(traceName);
  t.start();
  
  try {
    const result = await fn();
    t.stop();
    return result;
  } catch (error) {
    t.putAttribute('error', 'true');
    t.stop();
    throw error;
  }
};

/**
 * Measure the execution time of a sync function
 * 
 * @param traceName - Name of the trace
 * @param fn - Sync function to measure
 * @returns Result of the function
 */
export const measureSync = <T>(
  traceName: string,
  fn: () => T
): T => {
  const t = createTrace(traceName);
  t.start();
  
  try {
    const result = fn();
    t.stop();
    return result;
  } catch (error) {
    t.putAttribute('error', 'true');
    t.stop();
    throw error;
  }
};

