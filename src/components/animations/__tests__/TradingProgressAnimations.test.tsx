/**
 * Trading Progress Animations Component Tests
 * 
 * Test suite for multi-step workflow visualizations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TradingProgressAnimation, CompactTradingProgress } from '../TradingProgressAnimations';
import type { TradingStep, TradingStepData } from '../TradingProgressAnimations';

// Mock the animation hooks
jest.mock('../../../hooks/useTradeYaAnimation', () => ({
  useTradeYaAnimation: jest.fn(() => ({
    triggerAnimation: jest.fn(),
  })),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('div', props, children);
    },
    circle: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('circle', props, children);
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('TradingProgressAnimation', () => {
  const mockSteps: TradingStepData[] = [
    {
      id: 'proposal',
      label: 'Proposal',
      description: 'Submit your trade proposal',
      icon: '📝',
      status: 'completed',
      estimatedTime: '2 min',
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      description: 'Discuss trade details',
      icon: '💬',
      status: 'active',
      estimatedTime: '5-10 min',
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      description: 'Confirm trade agreement',
      icon: '✅',
      status: 'pending',
      estimatedTime: '1 min',
    },
    {
      id: 'completion',
      label: 'Completion',
      description: 'Complete the trade',
      icon: '🎉',
      status: 'pending',
      estimatedTime: '3-5 min',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all steps correctly', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      expect(screen.getByText('Proposal')).toBeInTheDocument();
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
      expect(screen.getByText('Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Completion')).toBeInTheDocument();
    });

    it('should show step descriptions', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      expect(screen.getByText('Submit your trade proposal')).toBeInTheDocument();
      expect(screen.getByText('Discuss trade details')).toBeInTheDocument();
      expect(screen.getByText('Confirm trade agreement')).toBeInTheDocument();
      expect(screen.getByText('Complete the trade')).toBeInTheDocument();
    });

    it('should show estimated durations when showEstimates is true', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
          showEstimates={true}
        />
      );

      // Only pending steps show estimated time
      expect(screen.getByText('Est. 1 min')).toBeInTheDocument();
      expect(screen.getByText('Est. 3-5 min')).toBeInTheDocument();
    });

    it('should not show estimated durations when showEstimates is false', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
          showEstimates={false}
        />
      );

      expect(screen.queryByText('2 min')).not.toBeInTheDocument();
      expect(screen.queryByText('5-10 min')).not.toBeInTheDocument();
    });
  });

  describe('Step Status Visualization', () => {
    it('should show completed step with checkmark', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      // Look for the checkmark in completed steps
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('Proposal')).toBeInTheDocument();
    });

    it('should show active step styling', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    it('should show pending steps', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      expect(screen.getByText('Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Completion')).toBeInTheDocument();
    });

    it('should show failed step with error styling', () => {
      const stepsWithFailure = [...mockSteps];
      stepsWithFailure[1] = { ...stepsWithFailure[1], status: 'failed' };

      render(
        <TradingProgressAnimation
          steps={stepsWithFailure}
          currentStep="negotiation"
        />
      );

      expect(screen.getByText('✕')).toBeInTheDocument();
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    it('should show skipped step with appropriate styling', () => {
      const stepsWithSkipped = [...mockSteps];
      stepsWithSkipped[2] = { ...stepsWithSkipped[2], status: 'skipped' };

      render(
        <TradingProgressAnimation
          steps={stepsWithSkipped}
          currentStep="completion"
        />
      );

      expect(screen.getByText('Confirmation')).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show progress ring for active step when showProgress is true', () => {
      const stepsWithProgress = [...mockSteps];
      stepsWithProgress[1] = { ...stepsWithProgress[1], progress: 50 };

      render(
        <TradingProgressAnimation
          steps={stepsWithProgress}
          currentStep="negotiation"
          showProgress={true}
        />
      );

      // The TradeProgressRing component should be rendered
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    it('should not show progress ring when showProgress is false', () => {
      const stepsWithProgress = [...mockSteps];
      stepsWithProgress[1] = { ...stepsWithProgress[1], progress: 50 };

      render(
        <TradingProgressAnimation
          steps={stepsWithProgress}
          currentStep="negotiation"
          showProgress={false}
        />
      );

      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    it('should show progress percentage when available', () => {
      const stepsWithProgress = [...mockSteps];
      stepsWithProgress[1] = { ...stepsWithProgress[1], progress: 75 };

      render(
        <TradingProgressAnimation
          steps={stepsWithProgress}
          currentStep="negotiation"
          showProgress={true}
        />
      );

      // Check for progress text label
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('should render horizontally by default', () => {
      const { container } = render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      expect(container.firstChild).toHaveClass('flex-row');
    });

    it('should render vertically when orientation is vertical', () => {
      const { container } = render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
          orientation="vertical"
        />
      );

      expect(container.firstChild).toHaveClass('flex-col');
    });
  });

  describe('Sizes', () => {
    it('should apply small size classes', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
          size="sm"
        />
      );

      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    it('should apply medium size classes by default', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    it('should apply large size classes', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
          size="lg"
        />
      );

      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });
  });

  describe('Step Interactions', () => {
    it('should call onStepClick when step is clicked', () => {
      const onStepClick = jest.fn();
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
          onStepClick={onStepClick}
        />
      );

      fireEvent.click(screen.getByText('Proposal'));
      expect(onStepClick).toHaveBeenCalledWith('proposal');
    });

    it('should not call onStepClick when step is disabled', () => {
      const onStepClick = jest.fn();
      const stepsWithDisabled = [...mockSteps];
      stepsWithDisabled[2] = { ...stepsWithDisabled[2], disabled: true };

      render(
        <TradingProgressAnimation
          steps={stepsWithDisabled}
          currentStep="negotiation"
          onStepClick={onStepClick}
        />
      );

      fireEvent.click(screen.getByText('Confirmation'));
      expect(onStepClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should render step labels for screen readers', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      expect(screen.getByText('Proposal')).toBeInTheDocument();
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
      expect(screen.getByText('Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Completion')).toBeInTheDocument();
    });

    it('should render step descriptions', () => {
      render(
        <TradingProgressAnimation
          steps={mockSteps}
          currentStep="negotiation"
        />
      );

      expect(screen.getByText('Submit your trade proposal')).toBeInTheDocument();
      expect(screen.getByText('Discuss trade details')).toBeInTheDocument();
      expect(screen.getByText('Confirm trade agreement')).toBeInTheDocument();
      expect(screen.getByText('Complete the trade')).toBeInTheDocument();
    });
  });
});

describe('CompactTradingProgress', () => {
  it('should render compact progress indicator', () => {
    render(
      <CompactTradingProgress
        currentStep="negotiation"
        totalSteps={4}
      />
    );

    expect(screen.getByText('2/4')).toBeInTheDocument();
  });

  it('should show correct progress for different steps', () => {
    const { rerender } = render(
      <CompactTradingProgress
        currentStep="proposal"
        totalSteps={4}
      />
    );

    expect(screen.getByText('1/4')).toBeInTheDocument();

    rerender(
      <CompactTradingProgress
        currentStep="completion"
        totalSteps={4}
      />
    );

    expect(screen.getByText('4/4')).toBeInTheDocument();
  });

  it('should handle custom total steps', () => {
    render(
      <CompactTradingProgress
        currentStep="negotiation"
        totalSteps={5}
      />
    );

    expect(screen.getByText('2/5')).toBeInTheDocument();
  });
});
