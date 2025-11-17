/**
 * Intelligent Preloading Service for TradeYa
 * 
 * Data-driven resource preloading based on RUM analytics, user behavior prediction,
 * and network conditions. Integrates with Week 1 RUM infrastructure to make
 * intelligent preloading decisions.
 */

import { getSyncFirebaseDb } from '../../firebase-config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { RUMMetrics, SessionInfo } from './rumService';
import { PreloadCandidate } from '../../utils/performance/criticalPathAnalyzer';
import type { ExtendedNavigator, ExtendedHTMLLinkElement } from '../../types/browser';
import { logger } from '@utils/logging/logger';

/**
 * Network connection information
 */
export interface NetworkInfo {
  effectiveType: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Preload candidate with analytics data
 */
export interface AnalyticsBasedPreloadCandidate extends PreloadCandidate {
  /** How frequently this resource is accessed */
  accessFrequency: number;
  /** Average load time improvement from preloading */
  averageImprovement: number;
  /** User journey patterns where this resource is needed */
  journeyPatterns: string[];
  /** Network conditions where preloading is most beneficial */
  optimalNetworkConditions: string[];
  /** Confidence score for the preloading decision (0-1) */
  confidenceScore: number;
}

/**
 * User behavior prediction result
 */
export interface UserBehaviorPrediction {
  /** Predicted next resources */
  nextResources: string[];
  /** Confidence scores for each prediction */
  confidenceScores: number[];
  /** Time estimates for when resources will be needed */
  timeEstimates: number[];
  /** User journey pattern that led to this prediction */
  journeyPattern: string;
}

/**
 * Preloading effectiveness metrics
 */
export interface PreloadingMetrics {
  /** Total resources preloaded */
  totalPreloaded: number;
  /** Resources that were actually used */
  successfulPreloads: number;
  /** Resources preloaded but not used */
  wastedPreloads: number;
  /** Average time saved per successful preload */
  averageTimeSaved: number;
  /** Total bandwidth used for preloading */
  bandwidthUsed: number;
  /** Preloading success rate (0-1) */
  successRate: number;
  /** Performance impact score */
  performanceImpact: number;
}

/**
 * Preloading configuration
 */
export interface PreloadingConfig {
  /** Enable/disable intelligent preloading */
  enabled: boolean;
  /** Maximum number of resources to preload simultaneously */
  maxConcurrentPreloads: number;
  /** Maximum total size of preloaded resources (KB) */
  maxPreloadSize: number;
  /** Minimum confidence score required for preloading */
  minConfidenceScore: number;
  /** Network-aware preloading settings */
  networkAware: {
    /** Preload on slow connections */
    enableOnSlowConnections: boolean;
    /** Respect data saver mode */
    respectDataSaver: boolean;
    /** Adaptive preloading based on connection quality */
    adaptivePreloading: boolean;
  };
  /** Performance budget constraints */
  performanceBudget: {
    /** Maximum acceptable performance impact (ms) */
    maxPerformanceImpact: number;
    /** Respect existing performance budgets */
    respectBudgets: boolean;
  };
}

/**
 * Default preloading configuration
 */
const DEFAULT_PRELOADING_CONFIG: PreloadingConfig = {
  enabled: true,
  maxConcurrentPreloads: 5,
  maxPreloadSize: 2048, // 2MB
  minConfidenceScore: 0.6,
  networkAware: {
    enableOnSlowConnections: false,
    respectDataSaver: true,
    adaptivePreloading: true
  },
  performanceBudget: {
    maxPerformanceImpact: 100, // 100ms
    respectBudgets: true
  }
};

/**
 * Intelligent Preloading Service
 */
export class PreloadingService {
  private config: PreloadingConfig;
  private preloadedResources: Map<string, HTMLLinkElement> = new Map();
  private preloadingMetrics: PreloadingMetrics;
  private analyticsCacheTime = 5 * 60 * 1000; // 5 minutes
  private lastAnalyticsUpdate = 0;
  private cachedAnalytics: Map<string, AnalyticsBasedPreloadCandidate[]> = new Map();

  constructor(config: Partial<PreloadingConfig> = {}) {
    this.config = { ...DEFAULT_PRELOADING_CONFIG, ...config };
    this.preloadingMetrics = this.initializeMetrics();
  }

  /**
   * Initialize preloading metrics
   */
  private initializeMetrics(): PreloadingMetrics {
    return {
      totalPreloaded: 0,
      successfulPreloads: 0,
      wastedPreloads: 0,
      averageTimeSaved: 0,
      bandwidthUsed: 0,
      successRate: 0,
      performanceImpact: 0
    };
  }

  /**
   * Analyze RUM data to identify preload opportunities
   */
  public async analyzePreloadOpportunities(): Promise<AnalyticsBasedPreloadCandidate[]> {
    if (!this.config.enabled) return [];

    // In development, skip Firestore analytics to avoid permission errors/noise
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Check cache first
    const cacheKey = 'preload_opportunities';
    const now = Date.now();
    
    if (now - this.lastAnalyticsUpdate < this.analyticsCacheTime && this.cachedAnalytics.has(cacheKey)) {
      return this.cachedAnalytics.get(cacheKey)!;
    }

    try {
      // Query recent RUM data for analysis
      const db = getSyncFirebaseDb();
      const rumCollection = collection(db, 'performance_metrics');
      const recentDataQuery = query(
        rumCollection,
        where('timestamp', '>', now - 24 * 60 * 60 * 1000), // Last 24 hours
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(recentDataQuery);
      const rumData: RUMMetrics[] = snapshot.docs.map(doc => doc.data() as RUMMetrics);

      // Analyze patterns
      const candidates = await this.analyzeResourcePatterns(rumData);
      
      // Cache results
      this.cachedAnalytics.set(cacheKey, candidates);
      this.lastAnalyticsUpdate = now;

      return candidates;
    } catch (error) {
      logger.error('Failed to analyze preload opportunities:', 'SERVICE', {}, error as Error);
      return [];
    }
  }

  /**
   * Analyze resource loading patterns from RUM data
   */
  private async analyzeResourcePatterns(rumData: RUMMetrics[]): Promise<AnalyticsBasedPreloadCandidate[]> {
    const resourcePatterns = new Map<string, {
      frequency: number;
      loadTimes: number[];
      journeyContexts: string[];
      networkConditions: string[];
      pageContexts: string[];
    }>();

    // Analyze each RUM entry
    rumData.forEach(entry => {
      // Extract resource information from business metrics
      if (entry.businessMetrics?.network_timing) {
        const networkTiming = entry.businessMetrics.network_timing;
        
        // Track resource usage patterns
        const resourceKey = entry.pageId;
        if (!resourcePatterns.has(resourceKey)) {
          resourcePatterns.set(resourceKey, {
            frequency: 0,
            loadTimes: [],
            journeyContexts: [],
            networkConditions: [],
            pageContexts: []
          });
        }

        const pattern = resourcePatterns.get(resourceKey)!;
        pattern.frequency++;
        pattern.loadTimes.push(networkTiming || 0);
        pattern.networkConditions.push(entry.connection?.effectiveType || 'unknown');
        pattern.pageContexts.push(entry.pageMetadata.url);
      }
    });

    // Convert patterns to preload candidates
    const candidates: AnalyticsBasedPreloadCandidate[] = [];

    for (const [resource, pattern] of resourcePatterns.entries()) {
      if (pattern.frequency < 2) continue; // Skip rarely accessed resources

      const averageLoadTime = pattern.loadTimes.reduce((a, b) => a + b, 0) / pattern.loadTimes.length;
      const confidenceScore = this.calculateConfidenceScore(pattern);

      if (confidenceScore >= this.config.minConfidenceScore) {
        candidates.push({
          url: resource,
          type: this.inferResourceType(resource),
          as: this.getPreloadAs(this.inferResourceType(resource)),
          priority: this.calculatePriority(pattern),
          reason: `Frequently accessed resource (${pattern.frequency}x) with high confidence`,
          estimatedBenefit: averageLoadTime * 0.7, // Assume 70% improvement
          accessFrequency: pattern.frequency,
          averageImprovement: averageLoadTime * 0.7,
          journeyPatterns: [...new Set(pattern.journeyContexts)],
          optimalNetworkConditions: [...new Set(pattern.networkConditions)],
          confidenceScore
        });
      }
    }

    return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  /**
   * Calculate confidence score for a resource pattern
   */
  private calculateConfidenceScore(pattern: {
    frequency: number;
    loadTimes: number[];
    networkConditions: string[];
    pageContexts: string[];
  }): number {
    let score = 0;

    // Frequency score (0-0.4)
    const frequencyScore = Math.min(0.4, pattern.frequency / 10);
    score += frequencyScore;

    // Consistency score (0-0.3)
    const loadTimeVariance = this.calculateVariance(pattern.loadTimes);
    const consistencyScore = Math.max(0, 0.3 - (loadTimeVariance / 1000000)); // Lower variance = higher score
    score += consistencyScore;

    // Network diversity score (0-0.2)
    const uniqueNetworkConditions = new Set(pattern.networkConditions).size;
    const networkScore = Math.min(0.2, uniqueNetworkConditions / 4);
    score += networkScore;

    // Context diversity score (0-0.1)
    const uniqueContexts = new Set(pattern.pageContexts).size;
    const contextScore = Math.min(0.1, uniqueContexts / 5);
    score += contextScore;

    return Math.min(1, score);
  }

  /**
   * Calculate variance of an array of numbers
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Predict next likely resources based on user journey
   */
  public async predictNextResources(
    currentPath: string, 
    userSession: SessionInfo
  ): Promise<UserBehaviorPrediction> {
    try {
      // Analyze historical journey patterns
      const journeyPatterns = await this.analyzeJourneyPatterns(currentPath);
      
      // Use current session context to make predictions
      const sessionContext = this.analyzeSessionContext(userSession);
      
      // Combine patterns to make predictions
      const predictions = this.generatePredictions(journeyPatterns, sessionContext, currentPath);
      
      return predictions;
    } catch (error) {
      logger.error('Failed to predict next resources:', 'SERVICE', {}, error as Error);
      return {
        nextResources: [],
        confidenceScores: [],
        timeEstimates: [],
        journeyPattern: 'unknown'
      };
    }
  }

  /**
   * Analyze historical journey patterns
   */
  private async analyzeJourneyPatterns(currentPath: string): Promise<Map<string, number>> {
    const patterns = new Map<string, number>();

    try {
      // Query sessions that visited the current path
      const db = getSyncFirebaseDb();
      const rumCollection = collection(db, 'performance_metrics');
      const pathQuery = query(
        rumCollection,
        where('pageId', '==', currentPath),
        where('timestamp', '>', Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        limit(500)
      );

      const snapshot = await getDocs(pathQuery);
      const entries = snapshot.docs.map(doc => doc.data() as RUMMetrics);

      // Analyze what pages users visited after the current path
      // Note: next_page would need to be stored differently in businessMetrics
      // as it's currently typed as number. For now, skip this analysis.
      // TODO: Update RUM service to support page transition tracking
      logger.debug(`Skipping journey pattern analysis for ${entries.length} entries`, 'SERVICE');
    } catch (error) {
      logger.warn('Failed to analyze journey patterns:', 'SERVICE', error);
    }

    return patterns;
  }

  /**
   * Analyze current session context
   */
  private analyzeSessionContext(session: SessionInfo): {
    sessionLength: number;
    journeyProgression: number;
    userType: 'new' | 'returning' | 'power';
  } {
    const sessionLength = session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime;
    const journeyProgression = session.journey.length;
    
    let userType: 'new' | 'returning' | 'power' = 'new';
    if (session.pageViews > 10) userType = 'power';
    else if (session.pageViews > 3) userType = 'returning';

    return {
      sessionLength,
      journeyProgression,
      userType
    };
  }

  /**
   * Generate resource predictions based on patterns and context
   */
  private generatePredictions(
    patterns: Map<string, number>,
    context: { sessionLength: number; journeyProgression: number; userType: string },
    currentPath: string
  ): UserBehaviorPrediction {
    const predictions: UserBehaviorPrediction = {
      nextResources: [],
      confidenceScores: [],
      timeEstimates: [],
      journeyPattern: 'unknown'
    };

    // Sort patterns by frequency
    const sortedPatterns = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 predictions

    sortedPatterns.forEach(([resource, frequency]) => {
      predictions.nextResources.push(resource);
      
      // Calculate confidence based on frequency and context
      const baseConfidence = Math.min(0.9, frequency / 100);
      const contextMultiplier = context.userType === 'power' ? 1.2 : 
                              context.userType === 'returning' ? 1.1 : 1.0;
      const confidence = Math.min(0.95, baseConfidence * contextMultiplier);
      
      predictions.confidenceScores.push(confidence);
      
      // Estimate time based on user behavior
      const baseTime = context.userType === 'power' ? 5000 : 
                      context.userType === 'returning' ? 10000 : 15000;
      predictions.timeEstimates.push(baseTime + (Math.random() * 10000));
    });

    predictions.journeyPattern = this.identifyJourneyPattern(currentPath, context);

    return predictions;
  }

  /**
   * Identify the current journey pattern
   */
  private identifyJourneyPattern(
    currentPath: string, 
    context: { sessionLength: number; journeyProgression: number; userType: string }
  ): string {
    if (currentPath.includes('/dashboard')) return 'dashboard_exploration';
    if (currentPath.includes('/trade')) return 'trading_flow';
    if (currentPath.includes('/profile')) return 'profile_management';
    if (currentPath.includes('/projects')) return 'project_browsing';
    if (context.journeyProgression === 1) return 'initial_landing';
    if (context.userType === 'power') return 'power_user_flow';
    return 'general_browsing';
  }

  /**
   * Apply intelligent preloading strategies
   */
  public async applyPreloading(candidates: AnalyticsBasedPreloadCandidate[]): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined') return;

    // Check network conditions
    const networkInfo = this.getNetworkInfo();
    if (!this.shouldPreloadForNetwork(networkInfo)) return;

    // Filter candidates based on config and current conditions
    const validCandidates = this.filterCandidates(candidates, networkInfo);

    // Apply preloading with budget constraints
    await this.applyPreloadingWithBudget(validCandidates);
  }

  /**
   * Get current network information
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
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  /**
   * Check if preloading should be enabled for current network
   */
  private shouldPreloadForNetwork(networkInfo: NetworkInfo): boolean {
    // Respect data saver mode
    if (this.config.networkAware.respectDataSaver && networkInfo.saveData) {
      return false;
    }

    // Check for slow connections
    if (!this.config.networkAware.enableOnSlowConnections) {
      if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
        return false;
      }
    }

    return true;
  }

  /**
   * Filter candidates based on configuration and conditions
   */
  private filterCandidates(
    candidates: AnalyticsBasedPreloadCandidate[], 
    networkInfo: NetworkInfo
  ): AnalyticsBasedPreloadCandidate[] {
    return candidates.filter(candidate => {
      // Confidence score check
      if (candidate.confidenceScore < this.config.minConfidenceScore) return false;

      // Network condition optimization
      if (this.config.networkAware.adaptivePreloading) {
        if (!candidate.optimalNetworkConditions.includes(networkInfo.effectiveType)) {
          // Allow if it's a high-confidence, high-priority resource
          if (candidate.confidenceScore < 0.8 || candidate.priority !== 'high') {
            return false;
          }
        }
      }

      // Check if already preloaded
      if (this.preloadedResources.has(candidate.url)) return false;

      return true;
    }).slice(0, this.config.maxConcurrentPreloads);
  }

  /**
   * Apply preloading with performance budget constraints
   */
  private async applyPreloadingWithBudget(candidates: AnalyticsBasedPreloadCandidate[]): Promise<void> {
    let totalSize = 0;
    let performanceImpact = 0;

    for (const candidate of candidates) {
      // Estimate resource size (simplified)
      const estimatedSize = this.estimateResourceSize(candidate);
      
      // Check size budget
      if (totalSize + estimatedSize > this.config.maxPreloadSize * 1024) break;

      // Check performance budget
      if (this.config.performanceBudget.respectBudgets) {
        const impact = this.estimatePerformanceImpact(candidate);
        if (performanceImpact + impact > this.config.performanceBudget.maxPerformanceImpact) break;
        performanceImpact += impact;
      }

      // Apply preload
      try {
        await this.preloadResource(candidate);
        totalSize += estimatedSize;
        this.preloadingMetrics.totalPreloaded++;
        this.preloadingMetrics.bandwidthUsed += estimatedSize;
      } catch (error) {
        logger.warn('Failed to preload resource:', 'SERVICE', { arg0: candidate.url, arg1: error });
      }
    }
  }

  /**
   * Preload a single resource
   */
  private async preloadResource(candidate: AnalyticsBasedPreloadCandidate): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = candidate.url;
      link.as = candidate.as;

      if (candidate.crossorigin) {
        link.crossOrigin = 'anonymous';
      }

      // Add priority hint if supported
      if (candidate.priority === 'high') {
        (link as ExtendedHTMLLinkElement).fetchPriority = 'high';
      }

      link.onload = () => {
        this.preloadingMetrics.successfulPreloads++;
        resolve();
      };

      link.onerror = () => {
        this.preloadingMetrics.wastedPreloads++;
        reject(new Error(`Failed to preload ${candidate.url}`));
      };

      // Track the preloaded resource
      this.preloadedResources.set(candidate.url, link);

      // Add to document head
      document.head.appendChild(link);
    });
  }

  /**
   * Estimate resource size
   */
  private estimateResourceSize(candidate: AnalyticsBasedPreloadCandidate): number {
    // Simplified size estimation based on resource type
    switch (candidate.type) {
      case 'script': return 50 * 1024; // 50KB average
      case 'style': return 20 * 1024;  // 20KB average
      case 'font': return 30 * 1024;   // 30KB average
      case 'image': return 100 * 1024; // 100KB average
      default: return 25 * 1024;       // 25KB default
    }
  }

  /**
   * Estimate performance impact
   */
  private estimatePerformanceImpact(candidate: AnalyticsBasedPreloadCandidate): number {
    // Simplified impact estimation
    const baseImpact = candidate.priority === 'high' ? 10 :
                      candidate.priority === 'medium' ? 5 : 2;
    
    return baseImpact * (1 - candidate.confidenceScore);
  }

  /**
   * Track preloading effectiveness
   */
  public trackPreloadingEffectiveness(): PreloadingMetrics {
    // Calculate success rate
    this.preloadingMetrics.successRate = this.preloadingMetrics.totalPreloaded > 0 ?
      this.preloadingMetrics.successfulPreloads / this.preloadingMetrics.totalPreloaded : 0;

    // Calculate average time saved (estimated)
    this.preloadingMetrics.averageTimeSaved = this.preloadingMetrics.successfulPreloads * 200; // 200ms average

    // Calculate performance impact
    this.preloadingMetrics.performanceImpact = 
      (this.preloadingMetrics.successfulPreloads * 200) - 
      (this.preloadingMetrics.wastedPreloads * 50);

    return { ...this.preloadingMetrics };
  }

  /**
   * Adapt to network conditions
   */
  public adaptToNetworkConditions(connectionInfo: NetworkInfo): void {
    // Adjust configuration based on network conditions
    if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g') {
      this.config.maxConcurrentPreloads = Math.min(2, this.config.maxConcurrentPreloads);
      this.config.maxPreloadSize = Math.min(512, this.config.maxPreloadSize); // 512KB max on slow connections
      this.config.minConfidenceScore = Math.max(0.8, this.config.minConfidenceScore);
    } else if (connectionInfo.effectiveType === '4g') {
      // More aggressive preloading on fast connections
      this.config.maxConcurrentPreloads = Math.min(8, this.config.maxConcurrentPreloads);
      this.config.minConfidenceScore = Math.max(0.5, this.config.minConfidenceScore);
    }

    // Respect data saver
    if (connectionInfo.saveData) {
      this.config.enabled = false;
    }
  }

  /**
   * Infer resource type from URL
   */
  private inferResourceType(url: string): 'script' | 'style' | 'font' | 'image' {
    if (url.includes('.js') || url.includes('script')) return 'script';
    if (url.includes('.css') || url.includes('style')) return 'style';
    if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) return 'font';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    return 'script'; // Default fallback
  }

  /**
   * Get preload 'as' attribute
   */
  private getPreloadAs(type: 'script' | 'style' | 'font' | 'image'): string {
    switch (type) {
      case 'script': return 'script';
      case 'style': return 'style';
      case 'font': return 'font';
      case 'image': return 'image';
      default: return 'fetch';
    }
  }

  /**
   * Calculate resource priority
   */
  private calculatePriority(pattern: {
    frequency: number;
    loadTimes: number[];
  }): 'high' | 'medium' | 'low' {
    const avgLoadTime = pattern.loadTimes.reduce((a, b) => a + b, 0) / pattern.loadTimes.length;
    
    if (pattern.frequency > 5 && avgLoadTime > 500) return 'high';
    if (pattern.frequency > 2 || avgLoadTime > 200) return 'medium';
    return 'low';
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PreloadingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear preloaded resources
   */
  public clearPreloadedResources(): void {
    this.preloadedResources.forEach(link => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    this.preloadedResources.clear();
  }

  /**
   * Get preloading statistics
   */
  public getStatistics(): PreloadingMetrics & { config: PreloadingConfig } {
    return {
      ...this.trackPreloadingEffectiveness(),
      config: { ...this.config }
    };
  }

  /**
   * Destroy the preloading service
   */
  public destroy(): void {
    this.clearPreloadedResources();
    this.cachedAnalytics.clear();
  }
}

// Utility functions for easy usage

/**
 * Create and initialize intelligent preloading
 */
export const initializeIntelligentPreloading = async (
  config?: Partial<PreloadingConfig>
): Promise<PreloadingService> => {
  const service = new PreloadingService(config);
  
  try {
    const opportunities = await service.analyzePreloadOpportunities();
    await service.applyPreloading(opportunities);
  } catch (error) {
    logger.error('Failed to initialize intelligent preloading:', 'SERVICE', {}, error as Error);
  }
  
  return service;
};

/**
 * Quick preload based on user journey prediction
 */
export const preloadForUserJourney = async (
  currentPath: string,
  userSession: SessionInfo,
  config?: Partial<PreloadingConfig>
): Promise<void> => {
  const service = new PreloadingService(config);
  
  try {
    const prediction = await service.predictNextResources(currentPath, userSession);
    
    // Convert predictions to preload candidates
    const candidates: AnalyticsBasedPreloadCandidate[] = prediction.nextResources.map((resource, index) => ({
      url: resource,
      type: 'script', // Simplified
      as: 'script',
      priority: prediction.confidenceScores[index] > 0.7 ? 'high' : 'medium',
      reason: `Predicted from user journey pattern: ${prediction.journeyPattern}`,
      estimatedBenefit: 200,
      accessFrequency: 1,
      averageImprovement: 200,
      journeyPatterns: [prediction.journeyPattern],
      optimalNetworkConditions: ['4g', '3g'],
      confidenceScore: prediction.confidenceScores[index]
    }));
    
    await service.applyPreloading(candidates);
  } catch (error) {
    logger.error('Failed to preload for user journey:', 'SERVICE', {}, error as Error);
  } finally {
    service.destroy();
  }
};

export default PreloadingService;