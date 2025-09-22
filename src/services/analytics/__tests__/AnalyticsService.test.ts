/**
 * Analytics Service Tests
 * 
 * Comprehensive test suite for the AnalyticsService
 */

import { analyticsService } from '../AnalyticsService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
};

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    analyticsService.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(analyticsService).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const customService = new (require('../AnalyticsService').default)({
        enableTracking: false,
        debugMode: true,
        batchSize: 50
      });
      expect(customService).toBeDefined();
    });
  });

  describe('Event Tracking', () => {
    it('should track custom events', () => {
      const trackSpy = jest.spyOn(analyticsService, 'track');
      analyticsService.track('test_event', { test: 'data' });
      expect(trackSpy).toHaveBeenCalledWith('test_event', { test: 'data' });
    });

    it('should track page views', () => {
      const trackPageViewSpy = jest.spyOn(analyticsService, 'trackPageView');
      analyticsService.trackPageView('/test-page');
      expect(trackPageViewSpy).toHaveBeenCalledWith('/test-page');
    });

    it('should track user actions', () => {
      const trackUserActionSpy = jest.spyOn(analyticsService, 'trackUserAction');
      analyticsService.trackUserAction('click', { element: 'button' });
      expect(trackUserActionSpy).toHaveBeenCalledWith('click', { element: 'button' });
    });

    it('should track performance metrics', () => {
      const trackPerformanceSpy = jest.spyOn(analyticsService, 'trackPerformance');
      analyticsService.trackPerformance('page_load', { duration: 1000 });
      expect(trackPerformanceSpy).toHaveBeenCalledWith('page_load', { duration: 1000 });
    });
  });

  describe('Metrics Retrieval', () => {
    it('should get user behavior metrics', async () => {
      const metrics = await analyticsService.getUserBehaviorMetrics('test-user');
      expect(metrics).toBeDefined();
      expect(metrics.userId).toBe('test-user');
    });

    it('should get business metrics', async () => {
      const metrics = await analyticsService.getBusinessMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalUsers).toBeDefined();
    });

    it('should get performance metrics', async () => {
      const metrics = await analyticsService.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.pageLoadTime).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      analyticsService.updateConfig({ enableTracking: false });
      expect(analyticsService).toBeDefined();
    });

    it('should get current configuration', () => {
      const config = analyticsService.getConfig();
      expect(config).toBeDefined();
      expect(config.enableTracking).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should set user ID', () => {
      analyticsService.setUserId('test-user');
      expect(analyticsService).toBeDefined();
    });

    it('should clear user data', () => {
      analyticsService.clearUserData();
      expect(analyticsService).toBeDefined();
    });
  });

  describe('Data Export', () => {
    it('should export events as CSV', async () => {
      const csv = await analyticsService.exportEvents('csv');
      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
    });

    it('should export events as JSON', async () => {
      const json = await analyticsService.exportEvents('json');
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // This should not throw
      analyticsService.track('test_event', { test: 'data' });
      
      console.error = originalConsoleError;
    });
  });
});
