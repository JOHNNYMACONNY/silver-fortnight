/**
 * Analytics Hook
 * 
 * React hook for analytics tracking and data fetching
 * with real-time updates and performance optimization.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsService } from '../services/analytics/AnalyticsService';

interface AnalyticsState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
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

interface UseAnalyticsOptions {
  enableRealTimeUpdates: boolean;
  updateInterval: number;
  enableAutoTracking: boolean;
  trackPageViews: boolean;
  trackUserActions: boolean;
  trackPerformance: boolean;
}

const DEFAULT_OPTIONS: UseAnalyticsOptions = {
  enableRealTimeUpdates: true,
  updateInterval: 30000, // 30 seconds
  enableAutoTracking: true,
  trackPageViews: true,
  trackUserActions: true,
  trackPerformance: true,
};

export function useAnalytics(userId?: string, options: Partial<UseAnalyticsOptions> = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [state, setState] = useState<AnalyticsState>({
    isLoading: false,
    error: null,
    lastUpdated: null,
  });
  
  const [userMetrics, setUserMetrics] = useState<UserBehaviorMetrics | null>(null);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  
  const updateTimerRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Track page view on mount
  useEffect(() => {
    if (config.trackPageViews) {
      analyticsService.trackPageView(window.location.pathname);
    }
  }, [config.trackPageViews]);

  // Set up real-time updates
  useEffect(() => {
    if (config.enableRealTimeUpdates && config.updateInterval > 0) {
      updateTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchAllMetrics();
        }
      }, config.updateInterval);
    }

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [config.enableRealTimeUpdates, config.updateInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, []);

  // Fetch user behavior metrics
  const fetchUserMetrics = useCallback(async (timeRange?: { start: Date; end: Date }) => {
    if (!userId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const defaultTimeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      };

      const metrics = await analyticsService.getUserBehaviorMetrics(userId, timeRange || defaultTimeRange);
      
      if (isMountedRef.current) {
        setUserMetrics(metrics);
        setState(prev => ({ ...prev, isLoading: false, lastUpdated: new Date() }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch user metrics' 
        }));
      }
    }
  }, [userId]);

  // Fetch business metrics
  const fetchBusinessMetrics = useCallback(async (timeRange?: { start: Date; end: Date }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const defaultTimeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      };

      const metrics = await analyticsService.getBusinessMetrics(timeRange || defaultTimeRange);
      
      if (isMountedRef.current) {
        setBusinessMetrics(metrics);
        setState(prev => ({ ...prev, isLoading: false, lastUpdated: new Date() }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch business metrics' 
        }));
      }
    }
  }, []);

  // Fetch performance metrics
  const fetchPerformanceMetrics = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const metrics = await analyticsService.getPerformanceMetrics();
      
      if (isMountedRef.current) {
        setPerformanceMetrics(metrics);
        setState(prev => ({ ...prev, isLoading: false, lastUpdated: new Date() }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch performance metrics' 
        }));
      }
    }
  }, []);

  // Fetch all metrics
  const fetchAllMetrics = useCallback(async (timeRange?: { start: Date; end: Date }) => {
    const promises = [];
    
    if (userId) {
      promises.push(fetchUserMetrics(timeRange));
    }
    promises.push(fetchBusinessMetrics(timeRange));
    promises.push(fetchPerformanceMetrics());

    await Promise.all(promises);
  }, [userId, fetchUserMetrics, fetchBusinessMetrics, fetchPerformanceMetrics]);

  // Track custom event
  const trackEvent = useCallback((eventName: string, properties: Record<string, any> = {}) => {
    if (config.enableAutoTracking) {
      analyticsService.track(eventName, properties);
    }
  }, [config.enableAutoTracking]);

  // Track user action
  const trackAction = useCallback((action: string, properties: Record<string, any> = {}) => {
    if (config.trackUserActions) {
      analyticsService.trackAction(action, properties);
    }
  }, [config.trackUserActions]);

  // Track trade event
  const trackTradeEvent = useCallback((eventType: 'created' | 'completed' | 'cancelled' | 'failed', tradeId: string, properties: Record<string, any> = {}) => {
    if (config.enableAutoTracking) {
      analyticsService.trackTradeEvent(eventType, tradeId, properties);
    }
  }, [config.enableAutoTracking]);

  // Track collaboration event
  const trackCollaborationEvent = useCallback((eventType: 'created' | 'joined' | 'completed' | 'left', collaborationId: string, properties: Record<string, any> = {}) => {
    if (config.enableAutoTracking) {
      analyticsService.trackCollaborationEvent(eventType, collaborationId, properties);
    }
  }, [config.enableAutoTracking]);

  // Export data
  const exportData = useCallback(async (format: 'json' | 'csv' | 'xlsx', timeRange?: { start: Date; end: Date }) => {
    const defaultTimeRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    };

    return await analyticsService.exportData(format, timeRange || defaultTimeRange);
  }, []);

  // Generate report
  const generateReport = useCallback(async (type: 'user' | 'business' | 'performance', timeRange?: { start: Date; end: Date }) => {
    const defaultTimeRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    };

    return await analyticsService.generateReport(type, timeRange || defaultTimeRange);
  }, []);

  // Set user ID
  const setUserId = useCallback((id: string) => {
    analyticsService.setUserId(id);
  }, []);

  return {
    // State
    ...state,
    userMetrics,
    businessMetrics,
    performanceMetrics,
    
    // Actions
    fetchUserMetrics,
    fetchBusinessMetrics,
    fetchPerformanceMetrics,
    fetchAllMetrics,
    trackEvent,
    trackAction,
    trackTradeEvent,
    trackCollaborationEvent,
    exportData,
    generateReport,
    setUserId,
  };
}

export default useAnalytics;

