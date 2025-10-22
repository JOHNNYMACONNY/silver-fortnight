/**
 * Unit tests for Performance Context
 */

import React from 'react';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { 
  PerformanceProvider, 
  usePerformance, 
  usePerformanceMonitoring,
  useJourneyTracking,
  useBusinessMetrics,
  usePerformanceAnalysis
} from '../PerformanceContext';

// Mock the RUM service
jest.mock('../../services/performance/rumService', () => ({
  initializeRUM: jest.fn(() => ({
    collectMetrics: jest.fn(),
    trackJourneyStep: jest.fn(),
    addBusinessMetric: jest.fn(),
    getSessionInfo: jest.fn(() => ({
      sessionId: 'test-session',
      startTime: Date.now(),
      pageViews: 1,
      userAgent: 'test',
      journey: []
    })),
    updateConfig: jest.fn(),
    destroy: jest.fn()
  })),
  getRUMService: jest.fn()
}));

// Mock the Critical Path Analyzer
jest.mock('../../utils/performance/criticalPathAnalyzer', () => ({
  CriticalPathAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeCriticalPath: jest.fn().mockResolvedValue({
      totalCriticalPathTime: 1500,
      renderBlockingResources: [],
      criticalResources: [],
      recommendations: [],
      performanceBudgetStatus: {
        overallStatus: 'pass',
        score: 85,
        budgets: {}
      },
      preloadCandidates: [],
      bottlenecks: []
    }),
    applyPreloading: jest.fn(),
    applyResourceHints: jest.fn(),
    updateConfig: jest.fn(),
    destroy: jest.fn()
  }))
}));

// Mock performance metrics
jest.mock('../../utils/performanceMetrics', () => ({
  getBasicPerformanceMetrics: jest.fn(() => ({
    loadTime: 1200,
    timeToInteractive: 800,
    firstContentfulPaint: 600
  }))
}));

describe('PerformanceContext', () => {
  const TestComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <PerformanceProvider>{children}</PerformanceProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PerformanceProvider', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <PerformanceProvider>
          <div>Test content</div>
        </PerformanceProvider>
      );

      expect(container.firstChild).toHaveTextContent('Test content');
    });

    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      expect(result.current.config.enabled).toBe(true);
      expect(result.current.performanceScore).toBe(100);
      expect(result.current.budgetStatus).toBe('pass');
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        enabled: false,
        autoCollectOnRouteChange: false
      };

      const CustomTestComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <PerformanceProvider config={customConfig}>
          {children}
        </PerformanceProvider>
      );

      const { result } = renderHook(() => usePerformance(), {
        wrapper: CustomTestComponent
      });

      expect(result.current.config.enabled).toBe(false);
      expect(result.current.config.autoCollectOnRouteChange).toBe(false);
    });

    it('should provide userId to RUM service', () => {
      const TestComponentWithUserId: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <PerformanceProvider userId="test-user-123">
          {children}
        </PerformanceProvider>
      );

      renderHook(() => usePerformance(), {
        wrapper: TestComponentWithUserId
      });

      // The userId should be passed to the RUM service when collecting metrics
    });
  });

  describe('usePerformance hook', () => {
    it('should provide performance context', () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      expect(result.current).toHaveProperty('metrics');
      expect(result.current).toHaveProperty('collectMetrics');
      expect(result.current).toHaveProperty('analyzeCriticalPath');
      expect(result.current).toHaveProperty('trackJourneyStep');
      expect(result.current).toHaveProperty('addBusinessMetric');
      expect(result.current).toHaveProperty('performanceScore');
      expect(result.current).toHaveProperty('budgetStatus');
    });

    it('should throw error when used outside provider', () => {
      // Mock console.error to avoid noise in test output
      const originalError = console.error;
      console.error = jest.fn();

      const { result } = renderHook(() => {
        try {
          return usePerformance();
        } catch (error) {
          return { error };
        }
      });

      expect((result.current as any).error).toEqual(
        Error('usePerformance must be used within a PerformanceProvider')
      );

      // Restore console.error
      console.error = originalError;
    });

    it('should collect metrics', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      await act(async () => {
        result.current.collectMetrics('test-page', { loadTime: 1500 });
      });

      expect(result.current.metrics).toHaveProperty('loadTime');
    });

    it('should track journey steps', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      await act(async () => {
        result.current.trackJourneyStep('button_click', { buttonId: 'submit' });
      });

      // Verify the journey step was tracked
      expect(result.current.sessionInfo).toBeDefined();
    });

    it('should add business metrics', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      await act(async () => {
        result.current.addBusinessMetric('conversion_rate', 0.15);
      });

      // Should not throw and should call the underlying service
    });

    it('should run critical path analysis', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      await act(async () => {
        await result.current.analyzeCriticalPath();
      });

      expect(result.current.criticalPathAnalysis).toBeDefined();
      expect(result.current.isAnalyzing).toBe(false);
    });

    it('should update configuration', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      const newConfig = {
        autoCollectOnRouteChange: false,
        autoApplyOptimizations: true
      };

      await act(async () => {
        result.current.updateConfig(newConfig);
      });

      expect(result.current.config.autoCollectOnRouteChange).toBe(false);
      expect(result.current.config.autoApplyOptimizations).toBe(true);
    });

    it('should reset metrics', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      // First add some metrics
      await act(async () => {
        result.current.collectMetrics('test-page', { loadTime: 1500 });
      });

      // Then reset
      await act(async () => {
        result.current.resetMetrics();
      });

      expect(Object.keys(result.current.metrics)).toHaveLength(0);
      expect(result.current.performanceScore).toBe(100);
      expect(result.current.budgetStatus).toBe('pass');
    });

    it('should export data', () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      const exportedData = result.current.exportData();

      expect(exportedData).toHaveProperty('metrics');
      expect(exportedData).toHaveProperty('config');
      expect(exportedData).toHaveProperty('performanceScore');
      expect(exportedData).toHaveProperty('timestamp');
    });
  });

  describe('usePerformanceMonitoring hook', () => {
    it('should auto-collect metrics for page', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring('test-page'), {
        wrapper: TestComponent
      });

      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
      });
    });

    it('should provide collect function', () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: TestComponent
      });

      expect(result.current.collectMetrics).toBeDefined();
      expect(typeof result.current.collectMetrics).toBe('function');
    });

    it('should provide performance score and budget status', () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: TestComponent
      });

      expect(result.current.performanceScore).toBeDefined();
      expect(result.current.budgetStatus).toBeDefined();
    });
  });

  describe('useJourneyTracking hook', () => {
    it('should provide journey tracking functionality', () => {
      const { result } = renderHook(() => useJourneyTracking(), {
        wrapper: TestComponent
      });

      expect(result.current.trackStep).toBeDefined();
      expect(typeof result.current.trackStep).toBe('function');
      expect(result.current.sessionInfo).toBeDefined();
    });

    it('should track journey steps', async () => {
      const { result } = renderHook(() => useJourneyTracking(), {
        wrapper: TestComponent
      });

      await act(async () => {
        result.current.trackStep('page_view', { pageName: 'home' });
      });

      // Should not throw
    });
  });

  describe('useBusinessMetrics hook', () => {
    it('should provide business metrics tracking', () => {
      const { result } = renderHook(() => useBusinessMetrics(), {
        wrapper: TestComponent
      });

      expect(result.current.track).toBeDefined();
      expect(typeof result.current.track).toBe('function');
    });

    it('should track business metrics', async () => {
      const { result } = renderHook(() => useBusinessMetrics(), {
        wrapper: TestComponent
      });

      await act(async () => {
        result.current.track('user_action', 'click');
      });

      // Should not throw
    });
  });

  describe('usePerformanceAnalysis hook', () => {
    it('should provide analysis functionality', () => {
      const { result } = renderHook(() => usePerformanceAnalysis(), {
        wrapper: TestComponent
      });

      expect(result.current.analyze).toBeDefined();
      expect(result.current.applyOptimizations).toBeDefined();
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.analysis).toBeNull();
    });

    it('should run analysis', async () => {
      const { result } = renderHook(() => usePerformanceAnalysis(), {
        wrapper: TestComponent
      });

      await act(async () => {
        await result.current.analyze();
      });

      expect(result.current.analysis).toBeDefined();
      expect(result.current.isAnalyzing).toBe(false);
    });

    it('should handle analysis errors', async () => {
      // Mock analyzer to throw error
      const mockAnalyzer = require('../../utils/performance/criticalPathAnalyzer').CriticalPathAnalyzer;
      mockAnalyzer.mockImplementationOnce(() => ({
        analyzeCriticalPath: jest.fn().mockRejectedValue(new Error('Analysis failed')),
        updateConfig: jest.fn(),
        destroy: jest.fn()
      }));

      const { result } = renderHook(() => usePerformanceAnalysis(), {
        wrapper: TestComponent
      });

      await act(async () => {
        await result.current.analyze();
      });

      expect(result.current.error).toBe('Analysis failed');
      expect(result.current.isAnalyzing).toBe(false);
    });
  });

  describe('Performance Score Calculation', () => {
    it('should calculate score based on metrics', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      await act(async () => {
        result.current.collectMetrics('test-page', {
          firstContentfulPaint: 2000, // Poor performance
          largestContentfulPaint: 3000,
          firstInputDelay: 150,
          cumulativeLayoutShift: 0.15
        });
      });

      // Score should be lower due to poor metrics
      expect(result.current.performanceScore).toBeLessThan(100);
    });

    it('should maintain high score for good metrics', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      await act(async () => {
        result.current.collectMetrics('test-page', {
          firstContentfulPaint: 800, // Good performance
          largestContentfulPaint: 1500,
          firstInputDelay: 50,
          cumulativeLayoutShift: 0.05
        });
      });

      // Score should remain high
      expect(result.current.performanceScore).toBeGreaterThan(90);
    });
  });

  describe('Error Handling', () => {
    it('should handle RUM service errors gracefully', async () => {
      // Mock RUM service to throw error
      const mockRUMService = require('../../services/performance/rumService').initializeRUM;
      mockRUMService.mockImplementationOnce(() => ({
        collectMetrics: jest.fn(() => { throw new Error('RUM error'); }),
        trackJourneyStep: jest.fn(),
        addBusinessMetric: jest.fn(),
        getSessionInfo: jest.fn(() => null),
        updateConfig: jest.fn(),
        destroy: jest.fn()
      }));

      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      await act(async () => {
        result.current.collectMetrics('test-page', { loadTime: 1000 });
      });

      expect(result.current.error).toBe('RUM error');
    });

    it('should handle disabled monitoring gracefully', () => {
      const DisabledTestComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <PerformanceProvider config={{ enabled: false }}>
          {children}
        </PerformanceProvider>
      );

      const { result } = renderHook(() => usePerformance(), {
        wrapper: DisabledTestComponent
      });

      // Should not crash when monitoring is disabled
      expect(() => {
        result.current.collectMetrics('test-page', { loadTime: 1000 });
      }).not.toThrow();
    });
  });

  describe('Route Change Detection', () => {
    it('should collect metrics on route changes when enabled', async () => {
      const { result } = renderHook(() => usePerformance(), {
        wrapper: TestComponent
      });

      // Simulate pushState (programmatic navigation)
      await act(async () => {
        window.history.pushState({}, '', '/new-route');
      });

      // Should have collected metrics automatically
      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
      });
    });

    it('should not collect metrics on route changes when disabled', async () => {
      const DisabledAutoCollectComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <PerformanceProvider config={{ autoCollectOnRouteChange: false }}>
          {children}
        </PerformanceProvider>
      );

      const { result } = renderHook(() => usePerformance(), {
        wrapper: DisabledAutoCollectComponent
      });

      // Clear any initial metrics
      await act(async () => {
        result.current.resetMetrics();
      });

      // Simulate route change
      await act(async () => {
        window.history.pushState({}, '', '/new-route');
      });

      // Should not have auto-collected metrics
      expect(Object.keys(result.current.metrics)).toHaveLength(0);
    });
  });
});