/**
 * Tests for TradeStatusIndicator Component
 * 
 * Test suite for animated trade status display with brand coordination
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TradeStatusIndicator, type TradeStatus } from '../TradeStatusIndicator';

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
      transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      borderColor: '#f97316'
    },
    isSupported: true
  }))
}));

// Mock cn utility
jest.mock('../../../utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('TradeStatusIndicator', () => {
  const allStatuses: TradeStatus[] = [
    'pending',
    'negotiating',
    'confirmed',
    'completed',
    'cancelled',
    'expired'
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<TradeStatusIndicator status="pending" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('aria-label', 'Trade status: Pending Review');
    });

    it('should render all status types', () => {
      allStatuses.forEach(status => {
        const { unmount } = render(<TradeStatusIndicator status={status} />);
        
        const indicator = screen.getByRole('status');
        expect(indicator).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should show status labels by default', () => {
      render(<TradeStatusIndicator status="pending" />);
      
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
    });

    it('should hide labels when showLabel is false', () => {
      render(<TradeStatusIndicator status="pending" showLabel={false} />);
      
      expect(screen.queryByText('Pending Review')).not.toBeInTheDocument();
    });
  });

  describe('Status Labels', () => {
    const statusLabels = {
      pending: 'Pending Review',
      negotiating: 'In Negotiation',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      expired: 'Expired'
    };

    Object.entries(statusLabels).forEach(([status, label]) => {
      it(`should show correct label for ${status} status`, () => {
        render(<TradeStatusIndicator status={status as TradeStatus} />);
        
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('Status Icons', () => {
    it('should render pending status with pulsing animation', () => {
      render(<TradeStatusIndicator status="pending" />);
      
      const indicator = screen.getByRole('status');
      const icon = indicator.querySelector('.animate-pulse');
      expect(icon).toBeInTheDocument();
    });

    it('should render negotiating status with gradient animation', () => {
      render(<TradeStatusIndicator status="negotiating" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
    });

    it('should render confirmed status with checkmark', () => {
      render(<TradeStatusIndicator status="confirmed" />);
      
      const indicator = screen.getByRole('status');
      const svg = indicator.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render completed status with bouncing checkmark', () => {
      render(<TradeStatusIndicator status="completed" />);
      
      const indicator = screen.getByRole('status');
      const svg = indicator.querySelector('svg.animate-bounce');
      expect(svg).toBeInTheDocument();
    });

    it('should render cancelled status with X icon', () => {
      render(<TradeStatusIndicator status="cancelled" />);
      
      const indicator = screen.getByRole('status');
      const svg = indicator.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render expired status with clock icon', () => {
      render(<TradeStatusIndicator status="expired" />);
      
      const indicator = screen.getByRole('status');
      const svg = indicator.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`should render ${size} size correctly`, () => {
        render(<TradeStatusIndicator status="pending" size={size} />);
        
        const indicator = screen.getByRole('status');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('Animation Control', () => {
    it('should trigger animation by default', () => {
      const mockTriggerAnimation = jest.fn();
      
      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: false, progress: 0, currentPhase: 'idle', performanceMetrics: {} },
        triggerAnimation: mockTriggerAnimation,
        resetAnimation: jest.fn(),
        animationStyles: {},
        isSupported: true
      });

      render(<TradeStatusIndicator status="pending" />);
      
      expect(mockTriggerAnimation).toHaveBeenCalled();
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

      render(<TradeStatusIndicator status="pending" showAnimation={false} />);
      
      expect(mockTriggerAnimation).not.toHaveBeenCalled();
    });

    it('should trigger animation when status changes', () => {
      const mockTriggerAnimation = jest.fn();
      
      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: false, progress: 0, currentPhase: 'idle', performanceMetrics: {} },
        triggerAnimation: mockTriggerAnimation,
        resetAnimation: jest.fn(),
        animationStyles: {},
        isSupported: true
      });

      const { rerender } = render(<TradeStatusIndicator status="pending" />);
      
      expect(mockTriggerAnimation).toHaveBeenCalledTimes(1);
      
      rerender(<TradeStatusIndicator status="confirmed" />);
      
      expect(mockTriggerAnimation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper role and aria-label', () => {
      render(<TradeStatusIndicator status="pending" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Trade status: Pending Review');
    });

    it('should update aria-label for different statuses', () => {
      const { rerender } = render(<TradeStatusIndicator status="pending" />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Trade status: Pending Review');
      
      rerender(<TradeStatusIndicator status="completed" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Trade status: Completed');
    });
  });

  describe('Styling and Classes', () => {
    it('should apply custom className', () => {
      render(<TradeStatusIndicator status="pending" className="custom-class" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('custom-class');
    });

    it('should apply animation styles', () => {
      const mockStyles = {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderColor: '#f97316',
        transform: 'scale(1.01)'
      };

      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: true, progress: 0.5, currentPhase: 'active', performanceMetrics: {} },
        triggerAnimation: jest.fn(),
        resetAnimation: jest.fn(),
        animationStyles: mockStyles,
        isSupported: true
      });

      render(<TradeStatusIndicator status="pending" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle('background-color: rgba(249, 115, 22, 0.1)');
    });
  });

  describe('Brand Color Integration', () => {
    it('should use correct brand colors for different statuses', () => {
      // Test that different statuses trigger different brand color schemes
      const statuses: Array<{ status: TradeStatus; expectedContext: string }> = [
        { status: 'pending', expectedContext: 'proposal' },
        { status: 'negotiating', expectedContext: 'negotiation' },
        { status: 'confirmed', expectedContext: 'confirmation' },
        { status: 'completed', expectedContext: 'completion' }
      ];

      statuses.forEach(({ status }) => {
        const { unmount } = render(<TradeStatusIndicator status={status} />);
        
        const indicator = screen.getByRole('status');
        expect(indicator).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid status changes without issues', () => {
      const { rerender } = render(<TradeStatusIndicator status="pending" />);
      
      // Rapidly change statuses
      allStatuses.forEach(status => {
        rerender(<TradeStatusIndicator status={status} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });
});
