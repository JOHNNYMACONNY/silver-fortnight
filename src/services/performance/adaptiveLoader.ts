/**
 * Adaptive Loading Engine for TradeYa
 * 
 * Context-aware loading strategies that adapt to user behavior, device capabilities,
 * and network conditions. Integrates with RUM data and performance analytics to
 * provide intelligent loading decisions.
 */

import { RUMMetrics, SessionInfo } from './rumService';
import { NetworkInfo } from './preloadingService';
import { performanceLogger } from '../../utils/performance/structuredLogger';
import type { ExtendedNavigator, BatteryManager } from '../../types/browser';

/**
 * Device capability information
 */
export interface DeviceCapabilities {
  /** CPU performance tier */
  cpuTier: 'low' | 'medium' | 'high';
  /** Memory in GB */
  memory: number;
  /** Screen resolution */
  screenResolution: { width: number; height: number };
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Hardware concurrency (CPU cores) */
  hardwareConcurrency: number;
  /** Touch support */
  touchSupport: boolean;
  /** Battery status */
  battery?: {
    level: number;
    charging: boolean;
  };
}

/**
 * User context information
 */
export interface UserContext {
  /** User type based on behavior */
  userType: 'casual' | 'regular' | 'power' | 'new';
  /** Current session length */
  sessionLength: number;
  /** Pages visited in session */
  pagesVisited: number;
  /** Time spent on current page */
  timeOnPage: number;
  /** Interaction frequency */
  interactionFrequency: 'low' | 'medium' | 'high';
  /** Preferred content types */
  preferredContentTypes: string[];
  /** Historical performance tolerance */
  performanceTolerance: 'low' | 'medium' | 'high';
}

/**
 * Loading strategy configuration
 */
export interface LoadingStrategy {
  /** Strategy name */
  name: string;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Loading approach */
  approach: 'eager' | 'lazy' | 'progressive' | 'conditional';
  /** Conditions for activation */
  conditions: {
    networkTypes: string[];
    deviceTiers: string[];
    userTypes: string[];
    performanceThresholds: {
      minBandwidth?: number;
      maxLatency?: number;
      minMemory?: number;
    };
  };
  /** Resource types this strategy applies to */
  resourceTypes: string[];
  /** Implementation details */
  implementation: {
    chunkSize?: number;
    concurrency?: number;
    timeout?: number;
    retries?: number;
  };
}

/**
 * Loading decision result
 */
export interface LoadingDecision {
  /** Chosen strategy */
  strategy: LoadingStrategy;
  /** Confidence in decision (0-1) */
  confidence: number;
  /** Reasoning behind decision */
  reasoning: string[];
  /** Performance expectations */
  expectations: {
    loadTime: number;
    memoryUsage: number;
    networkUsage: number;
  };
  /** Fallback strategy */
  fallback?: LoadingStrategy;
}

/**
 * Content adaptation rules
 */
export interface ContentAdaptation {
  /** Image quality adjustments */
  imageQuality: {
    high: number;
    medium: number;
    low: number;
  };
  /** Video quality settings */
  videoQuality: {
    resolution: string;
    bitrate: number;
    codec: string;
  };
  /** Font loading strategy */
  fontLoading: 'critical' | 'progressive' | 'lazy';
  /** Animation preferences */
  animations: 'full' | 'reduced' | 'disabled';
  /** Content prioritization */
  contentPriority: string[];
}

/**
 * Performance adaptive configuration
 */
export interface AdaptiveLoadingConfig {
  /** Enable adaptive loading */
  enabled: boolean;
  /** Strategies to use */
  strategies: LoadingStrategy[];
  /** Content adaptation rules */
  contentAdaptation: ContentAdaptation;
  /** Performance monitoring */
  monitoring: {
    /** Track loading performance */
    trackPerformance: boolean;
    /** Adaptation frequency */
    adaptationInterval: number;
    /** Performance thresholds */
    thresholds: {
      slowLoading: number;
      memoryPressure: number;
      highLatency: number;
    };
  };
  /** Fallback behavior */
  fallback: {
    /** Strategy when detection fails */
    defaultStrategy: string;
    /** Timeout for capability detection */
    detectionTimeout: number;
  };
}

/**
 * Default loading strategies
 */
const DEFAULT_STRATEGIES: LoadingStrategy[] = [
  {
    name: 'critical-first',
    priority: 'critical',
    approach: 'eager',
    conditions: {
      networkTypes: ['4g', '5g', 'wifi'],
      deviceTiers: ['medium', 'high'],
      userTypes: ['regular', 'power'],
      performanceThresholds: {
        minBandwidth: 1,
        maxLatency: 200
      }
    },
    resourceTypes: ['script', 'style', 'font'],
    implementation: {
      concurrency: 6,
      timeout: 5000,
      retries: 2
    }
  },
  {
    name: 'progressive-loading',
    priority: 'high',
    approach: 'progressive',
    conditions: {
      networkTypes: ['3g', '4g'],
      deviceTiers: ['low', 'medium'],
      userTypes: ['casual', 'regular'],
      performanceThresholds: {
        minBandwidth: 0.5,
        maxLatency: 500
      }
    },
    resourceTypes: ['image', 'video', 'font'],
    implementation: {
      chunkSize: 32768, // 32KB chunks
      concurrency: 3,
      timeout: 8000,
      retries: 3
    }
  },
  {
    name: 'conservative-loading',
    priority: 'medium',
    approach: 'lazy',
    conditions: {
      networkTypes: ['2g', '3g', 'slow-2g'],
      deviceTiers: ['low'],
      userTypes: ['casual', 'new'],
      performanceThresholds: {
        maxLatency: 1000,
        minMemory: 2
      }
    },
    resourceTypes: ['image', 'video', 'script'],
    implementation: {
      chunkSize: 16384, // 16KB chunks
      concurrency: 2,
      timeout: 10000,
      retries: 1
    }
  },
  {
    name: 'power-user-optimized',
    priority: 'high',
    approach: 'eager',
    conditions: {
      networkTypes: ['4g', '5g', 'wifi'],
      deviceTiers: ['high'],
      userTypes: ['power'],
      performanceThresholds: {
        minBandwidth: 2,
        minMemory: 8
      }
    },
    resourceTypes: ['script', 'style', 'font', 'image'],
    implementation: {
      concurrency: 8,
      timeout: 3000,
      retries: 2
    }
  }
];

/**
 * Default adaptive loading configuration
 */
const DEFAULT_CONFIG: AdaptiveLoadingConfig = {
  enabled: true,
  strategies: DEFAULT_STRATEGIES,
  contentAdaptation: {
    imageQuality: {
      high: 95,
      medium: 80,
      low: 60
    },
    videoQuality: {
      resolution: '720p',
      bitrate: 2000,
      codec: 'h264'
    },
    fontLoading: 'progressive',
    animations: 'full',
    contentPriority: ['text', 'images', 'videos', 'interactive']
  },
  monitoring: {
    trackPerformance: true,
    adaptationInterval: 30000, // 30 seconds
    thresholds: {
      slowLoading: 3000, // 3 seconds
      memoryPressure: 0.8, // 80% memory usage
      highLatency: 500 // 500ms
    }
  },
  fallback: {
    defaultStrategy: 'progressive-loading',
    detectionTimeout: 2000 // 2 seconds
  }
};

/**
 * Adaptive Loading Engine
 */
export class AdaptiveLoader {
  private config: AdaptiveLoadingConfig;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private userContext: UserContext | null = null;
  private networkInfo: NetworkInfo | null = null;
  private currentStrategy: LoadingStrategy | null = null;
  private performanceHistory: number[] = [];
  private adaptationTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AdaptiveLoadingConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
    this.initialize();
  }

  /**
   * Initialize the adaptive loader
   */
  private async initialize(): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined') return;

    try {
      // Detect device capabilities
      this.deviceCapabilities = await this.detectDeviceCapabilities();
      
      // Get network information
      this.networkInfo = this.getNetworkInfo();
      
      // Start adaptive monitoring
      if (this.config.monitoring.trackPerformance) {
        this.startAdaptiveMonitoring();
      }
      
      // Set up network change listener
      this.setupNetworkListener();
      
    } catch (error) {
      console.error('Failed to initialize adaptive loader:', error);
    }
  }

  /**
   * Detect device capabilities
   */
  private async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    const capabilities: DeviceCapabilities = {
      cpuTier: 'medium',
      memory: 4, // Default 4GB
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height
      },
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };

    // Detect memory
    const extNavigator = navigator as ExtendedNavigator;
    if (extNavigator.memory) {
      capabilities.memory = extNavigator.memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
    }

    // Estimate CPU tier based on various factors
    capabilities.cpuTier = await this.estimateCPUTier();

    // Get battery information if available
    if (extNavigator.getBattery) {
      try {
        const battery: BatteryManager = await extNavigator.getBattery();
        capabilities.battery = {
          level: battery.level,
          charging: battery.charging
        };
      } catch (error) {
        // Battery API not supported
      }
    }

    return capabilities;
  }

  /**
   * Estimate CPU performance tier
   */
  private async estimateCPUTier(): Promise<'low' | 'medium' | 'high'> {
    return new Promise((resolve) => {
      const start = performance.now();
      let iterations = 0;
      const maxTime = 10; // 10ms benchmark

      // Simple CPU benchmark
      const benchmark = () => {
        const current = performance.now();
        if (current - start < maxTime) {
          iterations++;
          // Do some computational work
          Math.sqrt(Math.random() * 1000000);
          setTimeout(benchmark, 0);
        } else {
          // Determine tier based on iterations completed
          if (iterations > 10000) resolve('high');
          else if (iterations > 5000) resolve('medium');
          else resolve('low');
        }
      };

      benchmark();
    });
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): NetworkInfo {
    const extNavigator = navigator as ExtendedNavigator;
    const connection = extNavigator.connection || 
                      extNavigator.mozConnection || 
                      extNavigator.webkitConnection;

    if (!connection) {
      return { effectiveType: 'unknown' };
    }

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  /**
   * Analyze user context from session data
   */
  public analyzeUserContext(sessionInfo: SessionInfo, rumMetrics: RUMMetrics[]): UserContext {
    const context: UserContext = {
      userType: 'casual',
      sessionLength: sessionInfo.endTime ? 
        sessionInfo.endTime - sessionInfo.startTime : 
        Date.now() - sessionInfo.startTime,
      pagesVisited: sessionInfo.pageViews,
      timeOnPage: 0,
      interactionFrequency: 'medium',
      preferredContentTypes: [],
      performanceTolerance: 'medium'
    };

    // Determine user type based on behavior
    if (sessionInfo.pageViews > 20) {
      context.userType = 'power';
    } else if (sessionInfo.pageViews > 5) {
      context.userType = 'regular';
    } else if (sessionInfo.pageViews === 1) {
      context.userType = 'new';
    }

    // Analyze performance tolerance from historical data
    if (rumMetrics.length > 0) {
      const avgPerformanceScore = rumMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / rumMetrics.length;
      if (avgPerformanceScore > 80) {
        context.performanceTolerance = 'high';
      } else if (avgPerformanceScore < 60) {
        context.performanceTolerance = 'low';
      }
    }

    // Estimate interaction frequency from journey steps
    const interactionCount = sessionInfo.journey.length;
    const sessionTimeMinutes = context.sessionLength / (1000 * 60);
    const interactionsPerMinute = interactionCount / Math.max(sessionTimeMinutes, 1);

    if (interactionsPerMinute > 2) {
      context.interactionFrequency = 'high';
    } else if (interactionsPerMinute < 0.5) {
      context.interactionFrequency = 'low';
    }

    this.userContext = context;
    return context;
  }

  /**
   * Make intelligent loading decision
   */
  public makeLoadingDecision(
    resourceType: string,
    context?: Partial<UserContext>
  ): LoadingDecision {
    try {
      // Use provided context or stored context, with defaults for missing properties
      const userCtx: UserContext = {
        userType: 'casual',
        sessionLength: 0,
        pagesVisited: 0,
        timeOnPage: 0,
        interactionFrequency: 'low',
        preferredContentTypes: [],
        performanceTolerance: 'medium',
        ...this.userContext,
        ...context
      };
      
      if (!this.deviceCapabilities || !this.networkInfo) {
        return this.getFallbackDecision(resourceType);
      }

      // Score each strategy
      const strategyScores = this.config.strategies
        .filter(strategy => strategy.resourceTypes.includes(resourceType))
        .map(strategy => ({
          strategy,
          score: this.scoreStrategy(strategy, userCtx)
        }))
        .sort((a, b) => b.score - a.score);

      if (strategyScores.length === 0) {
        return this.getFallbackDecision(resourceType);
      }

      const bestStrategy = strategyScores[0];
      const fallbackStrategy = strategyScores[1]?.strategy;

      const decision: LoadingDecision = {
        strategy: bestStrategy.strategy,
        confidence: Math.min(0.95, bestStrategy.score / 100),
        reasoning: this.generateReasoningForStrategy(bestStrategy.strategy),
        expectations: this.calculateExpectations(bestStrategy.strategy),
        fallback: fallbackStrategy
      };

      this.currentStrategy = bestStrategy.strategy;
      return decision;

    } catch (error) {
      console.error('Failed to make loading decision:', error);
      return this.getFallbackDecision(resourceType);
    }
  }

  /**
   * Score a strategy based on current conditions
   */
  private scoreStrategy(strategy: LoadingStrategy, userContext: UserContext): number {
    let score = 0;

    // Network compatibility
    if (this.networkInfo && strategy.conditions.networkTypes.includes(this.networkInfo.effectiveType)) {
      score += 30;
    }

    // Device tier compatibility
    if (this.deviceCapabilities && strategy.conditions.deviceTiers.includes(this.deviceCapabilities.cpuTier)) {
      score += 25;
    }

    // User type compatibility
    if (strategy.conditions.userTypes.includes(userContext.userType)) {
      score += 20;
    }

    // Performance threshold checks
    const thresholds = strategy.conditions.performanceThresholds;
    if (this.networkInfo) {
      if (thresholds.minBandwidth && this.networkInfo.downlink && this.networkInfo.downlink >= thresholds.minBandwidth) {
        score += 10;
      }
      if (thresholds.maxLatency && this.networkInfo.rtt && this.networkInfo.rtt <= thresholds.maxLatency) {
        score += 10;
      }
    }

    if (thresholds.minMemory && this.deviceCapabilities && this.deviceCapabilities.memory >= thresholds.minMemory) {
      score += 5;
    }

    // Performance tolerance alignment
    if (userContext.performanceTolerance === 'high' && strategy.priority === 'critical') {
      score += 15;
    } else if (userContext.performanceTolerance === 'low' && strategy.approach === 'lazy') {
      score += 15;
    }

    // Battery optimization
    if (this.deviceCapabilities?.battery && !this.deviceCapabilities.battery.charging && this.deviceCapabilities.battery.level < 0.2) {
      if (strategy.approach === 'lazy' || strategy.approach === 'conditional') {
        score += 10;
      } else {
        score -= 5;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Generate reasoning for strategy selection
   */
  private generateReasoningForStrategy(strategy: LoadingStrategy): string[] {
    const reasons: string[] = [];

    reasons.push(`Selected ${strategy.name} strategy with ${strategy.approach} loading approach`);

    if (this.networkInfo) {
      reasons.push(`Network: ${this.networkInfo.effectiveType} connection detected`);
    }

    if (this.deviceCapabilities) {
      reasons.push(`Device: ${this.deviceCapabilities.cpuTier} performance tier with ${this.deviceCapabilities.memory}GB memory`);
    }

    if (this.userContext) {
      reasons.push(`User: ${this.userContext.userType} user with ${this.userContext.performanceTolerance} performance tolerance`);
    }

    return reasons;
  }

  /**
   * Calculate performance expectations for a strategy
   */
  private calculateExpectations(strategy: LoadingStrategy): {
    loadTime: number;
    memoryUsage: number;
    networkUsage: number;
  } {
    const baseLoadTime = 1000; // 1 second base
    const baseMemory = 10; // 10MB base
    const baseNetwork = 100; // 100KB base

    let loadTimeMultiplier = 1;
    let memoryMultiplier = 1;
    let networkMultiplier = 1;

    // Adjust based on approach
    switch (strategy.approach) {
      case 'eager':
        loadTimeMultiplier = 0.7;
        memoryMultiplier = 1.3;
        networkMultiplier = 1.2;
        break;
      case 'lazy':
        loadTimeMultiplier = 1.5;
        memoryMultiplier = 0.8;
        networkMultiplier = 0.9;
        break;
      case 'progressive':
        loadTimeMultiplier = 1.0;
        memoryMultiplier = 1.0;
        networkMultiplier = 1.0;
        break;
      case 'conditional':
        loadTimeMultiplier = 1.2;
        memoryMultiplier = 0.9;
        networkMultiplier = 0.95;
        break;
    }

    // Adjust based on network conditions
    if (this.networkInfo) {
      if (this.networkInfo.effectiveType === '2g' || this.networkInfo.effectiveType === 'slow-2g') {
        loadTimeMultiplier *= 2;
      } else if (this.networkInfo.effectiveType === '4g' || this.networkInfo.effectiveType === '5g') {
        loadTimeMultiplier *= 0.8;
      }
    }

    return {
      loadTime: baseLoadTime * loadTimeMultiplier,
      memoryUsage: baseMemory * memoryMultiplier,
      networkUsage: baseNetwork * networkMultiplier
    };
  }

  /**
   * Get fallback decision when detection fails
   */
  private getFallbackDecision(resourceType: string): LoadingDecision {
    const fallbackStrategy = this.config.strategies.find(s => 
      s.name === this.config.fallback.defaultStrategy
    ) || this.config.strategies[0];

    return {
      strategy: fallbackStrategy,
      confidence: 0.5,
      reasoning: ['Using fallback strategy due to detection failure'],
      expectations: this.calculateExpectations(fallbackStrategy)
    };
  }

  /**
   * Adapt content based on conditions
   */
  public adaptContent(contentType: string): ContentAdaptation {
    const adaptation = { ...this.config.contentAdaptation };

    // Adjust for low-end devices
    if (this.deviceCapabilities?.cpuTier === 'low') {
      adaptation.imageQuality.high = Math.min(adaptation.imageQuality.high, 80);
      adaptation.imageQuality.medium = Math.min(adaptation.imageQuality.medium, 70);
      adaptation.animations = 'reduced';
    }

    // Adjust for slow connections
    if (this.networkInfo?.effectiveType === '2g' || this.networkInfo?.effectiveType === 'slow-2g') {
      adaptation.imageQuality.high = Math.min(adaptation.imageQuality.high, 70);
      adaptation.videoQuality.resolution = '480p';
      adaptation.videoQuality.bitrate = Math.min(adaptation.videoQuality.bitrate, 1000);
      adaptation.fontLoading = 'lazy';
    }

    // Adjust for data saver mode
    if (this.networkInfo?.saveData) {
      adaptation.imageQuality.high = Math.min(adaptation.imageQuality.high, 60);
      adaptation.videoQuality.resolution = '360p';
      adaptation.videoQuality.bitrate = Math.min(adaptation.videoQuality.bitrate, 500);
      adaptation.animations = 'disabled';
    }

    // Adjust for low battery
    if (this.deviceCapabilities?.battery && 
        !this.deviceCapabilities.battery.charging && 
        this.deviceCapabilities.battery.level < 0.2) {
      adaptation.animations = 'disabled';
      adaptation.fontLoading = 'lazy';
      adaptation.videoQuality.bitrate = Math.min(adaptation.videoQuality.bitrate, 800);
    }

    // Adjust for user preferences
    if (this.userContext?.performanceTolerance === 'low') {
      adaptation.fontLoading = 'lazy';
      adaptation.animations = 'reduced';
    }

    return adaptation;
  }

  /**
   * Start adaptive monitoring
   */
  private startAdaptiveMonitoring(): void {
    this.adaptationTimer = setInterval(() => {
      this.performAdaptation();
    }, this.config.monitoring.adaptationInterval);
  }

  /**
   * Perform adaptation based on current conditions
   */
  private performAdaptation(): void {
    try {
      // Update network info
      this.networkInfo = this.getNetworkInfo();

      // Check performance metrics
      const currentPerformance = this.getCurrentPerformance();
      this.performanceHistory.push(currentPerformance);

      // Keep only recent history
      if (this.performanceHistory.length > 10) {
        this.performanceHistory.shift();
      }

      // Detect performance degradation
      if (this.isPerformanceDegrading()) {
        this.adaptToPerformanceIssues();
      }

      // Update content adaptation
      this.updateContentAdaptation();

    } catch (error) {
      console.error('Failed to perform adaptation:', error);
    }
  }

  /**
   * Get current performance metric
   */
  private getCurrentPerformance(): number {
    // Simple performance metric based on page load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return navigation.loadEventEnd - navigation.loadEventStart;
    }
    return 0;
  }

  /**
   * Check if performance is degrading
   */
  private isPerformanceDegrading(): boolean {
    if (this.performanceHistory.length < 3) return false;

    const recent = this.performanceHistory.slice(-3);
    const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    
    return average > this.config.monitoring.thresholds.slowLoading;
  }

  /**
   * Adapt to performance issues
   */
  private adaptToPerformanceIssues(): void {
    // Switch to more conservative loading strategy
    const conservativeStrategy = this.config.strategies.find(s => s.approach === 'lazy');
    if (conservativeStrategy) {
      this.currentStrategy = conservativeStrategy;
    }

    // Reduce content quality
    this.config.contentAdaptation.imageQuality.high = Math.min(
      this.config.contentAdaptation.imageQuality.high, 70
    );
    this.config.contentAdaptation.animations = 'reduced';
  }

  /**
   * Update content adaptation based on current conditions
   */
  private updateContentAdaptation(): void {
    // This would trigger re-evaluation of content adaptation rules
    // In a real implementation, this might emit events or update a global state
    console.debug('Content adaptation updated based on current conditions');
  }

  /**
   * Setup network change listener
   */
  private setupNetworkListener(): void {
    if (typeof window === 'undefined') return;

    const extNavigator = navigator as ExtendedNavigator;
    const connection = extNavigator.connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.networkInfo = this.getNetworkInfo();
        this.performAdaptation();
      });
    }
  }

  /**
   * Deep merge configuration
   */
  private mergeConfig(
    defaultConfig: AdaptiveLoadingConfig,
    userConfig: Partial<AdaptiveLoadingConfig>
  ): AdaptiveLoadingConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      contentAdaptation: {
        ...defaultConfig.contentAdaptation,
        ...userConfig.contentAdaptation
      },
      monitoring: {
        ...defaultConfig.monitoring,
        ...userConfig.monitoring
      },
      fallback: {
        ...defaultConfig.fallback,
        ...userConfig.fallback
      }
    };
  }

  /**
   * Get current device capabilities
   */
  public getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  /**
   * Get current user context
   */
  public getUserContext(): UserContext | null {
    return this.userContext;
  }

  /**
   * Get current network information
   */
  public getNetworkInformation(): NetworkInfo | null {
    return this.networkInfo;
  }

  /**
   * Get current loading strategy
   */
  public getCurrentStrategy(): LoadingStrategy | null {
    return this.currentStrategy;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AdaptiveLoadingConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig);
  }

  /**
   * Destroy the adaptive loader
   */
  public destroy(): void {
    if (this.adaptationTimer) {
      clearInterval(this.adaptationTimer);
      this.adaptationTimer = null;
    }
    this.performanceHistory = [];
  }

  /**
   * Get loading statistics
   */
  public getStatistics(): {
    deviceCapabilities: DeviceCapabilities | null;
    userContext: UserContext | null;
    networkInfo: NetworkInfo | null;
    currentStrategy: LoadingStrategy | null;
    performanceHistory: number[];
    config: AdaptiveLoadingConfig;
  } {
    return {
      deviceCapabilities: this.deviceCapabilities,
      userContext: this.userContext,
      networkInfo: this.networkInfo,
      currentStrategy: this.currentStrategy,
      performanceHistory: [...this.performanceHistory],
      config: { ...this.config }
    };
  }
}

// Utility functions

/**
 * Quick device capability detection
 */
export const detectDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
  const loader = new AdaptiveLoader();
  await loader['detectDeviceCapabilities']();
  return loader.getDeviceCapabilities()!;
};

/**
 * Quick loading decision
 */
export const makeLoadingDecision = (
  resourceType: string,
  sessionInfo?: SessionInfo,
  rumMetrics?: RUMMetrics[]
): LoadingDecision => {
  const loader = new AdaptiveLoader();
  
  if (sessionInfo && rumMetrics) {
    loader.analyzeUserContext(sessionInfo, rumMetrics);
  }
  
  return loader.makeLoadingDecision(resourceType);
};

/**
 * Quick content adaptation
 */
export const adaptContent = (
  contentType: string,
  sessionInfo?: SessionInfo,
  rumMetrics?: RUMMetrics[]
): ContentAdaptation => {
  const loader = new AdaptiveLoader();
  
  if (sessionInfo && rumMetrics) {
    loader.analyzeUserContext(sessionInfo, rumMetrics);
  }
  
  return loader.adaptContent(contentType);
};

export default AdaptiveLoader;