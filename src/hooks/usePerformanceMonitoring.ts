/**
 * Performance Monitoring Hooks for TradeYa
 * 
 * Custom hooks for component-level performance monitoring, integrating with
 * the performance context and providing easy-to-use performance tracking capabilities.
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { usePerformance } from '../contexts/PerformanceContext';
import { PerformanceMetrics, startComponentRenderTimer, endComponentRenderTimer } from '../utils/performanceMetrics';
import { logger } from '@utils/logging/logger';

/**
 * Component performance metrics
 */
export interface ComponentPerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  isOptimized: boolean;
}

/**
 * Performance monitoring options
 */
export interface PerformanceMonitoringOptions {
  /** Component name for identification */
  componentName?: string;
  /** Enable automatic metrics collection */
  autoCollect?: boolean;
  /** Track render performance */
  trackRenders?: boolean;
  /** Track user interactions */
  trackInteractions?: boolean;
  /** Performance threshold for warnings (ms) */
  renderThreshold?: number;
  /** Sample rate for performance tracking */
  sampleRate?: number;
  /** Enable detailed timing */
  enableDetailedTiming?: boolean;
}

/**
 * Default monitoring options
 */
const DEFAULT_OPTIONS: Required<PerformanceMonitoringOptions> = {
  componentName: 'UnnamedComponent',
  autoCollect: true,
  trackRenders: true,
  trackInteractions: true,
  renderThreshold: 16, // 16ms for 60fps
  sampleRate: 1.0,
  enableDetailedTiming: process.env.NODE_ENV !== 'production'
};

/**
 * Main performance monitoring hook
 */
export const usePerformanceMonitoring = (options: PerformanceMonitoringOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { collectMetrics, addBusinessMetric, trackJourneyStep } = usePerformance();
  
  const [componentMetrics, setComponentMetrics] = useState<ComponentPerformanceMetrics>({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    isOptimized: true
  });

  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  const totalRenderTimeRef = useRef<number>(0);
  const lastRenderStartRef = useRef<number>(0);

  // Component mount tracking
  useEffect(() => {
    mountTimeRef.current = Date.now();
    
    if (opts.autoCollect) {
      trackJourneyStep(`${opts.componentName}_mounted`);
    }

    return () => {
      if (opts.autoCollect) {
        const mountDuration = Date.now() - mountTimeRef.current;
        addBusinessMetric(`${opts.componentName}_lifetime`, mountDuration);
        trackJourneyStep(`${opts.componentName}_unmounted`);
      }
    };
  }, [opts.componentName, opts.autoCollect, addBusinessMetric, trackJourneyStep]);

  // Track renders
  useEffect(() => {
    if (!opts.trackRenders) return;

    const renderStart = performance.now();
    lastRenderStartRef.current = renderStart;

    // Use requestAnimationFrame to measure after render
    const rafId = requestAnimationFrame(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      renderCountRef.current++;
      totalRenderTimeRef.current += renderTime;

      const averageRenderTime = totalRenderTimeRef.current / renderCountRef.current;
      const isOptimized = renderTime <= opts.renderThreshold;

      setComponentMetrics(prev => ({
        ...prev,
        renderTime,
        lastRenderTime: renderTime,
        updateCount: renderCountRef.current,
        totalRenderTime: totalRenderTimeRef.current,
        averageRenderTime,
        isOptimized: isOptimized && prev.isOptimized
      }));

      // Log performance warnings
      if (renderTime > opts.renderThreshold && opts.enableDetailedTiming) {
        logger.warn(`⚠️ Slow render detected in ${opts.componentName}: ${renderTime.toFixed(2)}ms (threshold: ${opts.renderThreshold}ms)`, 'APP');
      }

      // Sample and report metrics
      if (Math.random() < opts.sampleRate && opts.autoCollect) {
        addBusinessMetric(`${opts.componentName}_render_time`, renderTime);
        
        if (renderCountRef.current % 10 === 0) { // Report every 10 renders
          addBusinessMetric(`${opts.componentName}_average_render_time`, averageRenderTime);
        }
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  });

  return {
    metrics: componentMetrics,
    isOptimized: componentMetrics.isOptimized,
    trackInteraction: useCallback((interactionName: string, metadata?: Record<string, any>) => {
      if (opts.trackInteractions) {
        trackJourneyStep(`${opts.componentName}_${interactionName}`, {
          componentName: opts.componentName,
          ...metadata
        });
      }
    }, [opts.componentName, opts.trackInteractions, trackJourneyStep]),
    
    measureAsync: useCallback(async <T>(
      asyncOperation: () => Promise<T>,
      operationName: string
    ): Promise<T> => {
      const start = performance.now();
      try {
        const result = await asyncOperation();
        const duration = performance.now() - start;
        
        if (opts.autoCollect) {
          addBusinessMetric(`${opts.componentName}_${operationName}_duration`, duration);
        }
        
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        addBusinessMetric(`${opts.componentName}_${operationName}_error_duration`, duration);
        throw error;
      }
    }, [opts.componentName, opts.autoCollect, addBusinessMetric])
  };
};

/**
 * Hook for measuring render performance of specific components
 */
export const useRenderPerformance = (componentName: string) => {
  const renderTimesRef = useRef<number[]>([]);
  const [stats, setStats] = useState({
    averageRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: Infinity,
    totalRenders: 0,
    slowRenderCount: 0
  });

  useEffect(() => {
    const renderStart = performance.now();
    
    const measureRender = () => {
      const renderTime = performance.now() - renderStart;
      renderTimesRef.current.push(renderTime);
      
      // Keep only last 100 renders
      if (renderTimesRef.current.length > 100) {
        renderTimesRef.current.shift();
      }

      const times = renderTimesRef.current;
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);
      const slowCount = times.filter(time => time > 16).length;

      setStats({
        averageRenderTime: average,
        maxRenderTime: max,
        minRenderTime: min === Infinity ? 0 : min,
        totalRenders: times.length,
        slowRenderCount: slowCount
      });
    };

    const rafId = requestAnimationFrame(measureRender);
    return () => cancelAnimationFrame(rafId);
  });

  return stats;
};

/**
 * Hook for measuring async operations
 */
export const useAsyncPerformance = () => {
  const { addBusinessMetric } = usePerformance();
  const [operations, setOperations] = useState<Map<string, {
    start: number;
    name: string;
    metadata?: Record<string, any>;
  }>>(new Map());

  const startOperation = useCallback((name: string, metadata?: Record<string, any>) => {
    const operationId = `${name}_${Date.now()}_${Math.random()}`;
    setOperations(prev => new Map(prev.set(operationId, {
      start: performance.now(),
      name,
      metadata
    })));
    return operationId;
  }, []);

  const endOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const operation = prev.get(operationId);
      if (operation) {
        const duration = performance.now() - operation.start;
        addBusinessMetric(`async_${operation.name}_duration`, duration);
        
        if (operation.metadata) {
          Object.entries(operation.metadata).forEach(([key, value]) => {
            addBusinessMetric(`async_${operation.name}_${key}`, value);
          });
        }

        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      }
      return prev;
    });
  }, [addBusinessMetric]);

  const measureAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    operationName: string,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const operationId = startOperation(operationName, metadata);
    try {
      const result = await asyncFn();
      endOperation(operationId);
      return result;
    } catch (error) {
      endOperation(operationId);
      addBusinessMetric(`async_${operationName}_errors`, 1);
      throw error;
    }
  }, [startOperation, endOperation, addBusinessMetric]);

  return {
    startOperation,
    endOperation,
    measureAsync,
    activeOperations: operations.size
  };
};

/**
 * Hook for tracking user interactions performance
 */
export const useInteractionPerformance = () => {
  const { trackJourneyStep, addBusinessMetric } = usePerformance();
  const interactionTimesRef = useRef<Map<string, number>>(new Map());

  const trackInteraction = useCallback((
    interactionType: string,
    target?: string,
    metadata?: Record<string, any>
  ) => {
    const timestamp = performance.now();
    const interactionKey = `${interactionType}_${target || 'unknown'}`;
    
    // Track the interaction start
    interactionTimesRef.current.set(interactionKey, timestamp);
    
    trackJourneyStep(`interaction_${interactionType}`, {
      target,
      timestamp,
      ...metadata
    });
  }, [trackJourneyStep]);

  const trackInteractionEnd = useCallback((
    interactionType: string,
    target?: string,
    metadata?: Record<string, any>
  ) => {
    const endTime = performance.now();
    const interactionKey = `${interactionType}_${target || 'unknown'}`;
    const startTime = interactionTimesRef.current.get(interactionKey);
    
    if (startTime) {
      const duration = endTime - startTime;
      addBusinessMetric(`interaction_${interactionType}_duration`, duration);
      interactionTimesRef.current.delete(interactionKey);
      
      trackJourneyStep(`interaction_${interactionType}_end`, {
        target,
        duration,
        ...metadata
      });
    }
  }, [addBusinessMetric, trackJourneyStep]);

  const measureInteraction = useCallback((
    interactionType: string,
    target?: string
  ) => {
    trackInteraction(interactionType, target);
    
    return () => {
      trackInteractionEnd(interactionType, target);
    };
  }, [trackInteraction, trackInteractionEnd]);

  return {
    trackInteraction,
    trackInteractionEnd,
    measureInteraction
  };
};

/**
 * Hook for network request performance monitoring
 */
export const useNetworkPerformance = () => {
  const { addBusinessMetric } = usePerformance();
  const [networkMetrics, setNetworkMetrics] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageRequestTime: 0,
    slowRequestCount: 0
  });

  const measureRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    requestName: string,
    options: {
      timeout?: number;
      slowThreshold?: number;
    } = {}
  ): Promise<T> => {
    const { timeout = 30000, slowThreshold = 1000 } = options;
    const start = performance.now();
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });
      
      const result = await Promise.race([requestFn(), timeoutPromise]);
      const duration = performance.now() - start;
      
      // Update metrics
      setNetworkMetrics(prev => ({
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests + 1,
        failedRequests: prev.failedRequests,
        averageRequestTime: (prev.averageRequestTime * prev.totalRequests + duration) / (prev.totalRequests + 1),
        slowRequestCount: prev.slowRequestCount + (duration > slowThreshold ? 1 : 0)
      }));

      // Track business metrics
      addBusinessMetric(`network_${requestName}_duration`, duration);
      addBusinessMetric(`network_${requestName}_success`, 1);
      
      if (duration > slowThreshold) {
        addBusinessMetric(`network_${requestName}_slow`, 1);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      // Update metrics
      setNetworkMetrics(prev => ({
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests,
        failedRequests: prev.failedRequests + 1,
        averageRequestTime: (prev.averageRequestTime * prev.totalRequests + duration) / (prev.totalRequests + 1),
        slowRequestCount: prev.slowRequestCount
      }));

      // Track business metrics
      addBusinessMetric(`network_${requestName}_error`, 1);
      addBusinessMetric(`network_${requestName}_error_duration`, duration);
      
      throw error;
    }
  }, [addBusinessMetric]);

  return {
    measureRequest,
    metrics: networkMetrics
  };
};

/**
 * Hook for memory usage monitoring
 */
export const useMemoryPerformance = () => {
  const { addBusinessMetric } = usePerformance();
  const [memoryMetrics, setMemoryMetrics] = useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    memoryPressure: 'low' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    const updateMemoryMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const limit = memory.jsHeapSizeLimit;
        
        const usagePercentage = (used / limit) * 100;
        let pressure: 'low' | 'medium' | 'high' = 'low';
        
        if (usagePercentage > 80) pressure = 'high';
        else if (usagePercentage > 60) pressure = 'medium';

        setMemoryMetrics({
          usedJSHeapSize: used,
          totalJSHeapSize: total,
          jsHeapSizeLimit: limit,
          memoryPressure: pressure
        });

        // Report metrics periodically
        addBusinessMetric('memory_usage_percentage', usagePercentage);
        addBusinessMetric('memory_pressure', pressure);
      }
    };

    updateMemoryMetrics();
    const interval = setInterval(updateMemoryMetrics, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [addBusinessMetric]);

  return memoryMetrics;
};

/**
 * Utility hook for performance profiling
 */
export const usePerformanceProfiler = () => {
  const profiles = useRef<Map<string, {
    start: number;
    marks: Array<{ name: string; time: number; }>;
  }>>(new Map());

  const startProfile = useCallback((profileName: string) => {
    const start = performance.now();
    performance.mark(`${profileName}_start`);
    
    profiles.current.set(profileName, {
      start,
      marks: []
    });
  }, []);

  const addMark = useCallback((profileName: string, markName: string) => {
    const profile = profiles.current.get(profileName);
    if (profile) {
      const time = performance.now();
      performance.mark(`${profileName}_${markName}`);
      
      profile.marks.push({
        name: markName,
        time: time - profile.start
      });
    }
  }, []);

  const endProfile = useCallback((profileName: string) => {
    const profile = profiles.current.get(profileName);
    if (profile) {
      const totalTime = performance.now() - profile.start;
      performance.mark(`${profileName}_end`);
      performance.measure(`${profileName}_total`, `${profileName}_start`, `${profileName}_end`);
      
      profiles.current.delete(profileName);
      
      return {
        totalTime,
        marks: profile.marks
      };
    }
    return null;
  }, []);

  return {
    startProfile,
    addMark,
    endProfile
  };
};

export default usePerformanceMonitoring;