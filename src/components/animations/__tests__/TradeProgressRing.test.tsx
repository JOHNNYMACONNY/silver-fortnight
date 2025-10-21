/**
 * Tests for TradeProgressRing Component
 * 
 * Test suite for animated progress visualization with TradeYa gradient
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TradeProgressRing } from '../TradeProgressRing';

// Mock the animation hook
jest.mock('../../../hooks/useTradeYaAnimation', () => ({
  useTradeYaAnimation: jest.fn(() => ({
    animationState: {
      isAnimating: false,
      progress: 0,
      currentPhase: 'idle',
      performanceMetrics: { fps: 60, memoryUsage: 0, droppedFrames: 0 }
    },
    triggerAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    animationStyles: {
      transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },
    isSupported: true
  }))
}));

// Mock cn utility
jest.mock('../../../utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('TradeProgressRing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<TradeProgressRing progress={50} />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toBeInTheDocument();
      expect(progressRing).toHaveAttribute('aria-valuenow', '50');
      expect(progressRing).toHaveAttribute('aria-valuemin', '0');
      expect(progressRing).toHaveAttribute('aria-valuemax', '100');
    });

    it('should render SVG elements', () => {
      render(<TradeProgressRing progress={75} />);
      
      const svg = screen.getByRole('progressbar').querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      const circles = svg?.querySelectorAll('circle');
      expect(circles).toHaveLength(2); // Background and progress circles
    });

    it('should show progress text by default', () => {
      render(<TradeProgressRing progress={75} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should hide progress text when showProgress is false', () => {
      render(<TradeProgressRing progress={75} showProgress={false} />);
      
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });
  });

  describe('Progress Values', () => {
    it('should handle 0% progress', () => {
      render(<TradeProgressRing progress={0} />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle 100% progress', () => {
      render(<TradeProgressRing progress={100} />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should clamp progress values above 100', () => {
      render(<TradeProgressRing progress={150} />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should clamp progress values below 0', () => {
      render(<TradeProgressRing progress={-10} />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;

    sizes.forEach(size => {
      it(`should render ${size} size correctly`, () => {
        render(<TradeProgressRing progress={50} size={size} />);
        
        const progressRing = screen.getByRole('progressbar');
        expect(progressRing).toBeInTheDocument();
        
        const svg = progressRing.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Trading Context', () => {
    const contexts = ['proposal', 'negotiation', 'confirmation', 'completion', 'general'] as const;

    contexts.forEach(context => {
      it(`should render with ${context} trading context`, () => {
        render(<TradeProgressRing progress={50} tradingContext={context} />);
        
        const progressRing = screen.getByRole('progressbar');
        expect(progressRing).toBeInTheDocument();
      });
    });
  });

  describe('Custom Labels', () => {
    it('should show custom label when provided', () => {
      render(<TradeProgressRing progress={75} label="Skills Matched" />);
      
      expect(screen.getByText('Skills Matched')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show only custom label when showProgress is false', () => {
      render(
        <TradeProgressRing 
          progress={75} 
          label="Skills Matched" 
          showProgress={false} 
        />
      );
      
      expect(screen.getByText('Skills Matched')).toBeInTheDocument();
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });
  });

  describe('Animation Triggers', () => {
    it('should trigger animation on mount', () => {
      const mockTriggerAnimation = jest.fn();
      
      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: false, progress: 0, currentPhase: 'idle', performanceMetrics: {} },
        triggerAnimation: mockTriggerAnimation,
        resetAnimation: jest.fn(),
        animationStyles: {},
        isSupported: true
      });

      render(<TradeProgressRing progress={50} />);
      
      expect(mockTriggerAnimation).toHaveBeenCalled();
    });

    it('should trigger animation when progress changes', () => {
      const mockTriggerAnimation = jest.fn();
      
      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: false, progress: 0, currentPhase: 'idle', performanceMetrics: {} },
        triggerAnimation: mockTriggerAnimation,
        resetAnimation: jest.fn(),
        animationStyles: {},
        isSupported: true
      });

      const { rerender } = render(<TradeProgressRing progress={25} />);
      
      expect(mockTriggerAnimation).toHaveBeenCalledTimes(1);
      
      rerender(<TradeProgressRing progress={75} />);
      
      expect(mockTriggerAnimation).toHaveBeenCalledTimes(2);
    });

    it('should not trigger animation when showAnimation is false', () => {
      const mockTriggerAnimation = jest.fn();
      
      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: false, progress: 0, currentPhase: 'idle', performanceMetrics: {} },
        triggerAnimation: mockTriggerAnimation,
        resetAnimation: jest.fn(),
        animationStyles: {},
        isSupported: true
      });

      render(<TradeProgressRing progress={50} showAnimation={false} />);
      
      expect(mockTriggerAnimation).not.toHaveBeenCalled();
    });
  });

  describe('Completion Celebration', () => {
    it('should trigger celebration animation at 100% progress', () => {
      const mockTriggerAnimation = jest.fn();
      
      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: false, progress: 0, currentPhase: 'idle', performanceMetrics: {} },
        triggerAnimation: mockTriggerAnimation,
        resetAnimation: jest.fn(),
        animationStyles: {},
        isSupported: true
      });

      render(<TradeProgressRing progress={100} />);
      
      // Should trigger both progress and celebration animations
      expect(mockTriggerAnimation).toHaveBeenCalled();
    });

    it('should show completion checkmark at 100%', () => {
      render(<TradeProgressRing progress={100} />);
      
      const svg = screen.getByRole('progressbar').querySelector('svg');
      const checkmark = svg?.querySelector('path[d*="M9 12l2 2 4-4"]');
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TradeProgressRing progress={75} label="Trade Progress" />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toHaveAttribute('aria-label', 'Trade Progress');
      expect(progressRing).toHaveAttribute('aria-valuenow', '75');
      expect(progressRing).toHaveAttribute('aria-valuemin', '0');
      expect(progressRing).toHaveAttribute('aria-valuemax', '100');
    });

    it('should use default aria-label when no label provided', () => {
      render(<TradeProgressRing progress={50} />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toHaveAttribute('aria-label', 'Progress: 50%');
    });
  });

  describe('Styling and Classes', () => {
    it('should apply custom className', () => {
      render(<TradeProgressRing progress={50} className="custom-class" />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toHaveClass('custom-class');
    });

    it('should apply animation styles', () => {
      const mockStyles = {
        transform: 'scale(1.05)',
        filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.3))'
      };

      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: true, progress: 0.5, currentPhase: 'active', performanceMetrics: {} },
        triggerAnimation: jest.fn(),
        resetAnimation: jest.fn(),
        animationStyles: mockStyles,
        isSupported: true
      });

      render(<TradeProgressRing progress={75} />);
      
      const progressRing = screen.getByRole('progressbar');
      expect(progressRing).toHaveStyle('transform: scale(1.05)');
    });
  });

  describe('SVG Gradient', () => {
    it('should include TradeYa gradient definition', () => {
      render(<TradeProgressRing progress={50} />);
      
      const svg = screen.getByRole('progressbar').querySelector('svg');
      const defs = svg?.querySelector('defs');
      const gradient = defs?.querySelector('linearGradient');
      
      expect(gradient).toBeInTheDocument();
      expect(gradient).toHaveAttribute('id', 'tradeya-gradient');
    });

    it('should apply gradient to progress circle', () => {
      render(<TradeProgressRing progress={50} />);
      
      const svg = screen.getByRole('progressbar').querySelector('svg');
      const progressCircle = svg?.querySelector('circle[stroke="url(#tradeya-gradient)"]');
      
      expect(progressCircle).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle rapid progress updates', () => {
      const { rerender } = render(<TradeProgressRing progress={0} />);
      
      // Rapidly update progress
      for (let i = 0; i <= 100; i += 10) {
        rerender(<TradeProgressRing progress={i} />);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', i.toString());
      }
    });
  });
});
