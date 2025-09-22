/**
 * Performance Context Provider for TradeYa
 * 
 * Provides app-wide performance monitoring capabilities, integrating with
 * the RUM service and critical path analyzer. Follows existing context
 * provider patterns in the application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { RUMService, initializeRUM, getRUMService, RUMConfig, RUMMetrics, SessionInfo } from '../services/performance/rumService';
import { CriticalPathAnalyzer, CriticalPathAnalysis, CriticalPathConfig, analyzeCriticalPath } from '../utils/performance/criticalPathAnalyzer';
import { PerformanceMetrics, getBasicPerformanceMetrics } from '../utils/performanceMetrics';
import { analyticsService } from '../services/analytics/AnalyticsService';

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitoringConfig {
  /** Enable/disable performance monitoring */
  enabled: boolean;
  /** RUM service configuration */
  rumConfig: Partial<RUMConfig>;
  /** Critical path analyzer configuration */
  criticalPathConfig: Partial<CriticalPathConfig>;
  /** Auto-collect metrics on route changes */
  autoCollectOnRouteChange: boolean;
  /** Auto-apply optimizations */
  autoApplyOptimizations: boolean;
  /** Development mode features */
  developmentMode: boolean;
}

/**
 * Performance context state
 */
export interface PerformanceContextState {
  /** Current performance metrics */
  metrics: Partial<PerformanceMetrics>;
  /** Critical path analysis results */
  criticalPathAnalysis: CriticalPathAnalysis | null;
  /** Current session information */
  sessionInfo: SessionInfo | null;
  /** Performance monitoring configuration */
  config: PerformanceMonitoringConfig;
  /** Loading state */
  isAnalyzing: boolean;
  /** Error state */
  error: string | null;
  /** Performance score (0-100) */
  performanceScore: number;
  /** Budget status */
  budgetStatus: 'pass' | 'warn' | 'fail';
}

/**
 * Performance context actions
 */
export interface PerformanceContextActions {
  /** Collect metrics for current page */
  collectMetrics: (pageId: string, additionalMetrics?: Partial<PerformanceMetrics>) => void;
  /** Run critical path analysis */
  analyzeCriticalPath: () => Promise<void>;
  /** Track user journey step */
  trackJourneyStep: (stepName: string, metadata?: Record<string, any>) => void;
  /** Add business metric */
  addBusinessMetric: (key: string, value: any) => void;
  /** Update configuration */
  updateConfig: (newConfig: Partial<PerformanceMonitoringConfig>) => void;
  /** Reset metrics */
  resetMetrics: () => void;
  /** Apply performance optimizations */
  applyOptimizations: () => void;
  /** Export performance data */
  exportData: () => any;
  /** Get RUM service instance for direct access */
  getRUMService: () => RUMService | null;
}

/**
 * Combined performance context type
 */
export type PerformanceContextType = PerformanceContextState & PerformanceContextActions;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PerformanceMonitoringConfig = {
  enabled: true,
  rumConfig: {
    samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    batchSize: 50,
    batchInterval: 30000,
    enableOfflineQueue: true,
    maxOfflineQueueSize: 100
  },
  criticalPathConfig: {
    enablePreloading: true,
    enableResourceHints: true,
    maxPreloadResources: 10
  },
  autoCollectOnRouteChange: true,
  autoApplyOptimizations: process.env.NODE_ENV === 'production',
  developmentMode: process.env.NODE_ENV !== 'production'
};

/**
 * Performance Context
 */
const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

/**
 * Performance Provider Props
 */
export interface PerformanceProviderProps {
  children: ReactNode;
  config?: Partial<PerformanceMonitoringConfig>;
  userId?: string;
}

/**
 * Performance Provider Component
 */
export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({
  children,
  config: userConfig = {},
  userId
}) => {
  // Merge user config with defaults
  const [config, setConfig] = useState<PerformanceMonitoringConfig>({
    ...DEFAULT_CONFIG,
    ...userConfig
  });

  // State
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [criticalPathAnalysis, setCriticalPathAnalysis] = useState<CriticalPathAnalysis | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceScore, setPerformanceScore] = useState(100);
  const [budgetStatus, setBudgetStatus] = useState<'pass' | 'warn' | 'fail'>('pass');

  // RUM Service and Critical Path Analyzer instances
  const [rumService, setRumService] = useState<RUMService | null>(null);
  const [criticalPathAnalyzer, setCriticalPathAnalyzer] = useState<CriticalPathAnalyzer | null>(null);

  /**
   * Initialize performance monitoring
   */
  useEffect(() => {
    if (!config.enabled) return;

    try {
      // Initialize RUM service
      const rum = initializeRUM(config.rumConfig);
      setRumService(rum);

      // Initialize Critical Path Analyzer
      const analyzer = new CriticalPathAnalyzer(config.criticalPathConfig);
      setCriticalPathAnalyzer(analyzer);

      // Get initial session info
      const session = rum.getSessionInfo();
      setSessionInfo(session);

      // Auto-collect initial metrics
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          collectMetrics('initial-load');
        }, 1000);
      }

      // Auto-run critical path analysis
      if (config.autoApplyOptimizations) {
        setTimeout(() => {
          runCriticalPathAnalysis();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to initialize performance monitoring:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }

    return () => {
      // Cleanup
      if (rumService) {
        rumService.destroy();
      }
      if (criticalPathAnalyzer) {
        criticalPathAnalyzer.destroy();
      }
    };
  }, [config.enabled]);

  /**
   * Listen for route changes to auto-collect metrics
   */
  useEffect(() => {
    if (!config.autoCollectOnRouteChange || typeof window === 'undefined') return;

    const handleRouteChange = () => {
      const pageId = window.location.pathname;
      setTimeout(() => {
        collectMetrics(pageId);
      }, 500);
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [config.autoCollectOnRouteChange]);

  /**
   * Collect performance metrics
   */
  const collectMetrics = useCallback((pageId: string, additionalMetrics: Partial<PerformanceMetrics> = {}) => {
    if (!config.enabled || !rumService) return;

    try {
      // Get basic performance metrics
      const basicMetrics = getBasicPerformanceMetrics();
      const combinedMetrics = { ...basicMetrics, ...additionalMetrics };

      // Update local state
      setMetrics(combinedMetrics);

      // Send to RUM service
      rumService.collectMetrics(pageId, combinedMetrics, userId);

      // Track performance metrics in analytics
      analyticsService.trackPerformance('page_performance', {
        pageId,
        metrics: combinedMetrics,
        timestamp: new Date().toISOString()
      });

      // Update session info
      const session = rumService.getSessionInfo();
      setSessionInfo(session);

      // Calculate performance score
      const score = calculatePerformanceScore(combinedMetrics);
      setPerformanceScore(score);

      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error('Failed to collect metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to collect metrics');
    }
  }, [config.enabled, rumService, userId]);

  /**
   * Run critical path analysis
   */
  const runCriticalPathAnalysis = useCallback(async () => {
    if (!config.enabled || !criticalPathAnalyzer) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await criticalPathAnalyzer.analyzeCriticalPath();
      setCriticalPathAnalysis(analysis);

      // Update budget status
      setBudgetStatus(analysis.performanceBudgetStatus.overallStatus);

      // Update performance score from analysis
      setPerformanceScore(analysis.performanceBudgetStatus.score);

      // Auto-apply optimizations if enabled
      if (config.autoApplyOptimizations) {
        criticalPathAnalyzer.applyPreloading(analysis.preloadCandidates);
        criticalPathAnalyzer.applyResourceHints();
      }
    } catch (err) {
      console.error('Failed to analyze critical path:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze critical path');
    } finally {
      setIsAnalyzing(false);
    }
  }, [config.enabled, config.autoApplyOptimizations, criticalPathAnalyzer]);

  /**
   * Track user journey step
   */
  const trackJourneyStep = useCallback((stepName: string, metadata?: Record<string, any>) => {
    if (!config.enabled || !rumService) return;

    try {
      rumService.trackJourneyStep(stepName, metadata);
      
      // Update session info
      const session = rumService.getSessionInfo();
      setSessionInfo(session);
    } catch (err) {
      console.error('Failed to track journey step:', err);
    }
  }, [config.enabled, rumService]);

  /**
   * Add business metric
   */
  const addBusinessMetric = useCallback((key: string, value: any) => {
    if (!config.enabled || !rumService) return;

    try {
      rumService.addBusinessMetric(key, value);
    } catch (err) {
      console.error('Failed to add business metric:', err);
    }
  }, [config.enabled, rumService]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<PerformanceMonitoringConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));

    // Update RUM service config
    if (rumService && newConfig.rumConfig) {
      rumService.updateConfig(newConfig.rumConfig);
    }

    // Update critical path analyzer config
    if (criticalPathAnalyzer && newConfig.criticalPathConfig) {
      criticalPathAnalyzer.updateConfig(newConfig.criticalPathConfig);
    }
  }, [rumService, criticalPathAnalyzer]);

  /**
   * Reset metrics
   */
  const resetMetrics = useCallback(() => {
    setMetrics({});
    setCriticalPathAnalysis(null);
    setPerformanceScore(100);
    setBudgetStatus('pass');
    setError(null);
  }, []);

  /**
   * Apply performance optimizations
   */
  const applyOptimizations = useCallback(() => {
    if (!config.enabled || !criticalPathAnalyzer || !criticalPathAnalysis) return;

    try {
      criticalPathAnalyzer.applyPreloading(criticalPathAnalysis.preloadCandidates);
      criticalPathAnalyzer.applyResourceHints();
    } catch (err) {
      console.error('Failed to apply optimizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply optimizations');
    }
  }, [config.enabled, criticalPathAnalyzer, criticalPathAnalysis]);

  /**
   * Export performance data
   */
  const exportData = useCallback(() => {
    return {
      metrics,
      criticalPathAnalysis,
      sessionInfo,
      performanceScore,
      budgetStatus,
      config,
      timestamp: Date.now()
    };
  }, [metrics, criticalPathAnalysis, sessionInfo, performanceScore, budgetStatus, config]);

  /**
   * Get RUM service instance for direct access
   */
  const getRUMServiceInstance = useCallback(() => {
    // Return the local instance if available, otherwise try the global instance
    return rumService || getRUMService();
  }, [rumService]);

  /**
   * Calculate performance score from metrics
   */
  const calculatePerformanceScore = (metrics: Partial<PerformanceMetrics>): number => {
    let score = 100;

    // Deduct points based on performance metrics
    if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 1800) {
      score -= Math.min(20, (metrics.firstContentfulPaint - 1800) / 100);
    }

    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
      score -= Math.min(25, (metrics.largestContentfulPaint - 2500) / 200);
    }

    if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
      score -= Math.min(15, (metrics.firstInputDelay - 100) / 10);
    }

    if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
      score -= Math.min(20, (metrics.cumulativeLayoutShift - 0.1) * 200);
    }

    if (metrics.loadTime && metrics.loadTime > 3000) {
      score -= Math.min(20, (metrics.loadTime - 3000) / 500);
    }

    return Math.max(0, Math.min(100, score));
  };

  // Memoize context value to prevent recreation on every render
  const contextValue: PerformanceContextType = useMemo(() => ({
    // State
    metrics,
    criticalPathAnalysis,
    sessionInfo,
    config,
    isAnalyzing,
    error,
    performanceScore,
    budgetStatus,
    
    // Actions
    collectMetrics,
    analyzeCriticalPath: runCriticalPathAnalysis,
    trackJourneyStep,
    addBusinessMetric,
    updateConfig,
    resetMetrics,
    applyOptimizations,
    exportData,
    getRUMService: getRUMServiceInstance
  }), [
    // State dependencies
    metrics,
    criticalPathAnalysis,
    sessionInfo,
    config,
    isAnalyzing,
    error,
    performanceScore,
    budgetStatus,
    // Action dependencies (all memoized with useCallback)
    collectMetrics,
    runCriticalPathAnalysis,
    trackJourneyStep,
    addBusinessMetric,
    updateConfig,
    resetMetrics,
    applyOptimizations,
    exportData,
    getRUMServiceInstance
  ]);

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

/**
 * Custom hook to use the performance context
 */
export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);

  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }

  return context;
};

/**
 * Custom hook for basic performance monitoring
 */
export const usePerformanceMonitoring = (pageId?: string) => {
  const { collectMetrics, metrics, performanceScore, budgetStatus } = usePerformance();

  useEffect(() => {
    if (pageId) {
      collectMetrics(pageId);
    }
  }, [pageId, collectMetrics]);

  return {
    metrics,
    performanceScore,
    budgetStatus,
    collectMetrics: (additionalMetrics?: Partial<PerformanceMetrics>) => 
      collectMetrics(pageId || window.location.pathname, additionalMetrics)
  };
};

/**
 * Custom hook for user journey tracking
 */
export const useJourneyTracking = () => {
  const { trackJourneyStep, sessionInfo } = usePerformance();

  return {
    trackStep: trackJourneyStep,
    sessionInfo
  };
};

/**
 * Custom hook for business metrics
 */
export const useBusinessMetrics = () => {
  const { addBusinessMetric } = usePerformance();

  return {
    track: addBusinessMetric
  };
};

/**
 * Custom hook for performance analysis
 */
export const usePerformanceAnalysis = () => {
  const { 
    analyzeCriticalPath, 
    criticalPathAnalysis, 
    isAnalyzing, 
    applyOptimizations,
    error 
  } = usePerformance();

  return {
    analyze: analyzeCriticalPath,
    analysis: criticalPathAnalysis,
    isAnalyzing,
    applyOptimizations,
    error
  };
};

export default PerformanceProvider;