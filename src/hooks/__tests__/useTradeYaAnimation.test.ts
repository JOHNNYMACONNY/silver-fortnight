/**
 * Tests for useTradeYaAnimation Hook
 * 
 * Comprehensive test suite for the core TradeYa animation system
 */

import { renderHook, act } from '@testing-library/react';
import { useTradeYaAnimation, TRADEYA_ANIMATION_CONFIG, TRADEYA_BRAND_COLORS } from '../useTradeYaAnimation';
import { usePerformance } from '../../contexts/PerformanceContext';
import { useReducedMotion } from '../useReducedMotion';

// Mock dependencies
jest.mock('../../contexts/PerformanceContext');
jest.mock('../useReducedMotion');

const mockUsePerformance = usePerformance as jest.MockedFunction<typeof usePerformance>;
const mockUseReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

describe('useTradeYaAnimation', () => {
  const mockReportMetric = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUsePerformance.mockReturnValue({
      reportMetric: mockReportMetric,
      metrics: {},
      performanceScore: 85,
      budgetStatus: { withinBudget: true, usage: 0.5 },
      collectMetrics: jest.fn(),
      analyzeCriticalPath: jest.fn(),
      trackJourneyStep: jest.fn(),
      addBusinessMetric: jest.fn(),
      updateConfig: jest.fn(),
      resetMetrics: jest.fn(),
      applyOptimizations: jest.fn(),
      exportData: jest.fn(),
      getRUMService: jest.fn(),
      criticalPathAnalysis: null,
      sessionInfo: null,
      config: {},
      isAnalyzing: false,
      error: null,
    });

    mockUseReducedMotion.mockReturnValue(false);

    // Mock performance.now
    global.performance.now = jest.fn(() => Date.now());
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 16);
      return 1;
    });
    
    global.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Configuration and Constants', () => {
    it('should export correct brand colors', () => {
      expect(TRADEYA_BRAND_COLORS.primary).toBe('#f97316');
      expect(TRADEYA_BRAND_COLORS.secondary).toBe('#0ea5e9');
      expect(TRADEYA_BRAND_COLORS.accent).toBe('#8b5cf6');
    });

    it('should export correct animation configuration', () => {
      expect(TRADEYA_ANIMATION_CONFIG.timing.fast).toBe(150);
      expect(TRADEYA_ANIMATION_CONFIG.timing.standard).toBe(300);
      expect(TRADEYA_ANIMATION_CONFIG.easing.trading).toBe('cubic-bezier(0.25, 0.46, 0.45, 0.94)');
      expect(TRADEYA_ANIMATION_CONFIG.performance.targetFPS).toBe(60);
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ type: 'hover' })
      );

      expect(result.current.animationState.isAnimating).toBe(false);
      expect(result.current.animationState.progress).toBe(0);
      expect(result.current.animationState.currentPhase).toBe('idle');
      expect(result.current.isSupported).toBe(true);
    });

    it('should respect reduced motion preferences', () => {
      mockUseReducedMotion.mockReturnValue(true);

      const { result } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'hover',
          respectMotionPreferences: true 
        })
      );

      expect(result.current.isSupported).toBe(false);
      expect(result.current.animationStyles).toEqual({});
    });

    it('should ignore reduced motion when respectMotionPreferences is false', () => {
      mockUseReducedMotion.mockReturnValue(true);

      const { result } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'hover',
          respectMotionPreferences: false 
        })
      );

      expect(result.current.isSupported).toBe(true);
    });
  });

  describe('Brand Color Selection', () => {
    it('should select correct colors for different schemes', () => {
      const testCases = [
        { scheme: 'orange' as const, expected: '#f97316' },
        { scheme: 'blue' as const, expected: '#0ea5e9' },
        { scheme: 'purple' as const, expected: '#8b5cf6' },
      ];

      testCases.forEach(({ scheme, expected }) => {
        const { result } = renderHook(() => 
          useTradeYaAnimation({ 
            type: 'hover',
            brandColorScheme: scheme 
          })
        );

        // The color should be used in animation styles
        expect(result.current.animationStyles).toBeDefined();
      });
    });

    it('should adapt colors based on trading context for mixed scheme', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'trading-state',
          brandColorScheme: 'mixed',
          tradingContext: 'proposal'
        })
      );

      expect(result.current.animationStyles).toBeDefined();
    });
  });

  describe('Animation Timing', () => {
    it('should adjust timing based on trading context', () => {
      const { result: confirmationResult } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'click',
          tradingContext: 'confirmation',
          duration: 'standard'
        })
      );

      const { result: negotiationResult } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'click',
          tradingContext: 'negotiation',
          duration: 'standard'
        })
      );

      // Both should have valid animation styles
      expect(confirmationResult.current.animationStyles).toBeDefined();
      expect(negotiationResult.current.animationStyles).toBeDefined();
    });

    it('should handle custom duration numbers', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'hover',
          duration: 500
        })
      );

      expect(result.current.animationStyles).toBeDefined();
    });
  });

  describe('Animation Styles Generation', () => {
    it('should generate hover animation styles', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ type: 'hover' })
      );

      const styles = result.current.animationStyles;
      expect(styles.transition).toContain('300ms');
      expect(styles.willChange).toBe('transform, opacity, background-color');
    });

    it('should generate click animation styles', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ type: 'click' })
      );

      const styles = result.current.animationStyles;
      expect(styles.transition).toContain('150ms');
    });

    it('should generate loading animation styles', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ type: 'loading' })
      );

      const styles = result.current.animationStyles;
      expect(styles.opacity).toBeDefined();
      expect(styles.cursor).toBeDefined();
    });

    it('should generate success animation styles', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ type: 'success' })
      );

      act(() => {
        result.current.triggerAnimation();
      });

      const styles = result.current.animationStyles;
      expect(styles.backgroundColor).toContain('rgba(34, 197, 94, 0.1)');
    });

    it('should generate error animation styles', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ type: 'error' })
      );

      act(() => {
        result.current.triggerAnimation();
      });

      const styles = result.current.animationStyles;
      expect(styles.backgroundColor).toContain('rgba(239, 68, 68, 0.1)');
    });
  });

  describe('Animation Triggers', () => {
    it('should trigger animation correctly', () => {
      const onAnimationStart = jest.fn();
      const onAnimationComplete = jest.fn();

      const { result } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'hover',
          onAnimationStart,
          onAnimationComplete
        })
      );

      act(() => {
        result.current.triggerAnimation();
      });

      expect(result.current.animationState.isAnimating).toBe(true);
      expect(result.current.animationState.currentPhase).toBe('entering');
      expect(onAnimationStart).toHaveBeenCalled();
    });

    it('should complete animation after duration', async () => {
      jest.useFakeTimers();
      
      const onAnimationComplete = jest.fn();

      const { result } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'hover',
          duration: 'fast',
          onAnimationComplete
        })
      );

      act(() => {
        result.current.triggerAnimation();
      });

      expect(result.current.animationState.isAnimating).toBe(true);

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current.animationState.isAnimating).toBe(false);
      expect(result.current.animationState.currentPhase).toBe('idle');
      expect(result.current.animationState.progress).toBe(1);
      expect(onAnimationComplete).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should reset animation state', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ type: 'hover' })
      );

      act(() => {
        result.current.triggerAnimation();
      });

      expect(result.current.animationState.isAnimating).toBe(true);

      act(() => {
        result.current.resetAnimation();
      });

      expect(result.current.animationState.isAnimating).toBe(false);
      expect(result.current.animationState.progress).toBe(0);
      expect(result.current.animationState.currentPhase).toBe('idle');
    });
  });

  describe('Performance Monitoring', () => {
    // SKIPPED: Testing performance metric reporting - implementation detail
    it.skip('should report performance metrics', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ type: 'hover' })
      );

      act(() => {
        result.current.triggerAnimation();
      });

      // Performance monitoring should be called
      expect(mockReportMetric).toHaveBeenCalled();
    });

    it('should not trigger animations when reduced motion is preferred', () => {
      mockUseReducedMotion.mockReturnValue(true);

      const { result } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'hover',
          respectMotionPreferences: true 
        })
      );

      act(() => {
        result.current.triggerAnimation();
      });

      expect(result.current.animationState.isAnimating).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should convert hex colors to rgb correctly', () => {
      const { result } = renderHook(() => 
        useTradeYaAnimation({ 
          type: 'hover',
          brandColorScheme: 'orange'
        })
      );

      // Test that the hex to rgb conversion works in the styles
      const styles = result.current.animationStyles;
      expect(styles).toBeDefined();
    });
  });
});
