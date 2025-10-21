/**
 * Real User Monitoring (RUM) Service for TradeYa
 * 
 * Production-grade RUM service with batch processing, sampling, session tracking,
 * and network-aware data collection. Provides comprehensive performance monitoring
 * for real user experiences.
 */

import { getSyncFirebaseDb } from '../../firebase-config';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { PerformanceMetrics } from '../../utils/performanceMetrics';
import { performanceLogger } from '../../utils/performance/structuredLogger';
import type { ExtendedWindow, ExtendedNavigator } from '../../types/browser';

/**
 * Extended performance metrics for RUM collection
 */
export interface RUMMetrics extends PerformanceMetrics {
  /** Unique session identifier */
  sessionId: string;
  /** Page/route identifier */
  pageId: string;
  /** User identifier (anonymized) */
  userId?: string;
  /** Timestamp when metrics were collected */
  timestamp: number;
  /** User agent information */
  userAgent: string;
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** Connection information */
  connection?: {
    effectiveType: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  /** Page metadata */
  pageMetadata: {
    url: string;
    referrer: string;
    title: string;
  };
  /** Performance score (calculated) */
  performanceScore: number;
  /** Error information if any */
  errors?: Array<{
    message: string;
    stack?: string;
    timestamp: number;
  }>;
  /** Custom business metrics */
  businessMetrics?: Record<string, number>;
}

/**
 * User journey step for tracking user flows
 */
export interface UserJourneyStep {
  stepId: string;
  stepName: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Pending metrics item for authentication queue
 */
export interface PendingMetric {
  pageId: string;
  metrics: Partial<PerformanceMetrics>;
  timestamp: number;
  retryCount?: number;
}

/**
 * Retry tracking for metrics to prevent infinite loops
 */
export interface MetricRetryInfo {
  sessionId: string;
  pageId: string;
  retryCount: number;
  lastRetryTime: number;
  maxRetries: number;
  backoffMultiplier: number;
}

/**
 * Session tracking information
 */
export interface SessionInfo {
  sessionId: string;
  startTime: number;
  endTime?: number;
  pageViews: number;
  userAgent: string;
  journey: UserJourneyStep[];
  totalDuration?: number;
  bounceRate?: number;
  currentPageId?: string;
}

/**
 * RUM Configuration options
 */
export interface RUMConfig {
  /** Sampling rate (0-1) for data collection */
  samplingRate: number;
  /** Maximum batch size for sending data */
  batchSize: number;
  /** Batch send interval in milliseconds */
  batchInterval: number;
  /** Enable offline queue */
  enableOfflineQueue: boolean;
  /** Maximum offline queue size */
  maxOfflineQueueSize: number;
  /** Performance budget thresholds */
  performanceBudget: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  /** Privacy settings */
  privacy: {
    anonymizeUserId: boolean;
    collectUserAgent: boolean;
    collectLocation: boolean;
  };
}

/**
 * Default RUM configuration
 */
const DEFAULT_RUM_CONFIG: RUMConfig = {
  samplingRate: 0.1, // 10% sampling rate
  batchSize: 50,
  batchInterval: 30000, // 30 seconds
  enableOfflineQueue: true,
  maxOfflineQueueSize: 100,
  performanceBudget: {
    lcp: 2500, // 2.5 seconds
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1 score
    fcp: 1800, // 1.8 seconds
    ttfb: 800  // 800ms
  },
  privacy: {
    anonymizeUserId: true,
    collectUserAgent: true,
    collectLocation: false
  }
};

/**
 * Production-grade RUM Service class
 */
export class RUMService {
  private config: RUMConfig;
  private metricsQueue: RUMMetrics[] = [];
  private offlineQueue: RUMMetrics[] = [];
  private currentSession: SessionInfo | null = null;
  private batchTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private networkObserver: PerformanceObserver | null = null;
  private pendingMetrics: PendingMetric[] = [];
  private currentUserId: string | null = null;
  private retryTracking: Map<string, MetricRetryInfo> = new Map();
  private discardedMetrics: Set<string> = new Set();

  constructor(config: Partial<RUMConfig> = {}) {
    this.config = { ...DEFAULT_RUM_CONFIG, ...config };
    this.initializeService();
  }

  /**
   * Initialize the RUM service
   */
  private initializeService(): void {
    // Check if this session should be sampled
    if (!this.shouldSample()) {
      return;
    }

    this.initializeSession();
    this.setupNetworkMonitoring();
    this.setupOfflineDetection();
    this.setupErrorTracking();
    this.startBatchProcessor();
    this.setupPageUnloadHandler();
  }

  /**
   * Determine if this session should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  /**
   * Initialize a new session
   */
  private initializeSession(): void {
    const sessionId = this.generateSessionId();
    const userAgent = navigator.userAgent;

    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      pageViews: 0,
      userAgent,
      journey: []
    };

    // Store session in sessionStorage for persistence across page loads
    try {
      sessionStorage.setItem('rum_session', JSON.stringify(this.currentSession));
    } catch (error) {
      performanceLogger.warn('monitoring', 'Failed to store RUM session', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `rum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.networkObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
              this.analyzeNetworkTiming(entry as PerformanceNavigationTiming);
            }
          });
        });

        this.networkObserver.observe({ 
          entryTypes: ['navigation', 'resource'] 
        });
      } catch (error) {
        performanceLogger.warn('monitoring', 'Failed to setup network monitoring', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  }

  /**
   * Analyze network timing for performance insights
   */
  private analyzeNetworkTiming(entry: PerformanceNavigationTiming): void {
    const timing = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart ? entry.connectEnd - entry.secureConnectionStart : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      total: entry.responseEnd - entry.startTime
    };

    // Add to business metrics for analysis
    this.addBusinessMetric('network_timing', timing);
  }

  /**
   * Setup offline detection
   */
  private setupOfflineDetection(): void {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.message,
          stack: event.error?.stack,
          timestamp: Date.now()
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          timestamp: Date.now()
        });
      });
    }
  }

  /**
   * Start the batch processor
   */
  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.config.batchInterval);
  }

  /**
   * Setup page unload handler to send remaining metrics
   */
  private setupPageUnloadHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.finalizeSession();
        this.sendBeacon();
      });

      // Use Page Visibility API for better mobile support
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.sendBeacon();
        }
      });
    }
  }

  /**
   * Collect RUM metrics for a page
   */
  public collectMetrics(
    pageId: string,
    metrics: Partial<PerformanceMetrics>,
    userId?: string
  ): void {
    if (!this.currentSession) return;

    // Enhanced authentication validation with circuit breaker
    const metricId = `${this.currentSession.sessionId}-${pageId}`;
    
    if (this.discardedMetrics.has(metricId)) {
      performanceLogger.debug('monitoring', 'Metric permanently discarded, skipping collection', {
        pageId,
        sessionId: this.currentSession.sessionId,
        metricId
      });
      return;
    }

    // Check if authentication is required and not available
    if (!userId && this.isAuthenticationRequired()) {
      performanceLogger.warn('monitoring', 'Metrics collection skipped: authentication not available', {
        pageId,
        sessionId: this.currentSession.sessionId,
        reason: 'undefined_userId'
      });
      
      // Queue metrics for later processing when authentication is available
      this.queuePendingMetrics(pageId, metrics);
      return;
    }

    // Wait for authentication if we're in a pending state
    if (!userId && this.currentUserId && this.pendingMetrics.length > 0) {
      performanceLogger.debug('monitoring', 'Using established userId for metrics collection', {
        pageId,
        sessionId: this.currentSession.sessionId
      });
      userId = this.currentUserId;
    }

    const rumMetrics: RUMMetrics = {
      ...metrics,
      sessionId: this.currentSession.sessionId,
      pageId,
      userId: this.config.privacy.anonymizeUserId && userId ? this.hashUserId(userId) : userId,
      timestamp: Date.now(),
      userAgent: this.config.privacy.collectUserAgent ? navigator.userAgent : '',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: this.getConnectionInfo(),
      pageMetadata: {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title
      },
      performanceScore: this.calculatePerformanceScore(metrics),
      businessMetrics: {}
    };

    this.addToQueue(rumMetrics);
    this.updateSession(pageId);
  }

  /**
   * Check if authentication is required for metrics collection
   */
  private isAuthenticationRequired(): boolean {
    // In production environments, we typically want user identification
    // In development, we can be more lenient
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Queue metrics for processing when authentication becomes available
   */
  private queuePendingMetrics(pageId: string, metrics: Partial<PerformanceMetrics>): void {
    if (!this.pendingMetrics) {
      this.pendingMetrics = [];
    }

    this.pendingMetrics.push({
      pageId,
      metrics,
      timestamp: Date.now()
    });

    // Limit pending queue size to prevent memory issues
    const MAX_PENDING_METRICS = 50;
    if (this.pendingMetrics.length > MAX_PENDING_METRICS) {
      this.pendingMetrics = this.pendingMetrics.slice(-MAX_PENDING_METRICS);
      performanceLogger.warn('monitoring', 'Pending metrics queue overflow, dropping oldest entries');
    }
  }

  /**
   * Process pending metrics when authentication becomes available
   */
  public processPendingMetrics(userId: string): void {
    if (!this.pendingMetrics || this.pendingMetrics.length === 0) {
      return;
    }

    performanceLogger.info('monitoring', 'Processing pending metrics after authentication', {
      count: this.pendingMetrics.length,
      userId: this.config.privacy.anonymizeUserId ? this.hashUserId(userId) : userId
    });

    const metricsToProcess = [...this.pendingMetrics];
    this.pendingMetrics = [];

    metricsToProcess.forEach(pending => {
      this.collectMetrics(pending.pageId, pending.metrics, userId);
    });
  }

  /**
   * Set user ID for authenticated sessions
   */
  public setUserId(userId: string): void {
    if (!userId) {
      performanceLogger.warn('monitoring', 'Attempted to set undefined userId');
      return;
    }

    this.currentUserId = userId;
    
    // Process any pending metrics now that we have authentication
    this.processPendingMetrics(userId);
    
    performanceLogger.info('monitoring', 'User authentication established for RUM service', {
      userId: this.config.privacy.anonymizeUserId ? this.hashUserId(userId) : userId,
      sessionId: this.currentSession?.sessionId
    });
  }

  /**
   * Add a user journey step
   */
  public trackJourneyStep(stepName: string, metadata?: Record<string, any>): void {
    if (!this.currentSession) return;

    const step: UserJourneyStep = {
      stepId: `${this.currentSession.sessionId}_${Date.now()}`,
      stepName,
      timestamp: Date.now(),
      metadata
    };

    this.currentSession.journey.push(step);

    // Update session in storage
    try {
      sessionStorage.setItem('rum_session', JSON.stringify(this.currentSession));
    } catch (error) {
      performanceLogger.warn('monitoring', 'Failed to update RUM session', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Add business metric for tracking
   */
  public addBusinessMetric(key: string, value: any): void {
    // Store temporarily and include in next metrics collection
    if (!this.currentSession) return;

    // Store in a temporary metrics object that will be included in the next collection
    const extWindow = window as ExtendedWindow;
    if (!extWindow.__rum_business_metrics__) {
      extWindow.__rum_business_metrics__ = {};
    }
    extWindow.__rum_business_metrics__[key] = value;
  }

  /**
   * Track errors
   */
  private trackError(error: { message: string; stack?: string; timestamp: number }): void {
    if (!this.currentSession) return;

    // Add error to current metrics or create error-specific metrics
    const errorMetrics: Partial<RUMMetrics> = {
      sessionId: this.currentSession.sessionId,
      pageId: 'error',
      timestamp: Date.now(),
      errors: [error],
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pageMetadata: {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title
      },
      performanceScore: 0 // Errors impact performance score
    };

    this.addToQueue(errorMetrics as RUMMetrics);
  }

  /**
   * Get connection information
   */
  private getConnectionInfo() {
    const extNavigator = navigator as ExtendedNavigator;
    const connection = extNavigator.connection || extNavigator.mozConnection || extNavigator.webkitConnection;
    
    if (!connection) return undefined;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  /**
   * Calculate performance score based on Core Web Vitals
   */
  private calculatePerformanceScore(metrics: Partial<PerformanceMetrics>): number {
    let score = 100;
    const budget = this.config.performanceBudget;

    // LCP scoring (40% weight)
    if (metrics.largestContentfulPaint) {
      const lcpScore = metrics.largestContentfulPaint <= budget.lcp ? 40 : 
                     Math.max(0, 40 - ((metrics.largestContentfulPaint - budget.lcp) / budget.lcp) * 40);
      score = score - 40 + lcpScore;
    }

    // FID scoring (25% weight)
    if (metrics.firstInputDelay) {
      const fidScore = metrics.firstInputDelay <= budget.fid ? 25 : 
                      Math.max(0, 25 - ((metrics.firstInputDelay - budget.fid) / budget.fid) * 25);
      score = score - 25 + fidScore;
    }

    // CLS scoring (25% weight)
    if (metrics.cumulativeLayoutShift) {
      const clsScore = metrics.cumulativeLayoutShift <= budget.cls ? 25 : 
                      Math.max(0, 25 - ((metrics.cumulativeLayoutShift - budget.cls) / budget.cls) * 25);
      score = score - 25 + clsScore;
    }

    // FCP scoring (10% weight)
    if (metrics.firstContentfulPaint) {
      const fcpScore = metrics.firstContentfulPaint <= budget.fcp ? 10 : 
                      Math.max(0, 10 - ((metrics.firstContentfulPaint - budget.fcp) / budget.fcp) * 10);
      score = score - 10 + fcpScore;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Hash user ID for privacy
   */
  private hashUserId(userId: string): string {
    // Simple hash function for privacy (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash)}`;
  }

  /**
   * Add metrics to queue
   */
  private addToQueue(metrics: RUMMetrics): void {
    // Include any pending business metrics
    const extWindow = window as ExtendedWindow;
    if (extWindow.__rum_business_metrics__) {
      metrics.businessMetrics = { ...metrics.businessMetrics, ...extWindow.__rum_business_metrics__ };
      delete extWindow.__rum_business_metrics__;
    }

    if (this.isOnline) {
      this.metricsQueue.push(metrics);
      
      if (this.metricsQueue.length >= this.config.batchSize) {
        this.processBatch();
      }
    } else {
      this.addToOfflineQueue(metrics);
    }
  }

  /**
   * Add metrics to offline queue
   */
  private addToOfflineQueue(metrics: RUMMetrics): void {
    if (this.offlineQueue.length >= this.config.maxOfflineQueueSize) {
      this.offlineQueue.shift(); // Remove oldest entry
    }
    this.offlineQueue.push(metrics);
  }

  /**
   * Process offline queue when back online
   */
  private processOfflineQueue(): void {
    if (this.offlineQueue.length > 0) {
      this.metricsQueue.push(...this.offlineQueue);
      this.offlineQueue = [];
      this.processBatch();
    }
  }

  /**
   * Process batch of metrics
   */
  private async processBatch(): Promise<void> {
    if (this.metricsQueue.length === 0) return;

    const batch = this.metricsQueue.splice(0, this.config.batchSize);
    
    try {
      await this.sendMetricsBatch(batch);
    } catch (error) {
      console.error('Failed to send RUM metrics batch:', error);
      
      // Add back to offline queue if network error
      if (!this.isOnline) {
        this.offlineQueue.push(...batch);
      }
    }
  }

  /**
   * Enhanced metrics batch sending with improved validation and circuit breaker
   */
  private async sendMetricsBatch(metrics: RUMMetrics[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const db = getSyncFirebaseDb();

    try {
      // Pre-filter metrics with comprehensive validation
      const { validMetrics, invalidMetrics } = this.validateMetricsBatch(metrics);

      // Handle invalid metrics - don't retry them
      if (invalidMetrics.length > 0) {
        this.handleInvalidMetrics(invalidMetrics);
      }

      // If no valid metrics after filtering, return early
      if (validMetrics.length === 0) {
        performanceLogger.info('monitoring', 'No valid metrics to send after validation', {
          originalCount: metrics.length,
          invalidCount: invalidMetrics.length
        });
        return;
      }

      // Log if we filtered out some metrics
      if (validMetrics.length !== metrics.length) {
        performanceLogger.warn('monitoring', 'Filtered out invalid metrics', {
          original: metrics.length,
          valid: validMetrics.length,
          invalid: invalidMetrics.length
        });
      }

      const batch = writeBatch(db);
      const rumCollection = collection(db, 'performance_metrics');

      validMetrics.forEach((metric) => {
        const docRef = doc(rumCollection);
        
        // Create clean metric data for Firestore
        const metricData: any = {
          ...metric,
          createdAt: serverTimestamp(),
          version: '1.0'
        };

        // Ensure no undefined fields in the final data
        Object.keys(metricData).forEach(key => {
          if (metricData[key] === undefined) {
            delete metricData[key];
          }
        });

        batch.set(docRef, metricData);
      });

      await batch.commit();
      
      performanceLogger.info('monitoring', 'Successfully sent metrics batch', {
        count: validMetrics.length,
        invalidFiltered: invalidMetrics.length
      });

      // Clear retry tracking for successfully sent metrics
      validMetrics.forEach(metric => {
        const retryKey = `${metric.sessionId}-${metric.pageId}`;
        this.retryTracking.delete(retryKey);
      });

    } catch (error) {
      performanceLogger.error('monitoring', 'Failed to send metrics batch', {
        error: error instanceof Error ? error.message : String(error),
        count: metrics.length,
        metrics: metrics.map(m => ({
          sessionId: m.sessionId,
          pageId: m.pageId,
          hasUserId: !!m.userId,
          timestamp: m.timestamp
        }))
      });
      
      // Enhanced error handling - only requeue if recoverable
      if (this.isRecoverableError(error)) {
        performanceLogger.info('monitoring', 'Error is recoverable, attempting requeue', {
          errorType: 'recoverable',
          metricsCount: metrics.length
        });
        this.requeueMetrics(metrics);
      } else {
        performanceLogger.warn('monitoring', 'Error is non-recoverable, discarding metrics', {
          errorType: 'non-recoverable',
          metricsCount: metrics.length,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Mark metrics as permanently discarded for non-recoverable errors
        this.handleInvalidMetrics(metrics);
      }
    }
  }

  /**
   * Validate metrics batch and separate valid from invalid metrics
   */
  private validateMetricsBatch(metrics: RUMMetrics[]): {
    validMetrics: RUMMetrics[];
    invalidMetrics: RUMMetrics[];
  } {
    const validMetrics: RUMMetrics[] = [];
    const invalidMetrics: RUMMetrics[] = [];

    for (const metric of metrics) {
      // Check for undefined userId in production
      if (metric.userId === undefined && this.isAuthenticationRequired()) {
        performanceLogger.debug('monitoring', 'Metric failed userId validation', {
          sessionId: metric.sessionId,
          pageId: metric.pageId,
          timestamp: metric.timestamp,
          reason: 'undefined_userId_production'
        });
        invalidMetrics.push(metric);
        continue;
      }

      // Check for required fields
      if (!metric.sessionId || !metric.pageId || !metric.timestamp) {
        performanceLogger.debug('monitoring', 'Metric failed required fields validation', {
          sessionId: metric.sessionId,
          pageId: metric.pageId,
          timestamp: metric.timestamp,
          reason: 'missing_required_fields'
        });
        invalidMetrics.push(metric);
        continue;
      }

      // Check for reasonable timestamp (not too old or future)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const maxFuture = 5 * 60 * 1000; // 5 minutes in future

      if (metric.timestamp < (now - maxAge) || metric.timestamp > (now + maxFuture)) {
        performanceLogger.debug('monitoring', 'Metric failed timestamp validation', {
          sessionId: metric.sessionId,
          pageId: metric.pageId,
          timestamp: metric.timestamp,
          currentTime: now,
          reason: 'invalid_timestamp'
        });
        invalidMetrics.push(metric);
        continue;
      }

      // Metric passed all validations
      validMetrics.push(metric);
    }

    return { validMetrics, invalidMetrics };
  }

  /**
   * Handle invalid metrics by marking them as permanently discarded
   */
  private handleInvalidMetrics(invalidMetrics: RUMMetrics[]): void {
    for (const metric of invalidMetrics) {
      const metricId = `${metric.sessionId}-${metric.pageId}`;
      const retryKey = `${metric.sessionId}-${metric.pageId}`;

      // Add to permanently discarded set
      this.discardedMetrics.add(metricId);
      
      // Clean up any retry tracking
      this.retryTracking.delete(retryKey);

      performanceLogger.debug('monitoring', 'Permanently discarded invalid metric', {
        sessionId: metric.sessionId,
        pageId: metric.pageId,
        timestamp: metric.timestamp,
        hasUserId: !!metric.userId
      });
    }

    if (invalidMetrics.length > 0) {
      performanceLogger.info('monitoring', 'Permanently discarded invalid metrics', {
        count: invalidMetrics.length
      });
    }
  }

  /**
   * Enhanced error classification to distinguish between recoverable and non-recoverable errors
   */
  private isRecoverableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || String(error);
    const errorMessageLower = errorMessage.toLowerCase();
    
    // Non-recoverable errors (data validation issues)
    const nonRecoverableErrors = [
      'undefined userid',
      'userid is undefined',
      'null userid',
      'invalid userid',
      'validation failed',
      'schema validation',
      'required field missing',
      'permission denied'
    ];
    
    // Check for non-recoverable errors first
    if (nonRecoverableErrors.some(nonRecoverable =>
      errorMessageLower.includes(nonRecoverable)
    )) {
      return false;
    }
    
    // Recoverable errors (network/temporary Firebase issues)
    const recoverableErrors = [
      'network',
      'timeout',
      'unavailable',
      'deadline-exceeded',
      'internal',
      'aborted',
      'resource-exhausted',
      'cancelled',
      'unknown'
    ];
    
    return recoverableErrors.some(recoverable =>
      errorMessageLower.includes(recoverable)
    );
  }

  /**
   * Smart re-queuing logic with retry tracking and exponential backoff
   */
  private requeueMetrics(metrics: RUMMetrics[]): void {
    const now = Date.now();
    const validMetricsToRequeue: RUMMetrics[] = [];

    for (const metric of metrics) {
      const retryKey = `${metric.sessionId}-${metric.pageId}`;
      const metricId = `${metric.sessionId}-${metric.pageId}`;

      // Check if metric is already permanently discarded
      if (this.discardedMetrics.has(metricId)) {
        performanceLogger.debug('monitoring', 'Skipping requeue for permanently discarded metric', {
          sessionId: metric.sessionId,
          pageId: metric.pageId
        });
        continue;
      }

      // Get or create retry tracking info
      let retryInfo = this.retryTracking.get(retryKey);
      if (!retryInfo) {
        retryInfo = {
          sessionId: metric.sessionId,
          pageId: metric.pageId,
          retryCount: 0,
          lastRetryTime: now,
          maxRetries: 3, // Maximum retry attempts
          backoffMultiplier: 1000 // Start with 1 second backoff
        };
        this.retryTracking.set(retryKey, retryInfo);
      }

      // Check if we've exceeded max retries
      if (retryInfo.retryCount >= retryInfo.maxRetries) {
        performanceLogger.warn('monitoring', 'Metric exceeded max retries, permanently discarding', {
          sessionId: metric.sessionId,
          pageId: metric.pageId,
          retryCount: retryInfo.retryCount,
          maxRetries: retryInfo.maxRetries
        });
        
        // Permanently discard this metric
        this.discardedMetrics.add(metricId);
        this.retryTracking.delete(retryKey);
        continue;
      }

      // Calculate backoff delay
      const backoffDelay = retryInfo.backoffMultiplier * Math.pow(2, retryInfo.retryCount);
      const timeSinceLastRetry = now - retryInfo.lastRetryTime;

      // Check if enough time has passed for retry
      if (timeSinceLastRetry < backoffDelay) {
        performanceLogger.debug('monitoring', 'Metric not ready for retry (backoff period)', {
          sessionId: metric.sessionId,
          pageId: metric.pageId,
          retryCount: retryInfo.retryCount,
          backoffDelay,
          timeSinceLastRetry
        });
        continue;
      }

      // Update retry tracking
      retryInfo.retryCount++;
      retryInfo.lastRetryTime = now;

      // Validate metric before requeuing
      if (metric.userId === undefined && this.isAuthenticationRequired()) {
        performanceLogger.warn('monitoring', 'Skipping requeue for metric with undefined userId', {
          sessionId: metric.sessionId,
          pageId: metric.pageId,
          retryCount: retryInfo.retryCount
        });

        // If this is a validation error and we've tried multiple times, discard it
        if (retryInfo.retryCount >= 2) {
          performanceLogger.warn('monitoring', 'Discarding metric with persistent validation issues', {
            sessionId: metric.sessionId,
            pageId: metric.pageId,
            retryCount: retryInfo.retryCount
          });
          this.discardedMetrics.add(metricId);
          this.retryTracking.delete(retryKey);
        }
        continue;
      }

      // Metric is valid for requeuing
      validMetricsToRequeue.push(metric);

      performanceLogger.info('monitoring', 'Requeuing metric with backoff', {
        sessionId: metric.sessionId,
        pageId: metric.pageId,
        retryCount: retryInfo.retryCount,
        backoffDelay
      });
    }

    // Actually requeue valid metrics
    if (validMetricsToRequeue.length > 0) {
      if (this.isOnline && this.metricsQueue.length < this.config.batchSize) {
        // Add back to main queue if online and there's space
        this.metricsQueue.unshift(...validMetricsToRequeue);
      } else {
        // Add to offline queue for later processing
        validMetricsToRequeue.forEach(metric => this.addToOfflineQueue(metric));
      }

      performanceLogger.info('monitoring', 'Successfully requeued metrics', {
        count: validMetricsToRequeue.length,
        discarded: metrics.length - validMetricsToRequeue.length
      });
    }

    // Clean up old retry tracking entries (older than 1 hour)
    this.cleanupRetryTracking(now);
  }

  /**
   * Clean up old retry tracking entries to prevent memory leaks
   */
  private cleanupRetryTracking(currentTime: number): void {
    const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    
    for (const [key, retryInfo] of this.retryTracking.entries()) {
      if (currentTime - retryInfo.lastRetryTime > maxAge) {
        this.retryTracking.delete(key);
      }
    }

    // Also clean up very old discarded metrics (older than 24 hours)
    if (this.discardedMetrics.size > 1000) {
      // Simple cleanup - remove half the entries when we have too many
      // In a production system, you'd want timestamp-based cleanup
      const entries = Array.from(this.discardedMetrics);
      this.discardedMetrics.clear();
      
      // Keep the more recent half
      const keepCount = Math.floor(entries.length / 2);
      for (let i = keepCount; i < entries.length; i++) {
        this.discardedMetrics.add(entries[i]);
      }
    }
  }

  /**
   * Send beacon for critical metrics before page unload
   */
  private sendBeacon(): void {
    if (this.metricsQueue.length === 0) return;

    // Suppress beacons in development to avoid 404s to /api/rum-beacon
    if (process.env.NODE_ENV !== 'production') {
      this.metricsQueue = [];
      return;
    }

    // Use sendBeacon for reliable delivery during page unload
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        metrics: this.metricsQueue,
        sessionInfo: this.currentSession
      });

      // In production, send to analytics endpoint
      navigator.sendBeacon('/api/rum-beacon', data);
    }

    this.metricsQueue = [];
  }

  /**
   * Update session information
   */
  private updateSession(pageId: string): void {
    if (!this.currentSession) return;

    this.currentSession.pageViews++;
    this.currentSession.currentPageId = pageId;
    
    try {
      sessionStorage.setItem('rum_session', JSON.stringify(this.currentSession));
    } catch (error) {
      performanceLogger.warn('monitoring', 'Failed to update RUM session', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: this.currentSession.sessionId,
        pageId
      });
    }
  }

  /**
   * Finalize session when page unloads
   */
  private finalizeSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.totalDuration = this.currentSession.endTime - this.currentSession.startTime;
    
    // Calculate bounce rate (single page view)
    this.currentSession.bounceRate = this.currentSession.pageViews === 1 ? 1 : 0;
  }

  /**
   * Get current session information
   */
  public getSessionInfo(): SessionInfo | null {
    return this.currentSession;
  }

  /**
   * Update RUM configuration
   */
  public updateConfig(newConfig: Partial<RUMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Enhanced destroy method with cleanup of tracking data
   */
  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.networkObserver) {
      this.networkObserver.disconnect();
      this.networkObserver = null;
    }

    // Send remaining metrics
    this.sendBeacon();

    // Clean up tracking data to prevent memory leaks
    this.retryTracking.clear();
    this.discardedMetrics.clear();
    this.pendingMetrics = [];
    this.metricsQueue = [];
    this.offlineQueue = [];
    this.currentUserId = null;

    performanceLogger.info('monitoring', 'RUM service destroyed and cleaned up', {
      sessionId: this.currentSession?.sessionId
    });
  }
}

// Global RUM service instance
let rumService: RUMService | null = null;

/**
 * Initialize the global RUM service
 */
export const initializeRUM = (config?: Partial<RUMConfig>): RUMService => {
  if (rumService) {
    rumService.destroy();
  }

  rumService = new RUMService(config);
  return rumService;
};

/**
 * Get the global RUM service instance
 */
export const getRUMService = (): RUMService | null => {
  return rumService;
};

/**
 * Collect metrics using the global RUM service
 */
export const collectRUMMetrics = (
  pageId: string,
  metrics: Partial<PerformanceMetrics>,
  userId?: string
): void => {
  if (rumService) {
    rumService.collectMetrics(pageId, metrics, userId);
  }
};

/**
 * Track user journey step using the global RUM service
 */
export const trackUserJourney = (stepName: string, metadata?: Record<string, any>): void => {
  if (rumService) {
    rumService.trackJourneyStep(stepName, metadata);
  }
};

/**
 * Add business metric using the global RUM service
 */
export const addRUMBusinessMetric = (key: string, value: any): void => {
  if (rumService) {
    rumService.addBusinessMetric(key, value);
  }
};

export default RUMService;