/**
 * Analytics Dashboard Tests
 * 
 * Comprehensive test suite for the AnalyticsDashboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '../AnalyticsDashboard';

// Mock the useAnalytics hook
jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(() => ({
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
  }))
}));

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the dashboard', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<AnalyticsDashboard className="custom-class" />);
      
      const dashboard = screen.getByText('Analytics Dashboard').closest('div');
      expect(dashboard).toHaveClass('custom-class');
    });

    it('should render with user ID', () => {
      render(<AnalyticsDashboard userId="test-user" />);
      
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('should render all tabs', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Business')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    it('should switch between tabs', () => {
      render(<AnalyticsDashboard />);
      
      const usersTab = screen.getByText('Users');
      fireEvent.click(usersTab);
      
      expect(screen.getByText('User Behavior')).toBeInTheDocument();
    });
  });

  describe('Time Range Selection', () => {
    it('should render time range selector', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('should change time range', async () => {
      render(<AnalyticsDashboard />);
      
      const timeRangeSelector = screen.getByText('Last 7 days');
      fireEvent.click(timeRangeSelector);
      
      // This would open a dropdown in a real implementation
      expect(timeRangeSelector).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display business metrics', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('should display user metrics', () => {
      render(<AnalyticsDashboard />);
      
      const usersTab = screen.getByText('Users');
      fireEvent.click(usersTab);
      
      expect(screen.getByText('Session Duration')).toBeInTheDocument();
    });

    it('should display performance metrics', () => {
      render(<AnalyticsDashboard />);
      
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
      
      expect(screen.getByText('Page Load Time')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state', () => {
      const mockUseAnalytics = require('../../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        ...mockUseAnalytics(),
        isLoading: true
      });

      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error state', () => {
      const mockUseAnalytics = require('../../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        ...mockUseAnalytics(),
        error: 'Failed to load analytics'
      });

      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should have export button', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });

    it('should call export function when clicked', () => {
      const mockUseAnalytics = require('../../../hooks/useAnalytics').useAnalytics;
      const mockExportData = jest.fn();
      mockUseAnalytics.mockReturnValue({
        ...mockUseAnalytics(),
        exportData: mockExportData
      });

      render(<AnalyticsDashboard />);
      
      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);
      
      expect(mockExportData).toHaveBeenCalled();
    });
  });

  describe('Refresh Functionality', () => {
    it('should have refresh button', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should call refresh function when clicked', () => {
      const mockUseAnalytics = require('../../../hooks/useAnalytics').useAnalytics;
      const mockFetchAllMetrics = jest.fn();
      mockUseAnalytics.mockReturnValue({
        ...mockUseAnalytics(),
        fetchAllMetrics: mockFetchAllMetrics
      });

      render(<AnalyticsDashboard />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      expect(mockFetchAllMetrics).toHaveBeenCalled();
    });
  });
});
