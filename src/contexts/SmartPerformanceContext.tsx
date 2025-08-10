/**
 * Smart Performance Context for TradeYa
 * 
 * Enhanced performance context that integrates Week 1 RUM infrastructure with
 * Week 2 smart optimization components: intelligent preloading, resource optimization,
 * adaptive loading, and intelligent caching.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
// Remove circular dependency - SmartPerformanceContext will be independent
// import { usePerformance } from './PerformanceContext';
import { SmartOrchestrator, SmartOrchestratorConfig, OrchestratorState, OptimizationSummary } from '../services/performance/smartOrchestrator';
import { PreloadingService, AnalyticsBasedPreloadCandidate, NetworkInfo } from '../services/performance/preloadingService';
import { ResourceOptimizer, OptimizationPlan } from '../utils/performance/resourceOptimizer';
import { AdaptiveLoader, LoadingDecision, UserContext, DeviceCapabilities } from '../services/performance/adaptiveLoader';
import { CacheManager, CacheStats } from '../services/performance/cacheManager';
import { RUMMetrics, SessionInfo } from '../services/performance/rumService';

/**
 * Smart performance configuration
 */
export interface SmartPerformanceConfig {
  /** Enable smart performance features */
  enabled: boolean;
  /** Orchestrator configuration */
  orchestrator: Partial<SmartOrchestratorConfig>;
  /** Auto-optimization settings */
  autoOptimization: {
    /** Enable automatic optimization */
    enabled: boolean;
    /** Optimization triggers */
    triggers: {
      /** Trigger on performance degradation */
      onPerformanceDrop: boolean;
      /** Trigger on network change */
      onNetworkChange: boolean;
      /** Trigger on user behavior change */
      onUserBehaviorChange: boolean;
    };
    /** Optimization intervals */
    intervals: {
      /** Full optimization interval (ms) */
      fullOptimization: number;
      /** Quick optimization interval (ms) */
      quickOptimization: number;
    };
  };
  /** Real-time adaptation */
  realTimeAdaptation: {
    /** Enable real-time adaptation */
    enabled: boolean;
    /** Adaptation sensitivity */
    sensitivity: 'low' | 'medium' | 'high';
    /** Maximum adaptations per session */
    maxAdaptationsPerSession: number;
  };
}

/**
 * Smart performance state
 */
export interface SmartPerformanceState {
  /** Orchestrator state */
  orchestratorState: OrchestratorState | null;
  /** Current optimization summary */
  optimizationSummary: OptimizationSummary | null;
  /** Network information */
  networkInfo: NetworkInfo | null;
  /** Device capabilities */
  deviceCapabilities: DeviceCapabilities | null;
  /** User context */
  userContext: UserContext | null;
  /** Cache statistics */
  cacheStats: CacheStats | null;
  /** Loading decisions history */
  loadingDecisions: LoadingDecision[];
  /** Active preload candidates */
  activePreloads: AnalyticsBasedPreloadCandidate[];
  /** Optimization history */
  optimizationHistory: Array<{
    timestamp: number;
    type: string;
    success: boolean;
    impact: number;
  }>;
  /** Smart features status */
  smartFeaturesStatus: {
    preloading: 'active' | 'inactive' | 'error';
    resourceOptimization: 'active' | 'inactive' | 'error';
    adaptiveLoading: 'active' | 'inactive' | 'error';
    intelligentCaching: 'active' | 'inactive' | 'error';
  };
  /** Performance trends */
  performanceTrends: {
    loadTime: number[];
    cacheHitRate: number[];
    optimizationImpact: number[];
  };
}

/**
 * Smart performance actions
 */
export interface SmartPerformanceActions {
  /** Initialize smart performance features */
  initializeSmartFeatures: () => Promise<void>;
  /** Trigger intelligent preloading */
  triggerIntelligentPreloading: () => Promise<void>;
  /** Optimize resources dynamically */
  optimizeResources: (resourceTypes?: string[]) => Promise<OptimizationPlan | null>;
  /** Adapt loading strategy */
  adaptLoadingStrategy: (resourceType: string) => Promise<LoadingDecision>;
  /** Manage intelligent cache */
  manageCache: (action: 'clear' | 'warm' | 'optimize') => Promise<void>;
  /** Get loading recommendation */
  getLoadingRecommendation: (resourceType: string, context?: any) => LoadingDecision | null;
  /** Update smart configuration */
  updateSmartConfig: (config: Partial<SmartPerformanceConfig>) => void;
  /** Get optimization recommendations */
  getOptimizationRecommendations: () => string[];
  /** Force optimization cycle */
  forceOptimizationCycle: () => Promise<void>;
  /** Reset smart performance state */
  resetSmartPerformance: () => void;
}

/**
 * Combined smart performance context type
 */
export type SmartPerformanceContextType = SmartPerformanceState & SmartPerformanceActions;

/**
 * Default smart performance configuration
 */
const DEFAULT_SMART_CONFIG: SmartPerformanceConfig = {
  enabled: true,
  orchestrator: {
    enabled: true,
    preloading: {
      enabled: true,
      autoAnalyze: true,
      analysisInterval: 5 * 60 * 1000 // 5 minutes
    },
    resourceOptimization: {
      enabled: true,
      autoOptimize: true,
      optimizationInterval: 10 * 60 * 1000 // 10 minutes
    },
    adaptiveLoading: {
      enabled: true,
      autoAdapt: true,
      adaptationInterval: 2 * 60 * 1000 // 2 minutes
    },
    intelligentCaching: {
      enabled: true,
      syncWithRUM: true,
      syncInterval: 1 * 60 * 1000 // 1 minute
    }
  },
  autoOptimization: {
    enabled: true,
    triggers: {
      onPerformanceDrop: true,
      onNetworkChange: true,
      onUserBehaviorChange: true
    },
    intervals: {
      fullOptimization: 15 * 60 * 1000, // 15 minutes
      quickOptimization: 2 * 60 * 1000   // 2 minutes
    }
  },
  realTimeAdaptation: {
    enabled: true,
    sensitivity: 'medium',
    maxAdaptationsPerSession: 10
  }
};

/**
 * Smart Performance Context
 */
const SmartPerformanceContext = createContext<SmartPerformanceContextType | undefined>(undefined);

/**
 * Smart Performance Provider Props
 */
export interface SmartPerformanceProviderProps {
  children: ReactNode;
  config?: Partial<SmartPerformanceConfig>;
}

/**
 * Smart Performance Provider Component
 */
export const SmartPerformanceProvider: React.FC<SmartPerformanceProviderProps> = ({
  children,
  config: userConfig = {}
}) => {
  // BREAKING CIRCULAR DEPENDENCY: Remove dependency on PerformanceContext
  // Create independent performance monitoring to break the circular chain
  // const basePerformanceContext = usePerformance();
  
  // Independent performance state to replace basePerformanceContext
  const [independentPerformanceScore, setIndependentPerformanceScore] = useState(100);
  const [independentMetrics, setIndependentMetrics] = useState<{ loadTime?: number }>({});
  
  // Merge configuration
  const [config, setConfig] = useState<SmartPerformanceConfig>({
    ...DEFAULT_SMART_CONFIG,
    ...userConfig
  });

  // Smart performance state
  const [orchestratorState, setOrchestratorState] = useState<OrchestratorState | null>(null);
  const [optimizationSummary, setOptimizationSummary] = useState<OptimizationSummary | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loadingDecisions, setLoadingDecisions] = useState<LoadingDecision[]>([]);
  const [activePreloads, setActivePreloads] = useState<AnalyticsBasedPreloadCandidate[]>([]);
  const [optimizationHistory, setOptimizationHistory] = useState<Array<{
    timestamp: number;
    type: string;
    success: boolean;
    impact: number;
  }>>([]);
  
  // Fixed smartFeaturesStatus with proper type definition
  const [smartFeaturesStatus, setSmartFeaturesStatus] = useState<{
    preloading: 'active' | 'inactive' | 'error';
    resourceOptimization: 'active' | 'inactive' | 'error';
    adaptiveLoading: 'active' | 'inactive' | 'error';
    intelligentCaching: 'active' | 'inactive' | 'error';
  }>({
    preloading: 'inactive',
    resourceOptimization: 'inactive',
    adaptiveLoading: 'inactive',
    intelligentCaching: 'inactive'
  });

  const [performanceTrends, setPerformanceTrends] = useState({
    loadTime: [] as number[],
    cacheHitRate: [] as number[],
    optimizationImpact: [] as number[]
  });

  // Component instances
  const [orchestrator, setOrchestrator] = useState<SmartOrchestrator | null>(null);
  const [preloadingService, setPreloadingService] = useState<PreloadingService | null>(null);
  const [resourceOptimizer, setResourceOptimizer] = useState<ResourceOptimizer | null>(null);
  const [adaptiveLoader, setAdaptiveLoader] = useState<AdaptiveLoader | null>(null);
  const [cacheManager, setCacheManager] = useState<CacheManager | null>(null);

  // Adaptation tracking
  const [adaptationCount, setAdaptationCount] = useState(0);
  const [lastPerformanceScore, setLastPerformanceScore] = useState(0);

  /**
   * Initialize smart performance features
   */
  const initializeSmartFeatures = useCallback(async () => {
    if (!config.enabled) return;

    try {
      // Create orchestrator with RUM service from Week 1
      const smartOrchestrator = new SmartOrchestrator({
        ...config.orchestrator,
        rumService: undefined // Would be integrated with actual RUM service
      });

      // Create individual components
      const preloading = new PreloadingService();
      const optimizer = new ResourceOptimizer();
      const adaptive = new AdaptiveLoader();
      const cache = new CacheManager();

      // Set component instances
      setOrchestrator(smartOrchestrator);
      setPreloadingService(preloading);
      setResourceOptimizer(optimizer);
      setAdaptiveLoader(adaptive);
      setCacheManager(cache);

      // Update initial state
      setOrchestratorState(smartOrchestrator.getState());
      setOptimizationSummary(smartOrchestrator.getOptimizationSummary());
      setDeviceCapabilities(adaptive.getDeviceCapabilities());
      setNetworkInfo(adaptive.getNetworkInformation());
      setCacheStats(cache.getStats());

      // Update feature status
      setSmartFeaturesStatus({
        preloading: 'active',
        resourceOptimization: 'active',
        adaptiveLoading: 'active',
        intelligentCaching: 'active'
      });

      console.log('Smart performance features initialized successfully');

    } catch (error) {
      console.error('Failed to initialize smart performance features:', error);
      setSmartFeaturesStatus({
        preloading: 'error',
        resourceOptimization: 'error',
        adaptiveLoading: 'error',
        intelligentCaching: 'error'
      });
    }
  }, [config]);

  /**
   * Trigger intelligent preloading
   */
  const triggerIntelligentPreloading = useCallback(async () => {
    if (!preloadingService) return;

    try {
      const opportunities = await preloadingService.analyzePreloadOpportunities();
      setActivePreloads(opportunities);

      if (opportunities.length > 0) {
        await preloadingService.applyPreloading(opportunities);
        
        // Record optimization
        setOptimizationHistory(prev => [...prev, {
          timestamp: Date.now(),
          type: 'preloading',
          success: true,
          impact: opportunities.reduce((sum, opp) => sum + opp.estimatedBenefit, 0)
        }]);
      }

    } catch (error) {
      console.error('Intelligent preloading failed:', error);
      setSmartFeaturesStatus(prev => ({ ...prev, preloading: 'error' }));
    }
  }, [preloadingService]);

  /**
   * Optimize resources dynamically
   */
  const optimizeResources = useCallback(async (resourceTypes?: string[]): Promise<OptimizationPlan | null> => {
    if (!resourceOptimizer) return null;

    try {
      // This would analyze actual page resources
      // For now, return a mock optimization plan
      const mockPlan: OptimizationPlan = {
        images: {
          webpCandidates: [],
          avifCandidates: [],
          lazyLoadCandidates: [],
          resizeCandidates: [],
          estimatedSavings: 0
        },
        fonts: {
          preloadCandidates: [],
          displayStrategies: new Map(),
          subsetCandidates: [],
          loadingStrategies: new Map(),
          estimatedImprovement: 0
        },
        bundles: {
          splitCandidates: [],
          deadCodeTargets: [],
          dynamicImportOpportunities: [],
          treeShakingOpportunities: [],
          estimatedSizeReduction: 0
        },
        thirdParty: {
          resourceHints: [],
          deferCandidates: [],
          fallbackCandidates: [],
          estimatedImprovement: 0
        },
        priority: 5,
        estimatedImprovement: 100
      };

      // Apply optimizations
      const result = await resourceOptimizer.applyOptimizations(mockPlan);
      
      if (result.success) {
        setOptimizationHistory(prev => [...prev, {
          timestamp: Date.now(),
          type: 'resource-optimization',
          success: true,
          impact: result.improvements.loadTimeImprovement
        }]);
      }

      return mockPlan;

    } catch (error) {
      console.error('Resource optimization failed:', error);
      setSmartFeaturesStatus(prev => ({ ...prev, resourceOptimization: 'error' }));
      return null;
    }
  }, [resourceOptimizer]);

  /**
   * Adapt loading strategy
   */
  const adaptLoadingStrategy = useCallback(async (resourceType: string): Promise<LoadingDecision> => {
    if (!adaptiveLoader) {
      return {
        strategy: {
          name: 'fallback',
          priority: 'medium',
          approach: 'lazy',
          conditions: {
            networkTypes: [],
            deviceTiers: [],
            userTypes: [],
            performanceThresholds: {}
          },
          resourceTypes: [],
          implementation: {}
        },
        confidence: 0.5,
        reasoning: ['Adaptive loader not available'],
        expectations: { loadTime: 1000, memoryUsage: 10, networkUsage: 100 }
      };
    }

    try {
      const decision = adaptiveLoader.makeLoadingDecision(resourceType, userContext || undefined);
      
      setLoadingDecisions(prev => [...prev.slice(-9), decision]); // Keep last 10 decisions
      
      // Trigger adaptation if needed
      if (config.realTimeAdaptation.enabled && 
          adaptationCount < config.realTimeAdaptation.maxAdaptationsPerSession) {
        
        const contentAdaptation = adaptiveLoader.adaptContent(resourceType);
        setAdaptationCount(prev => prev + 1);
      }

      return decision;

    } catch (error) {
      console.error('Loading strategy adaptation failed:', error);
      setSmartFeaturesStatus(prev => ({ ...prev, adaptiveLoading: 'error' }));
      throw error;
    }
  }, [adaptiveLoader, userContext, config.realTimeAdaptation, adaptationCount]);

  /**
   * Manage intelligent cache
   */
  const manageCache = useCallback(async (action: 'clear' | 'warm' | 'optimize') => {
    if (!cacheManager) return;

    try {
      switch (action) {
        case 'clear':
          cacheManager.clear();
          break;
        case 'warm':
          // Implement cache warming logic
          break;
        case 'optimize':
          // Implement cache optimization logic
          break;
      }

      // Update cache stats
      setCacheStats(cacheManager.getStats());

    } catch (error) {
      console.error('Cache management failed:', error);
      setSmartFeaturesStatus(prev => ({ ...prev, intelligentCaching: 'error' }));
    }
  }, [cacheManager]);

  /**
   * Get loading recommendation
   */
  const getLoadingRecommendation = useCallback((resourceType: string, context?: any): LoadingDecision | null => {
    if (!adaptiveLoader) return null;

    try {
      return adaptiveLoader.makeLoadingDecision(resourceType, context);
    } catch (error) {
      console.error('Failed to get loading recommendation:', error);
      return null;
    }
  }, [adaptiveLoader]);

  /**
   * Update smart configuration
   */
  const updateSmartConfig = useCallback((newConfig: Partial<SmartPerformanceConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    // Update orchestrator config if available
    if (orchestrator && newConfig.orchestrator) {
      orchestrator.updateConfig(newConfig.orchestrator);
    }
  }, [orchestrator]);

  /**
   * Get optimization recommendations
   */
  const getOptimizationRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    // Analyze current state and provide recommendations
    if (optimizationSummary) {
      if (optimizationSummary.improvements.cacheHitRate < 0.7) {
        recommendations.push('Consider implementing cache warming strategies');
      }
      
      if (optimizationSummary.improvements.loadTime > 2000) {
        recommendations.push('Aggressive preloading could improve load times');
      }
      
      if (smartFeaturesStatus.preloading === 'error') {
        recommendations.push('Preloading service needs attention');
      }
    }

    // Analyze performance trends
    if (performanceTrends.loadTime.length > 3) {
      const recentLoadTimes = performanceTrends.loadTime.slice(-3);
      const isIncreasing = recentLoadTimes.every((time, index) => 
        index === 0 || time > recentLoadTimes[index - 1]
      );
      
      if (isIncreasing) {
        recommendations.push('Performance degradation detected - consider immediate optimization');
      }
    }

    return recommendations;
  }, [optimizationSummary, smartFeaturesStatus, performanceTrends]);

  /**
   * Force optimization cycle
   */
  const forceOptimizationCycle = useCallback(async () => {
    if (!orchestrator) return;

    try {
      await orchestrator.triggerOptimization('preload');
      await orchestrator.triggerOptimization('optimize');
      await orchestrator.triggerOptimization('adapt');
      await orchestrator.triggerOptimization('cache');

      // Update state
      setOrchestratorState(orchestrator.getState());
      setOptimizationSummary(orchestrator.getOptimizationSummary());

    } catch (error) {
      console.error('Forced optimization cycle failed:', error);
    }
  }, [orchestrator]);

  /**
   * Reset smart performance state
   */
  const resetSmartPerformance = useCallback(() => {
    setOptimizationHistory([]);
    setLoadingDecisions([]);
    setActivePreloads([]);
    setAdaptationCount(0);
    setPerformanceTrends({
      loadTime: [],
      cacheHitRate: [],
      optimizationImpact: []
    });
  }, []);

  /**
   * Independent performance monitoring to replace dependency on PerformanceContext
   */
  useEffect(() => {
    if (!config.autoOptimization.enabled) return;

    // Create independent performance monitoring
    const collectIndependentMetrics = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart;
          setIndependentMetrics({ loadTime });
          
          // Calculate independent performance score
          let score = 100;
          if (loadTime > 3000) score -= Math.min(30, (loadTime - 3000) / 100);
          setIndependentPerformanceScore(Math.max(0, score));
        }
      }
    };

    // Check for performance degradation using independent metrics
    if (config.autoOptimization.triggers.onPerformanceDrop &&
        lastPerformanceScore > 0 &&
        independentPerformanceScore < lastPerformanceScore - 10) {
      
      console.log('SmartPerformance: Performance degradation detected, triggering optimization');
      forceOptimizationCycle();
    }

    setLastPerformanceScore(independentPerformanceScore);
    
    // Collect metrics periodically
    collectIndependentMetrics();
    const interval = setInterval(collectIndependentMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [independentPerformanceScore, config.autoOptimization, lastPerformanceScore, forceOptimizationCycle]);

  /**
   * Update performance trends using independent metrics
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (independentMetrics.loadTime) {
        setPerformanceTrends(prev => ({
          loadTime: [...prev.loadTime.slice(-19), independentMetrics.loadTime!],
          cacheHitRate: [...prev.cacheHitRate.slice(-19), cacheStats?.hitRate || 0],
          optimizationImpact: [...prev.optimizationImpact.slice(-19), optimizationSummary?.improvements.loadTime || 0]
        }));
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [independentMetrics.loadTime, cacheStats?.hitRate, optimizationSummary?.improvements.loadTime]);

  /**
   * Initialize smart features on mount
   */
  useEffect(() => {
    initializeSmartFeatures();
  }, [initializeSmartFeatures]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      orchestrator?.destroy();
      preloadingService?.destroy();
      resourceOptimizer?.clearCache();
      adaptiveLoader?.destroy();
      cacheManager?.destroy();
    };
  }, [orchestrator, preloadingService, resourceOptimizer, adaptiveLoader, cacheManager]);

  // Memoize context value to prevent recreation on every render
  const contextValue: SmartPerformanceContextType = useMemo(() => ({
    // State
    orchestratorState,
    optimizationSummary,
    networkInfo,
    deviceCapabilities,
    userContext,
    cacheStats,
    loadingDecisions,
    activePreloads,
    optimizationHistory,
    smartFeaturesStatus,
    performanceTrends,
    
    // Actions
    initializeSmartFeatures,
    triggerIntelligentPreloading,
    optimizeResources,
    adaptLoadingStrategy,
    manageCache,
    getLoadingRecommendation,
    updateSmartConfig,
    getOptimizationRecommendations,
    forceOptimizationCycle,
    resetSmartPerformance
  }), [
    // State dependencies
    orchestratorState,
    optimizationSummary,
    networkInfo,
    deviceCapabilities,
    userContext,
    cacheStats,
    loadingDecisions,
    activePreloads,
    optimizationHistory,
    smartFeaturesStatus,
    performanceTrends,
    // Action dependencies (all memoized with useCallback)
    initializeSmartFeatures,
    triggerIntelligentPreloading,
    optimizeResources,
    adaptLoadingStrategy,
    manageCache,
    getLoadingRecommendation,
    updateSmartConfig,
    getOptimizationRecommendations,
    forceOptimizationCycle,
    resetSmartPerformance
  ]);

  return (
    <SmartPerformanceContext.Provider value={contextValue}>
      {children}
    </SmartPerformanceContext.Provider>
  );
};

/**
 * Custom hook to use the smart performance context
 */
export const useSmartPerformance = (): SmartPerformanceContextType => {
  const context = useContext(SmartPerformanceContext);

  if (context === undefined) {
    throw new Error('useSmartPerformance must be used within a SmartPerformanceProvider');
  }

  return context;
};

/**
 * Custom hook for intelligent preloading
 */
export const useIntelligentPreloading = () => {
  const { triggerIntelligentPreloading, activePreloads, smartFeaturesStatus } = useSmartPerformance();

  return {
    triggerPreloading: triggerIntelligentPreloading,
    activePreloads,
    status: smartFeaturesStatus.preloading
  };
};

/**
 * Custom hook for adaptive loading
 */
export const useAdaptiveLoading = () => {
  const { 
    adaptLoadingStrategy, 
    getLoadingRecommendation, 
    loadingDecisions, 
    deviceCapabilities,
    networkInfo
  } = useSmartPerformance();

  return {
    adaptStrategy: adaptLoadingStrategy,
    getRecommendation: getLoadingRecommendation,
    recentDecisions: loadingDecisions.slice(-5),
    deviceCapabilities,
    networkInfo
  };
};

/**
 * Custom hook for resource optimization
 */
export const useResourceOptimization = () => {
  const { 
    optimizeResources, 
    getOptimizationRecommendations, 
    optimizationSummary,
    optimizationHistory
  } = useSmartPerformance();

  return {
    optimize: optimizeResources,
    getRecommendations: getOptimizationRecommendations,
    summary: optimizationSummary,
    history: optimizationHistory.slice(-10)
  };
};

/**
 * Custom hook for intelligent caching
 */
export const useIntelligentCaching = () => {
  const { manageCache, cacheStats, smartFeaturesStatus } = useSmartPerformance();

  return {
    manageCache,
    stats: cacheStats,
    status: smartFeaturesStatus.intelligentCaching
  };
};

export default SmartPerformanceProvider;