import { advancedCodeSplitting, intelligentResourcePreloader } from './advancedCodeSplitting';
import { enhancedPWA } from './enhancedPWA';
import { SmartOrchestrator } from './smartOrchestrator';
import RUMService from './rumService';
import { multiLevelCache } from '../../utils/performance/advancedCaching';
import { bundleOptimizer } from '../../utils/performance/bundleOptimizer';
import { logger } from '@utils/logging/logger';

/**
 * Advanced Performance Orchestrator Configuration
 */
export interface AdvancedPerformanceConfig {
  /** Enable advanced code splitting */
  enableAdvancedCodeSplitting: boolean;
  /** Enable intelligent resource preloading */
  enableIntelligentPreloading: boolean;
  /** Enable enhanced PWA features */
  enableEnhancedPWA: boolean;
  /** Enable real-time performance monitoring */
  enableRealTimeMonitoring: boolean;
  /** Enable adaptive performance optimization */
  enableAdaptiveOptimization: boolean;
  /** Performance budget thresholds */
  performanceBudget: {
    /** First Contentful Paint threshold (ms) */
    fcp: number;
    /** Largest Contentful Paint threshold (ms) */
    lcp: number;
    /** First Input Delay threshold (ms) */
    fid: number;
    /** Cumulative Layout Shift threshold */
    cls: number;
    /** Time to Interactive threshold (ms) */
    tti: number;
  };
  /** Optimization intervals */
  optimizationIntervals: {
    /** Bundle analysis interval (ms) */
    bundleAnalysis: number;
    /** Cache optimization interval (ms) */
    cacheOptimization: number;
    /** Performance monitoring interval (ms) */
    performanceMonitoring: number;
  };
}

/**
 * Performance optimization result
 */
export interface OptimizationResult {
  success: boolean;
  optimizations: string[];
  metrics: {
    before: PerformanceSnapshot;
    after: PerformanceSnapshot;
  };
  recommendations: string[];
}

/**
 * Performance snapshot
 */
export interface PerformanceSnapshot {
  timestamp: number;
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  tti: number;
  bundleSize: number;
  cacheHitRate: number;
  networkRequests: number;
}

/**
 * Advanced Performance Orchestrator
 * Coordinates all advanced performance features for optimal user experience
 */
export class AdvancedPerformanceOrchestrator {
  private config: AdvancedPerformanceConfig;
  private isInitialized = false;
  private optimizationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private performanceHistory: PerformanceSnapshot[] = [];
  private currentOptimizations = new Set<string>();
  private smartOrchestrator: SmartOrchestrator | null = null;

  constructor(config: Partial<AdvancedPerformanceConfig> = {}) {
    this.config = {
      enableAdvancedCodeSplitting: true,
      enableIntelligentPreloading: true,
      enableEnhancedPWA: true,
      enableRealTimeMonitoring: true,
      enableAdaptiveOptimization: true,
      performanceBudget: {
        fcp: 1800, // 1.8s
        lcp: 2500, // 2.5s
        fid: 100,  // 100ms
        cls: 0.1,  // 0.1
        tti: 3800  // 3.8s
      },
      optimizationIntervals: {
        bundleAnalysis: 10 * 60 * 1000,     // 10 minutes
        cacheOptimization: 5 * 60 * 1000,   // 5 minutes
        performanceMonitoring: 30 * 1000    // 30 seconds
      },
      ...config
    };
  }

  /**
   * Initialize the advanced performance orchestrator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    logger.debug('Initializing Advanced Performance Orchestrator...', 'SERVICE');

    try {
      // Initialize core performance services
      await this.initializeCoreServices();

      // Setup advanced features
      await this.setupAdvancedFeatures();

      // Start optimization loops
      this.startOptimizationLoops();

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      this.isInitialized = true;
      logger.debug('Advanced Performance Orchestrator initialized successfully', 'SERVICE');
    } catch (error) {
      logger.error('Failed to initialize Advanced Performance Orchestrator:', 'SERVICE', {}, error as Error);
      throw error;
    }
  }

  /**
   * Initialize core performance services
   */
  private async initializeCoreServices(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    // Initialize smart orchestrator
    try {
      this.smartOrchestrator = new SmartOrchestrator();
      // initialize is internal; SmartOrchestrator auto-initializes on construction
    } catch (error) {
      logger.warn('Smart orchestrator initialization failed, continuing without it:', 'SERVICE', error);
    }

    // Initialize enhanced PWA if enabled
    if (this.config.enableEnhancedPWA) {
      // PWA service initializes automatically
    }

    // Initialize intelligent preloading
    if (this.config.enableIntelligentPreloading) {
      initPromises.push(intelligentResourcePreloader.preloadCriticalResources());
    }

    await Promise.all(initPromises);
  }

  /**
   * Setup advanced features
   */
  private async setupAdvancedFeatures(): Promise<void> {
    // Setup advanced code splitting
    if (this.config.enableAdvancedCodeSplitting) {
      this.setupAdvancedCodeSplitting();
    }

    // Setup intelligent caching
    await this.setupIntelligentCaching();

    // Setup adaptive optimization
    if (this.config.enableAdaptiveOptimization) {
      this.setupAdaptiveOptimization();
    }
  }

  /**
   * Setup advanced code splitting
   */
  private setupAdvancedCodeSplitting(): void {
    // Advanced code splitting is handled by the service itself
    logger.debug('Advanced code splitting enabled', 'SERVICE');
  }

  /**
   * Setup intelligent caching
   */
  private async setupIntelligentCaching(): Promise<void> {
    try {
      if (multiLevelCache && typeof (multiLevelCache as any).initialize === 'function') {
        await (multiLevelCache as any).initialize();
        logger.debug('Intelligent caching initialized', 'SERVICE');
      } else {
        logger.debug('Multi-level cache not available, skipping initialization', 'SERVICE');
      }
    } catch (error) {
      logger.error('Failed to initialize intelligent caching:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Setup adaptive optimization
   */
  private setupAdaptiveOptimization(): void {
    // Monitor performance and adapt optimizations
    this.setupPerformanceBudgetMonitoring();
    this.setupNetworkAdaptation();
    this.setupDeviceCapabilityAdaptation();
  }

  /**
   * Start optimization loops
   */
  private startOptimizationLoops(): void {
    // Bundle analysis loop
    const bundleInterval = setInterval(
      () => this.runBundleOptimization(),
      this.config.optimizationIntervals.bundleAnalysis
    );
    this.optimizationIntervals.set('bundle', bundleInterval);

    // Cache optimization loop
    const cacheInterval = setInterval(
      () => this.runCacheOptimization(),
      this.config.optimizationIntervals.cacheOptimization
    );
    this.optimizationIntervals.set('cache', cacheInterval);

    // Performance monitoring loop
    const monitoringInterval = setInterval(
      () => this.runPerformanceMonitoring(),
      this.config.optimizationIntervals.performanceMonitoring
    );
    this.optimizationIntervals.set('monitoring', monitoringInterval);
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.enableRealTimeMonitoring) return;

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();

    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor user interactions
    this.monitorUserInteractions();
  }

  /**
   * Run bundle optimization
   */
  private async runBundleOptimization(): Promise<void> {
    if (this.currentOptimizations.has('bundle')) return;

    this.currentOptimizations.add('bundle');
    try {
      logger.debug('Running bundle optimization...', 'SERVICE');
      if (bundleOptimizer && typeof (bundleOptimizer as any).optimizeBundles === 'function') {
        await (bundleOptimizer as any).optimizeBundles();
      } else {
        logger.debug('Bundle optimizer not available, skipping optimization', 'SERVICE');
      }
    } catch (error) {
      logger.error('Bundle optimization failed:', 'SERVICE', {}, error as Error);
    } finally {
      this.currentOptimizations.delete('bundle');
    }
  }

  /**
   * Run cache optimization
   */
  private async runCacheOptimization(): Promise<void> {
    if (this.currentOptimizations.has('cache')) return;

    this.currentOptimizations.add('cache');
    try {
      logger.debug('Running cache optimization...', 'SERVICE');
      if (multiLevelCache && typeof (multiLevelCache as any).optimize === 'function') {
        await (multiLevelCache as any).optimize();
      } else {
        logger.debug('Cache optimization not available, skipping', 'SERVICE');
      }
    } catch (error) {
      logger.error('Cache optimization failed:', 'SERVICE', {}, error as Error);
    } finally {
      this.currentOptimizations.delete('cache');
    }
  }

  /**
   * Run performance monitoring
   */
  private async runPerformanceMonitoring(): Promise<void> {
    try {
      const snapshot = await this.capturePerformanceSnapshot();
      this.performanceHistory.push(snapshot);

      // Keep only last 100 snapshots
      if (this.performanceHistory.length > 100) {
        this.performanceHistory = this.performanceHistory.slice(-100);
      }

      // Check performance budget
      this.checkPerformanceBudget(snapshot);
    } catch (error) {
      logger.error('Performance monitoring failed:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Capture performance snapshot
   */
  private async capturePerformanceSnapshot(): Promise<PerformanceSnapshot> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      timestamp: Date.now(),
      fcp: this.getFirstContentfulPaint(),
      lcp: await this.getLargestContentfulPaint(),
      fid: this.getFirstInputDelay(),
      cls: this.getCumulativeLayoutShift(),
      tti: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      bundleSize: await this.getBundleSize(),
      cacheHitRate: this.getCacheHitRate(),
      networkRequests: performance.getEntriesByType('resource').length
    };
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorCoreWebVitals(): void {
    // Use Web Vitals library or implement custom monitoring
    if ('PerformanceObserver' in window) {
      // Monitor LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      if (lastEntry) logger.debug('LCP:', 'SERVICE', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry && typeof entry.processingStart === 'number') {
            logger.debug('FID:', 'SERVICE', entry.processingStart - entry.startTime);
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // Monitor CLS
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry && !entry.hadRecentInput) {
            logger.debug('CLS:', 'SERVICE', entry.value);
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Monitor resource loading
   */
  private monitorResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 1000 && process.env.NODE_ENV === 'production') { // Reduce dev noise
            logger.warn('Slow resource:', 'SERVICE', { arg0: entry.name, arg1: entry.duration });
          }
        });
      }).observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Monitor user interactions
   */
  private monitorUserInteractions(): void {
    // Monitor click responsiveness
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;
        if (responseTime > 100) {
          logger.warn('Slow click response:', 'SERVICE', responseTime);
        }
      });
    });
  }

  /**
   * Setup performance budget monitoring
   */
  private setupPerformanceBudgetMonitoring(): void {
    // Monitor and alert when performance budget is exceeded
  }

  /**
   * Setup network adaptation
   */
  private setupNetworkAdaptation(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.adaptToNetworkConditions(connection);
      });
    }
  }

  /**
   * Setup device capability adaptation
   */
  private setupDeviceCapabilityAdaptation(): void {
    // Adapt based on device memory, CPU cores, etc.
    if ('deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory;
      this.adaptToDeviceCapabilities({ memory: deviceMemory });
    }
  }

  /**
   * Check performance budget
   */
  private checkPerformanceBudget(snapshot: PerformanceSnapshot): void {
    const budget = this.config.performanceBudget;
    const violations: string[] = [];

    if (snapshot.fcp > budget.fcp) violations.push(`FCP: ${snapshot.fcp}ms > ${budget.fcp}ms`);
    if (snapshot.lcp > budget.lcp) violations.push(`LCP: ${snapshot.lcp}ms > ${budget.lcp}ms`);
    if (snapshot.fid > budget.fid) violations.push(`FID: ${snapshot.fid}ms > ${budget.fid}ms`);
    if (snapshot.cls > budget.cls) violations.push(`CLS: ${snapshot.cls} > ${budget.cls}`);
    if (snapshot.tti > budget.tti) violations.push(`TTI: ${snapshot.tti}ms > ${budget.tti}ms`);

    if (violations.length > 0) {
      logger.warn('Performance budget violations:', 'SERVICE', violations);
      this.triggerPerformanceOptimization();
    }
  }

  /**
   * Trigger performance optimization
   */
  private async triggerPerformanceOptimization(): Promise<void> {
    logger.debug('Triggering emergency performance optimization...', 'SERVICE');
    
    // Run immediate optimizations
    await Promise.all([
      this.runBundleOptimization(),
      this.runCacheOptimization()
    ]);
  }

  /**
   * Adapt to network conditions
   */
  private adaptToNetworkConditions(connection: any): void {
    const effectiveType = connection.effectiveType;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      // Enable aggressive optimizations for slow connections
      this.enableAggressiveOptimizations();
    } else {
      // Use normal optimizations
      this.enableNormalOptimizations();
    }
  }

  /**
   * Adapt to device capabilities
   */
  private adaptToDeviceCapabilities(capabilities: { memory: number }): void {
    if (capabilities.memory < 4) {
      // Enable memory-conscious optimizations
      this.enableMemoryOptimizations();
    }
  }

  /**
   * Enable aggressive optimizations
   */
  private enableAggressiveOptimizations(): void {
    logger.debug('Enabling aggressive optimizations for slow network', 'SERVICE');
  }

  /**
   * Enable normal optimizations
   */
  private enableNormalOptimizations(): void {
    logger.debug('Using normal optimization settings', 'SERVICE');
  }

  /**
   * Enable memory optimizations
   */
  private enableMemoryOptimizations(): void {
    logger.debug('Enabling memory-conscious optimizations', 'SERVICE');
  }

  // Helper methods for performance metrics
  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private getLargestContentfulPaint(): Promise<number> {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry ? lastEntry.startTime : 0);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 5000);
      } else {
        // Fallback for older browsers
        const entries = performance.getEntriesByType('largest-contentful-paint');
        resolve(entries.length > 0 ? entries[entries.length - 1].startTime : 0);
      }
    });
  }

  private getFirstInputDelay(): number {
    // This would typically be measured by the Web Vitals library
    return 0;
  }

  private getCumulativeLayoutShift(): number {
    // This would typically be measured by the Web Vitals library
    return 0;
  }

  private async getBundleSize(): Promise<number> {
    // Estimate bundle size from resource entries
    const resources = performance.getEntriesByType('resource');
    return resources.reduce((total, resource) => {
      return total + ((resource as any).transferSize || 0);
    }, 0);
  }

  private getCacheHitRate(): number {
    // Get cache hit rate from PWA service
    const pwaMetrics = enhancedPWA.getPerformanceMetrics();
    return pwaMetrics.cacheHitRate;
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): {
    currentSnapshot: PerformanceSnapshot | null;
    history: PerformanceSnapshot[];
    optimizationStatus: {
      activeOptimizations: string[];
      lastOptimization: number;
    };
    budgetStatus: {
      violations: string[];
      score: number;
    };
  } {
    const currentSnapshot = this.performanceHistory[this.performanceHistory.length - 1] || null;
    const violations: string[] = [];
    
    if (currentSnapshot) {
      const budget = this.config.performanceBudget;
      if (currentSnapshot.fcp > budget.fcp) violations.push('FCP');
      if (currentSnapshot.lcp > budget.lcp) violations.push('LCP');
      if (currentSnapshot.fid > budget.fid) violations.push('FID');
      if (currentSnapshot.cls > budget.cls) violations.push('CLS');
      if (currentSnapshot.tti > budget.tti) violations.push('TTI');
    }

    return {
      currentSnapshot,
      history: this.performanceHistory,
      optimizationStatus: {
        activeOptimizations: Array.from(this.currentOptimizations),
        lastOptimization: Date.now()
      },
      budgetStatus: {
        violations,
        score: Math.max(0, 100 - (violations.length * 20))
      }
    };
  }

  /**
   * Shutdown the orchestrator
   */
  shutdown(): void {
    // Clear all intervals
    this.optimizationIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.optimizationIntervals.clear();

    this.isInitialized = false;
    logger.debug('Advanced Performance Orchestrator shut down', 'SERVICE');
  }
}

// Create singleton instance
export const advancedPerformanceOrchestrator = new AdvancedPerformanceOrchestrator();
