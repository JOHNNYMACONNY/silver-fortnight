/**
 * Tests for AnimatedButton Component
 * 
 * Comprehensive test suite for trading-context aware button animations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  AnimatedButton, 
  ProposalSubmitButton,
  NegotiationResponseButton,
  ConfirmationButton,
  CompletionButton 
} from '../AnimatedButton';

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
      willChange: 'transform, opacity, background-color'
    },
    isSupported: true
  })),
  TRADEYA_ANIMATION_CONFIG: {
    timing: { fast: 150, standard: 300 }
  }
}));

// Mock cn utility
jest.mock('../../../utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('AnimatedButton', () => {
  const defaultProps = {
    children: 'Test Button'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<AnimatedButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Test Button');
    });

    it('should render with custom className', () => {
      render(
        <AnimatedButton {...defaultProps} className="custom-class" />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render as different button types', () => {
      const { rerender } = render(
        <AnimatedButton {...defaultProps} type="submit" />
      );
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');

      rerender(<AnimatedButton {...defaultProps} type="reset" />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('Variants and Sizes', () => {
    it('should render different variants', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
      
      variants.forEach(variant => {
        const { unmount } = render(
          <AnimatedButton {...defaultProps} variant={variant} />
        );
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should render different sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(
          <AnimatedButton {...defaultProps} size={size} />
        );
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Trading Context', () => {
    it('should handle different trading contexts', () => {
      const contexts = ['proposal', 'negotiation', 'confirmation', 'completion', 'general'] as const;
      
      contexts.forEach(context => {
        const { unmount } = render(
          <AnimatedButton {...defaultProps} tradingContext={context} />
        );
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should handle critical actions', () => {
      render(
        <AnimatedButton {...defaultProps} criticalAction={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Should have screen reader description for critical actions
      expect(screen.getByText('This is an important action that will affect your trade.')).toBeInTheDocument();
    });
  });

  describe('Interactive States', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <AnimatedButton {...defaultProps} onClick={handleClick} />
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <AnimatedButton {...defaultProps} onClick={handleClick} disabled={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not trigger click when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <AnimatedButton {...defaultProps} onClick={handleClick} loading={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should show loading spinner when loading', () => {
      render(
        <AnimatedButton {...defaultProps} loading={true} />
      );
      
      // Loading spinner should be present
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <AnimatedButton {...defaultProps} disabled={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper ARIA attributes when loading', () => {
      render(
        <AnimatedButton {...defaultProps} loading={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have describedby for critical actions', () => {
      render(
        <AnimatedButton {...defaultProps} criticalAction={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'critical-action-description');
    });
  });

  describe('Specialized Button Components', () => {
    it('should render ProposalSubmitButton with correct props', () => {
      render(<ProposalSubmitButton>Submit Proposal</ProposalSubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Submit Proposal');
    });

    it('should render NegotiationResponseButton', () => {
      render(<NegotiationResponseButton>Respond</NegotiationResponseButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Respond');
    });

    it('should render ConfirmationButton with critical action', () => {
      render(<ConfirmationButton>Confirm Trade</ConfirmationButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Confirm Trade');
      
      // Should have critical action description
      expect(screen.getByText('This is an important action that will affect your trade.')).toBeInTheDocument();
    });

    it('should render CompletionButton', () => {
      render(<CompletionButton>Mark Complete</CompletionButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Mark Complete');
    });
  });

  describe('Animation Integration', () => {
    it('should call triggerAnimation on click', async () => {
      const mockTriggerAnimation = jest.fn();
      
      // Mock the hook to return our spy
      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: {
          isAnimating: false,
          progress: 0,
          currentPhase: 'idle',
          performanceMetrics: { fps: 60, memoryUsage: 0, droppedFrames: 0 }
        },
        triggerAnimation: mockTriggerAnimation,
        resetAnimation: jest.fn(),
        animationStyles: {},
        isSupported: true
      });

      const user = userEvent.setup();
      
      render(<AnimatedButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockTriggerAnimation).toHaveBeenCalled();
    });

    it('should not call triggerAnimation when animation is not supported', async () => {
      const mockTriggerAnimation = jest.fn();
      
      // Mock the hook to return unsupported
      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: {
          isAnimating: false,
          progress: 0,
          currentPhase: 'idle',
          performanceMetrics: { fps: 60, memoryUsage: 0, droppedFrames: 0 }
        },
        triggerAnimation: mockTriggerAnimation,
        resetAnimation: jest.fn(),
        animationStyles: {},
        isSupported: false
      });

      const user = userEvent.setup();
      
      render(<AnimatedButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockTriggerAnimation).not.toHaveBeenCalled();
    });
  });

  describe('Style Application', () => {
    it('should apply animation styles', () => {
      const mockStyles = {
        transform: 'translateY(-2px) scale(1.02)',
        transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      };

      const { useTradeYaAnimation } = require('../../../hooks/useTradeYaAnimation');
      useTradeYaAnimation.mockReturnValue({
        animationState: { isAnimating: false, progress: 0, currentPhase: 'idle', performanceMetrics: {} },
        triggerAnimation: jest.fn(),
        resetAnimation: jest.fn(),
        animationStyles: mockStyles,
        isSupported: true
      });

      render(<AnimatedButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle('transform: translateY(-2px) scale(1.02)');
    });
  });
});
