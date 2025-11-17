/**
 * Smart Performance Orchestrator for TradeYa
 * 
 * Central orchestration service that coordinates all Week 2 performance optimization
 * components: intelligent preloading, resource optimization, adaptive loading, and
 * intelligent caching. Integrates with Week 1 RUM infrastructure.
 */

import { RUMService, RUMMetrics } from './rumService';
import { PreloadingService, AnalyticsBasedPreloadCandidate, NetworkInfo } from './preloadingService';
import { ResourceOptimizer, OptimizationPlan, ImageMetrics, FontMetrics, BundleAnalysis } from '../../utils/performance/resourceOptimizer';
import { AdaptiveLoader, LoadingDecision, UserContext, DeviceCapabilities } from './adaptiveLoader';
import { CacheManager } from './cacheManager';
import { CriticalPathAnalyzer } from '../../utils/performance/criticalPathAnalyzer';
import { multiLevelCache } from '../../utils/performance/advancedCaching';
import { bundleOptimizer } from '../../utils/performance/bundleOptimizer';
import { logger } from '@utils/logging/logger';
import {
  routePreloader,
  adaptiveLoader as enhancedAdaptiveLoader,
  performanceLoader
} from '../../utils/performance/enhancedLazyLoading';

/**
 * Orchestrator configuration
 */
export interface SmartOrchestratorConfig {
  /** Enable orchestrator */
  enabled: boolean;
  /** RUM service instance (from Week 1) */
  rumService?: RUMService;
  /** Preloading service configuration */
  preloading: {
    enabled: boolean;
    autoAnalyze: boolean;
    analysisInterval: number;
  };
  /** Resource optimization configuration */
  resourceOptimization: {
    enabled: boolean;
    autoOptimize: boolean;
    optimizationInterval: number;
  };
  /** Adaptive loading configuration */
  adaptiveLoading: {
    enabled: boolean;
    autoAdapt: boolean;
    adaptationInterval: number;
  };
  /** Intelligent caching configuration */
  intelligentCaching: {
    enabled: boolean;
    syncWithRUM: boolean;
    syncInterval: number;
  };
  /** Coordination settings */
  coordination: {
    /** Cross-component data sharing */
    enableDataSharing: boolean;
    /** Conflict resolution strategy */
    conflictResolution: 'priority' | 'consensus' | 'adaptive';
    /** Performance impact threshold */
    performanceImpactThreshold: number;
  };
}

/**
 * Orchestrator state
 */
export interface OrchestratorState {
  /** Current network conditions */
  networkInfo: NetworkInfo | null;
  /** Current device capabilities */
  deviceCapabilities: DeviceCapabilities | null;
  /** Current user context */
  userContext: UserContext | null;
  /** Active optimizations */
  activeOptimizations: string[];
  /** Performance impact summary */
  performanceImpact: {
    totalImprovement: number;
    memoryUsage: number;
    networkUsage: number;
    cpuUsage: number;
  };
  /** Component status */
  componentStatus: {
    preloading: 'active' | 'inactive' | 'error';
    resourceOptimization: 'active' | 'inactive' | 'error';
    adaptiveLoading: 'active' | 'inactive' | 'error';
    intelligentCaching: 'active' | 'inactive' | 'error';
  };
}

/**
 * Orchestration decision
 */
export interface OrchestrationDecision {
  /** Decision type */
  type: 'preload' | 'optimize' | 'adapt' | 'cache' | 'defer';
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Affected components */
  components: string[];
  /** Decision rationale */
  rationale: string;
  /** Expected impact */
  expectedImpact: {
    performance: number;
    memory: number;
    network: number;
  };
  /** Execution plan */
  executionPlan: {
    immediate: Array<{ component: string; action: string; params: any }>;
    deferred: Array<{ component: string; action: string; params: any; delay: number }>;
  };
}

/**
 * Performance optimization summary
 */
export interface OptimizationSummary {
  /** Total optimizations applied */
  totalOptimizations: number;
  /** Performance improvements */
  improvements: {
    loadTime: number;
    memorySavings: number;
    networkSavings: number;
    cacheHitRate: number;
  };
  /** Resource statistics */
  resourceStats: {
    preloadedResources: number;
    optimizedImages: number;
    optimizedFonts: number;
    cachedEntries: number;
  };
  /** Recommendations */
  recommendations: string[];
  /** Next scheduled optimization */
  nextOptimization: number;
}

/**
 * Default orchestrator configuration
 */
const DEFAULT_ORCHESTRATOR_CONFIG: SmartOrchestratorConfig = {
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
  },
  coordination: {
    enableDataSharing: true,
    conflictResolution: 'adaptive',
    performanceImpactThreshold: 100 // 100ms
  }
};

/**
 * Smart Performance Orchestrator
 */
export class SmartOrchestrator {
  private config: SmartOrchestratorConfig;
  private state: OrchestratorState;
  
  // Component instances
  private rumService: RUMService | null = null;
  private preloadingService: PreloadingService | null = null;
  private resourceOptimizer: ResourceOptimizer | null = null;
  private adaptiveLoader: AdaptiveLoader | null = null;
  private cacheManager: CacheManager | null = null;
  private criticalPathAnalyzer: CriticalPathAnalyzer | null = null;

  // Timers and intervals
  private orchestrationTimers: Map<string, NodeJS.Timeout> = new Map();
  private decisionHistory: OrchestrationDecision[] = [];
  private performanceBaseline: number = 0;

  constructor(config: Partial<SmartOrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.state = this.initializeState();
    this.initialize();
  }

  /**
   * Initialize orchestrator state
   */
  private initializeState(): OrchestratorState {
    return {
      networkInfo: null,
      deviceCapabilities: null,
      userContext: null,
      activeOptimizations: [],
      performanceImpact: {
        totalImprovement: 0,
        memoryUsage: 0,
        networkUsage: 0,
        cpuUsage: 0
      },
      componentStatus: {
        preloading: 'inactive',
        resourceOptimization: 'inactive',
        adaptiveLoading: 'inactive',
        intelligentCaching: 'inactive'
      }
    };
  }

  /**
   * Initialize the orchestrator and all components
   */
  private async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Use provided RUM service or get existing instance
      this.rumService = this.config.rumService || null;

      // Initialize components based on configuration
      await this.initializeComponents();

      // Start orchestration loops
      this.startOrchestrationLoops();

      // Setup cross-component data sharing
      if (this.config.coordination.enableDataSharing) {
        this.setupDataSharing();
      }

      // Get initial performance baseline
      this.performanceBaseline = await this.getPerformanceBaseline();

      logger.debug('Smart Performance Orchestrator initialized successfully', 'SERVICE');

    } catch (error) {
      logger.error('Failed to initialize Smart Performance Orchestrator:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Initialize individual components
   */
  private async initializeComponents(): Promise<void> {
    try {
      // Initialize Preloading Service
      if (this.config.preloading.enabled) {
        this.preloadingService = new PreloadingService();
        this.state.componentStatus.preloading = 'active';
      }

      // Initialize Resource Optimizer
      if (this.config.resourceOptimization.enabled) {
        this.resourceOptimizer = new ResourceOptimizer();
        this.state.componentStatus.resourceOptimization = 'active';
      }

      // Initialize Adaptive Loader
      if (this.config.adaptiveLoading.enabled) {
        this.adaptiveLoader = new AdaptiveLoader();
        this.state.componentStatus.adaptiveLoading = 'active';
      }

      // Initialize Cache Manager
      if (this.config.intelligentCaching.enabled) {
        this.cacheManager = new CacheManager();
        this.state.componentStatus.intelligentCaching = 'active';
      }

      // Initialize Critical Path Analyzer (from Week 1)
      this.criticalPathAnalyzer = new CriticalPathAnalyzer();

    } catch (error) {
      logger.error('Failed to initialize components:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Start orchestration loops for each component
   */
  private startOrchestrationLoops(): void {
    // Preloading analysis loop
    if (this.config.preloading.enabled && this.config.preloading.autoAnalyze) {
      const timer = setInterval(() => {
        this.orchestratePreloading();
      }, this.config.preloading.analysisInterval);
      this.orchestrationTimers.set('preloading', timer);
    }

    // Resource optimization loop
    if (this.config.resourceOptimization.enabled && this.config.resourceOptimization.autoOptimize) {
      const timer = setInterval(() => {
        this.orchestrateResourceOptimization();
      }, this.config.resourceOptimization.optimizationInterval);
      this.orchestrationTimers.set('resourceOptimization', timer);
    }

    // Adaptive loading loop
    if (this.config.adaptiveLoading.enabled && this.config.adaptiveLoading.autoAdapt) {
      const timer = setInterval(() => {
        this.orchestrateAdaptiveLoading();
      }, this.config.adaptiveLoading.adaptationInterval);
      this.orchestrationTimers.set('adaptiveLoading', timer);
    }

    // Cache synchronization loop
    if (this.config.intelligentCaching.enabled && this.config.intelligentCaching.syncWithRUM) {
      const timer = setInterval(() => {
        this.orchestrateCaching();
      }, this.config.intelligentCaching.syncInterval);
      this.orchestrationTimers.set('caching', timer);
    }
  }

  /**
   * Orchestrate intelligent preloading
   */
  private async orchestratePreloading(): Promise<void> {
    if (!this.preloadingService) return;

    try {
      // Analyze preload opportunities
      const opportunities = await this.preloadingService.analyzePreloadOpportunities();
      
      if (opportunities.length > 0) {
        // Make orchestration decision
        const decision = this.makeOrchestrationDecision('preload', {
          opportunities,
          networkInfo: this.state.networkInfo,
          userContext: this.state.userContext
        });

        // Execute preloading if decision is positive
        if (decision.priority === 'high' || decision.priority === 'critical') {
          await this.preloadingService.applyPreloading(opportunities);
          this.state.activeOptimizations.push('preloading');
          
          // Update performance impact
          const impact = opportunities.reduce((sum, opp) => sum + opp.estimatedBenefit, 0);
          this.state.performanceImpact.totalImprovement += impact;
        }

        // Store decision
        this.decisionHistory.push(decision);
      }

    } catch (error) {
      logger.error('Preloading orchestration failed:', 'SERVICE', {}, error as Error);
      this.state.componentStatus.preloading = 'error';
    }
  }

  /**
   * Orchestrate resource optimization
   */
  private async orchestrateResourceOptimization(): Promise<void> {
    if (!this.resourceOptimizer) return;

    try {
      // Get current resource metrics
      const resourceMetrics = await this.gatherResourceMetrics();
      
      // Generate optimization plans
      const imagePlan = this.resourceOptimizer.optimizeImageLoading(resourceMetrics.images);
      const fontPlan = this.resourceOptimizer.optimizeFontLoading(resourceMetrics.fonts);
      
      // Evaluate plans
      const totalSavings = imagePlan.estimatedSavings + fontPlan.estimatedImprovement;
      
      if (totalSavings > this.config.coordination.performanceImpactThreshold) {
        // Create combined optimization plan
        const optimizationPlan: OptimizationPlan = {
          images: imagePlan,
          fonts: fontPlan,
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
          priority: totalSavings > 1000 ? 10 : 5,
          estimatedImprovement: totalSavings
        };

        // Apply optimizations
        const result = await this.resourceOptimizer.applyOptimizations(optimizationPlan);
        
        if (result.success) {
          this.state.activeOptimizations.push('resource-optimization');
          this.state.performanceImpact.totalImprovement += result.improvements.loadTimeImprovement;
          this.state.performanceImpact.memoryUsage += result.improvements.sizeReduction;
        }
      }

    } catch (error) {
      logger.error('Resource optimization orchestration failed:', 'SERVICE', {}, error as Error);
      this.state.componentStatus.resourceOptimization = 'error';
    }
  }

  /**
   * Orchestrate adaptive loading
   */
  private async orchestrateAdaptiveLoading(): Promise<void> {
    if (!this.adaptiveLoader) return;

    try {
      // Update context from RUM data
      if (this.rumService) {
        const sessionInfo = this.rumService.getSessionInfo();
        const recentMetrics = await this.getRecentRUMMetrics();
        
        if (sessionInfo) {
          this.state.userContext = this.adaptiveLoader.analyzeUserContext(sessionInfo, recentMetrics);
        }
        this.state.deviceCapabilities = this.adaptiveLoader.getDeviceCapabilities();
        this.state.networkInfo = this.adaptiveLoader.getNetworkInformation();
      }

      // Make loading decisions for different resource types
      const resourceTypes = ['script', 'style', 'image', 'font'];
      
      for (const resourceType of resourceTypes) {
        const decision = this.adaptiveLoader.makeLoadingDecision(resourceType, this.state.userContext || undefined);
        
        // Apply adaptive content optimization
        const contentAdaptation = this.adaptiveLoader.adaptContent(resourceType);
        
        // Integrate with other components based on decision
        await this.integrateLoadingDecision(decision, resourceType, contentAdaptation);
      }

    } catch (error) {
      logger.error('Adaptive loading orchestration failed:', 'SERVICE', {}, error as Error);
      this.state.componentStatus.adaptiveLoading = 'error';
    }
  }

  /**
   * Orchestrate intelligent caching
   */
  private async orchestrateCaching(): Promise<void> {
    if (!this.cacheManager) return;

    try {
      // Sync with RUM data
      if (this.rumService && this.config.intelligentCaching.syncWithRUM) {
        const recentMetrics = await this.getRecentRUMMetrics();
        this.cacheManager.updateRUMData(recentMetrics);
      }

      // Get cache statistics
      const cacheStats = this.cacheManager.getStats();
      
      // Optimize cache based on performance data
      if (cacheStats.hitRate < 0.7) { // Less than 70% hit rate
        // Implement cache warming strategies
        await this.implementCacheWarmingStrategies();
      }

      // Update performance impact
      this.state.performanceImpact.memoryUsage = cacheStats.memoryUsage;

    } catch (error) {
      logger.error('Caching orchestration failed:', 'SERVICE', {}, error as Error);
      this.state.componentStatus.intelligentCaching = 'error';
    }
  }

  /**
   * Make orchestration decision based on context and data
   */
  private makeOrchestrationDecision(
    type: 'preload' | 'optimize' | 'adapt' | 'cache' | 'defer',
    context: any
  ): OrchestrationDecision {
    const decision: OrchestrationDecision = {
      type,
      priority: 'medium',
      components: [],
      rationale: '',
      expectedImpact: { performance: 0, memory: 0, network: 0 },
      executionPlan: { immediate: [], deferred: [] }
    };

    switch (type) {
      case 'preload':
        return this.makePreloadingDecision(context, decision);
      case 'optimize':
        return this.makeOptimizationDecision(context, decision);
      case 'adapt':
        return this.makeAdaptiveDecision(context, decision);
      case 'cache':
        return this.makeCachingDecision(context, decision);
      default:
        return decision;
    }
  }

  /**
   * Make preloading-specific decision
   */
  private makePreloadingDecision(context: any, decision: OrchestrationDecision): OrchestrationDecision {
    const { opportunities, networkInfo, userContext } = context;
    
    decision.components = ['preloading'];
    
    // Evaluate based on network conditions
    if (networkInfo?.effectiveType === '4g' || networkInfo?.effectiveType === '5g') {
      decision.priority = 'high';
      decision.rationale = 'Fast network detected, aggressive preloading beneficial';
    } else if (networkInfo?.saveData) {
      decision.priority = 'low';
      decision.rationale = 'Data saver mode detected, conservative preloading';
    } else {
      decision.priority = 'medium';
      decision.rationale = 'Standard preloading approach';
    }

    // Calculate expected impact
    decision.expectedImpact.performance = opportunities.reduce((sum: number, opp: any) => sum + opp.estimatedBenefit, 0);
    decision.expectedImpact.network = opportunities.length * 100; // Estimated network usage

    return decision;
  }

  /**
   * Make optimization-specific decision
   */
  private makeOptimizationDecision(context: any, decision: OrchestrationDecision): OrchestrationDecision {
    decision.components = ['resourceOptimization'];
    decision.priority = 'medium';
    decision.rationale = 'Resource optimization based on usage patterns';
    
    return decision;
  }

  /**
   * Make adaptive loading decision
   */
  private makeAdaptiveDecision(context: any, decision: OrchestrationDecision): OrchestrationDecision {
    decision.components = ['adaptiveLoading'];
    decision.priority = 'high';
    decision.rationale = 'Adaptive loading based on device and network conditions';
    
    return decision;
  }

  /**
   * Make caching decision
   */
  private makeCachingDecision(context: any, decision: OrchestrationDecision): OrchestrationDecision {
    decision.components = ['intelligentCaching'];
    decision.priority = 'medium';
    decision.rationale = 'Cache optimization based on access patterns';
    
    return decision;
  }

  /**
   * Integrate loading decision with other components
   */
  private async integrateLoadingDecision(
    decision: LoadingDecision,
    resourceType: string,
    contentAdaptation: any
  ): Promise<void> {
    // Integrate with preloading service
    if (this.preloadingService && decision.strategy.approach === 'eager') {
      // Trigger preloading for eager resources
      const candidates: AnalyticsBasedPreloadCandidate[] = [{
        url: `${resourceType}_resource`,
        type: resourceType as 'script' | 'style' | 'image' | 'font',
        as: resourceType,
        priority: decision.strategy.priority as 'high' | 'medium' | 'low',
        reason: decision.reasoning.join(', '),
        estimatedBenefit: decision.expectations.loadTime,
        accessFrequency: 1,
        averageImprovement: decision.expectations.loadTime,
        journeyPatterns: ['adaptive_loading'],
        optimalNetworkConditions: ['4g', '3g'],
        confidenceScore: decision.confidence
      }];
      
      await this.preloadingService.applyPreloading(candidates);
    }

    // Integrate with cache manager
    if (this.cacheManager && decision.strategy.approach !== 'lazy') {
      // Cache frequently accessed resources
      await this.cacheManager.set(
        `adaptive_${resourceType}`,
        contentAdaptation,
        {
          ttl: 30 * 60 * 1000, // 30 minutes
          priority: decision.strategy.priority as 'high' | 'medium' | 'low',
          tags: ['adaptive', resourceType]
        }
      );
    }
  }

  /**
   * Setup cross-component data sharing
   */
  private setupDataSharing(): void {
    // Share network information across components
    if (this.adaptiveLoader) {
      const networkInfo = this.adaptiveLoader.getNetworkInformation();
      if (networkInfo && this.preloadingService) {
        this.preloadingService.adaptToNetworkConditions(networkInfo);
      }
    }

    // Share performance data between components
    if (this.rumService && this.cacheManager) {
      // This would be implemented as event listeners in a real system
      logger.debug('Data sharing setup completed', 'SERVICE');
    }
  }

  /**
   * Implement cache warming strategies
   */
  private async implementCacheWarmingStrategies(): Promise<void> {
    if (!this.cacheManager || !this.preloadingService) return;

    try {
      // Get preload opportunities and warm cache with them
      const opportunities = await this.preloadingService.analyzePreloadOpportunities();
      
      for (const opportunity of opportunities.slice(0, 5)) { // Top 5 opportunities
        await this.cacheManager.set(
          `warm_${opportunity.url}`,
          { preloadCandidate: true },
          {
            ttl: 60 * 60 * 1000, // 1 hour
            priority: 'high',
            tags: ['warm', 'preload']
          }
        );
      }

    } catch (error) {
      logger.error('Cache warming failed:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Gather resource metrics for optimization
   */
  private async gatherResourceMetrics(): Promise<{
    images: ImageMetrics[];
    fonts: FontMetrics[];
    bundles: BundleAnalysis[];
  }> {
    // In a real implementation, this would analyze actual page resources
    // For now, return mock data structure
    return {
      images: [],
      fonts: [],
      bundles: []
    };
  }

  /**
   * Get recent RUM metrics
   */
  private async getRecentRUMMetrics(): Promise<RUMMetrics[]> {
    if (!this.rumService) return [];

    try {
      // This would integrate with the actual RUM service data
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to get RUM metrics:', 'SERVICE', {}, error as Error);
      return [];
    }
  }

  /**
   * Get performance baseline
   */
  private async getPerformanceBaseline(): Promise<number> {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Public API methods
   */

  /**
   * Get current orchestrator state
   */
  public getState(): OrchestratorState {
    return { ...this.state };
  }

  /**
   * Get optimization summary
   */
  public getOptimizationSummary(): OptimizationSummary {
    const cacheStats = this.cacheManager?.getStats();
    const preloadingStats = this.preloadingService?.getStatistics();

    return {
      totalOptimizations: this.state.activeOptimizations.length,
      improvements: {
        loadTime: this.state.performanceImpact.totalImprovement,
        memorySavings: this.state.performanceImpact.memoryUsage,
        networkSavings: this.state.performanceImpact.networkUsage,
        cacheHitRate: cacheStats?.hitRate || 0
      },
      resourceStats: {
        preloadedResources: preloadingStats?.totalPreloaded || 0,
        optimizedImages: 0, // Would be tracked from resource optimizer
        optimizedFonts: 0,  // Would be tracked from resource optimizer
        cachedEntries: cacheStats?.totalEntries || 0
      },
      recommendations: this.generateRecommendations(),
      nextOptimization: Date.now() + Math.min(
        this.config.preloading.analysisInterval,
        this.config.resourceOptimization.optimizationInterval
      )
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Analyze component status and suggest improvements
    if (this.state.componentStatus.preloading === 'error') {
      recommendations.push('Preloading service needs attention - check network conditions');
    }

    if (this.state.performanceImpact.totalImprovement < 100) {
      recommendations.push('Consider more aggressive optimization strategies');
    }

    const cacheStats = this.cacheManager?.getStats();
    if (cacheStats && cacheStats.hitRate < 0.7) {
      recommendations.push('Cache hit rate is low - consider cache warming strategies');
    }

    if (this.state.performanceImpact.memoryUsage > 50 * 1024 * 1024) { // > 50MB
      recommendations.push('High memory usage detected - consider cache size optimization');
    }

    return recommendations;
  }

  /**
   * Manual trigger for specific optimization
   */
  public async triggerOptimization(type: 'preload' | 'optimize' | 'adapt' | 'cache'): Promise<void> {
    switch (type) {
      case 'preload':
        await this.orchestratePreloading();
        break;
      case 'optimize':
        await this.orchestrateResourceOptimization();
        break;
      case 'adapt':
        await this.orchestrateAdaptiveLoading();
        break;
      case 'cache':
        await this.orchestrateCaching();
        break;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SmartOrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timers if intervals changed
    if (newConfig.preloading || newConfig.resourceOptimization || 
        newConfig.adaptiveLoading || newConfig.intelligentCaching) {
      this.stopOrchestrationLoops();
      this.startOrchestrationLoops();
    }
  }

  /**
   * Stop orchestration loops
   */
  private stopOrchestrationLoops(): void {
    this.orchestrationTimers.forEach(timer => clearInterval(timer));
    this.orchestrationTimers.clear();
  }

  /**
   * Destroy the orchestrator
   */
  public destroy(): void {
    // Stop all timers
    this.stopOrchestrationLoops();

    // Destroy components
    this.preloadingService?.destroy();
    this.resourceOptimizer?.clearCache();
    this.adaptiveLoader?.destroy();
    this.cacheManager?.destroy();
    this.criticalPathAnalyzer?.destroy();

    // Clear state
    this.decisionHistory = [];
    this.state = this.initializeState();
  }

  /**
   * Run comprehensive performance optimization
   */
  async runFullOptimization(): Promise<{
    bundleOptimization: any;
    cacheOptimization: any;
    lazyLoadingOptimization: any;
    resourceOptimization: any;
  }> {
    const results = {
      bundleOptimization: null as any,
      cacheOptimization: null as any,
      lazyLoadingOptimization: null as any,
      resourceOptimization: null as any
    };

    try {
      // Bundle optimization
      const bundleAnalysis = await bundleOptimizer.analyzeBundles();
      await bundleOptimizer.applyOptimizations(bundleAnalysis);
      results.bundleOptimization = {
        success: true,
        totalSavings: bundleAnalysis.recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0),
        recommendationsApplied: bundleAnalysis.recommendations.length
      };
    } catch (error) {
      results.bundleOptimization = { success: false, error };
    }

    try {
      // Cache optimization
      await multiLevelCache.predictivePreload();
      results.cacheOptimization = { success: true };
    } catch (error) {
      results.cacheOptimization = { success: false, error };
    }

    try {
      // Enhanced lazy loading optimization
      const currentRoute = window.location.pathname;
      routePreloader.preloadBasedOnBehavior(currentRoute);
      await routePreloader.processQueue();
      results.lazyLoadingOptimization = { success: true };
    } catch (error) {
      results.lazyLoadingOptimization = { success: false, error };
    }

    try {
      // Resource optimization
      if (this.resourceOptimizer) {
        // Fallback: run individual optimizations in absence of optimizeAll
        await this.optimizeCaching();
        await this.optimizeResourceLoading();
      }
      results.resourceOptimization = { success: true };
    } catch (error) {
      results.resourceOptimization = { success: false, error };
    }

    return results;
  }

  /**
   * Optimize bundle size
   */
  async optimizeBundleSize(): Promise<void> {
    const analysis = await bundleOptimizer.analyzeBundles();
    await bundleOptimizer.applyOptimizations(analysis);
    await bundleOptimizer.trackBundleSize();
  }

  /**
   * Optimize caching strategies
   */
  async optimizeCaching(): Promise<void> {
    await multiLevelCache.predictivePreload();

    // Clear low-priority cache entries to make room for high-priority ones
    await multiLevelCache.clearByTags(['low-priority']);
  }

  /**
   * Optimize resource loading
   */
  async optimizeResourceLoading(): Promise<void> {
    const strategy = enhancedAdaptiveLoader.getLoadingStrategy();
    const shouldPreload = enhancedAdaptiveLoader.shouldPreload();

    if (shouldPreload && strategy === 'aggressive') {
      routePreloader.preloadBasedOnBehavior(window.location.pathname);
      await routePreloader.processQueue(4);
    } else if (strategy === 'conservative') {
      await routePreloader.processQueue(2);
    }
  }

  /**
   * Enable image optimization
   */
  async enableImageOptimization(): Promise<void> {
    // Integrate with ResourceOptimizer via bundle/image/font analysis if needed
  }

  /**
   * Optimize layout stability (CLS)
   */
  async optimizeLayoutStability(): Promise<void> {
    // Add size attributes to images without them
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      if (imgElement.naturalWidth && imgElement.naturalHeight) {
        imgElement.width = imgElement.naturalWidth;
        imgElement.height = imgElement.naturalHeight;
      }
    });

    // Reserve space for dynamic content
    const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');
    dynamicContainers.forEach(container => {
      const element = container as HTMLElement;
      if (!element.style.minHeight) {
        element.style.minHeight = '100px';
      }
    });
  }
}

// Utility functions

/**
 * Create and initialize smart orchestrator
 */
export const createSmartOrchestrator = async (
  config?: Partial<SmartOrchestratorConfig>,
  rumService?: RUMService
): Promise<SmartOrchestrator> => {
  const orchestratorConfig = {
    ...config,
    rumService
  };
  
  const orchestrator = new SmartOrchestrator(orchestratorConfig);
  return orchestrator;
};

/**
 * Quick optimization trigger
 */
export const triggerSmartOptimization = async (
  orchestrator: SmartOrchestrator,
  types: Array<'preload' | 'optimize' | 'adapt' | 'cache'> = ['preload', 'optimize', 'adapt', 'cache']
): Promise<OptimizationSummary> => {
  for (const type of types) {
    await orchestrator.triggerOptimization(type);
  }
  
  return orchestrator.getOptimizationSummary();
};

export default SmartOrchestrator;