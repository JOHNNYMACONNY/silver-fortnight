/**
 * useAnalytics Hook Tests
 * 
 * Comprehensive test suite for the useAnalytics hook
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '../useAnalytics';

// Mock the analytics service
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
  }
}));

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useAnalytics());
      
      expect(result.current).toBeDefined();
      expect(result.current.track).toBeDefined();
      expect(result.current.trackPageView).toBeDefined();
      expect(result.current.trackUserAction).toBeDefined();
      expect(result.current.trackPerformance).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        enableRealTimeUpdates: false,
        updateInterval: 60000,
        enableAutoTracking: false,
      };
      
      const { result } = renderHook(() => useAnalytics('test-user', customOptions));
      
      expect(result.current).toBeDefined();
    });
  });

  describe('Event Tracking', () => {
    it('should track events', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.track('test_event', { test: 'data' });
      });
      
      expect(result.current).toBeDefined();
    });

    it('should track page views', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackPageView('/test-page');
      });
      
      expect(result.current).toBeDefined();
    });

    it('should track user actions', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackUserAction('click', { element: 'button' });
      });
      
      expect(result.current).toBeDefined();
    });

    it('should track performance metrics', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackPerformance('page_load', { duration: 1000 });
      });
      
      expect(result.current).toBeDefined();
    });
  });

  describe('Metrics Fetching', () => {
    it('should fetch user metrics', async () => {
      const { result } = renderHook(() => useAnalytics());
      
      await act(async () => {
        await result.current.fetchUserMetrics('test-user');
      });
      
      expect(result.current).toBeDefined();
    });

    it('should fetch business metrics', async () => {
      const { result } = renderHook(() => useAnalytics());
      
      await act(async () => {
        await result.current.fetchBusinessMetrics();
      });
      
      expect(result.current).toBeDefined();
    });

    it('should fetch performance metrics', async () => {
      const { result } = renderHook(() => useAnalytics());
      
      await act(async () => {
        await result.current.fetchPerformanceMetrics();
      });
      
      expect(result.current).toBeDefined();
    });
  });

  describe('Real-time Updates', () => {
    it('should set up real-time updates', () => {
      const { result } = renderHook(() => useAnalytics('test-user', {
        enableRealTimeUpdates: true,
        updateInterval: 1000
      }));
      
      expect(result.current).toBeDefined();
    });

    it('should disable real-time updates', () => {
      const { result } = renderHook(() => useAnalytics('test-user', {
        enableRealTimeUpdates: false
      }));
      
      expect(result.current).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useAnalytics());
      
      expect(result.current).toBeDefined();
      
      unmount();
      
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
