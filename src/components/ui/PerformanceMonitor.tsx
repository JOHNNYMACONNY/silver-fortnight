import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  getBasicPerformanceMetrics,
  observeLCP,
  observeCLS,
  observeFID,
  PerformanceMetrics,
  logPerformanceMetrics
} from '../../utils/performanceMetrics';
import { usePerformance } from '../../contexts/PerformanceContext';
import { logger } from '@utils/logging/logger';

interface PerformanceMonitorProps {
  pageName: string;
  enabled?: boolean;
  onMetricsCollected?: (metrics: Partial<PerformanceMetrics>) => void;
  /** Enable production-grade RUM integration */
  enableRUM?: boolean;
  /** Enable critical path analysis */
  enableCriticalPathAnalysis?: boolean;
  /** Show performance overlay in development */
  showDevOverlay?: boolean;
  /** Additional metadata for the page */
  pageMetadata?: Record<string, any>;
}

// Access the global metrics collection function if available
const globalMetricsCollector = (window as any).__COLLECT_METRICS__;

/**
 * Enhanced PerformanceMonitor component
 *
 * This component collects performance metrics for the page it's included on.
 * Now integrates with the production-grade RUM service and critical path analyzer.
 * It doesn't render anything visible but collects metrics in the background.
 *
 * @param pageName Name of the page being monitored
 * @param enabled Whether monitoring is enabled (default: true)
 * @param onMetricsCollected Callback function called when metrics are collected
 * @param enableRUM Enable RUM service integration (default: true)
 * @param enableCriticalPathAnalysis Enable critical path analysis (default: false)
 * @param showDevOverlay Show development overlay (default: false in production)
 * @param pageMetadata Additional metadata for the page
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  pageName,
  enabled = true,
  onMetricsCollected,
  enableRUM = true,
  enableCriticalPathAnalysis = false,
  showDevOverlay = process.env.NODE_ENV !== 'production',
  pageMetadata = {}
}) => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [showOverlay, setShowOverlay] = useState(false);
  const metricsCollectedRef = useRef(false);
  const currentMetricsRef = useRef<Partial<PerformanceMetrics>>({});
  const loopDetectionRef = useRef(0);
  const circuitBreakerRef = useRef({ broken: false, resetAt: 0 });
  const stablePageNameRef = useRef(pageName);
  const stableEnabledRef = useRef(enabled);

  // Use performance context if available
  const performanceContext = enableRUM ? usePerformance() : null;

  // Stabilize pageMetadata using useRef instead of JSON.stringify to prevent infinite loops
  const stablePageMetadataRef = useRef(pageMetadata);
  const stablePageMetadata = useMemo(() => {
    // Only update if object keys/values actually changed
    const current = pageMetadata;
    const previous = stablePageMetadataRef.current;
    
    if (Object.keys(current).length !== Object.keys(previous).length) {
      stablePageMetadataRef.current = current;
      return current;
    }
    
    for (const key in current) {
      if (current[key] !== previous[key]) {
        stablePageMetadataRef.current = current;
        return current;
      }
    }
    
    return previous;
  }, [pageMetadata]);

  // Memoize callback functions to prevent recreation on every render
  const memoizedOnMetricsCollected = useCallback(
    onMetricsCollected || (() => {}),
    [onMetricsCollected]
  );

  // Track page load performance
  useEffect(() => {
    // Circuit breaker pattern - prevent infinite loops
    const now = Date.now();
    if (circuitBreakerRef.current.broken) {
      if (now < circuitBreakerRef.current.resetAt) {
        logger.warn('🔒 PerformanceMonitor: Circuit breaker active, skipping execution', 'COMPONENT');
        return;
      } else {
        // Reset circuit breaker after 5 seconds
        circuitBreakerRef.current.broken = false;
        loopDetectionRef.current = 0;
        logger.debug('🔓 PerformanceMonitor: Circuit breaker reset, resuming normal operation', 'COMPONENT');
      }
    }

    if (!enabled) return;

    // Enhanced loop detection with automatic recovery
    loopDetectionRef.current++;
    if (loopDetectionRef.current > 3) {
      logger.warn('⚠️ PerformanceMonitor: Potential infinite loop detected. Effect has run', 'COMPONENT', { arg0: loopDetectionRef.current, arg1: 'times for page:', arg2: pageName });
      
      if (loopDetectionRef.current > 8) {
        logger.error('🚨 PerformanceMonitor: Infinite loop detected! Activating circuit breaker to prevent browser crash.', 'COMPONENT');
        circuitBreakerRef.current.broken = true;
        circuitBreakerRef.current.resetAt = now + 5000; // Reset after 5 seconds
        return;
      }
    }

    // Update stable refs
    stablePageNameRef.current = pageName;
    stableEnabledRef.current = enabled;

    // Track page journey step
    if (performanceContext) {
      performanceContext.trackJourneyStep(`page_${pageName}_load_start`, {
        pageName,
        ...stablePageMetadata
      });
    }

    // Collect basic metrics after the page has loaded
    const handleLoad = () => {
      // Wait a bit to ensure all metrics are available
      setTimeout(() => {
        if (metricsCollectedRef.current) return; // Prevent duplicate collection

        const basicMetrics = getBasicPerformanceMetrics();
        const enhancedMetrics = {
          ...basicMetrics,
          pageLoadTime: performance.now(), // Time since navigation start
          ...stablePageMetadata
        };

        setMetrics(prev => ({
          ...prev,
          ...enhancedMetrics
        }));

        // Log metrics to console (legacy behavior)
        if (process.env.NODE_ENV !== 'production') {
          logPerformanceMetrics(enhancedMetrics, pageName);
        }

        // Send to RUM service if enabled
        if (performanceContext && enableRUM) {
          performanceContext.collectMetrics(pageName, enhancedMetrics);
        }

        // Call the callback if provided (legacy behavior)
        if (onMetricsCollected) {
          onMetricsCollected(enhancedMetrics);
        }

        // Call the global metrics collector if available (legacy behavior)
        if (globalMetricsCollector) {
          globalMetricsCollector(pageName, enhancedMetrics);
        }

        // Track completion
        if (performanceContext) {
          performanceContext.trackJourneyStep(`page_${pageName}_metrics_collected`, {
            pageName,
            metricsCount: Object.keys(enhancedMetrics).length
          });
        }

        metricsCollectedRef.current = true;
      }, 1000);
    };

    // Observe Largest Contentful Paint
    observeLCP((lcp) => {
      const lcpMetrics = {
        largestContentfulPaint: lcp
      };

      setMetrics(prev => {
        const updatedMetrics = {
          ...prev,
          ...lcpMetrics
        };
        currentMetricsRef.current = updatedMetrics;
        
        // Call callbacks with current metrics to avoid stale closure
        if (memoizedOnMetricsCollected) {
          memoizedOnMetricsCollected(updatedMetrics);
        }
        
        if (globalMetricsCollector) {
          globalMetricsCollector(pageName, updatedMetrics);
        }
        
        return updatedMetrics;
      });

      // Send to RUM service
      if (performanceContext && enableRUM) {
        performanceContext.collectMetrics(pageName, lcpMetrics);
      }
    });

    // Observe Cumulative Layout Shift
    observeCLS((cls) => {
      const clsMetrics = {
        cumulativeLayoutShift: cls
      };

      setMetrics(prev => {
        const updatedMetrics = {
          ...prev,
          ...clsMetrics
        };
        currentMetricsRef.current = updatedMetrics;
        
        // Call callbacks with current metrics to avoid stale closure
        if (memoizedOnMetricsCollected) {
          memoizedOnMetricsCollected(updatedMetrics);
        }
        
        if (globalMetricsCollector) {
          globalMetricsCollector(pageName, updatedMetrics);
        }
        
        return updatedMetrics;
      });

      // Send to RUM service
      if (performanceContext && enableRUM) {
        performanceContext.collectMetrics(pageName, clsMetrics);
      }
    });

    // Observe First Input Delay
    observeFID((fid) => {
      const fidMetrics = {
        firstInputDelay: fid
      };

      setMetrics(prev => {
        const updatedMetrics = {
          ...prev,
          ...fidMetrics
        };
        currentMetricsRef.current = updatedMetrics;
        
        // Call callbacks with current metrics to avoid stale closure
        if (memoizedOnMetricsCollected) {
          memoizedOnMetricsCollected(updatedMetrics);
        }
        
        if (globalMetricsCollector) {
          globalMetricsCollector(pageName, updatedMetrics);
        }
        
        return updatedMetrics;
      });

      // Send to RUM service
      if (performanceContext && enableRUM) {
        performanceContext.collectMetrics(pageName, fidMetrics);
      }
    });

    // Add load event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('load', handleLoad);
    }

    // Run critical path analysis if enabled
    if (enableCriticalPathAnalysis && performanceContext) {
      setTimeout(() => {
        performanceContext.analyzeCriticalPath();
      }, 2000);
    }

    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', handleLoad);
      }
    };
  }, [
    // Use stable refs instead of changing dependencies to prevent infinite loops
    stableEnabledRef.current,
    stablePageNameRef.current,
    memoizedOnMetricsCollected,
    enableRUM,
    enableCriticalPathAnalysis
    // Removed performanceContext and stablePageMetadata from dependencies to break circular dependency
  ]);

  // Development overlay for performance debugging
  useEffect(() => {
    if (!showDevOverlay || process.env.NODE_ENV === 'production') return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Toggle overlay with Ctrl+Shift+P
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setShowOverlay(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDevOverlay]);

  // Render development overlay
  if (showOverlay && showDevOverlay && process.env.NODE_ENV !== 'production') {
    return (
      <div className="fixed top-4 right-4 z-overlay bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md text-sm font-mono">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Performance Monitor</h3>
          <button
            onClick={() => setShowOverlay(false)}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-1">
          <div><strong>Page:</strong> {pageName}</div>
          {performanceContext && (
            <>
              <div><strong>Score:</strong> {performanceContext.performanceScore.toFixed(1)}/100</div>
              <div><strong>Budget:</strong>
                <span className={`ml-1 ${
                  performanceContext.budgetStatus === 'pass' ? 'text-green-400' :
                  performanceContext.budgetStatus === 'warn' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {performanceContext.budgetStatus.toUpperCase()}
                </span>
              </div>
            </>
          )}
          
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {
                typeof value === 'number' ? value.toFixed(2) : String(value)
              }
              {typeof value === 'number' && (key.includes('Time') || key.includes('Paint')) ? 'ms' : ''}
            </div>
          ))}
          
          <div className="text-xs text-gray-400 mt-2">
            Press Ctrl+Shift+P to toggle
          </div>
        </div>
      </div>
    );
  }

  // This component doesn't render anything visible by default
  return null;
};

export default PerformanceMonitor;
