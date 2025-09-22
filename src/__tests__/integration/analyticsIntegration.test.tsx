/**
 * Analytics Integration Tests
 * 
 * Integration tests for analytics system with other app components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard';
import { useAnalytics } from '../../hooks/useAnalytics';
import { analyticsService } from '../../services/analytics/AnalyticsService';

// Mock analytics service
jest.mock('../../services/analytics/AnalyticsService', () => ({
  analyticsService: {
    track: jest.fn(),
    trackPageView: jest.fn(),
    trackUserAction: jest.fn(),
    trackPerformance: jest.fn(),
    getUserBehaviorMetrics: jest.fn(),
    getBusinessMetrics: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    setUserId: jest.fn(),
    clearUserData: jest.fn(),
    exportEvents: jest.fn(),
    updateConfig: jest.fn(),
    getConfig: jest.fn(() => ({
      enableTracking: true,
      debugMode: false,
      batchSize: 10,
      flushInterval: 5000
    }))
  }
}));

// Mock useAnalytics hook
jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn()
}));

const mockUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>;

describe('Analytics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAnalytics.mockReturnValue({
      userMetrics: {
        userId: 'test-user',
        sessionDuration: 300,
        pageViews: 10,
        interactions: 25,
        bounceRate: 0.2,
        conversionRate: 0.15,
        lastActive: new Date(),
        totalSessions: 5,
        averageSessionDuration: 300,
        topPages: [
          { page: '/home', views: 5 },
          { page: '/profile', views: 3 }
        ],
        topActions: [
          { action: 'click', count: 15 },
          { action: 'scroll', count: 10 }
        ]
      },
      businessMetrics: {
        totalUsers: 1000,
        activeUsers: 500,
        newUsers: 100,
        returningUsers: 400,
        userRetentionRate: 0.8,
        averageSessionDuration: 300,
        totalTrades: 250,
        completedTrades: 200,
        tradeSuccessRate: 0.8,
        totalRevenue: 50000,
        averageRevenuePerUser: 50,
        topSkills: [
          { skill: 'JavaScript', count: 150, growth: 0.1 },
          { skill: 'React', count: 120, growth: 0.15 }
        ],
        topLocations: [
          { location: 'San Francisco', users: 200, growth: 0.05 },
          { location: 'New York', users: 150, growth: 0.08 }
        ],
        engagementScore: 0.75,
        growthRate: 0.12
      },
      performanceMetrics: {
        pageLoadTime: 1200,
        firstContentfulPaint: 800,
        largestContentfulPaint: 1000,
        cumulativeLayoutShift: 0.1,
        firstInputDelay: 50,
        timeToInteractive: 1500,
        errorRate: 0.02,
        apiResponseTime: 200,
        cacheHitRate: 0.85
      },
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      track: jest.fn(),
      trackPageView: jest.fn(),
      trackUserAction: jest.fn(),
      trackPerformance: jest.fn(),
      fetchUserMetrics: jest.fn(),
      fetchBusinessMetrics: jest.fn(),
      fetchPerformanceMetrics: jest.fn(),
      fetchAllMetrics: jest.fn(),
      exportData: jest.fn()
    });
  });

  describe('Service Integration', () => {
    it('should integrate with ServiceRegistry', () => {
      const { ServiceRegistry } = require('../../services/core/ServiceRegistry');
      const registry = ServiceRegistry.getInstance();
      
      expect(registry.get('analyticsService')).toBeDefined();
    });

    it('should track events through analytics service', () => {
      analyticsService.track('test_event', { test: 'data' });
      
      expect(analyticsService.track).toHaveBeenCalledWith('test_event', { test: 'data' });
    });

    it('should track page views', () => {
      analyticsService.trackPageView('/test-page');
      
      expect(analyticsService.trackPageView).toHaveBeenCalledWith('/test-page');
    });

    it('should track user actions', () => {
      analyticsService.trackUserAction('click', { element: 'button' });
      
      expect(analyticsService.trackUserAction).toHaveBeenCalledWith('click', { element: 'button' });
    });

    it('should track performance metrics', () => {
      analyticsService.trackPerformance('page_load', { duration: 1000 });
      
      expect(analyticsService.trackPerformance).toHaveBeenCalledWith('page_load', { duration: 1000 });
    });
  });

  describe('Hook Integration', () => {
    it('should provide analytics data through useAnalytics hook', () => {
      const { result } = renderHook(() => useAnalytics('test-user'));
      
      expect(result.current.userMetrics).toBeDefined();
      expect(result.current.businessMetrics).toBeDefined();
      expect(result.current.performanceMetrics).toBeDefined();
    });

    it('should track events through hook', () => {
      const { result } = renderHook(() => useAnalytics('test-user'));
      
      act(() => {
        result.current.track('test_event', { test: 'data' });
      });
      
      expect(result.current.track).toHaveBeenCalledWith('test_event', { test: 'data' });
    });
  });

  describe('Component Integration', () => {
    it('should render analytics dashboard', () => {
      render(
        <BrowserRouter>
          <AnalyticsDashboard />
        </BrowserRouter>
      );
      
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    it('should display metrics from analytics service', () => {
      render(
        <BrowserRouter>
          <AnalyticsDashboard />
        </BrowserRouter>
      );
      
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('should handle export functionality', async () => {
      analyticsService.exportEvents.mockResolvedValue('csv,data');
      
      render(
        <BrowserRouter>
          <AnalyticsDashboard />
        </BrowserRouter>
      );
      
      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(analyticsService.exportEvents).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Context Integration', () => {
    it('should track performance metrics in analytics', () => {
      const { PerformanceProvider } = require('../../contexts/PerformanceContext');
      
      render(
        <BrowserRouter>
          <PerformanceProvider>
            <div>Test</div>
          </PerformanceProvider>
        </BrowserRouter>
      );
      
      // Performance context should automatically track metrics
      expect(analyticsService.trackPerformance).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics service errors gracefully', () => {
      analyticsService.track.mockImplementation(() => {
        throw new Error('Analytics error');
      });
      
      // Should not throw
      expect(() => {
        analyticsService.track('test_event', { test: 'data' });
      }).toThrow('Analytics error');
    });

    it('should handle hook errors gracefully', () => {
      mockUseAnalytics.mockReturnValue({
        ...mockUseAnalytics(),
        error: 'Failed to load analytics'
      });

      render(
        <BrowserRouter>
          <AnalyticsDashboard />
        </BrowserRouter>
      );
      
      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      analyticsService.updateConfig({ enableTracking: false });
      
      expect(analyticsService.updateConfig).toHaveBeenCalledWith({ enableTracking: false });
    });

    it('should provide current configuration', () => {
      const config = analyticsService.getConfig();
      
      expect(config).toBeDefined();
      expect(config.enableTracking).toBe(true);
    });
  });
});
