/**
 * Advanced Analytics Service for TradeYa
 * 
 * Comprehensive analytics service providing business intelligence,
 * user behavior tracking, and performance monitoring capabilities.
 */

interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  pageUrl: string;
  userAgent: string;
  ipAddress?: string;
}

interface UserBehaviorMetrics {
  userId: string;
  sessionDuration: number;
  pageViews: number;
  interactions: number;
  bounceRate: number;
  conversionRate: number;
  lastActive: Date;
  totalSessions: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  topActions: Array<{ action: string; count: number }>;
}

interface BusinessMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  userRetentionRate: number;
  averageSessionDuration: number;
  totalTrades: number;
  completedTrades: number;
  tradeSuccessRate: number;
  totalRevenue: number;
  averageRevenuePerUser: number;
  topSkills: Array<{ skill: string; count: number; growth: number }>;
  topLocations: Array<{ location: string; users: number; growth: number }>;
  engagementScore: number;
  growthRate: number;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  bundleSize: number;
  cacheHitRate: number;
  errorRate: number;
  uptime: number;
}

interface AnalyticsConfig {
  enableTracking: boolean;
  enablePersonalization: boolean;
  enableABTesting: boolean;
  enableHeatmaps: boolean;
  enableSessionRecording: boolean;
  dataRetentionDays: number;
  batchSize: number;
  flushInterval: number;
  debugMode: boolean;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enableTracking: true,
  enablePersonalization: true,
  enableABTesting: false,
  enableHeatmaps: false,
  enableSessionRecording: false,
  dataRetentionDays: 365,
  batchSize: 100,
  flushInterval: 30000, // 30 seconds
  debugMode: false,
};

class AnalyticsService {
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isInitialized: boolean = false;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize the analytics service
   */
  private async initialize(): Promise<void> {
    try {
      console.log('[Analytics] Initializing analytics service...');
      
      // Load user session
      await this.loadUserSession();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start batch processing
      this.startBatchProcessing();
      
      this.isInitialized = true;
      console.log('[Analytics] Analytics service initialized successfully');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.config.enableTracking) return;

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      userId: this.userId,
      eventType: 'custom',
      eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.events.push(event);
    this.logEvent(event);
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, properties: Record<string, any> = {}): void {
    this.track('page_view', {
      page_name: pageName,
      page_url: window.location.href,
      referrer: document.referrer,
      ...properties,
    });
  }

  /**
   * Track user action
   */
  trackAction(action: string, properties: Record<string, any> = {}): void {
    this.track('user_action', {
      action,
      ...properties,
    });
  }

  /**
   * Track trade event
   */
  trackTradeEvent(eventType: 'created' | 'completed' | 'cancelled' | 'failed', tradeId: string, properties: Record<string, any> = {}): void {
    this.track('trade_event', {
      event_type: eventType,
      trade_id: tradeId,
      ...properties,
    });
  }

  /**
   * Track collaboration event
   */
  trackCollaborationEvent(eventType: 'created' | 'joined' | 'completed' | 'left', collaborationId: string, properties: Record<string, any> = {}): void {
    this.track('collaboration_event', {
      event_type: eventType,
      collaboration_id: collaborationId,
      ...properties,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: Partial<PerformanceMetrics>): void {
    this.track('performance_metrics', {
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.track('user_identified', { user_id: userId });
  }

  /**
   * Get user behavior metrics
   */
  async getUserBehaviorMetrics(userId: string, timeRange: { start: Date; end: Date }): Promise<UserBehaviorMetrics> {
    // Mock implementation - in production, this would query the database
    const mockMetrics: UserBehaviorMetrics = {
      userId,
      sessionDuration: Math.random() * 3600, // 0-1 hour
      pageViews: Math.floor(Math.random() * 50) + 10,
      interactions: Math.floor(Math.random() * 200) + 50,
      bounceRate: Math.random() * 0.5 + 0.1, // 10-60%
      conversionRate: Math.random() * 0.3 + 0.05, // 5-35%
      lastActive: new Date(),
      totalSessions: Math.floor(Math.random() * 20) + 1,
      averageSessionDuration: Math.random() * 1800 + 300, // 5-35 minutes
      topPages: [
        { page: '/dashboard', views: Math.floor(Math.random() * 100) + 50 },
        { page: '/trades', views: Math.floor(Math.random() * 80) + 30 },
        { page: '/profile', views: Math.floor(Math.random() * 60) + 20 },
      ],
      topActions: [
        { action: 'view_trade', count: Math.floor(Math.random() * 50) + 20 },
        { action: 'create_trade', count: Math.floor(Math.random() * 20) + 5 },
        { action: 'send_message', count: Math.floor(Math.random() * 30) + 10 },
      ],
    };

    return mockMetrics;
  }

  /**
   * Get business metrics
   */
  async getBusinessMetrics(timeRange: { start: Date; end: Date }): Promise<BusinessMetrics> {
    // Mock implementation - in production, this would query the database
    const mockMetrics: BusinessMetrics = {
      totalUsers: Math.floor(Math.random() * 10000) + 5000,
      activeUsers: Math.floor(Math.random() * 5000) + 2000,
      newUsers: Math.floor(Math.random() * 500) + 100,
      returningUsers: Math.floor(Math.random() * 2000) + 1000,
      userRetentionRate: Math.random() * 0.4 + 0.3, // 30-70%
      averageSessionDuration: Math.random() * 1800 + 600, // 10-40 minutes
      totalTrades: Math.floor(Math.random() * 5000) + 1000,
      completedTrades: Math.floor(Math.random() * 4000) + 800,
      tradeSuccessRate: Math.random() * 0.3 + 0.6, // 60-90%
      totalRevenue: Math.random() * 100000 + 50000,
      averageRevenuePerUser: Math.random() * 50 + 25,
      topSkills: [
        { skill: 'Web Development', count: Math.floor(Math.random() * 1000) + 500, growth: Math.random() * 0.5 + 0.1 },
        { skill: 'Graphic Design', count: Math.floor(Math.random() * 800) + 400, growth: Math.random() * 0.4 + 0.05 },
        { skill: 'Mobile Development', count: Math.floor(Math.random() * 600) + 300, growth: Math.random() * 0.6 + 0.2 },
      ],
      topLocations: [
        { location: 'San Francisco', users: Math.floor(Math.random() * 1000) + 500, growth: Math.random() * 0.3 + 0.1 },
        { location: 'New York', users: Math.floor(Math.random() * 800) + 400, growth: Math.random() * 0.4 + 0.05 },
        { location: 'London', users: Math.floor(Math.random() * 600) + 300, growth: Math.random() * 0.5 + 0.15 },
      ],
      engagementScore: Math.random() * 40 + 60, // 60-100
      growthRate: Math.random() * 0.5 + 0.1, // 10-60%
    };

    return mockMetrics;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Mock implementation - in production, this would query performance data
    const mockMetrics: PerformanceMetrics = {
      pageLoadTime: Math.random() * 2000 + 500, // 500-2500ms
      timeToInteractive: Math.random() * 3000 + 1000, // 1-4s
      firstContentfulPaint: Math.random() * 1500 + 300, // 300-1800ms
      largestContentfulPaint: Math.random() * 2500 + 800, // 800-3300ms
      cumulativeLayoutShift: Math.random() * 0.1 + 0.01, // 0.01-0.11
      firstInputDelay: Math.random() * 100 + 10, // 10-110ms
      totalBlockingTime: Math.random() * 200 + 50, // 50-250ms
      bundleSize: Math.random() * 500000 + 100000, // 100KB-600KB
      cacheHitRate: Math.random() * 0.3 + 0.7, // 70-100%
      errorRate: Math.random() * 0.05 + 0.001, // 0.1-5%
      uptime: Math.random() * 0.05 + 0.95, // 95-100%
    };

    return mockMetrics;
  }

  /**
   * Generate analytics report
   */
  async generateReport(type: 'user' | 'business' | 'performance', timeRange: { start: Date; end: Date }): Promise<any> {
    switch (type) {
      case 'user':
        return this.getUserBehaviorMetrics(this.userId || '', timeRange);
      case 'business':
        return this.getBusinessMetrics(timeRange);
      case 'performance':
        return this.getPerformanceMetrics();
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  /**
   * Export analytics data
   */
  async exportData(format: 'json' | 'csv' | 'xlsx', timeRange: { start: Date; end: Date }): Promise<Blob> {
    const data = this.events.filter(event => 
      event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
    );

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      case 'csv':
        const csv = this.convertToCSV(data);
        return new Blob([csv], { type: 'text/csv' });
      case 'xlsx':
        // In production, this would use a library like xlsx
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('page_visibility_change', {
        hidden: document.hidden,
        visibility_state: document.visibilityState,
      });
    });

    // Track unload events
    window.addEventListener('beforeunload', () => {
      this.track('page_unload', {
        page_url: window.location.href,
        time_on_page: Date.now() - (window as any).pageLoadTime,
      });
    });

    // Track performance metrics
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.trackPerformanceMetrics();
        }, 1000);
      });
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformanceMetrics(): void {
    if (!('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const metrics: Partial<PerformanceMetrics> = {
      pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
      timeToInteractive: navigation.domInteractive - navigation.navigationStart,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: paint.find(p => p.name === 'largest-contentful-paint')?.startTime || 0,
    };

    this.trackPerformance(metrics);
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  /**
   * Flush events to server
   */
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      // In production, this would send to analytics server
      console.log(`[Analytics] Flushing ${this.events.length} events`);
      
      // Clear processed events
      this.events = [];
    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
    }
  }

  /**
   * Load user session
   */
  private async loadUserSession(): Promise<void> {
    // In production, this would load from localStorage or server
    const savedUserId = localStorage.getItem('analytics_user_id');
    if (savedUserId) {
      this.userId = savedUserId;
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log event (for debugging)
   */
  private logEvent(event: AnalyticsEvent): void {
    if (this.config.debugMode) {
      console.log('[Analytics] Event tracked:', event);
    }
  }

  /**
   * Convert data to CSV
   */
  private convertToCSV(data: AnalyticsEvent[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header as keyof AnalyticsEvent])).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushEvents();
  }
}

export const analyticsService = new AnalyticsService();
export default AnalyticsService;

