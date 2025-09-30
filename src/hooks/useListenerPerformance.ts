/**
 * Performance monitoring hook for Firebase real-time listeners
 * Tracks memory usage, listener count, and performance metrics
 */

import { useEffect, useRef, useCallback, useState } from "react";

interface ListenerMetrics {
  activeListeners: number;
  totalListeners: number;
  memoryUsage: number;
  averageResponseTime: number;
  errorCount: number;
  lastError?: string;
}

interface ListenerPerformanceOptions {
  maxListeners?: number;
  memoryThreshold?: number; // MB
  responseTimeThreshold?: number; // ms
  enableLogging?: boolean;
}

const DEFAULT_OPTIONS: Required<ListenerPerformanceOptions> = {
  maxListeners: 10,
  memoryThreshold: 50, // 50MB
  responseTimeThreshold: 1000, // 1 second
  enableLogging: true,
};

// Global listener registry
const listenerRegistry = new Map<
  string,
  {
    id: string;
    startTime: number;
    lastActivity: number;
    errorCount: number;
    cleanup: () => void;
  }
>();

export const useListenerPerformance = (
  listenerId: string,
  options: ListenerPerformanceOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [metrics, setMetrics] = useState<ListenerMetrics>({
    activeListeners: 0,
    totalListeners: 0,
    memoryUsage: 0,
    averageResponseTime: 0,
    errorCount: 0,
  });

  const startTimeRef = useRef<number>(Date.now());
  const responseTimesRef = useRef<number[]>([]);
  const errorCountRef = useRef<number>(0);

  // Register listener
  const registerListener = useCallback(
    (cleanup: () => void) => {
      const listenerData = {
        id: listenerId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        errorCount: 0,
        cleanup,
      };

      listenerRegistry.set(listenerId, listenerData);

      if (opts.enableLogging) {
        console.log(`📡 Listener registered: ${listenerId}`);
      }

      // Check if we're exceeding the listener limit
      if (listenerRegistry.size > opts.maxListeners) {
        console.warn(
          `⚠️ Listener limit exceeded: ${listenerRegistry.size}/${opts.maxListeners}`
        );
      }

      return () => {
        listenerRegistry.delete(listenerId);
        cleanup();

        if (opts.enableLogging) {
          console.log(`📡 Listener unregistered: ${listenerId}`);
        }
      };
    },
    [listenerId, opts.maxListeners, opts.enableLogging]
  );

  // Track listener activity
  const trackActivity = useCallback(
    (responseTime?: number) => {
      const listener = listenerRegistry.get(listenerId);
      if (listener) {
        listener.lastActivity = Date.now();

        if (responseTime !== undefined) {
          responseTimesRef.current.push(responseTime);

          // Keep only last 10 response times for average calculation
          if (responseTimesRef.current.length > 10) {
            responseTimesRef.current.shift();
          }

          // Check if response time exceeds threshold
          if (responseTime > opts.responseTimeThreshold) {
            console.warn(
              `⚠️ Slow listener response: ${listenerId} took ${responseTime}ms`
            );
          }
        }
      }
    },
    [listenerId, opts.responseTimeThreshold]
  );

  // Track errors
  const trackError = useCallback(
    (error: Error) => {
      const listener = listenerRegistry.get(listenerId);
      if (listener) {
        listener.errorCount++;
        errorCountRef.current++;
      }

      setMetrics((prev) => ({
        ...prev,
        errorCount: errorCountRef.current,
        lastError: error.message,
      }));

      if (opts.enableLogging) {
        console.error(`❌ Listener error: ${listenerId}`, error);
      }
    },
    [listenerId, opts.enableLogging]
  );

  // Get memory usage (approximate)
  const getMemoryUsage = useCallback((): number => {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in (window.performance as any)
    ) {
      const memory = (window.performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }
    return 0;
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const memoryUsage = getMemoryUsage();
      const averageResponseTime =
        responseTimesRef.current.length > 0
          ? responseTimesRef.current.reduce((a, b) => a + b, 0) /
            responseTimesRef.current.length
          : 0;

      setMetrics({
        activeListeners: listenerRegistry.size,
        totalListeners: listenerRegistry.size,
        memoryUsage,
        averageResponseTime: Math.round(averageResponseTime),
        errorCount: errorCountRef.current,
      });

      // Check memory threshold
      if (memoryUsage > opts.memoryThreshold) {
        console.warn(
          `⚠️ Memory usage high: ${memoryUsage}MB (threshold: ${opts.memoryThreshold}MB)`
        );
      }
    };

    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [getMemoryUsage, opts.memoryThreshold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const listener = listenerRegistry.get(listenerId);
      if (listener) {
        listener.cleanup();
        listenerRegistry.delete(listenerId);
      }
    };
  }, [listenerId]);

  return {
    metrics,
    registerListener,
    trackActivity,
    trackError,
    // Utility functions
    getActiveListeners: () => Array.from(listenerRegistry.keys()),
    getListenerInfo: (id: string) => listenerRegistry.get(id),
    cleanupAllListeners: () => {
      listenerRegistry.forEach((listener) => listener.cleanup());
      listenerRegistry.clear();
    },
  };
};

// Global utility to get all listener metrics
export const getGlobalListenerMetrics = (): ListenerMetrics => {
  const memoryUsage =
    typeof window !== "undefined" &&
    "performance" in window &&
    "memory" in (window.performance as any)
      ? Math.round(
          (window.performance as any).memory.usedJSHeapSize / 1024 / 1024
        )
      : 0;

  return {
    activeListeners: listenerRegistry.size,
    totalListeners: listenerRegistry.size,
    memoryUsage,
    averageResponseTime: 0,
    errorCount: 0,
  };
};

// Cleanup utility for emergency situations
export const emergencyCleanupListeners = () => {
  console.warn("🚨 Emergency cleanup: Removing all active listeners");
  listenerRegistry.forEach((listener) => {
    try {
      listener.cleanup();
    } catch (error) {
      console.error("Error during emergency cleanup:", error);
    }
  });
  listenerRegistry.clear();
};
