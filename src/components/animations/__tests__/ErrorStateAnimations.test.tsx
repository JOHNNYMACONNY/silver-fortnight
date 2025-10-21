/**
 * Error State Animations Component Tests
 * 
 * Test suite for animated error handling components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorStateAnimation, TradeErrorAnimation, NetworkErrorAnimation } from '../ErrorStateAnimations';
import type { ErrorState } from '../ErrorStateAnimations';

// Mock the animation hooks
jest.mock('../../../hooks/useTradeYaAnimation', () => ({
  useTradeYaAnimation: jest.fn(() => ({
    triggerAnimation: jest.fn(),
  })),
}));

// Mock AnimatedButton
jest.mock('../AnimatedButton', () => ({
  AnimatedButton: ({ children, onClick, disabled, ...props }: any) => {
    const React = require('react');
    return React.createElement('button', { onClick, disabled, ...props }, children);
  },
}));

describe('ErrorStateAnimation', () => {
  const mockError: ErrorState = {
    type: 'network',
    severity: 'medium',
    message: 'Connection failed',
    details: 'Unable to reach the server',
    retryable: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render error message', () => {
      render(<ErrorStateAnimation error={mockError} />);
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('should render error title based on type', () => {
      render(<ErrorStateAnimation error={mockError} />);
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    it('should render error icon based on type', () => {
      render(<ErrorStateAnimation error={mockError} />);
      expect(screen.getByText('🌐')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<ErrorStateAnimation error={mockError} />);
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Error Types', () => {
    it('should render validation error correctly', () => {
      const validationError: ErrorState = {
        type: 'validation',
        severity: 'low',
        message: 'Invalid input',
      };
      
      render(<ErrorStateAnimation error={validationError} />);
      expect(screen.getByText('Validation Error')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should render trade failed error correctly', () => {
      const tradeError: ErrorState = {
        type: 'trade_failed',
        severity: 'high',
        message: 'Trade could not be completed',
      };
      
      render(<ErrorStateAnimation error={tradeError} />);
      expect(screen.getByText('Trade Failed')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should render timeout error correctly', () => {
      const timeoutError: ErrorState = {
        type: 'timeout',
        severity: 'medium',
        message: 'Request timed out',
      };
      
      render(<ErrorStateAnimation error={timeoutError} />);
      expect(screen.getByText('Request Timeout')).toBeInTheDocument();
      expect(screen.getByText('⏱️')).toBeInTheDocument();
    });
  });

  describe('Error Details', () => {
    it('should show details when showDetails is true', () => {
      render(<ErrorStateAnimation error={mockError} showDetails={true} />);
      expect(screen.getByText('Unable to reach the server')).toBeInTheDocument();
    });

    it('should not show details by default', () => {
      render(<ErrorStateAnimation error={mockError} />);
      expect(screen.queryByText('Unable to reach the server')).not.toBeInTheDocument();
    });

    it('should show error code when provided', () => {
      const errorWithCode: ErrorState = {
        ...mockError,
        code: 'NET_001',
      };
      
      render(<ErrorStateAnimation error={errorWithCode} showDetails={true} />);
      expect(screen.getByText('Code: NET_001')).toBeInTheDocument();
    });

    it('should toggle details when details button is clicked', async () => {
      render(<ErrorStateAnimation error={mockError} />);
      
      // Details should not be visible initially
      expect(screen.queryByText('Unable to reach the server')).not.toBeInTheDocument();
      
      // Click show details
      fireEvent.click(screen.getByText('Show Details'));
      
      // Details should now be visible
      await waitFor(() => {
        expect(screen.getByText('Unable to reach the server')).toBeInTheDocument();
      });
      
      // Click hide details
      fireEvent.click(screen.getByText('Hide Details'));
      
      // Details should be hidden again
      await waitFor(() => {
        expect(screen.queryByText('Unable to reach the server')).not.toBeInTheDocument();
      });
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button when error is retryable', () => {
      const onRetry = jest.fn();
      render(<ErrorStateAnimation error={mockError} onRetry={onRetry} />);
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should not show retry button when error is not retryable', () => {
      const nonRetryableError: ErrorState = {
        ...mockError,
        retryable: false,
      };
      
      render(<ErrorStateAnimation error={nonRetryableError} />);
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = jest.fn().mockResolvedValue(undefined);
      render(<ErrorStateAnimation error={mockError} onRetry={onRetry} />);
      
      fireEvent.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should show retrying state when retry is in progress', async () => {
      const onRetry = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ErrorStateAnimation error={mockError} onRetry={onRetry} />);
      
      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.getByText('Retrying...')).toBeInTheDocument();
      });
    });

    it('should show retry progress when retry count is provided', () => {
      const errorWithRetries: ErrorState = {
        ...mockError,
        retryCount: 2,
        maxRetries: 5,
      };
      
      render(<ErrorStateAnimation error={errorWithRetries} />);
      expect(screen.getByText('Retry attempt 2 of 5')).toBeInTheDocument();
    });
  });

  describe('Recovery and Dismiss', () => {
    it('should show recover button when onRecover is provided', () => {
      const onRecover = jest.fn();
      render(<ErrorStateAnimation error={mockError} onRecover={onRecover} />);
      expect(screen.getByText('Recover')).toBeInTheDocument();
    });

    it('should call onRecover when recover button is clicked', () => {
      const onRecover = jest.fn();
      render(<ErrorStateAnimation error={mockError} onRecover={onRecover} />);
      
      fireEvent.click(screen.getByText('Recover'));
      expect(onRecover).toHaveBeenCalledTimes(1);
    });

    it('should show dismiss button when onDismiss is provided', () => {
      const onDismiss = jest.fn();
      render(<ErrorStateAnimation error={mockError} onDismiss={onDismiss} />);
      expect(screen.getByLabelText('Dismiss error')).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      const onDismiss = jest.fn();
      render(<ErrorStateAnimation error={mockError} onDismiss={onDismiss} />);
      
      fireEvent.click(screen.getByLabelText('Dismiss error'));
      
      // Should call onDismiss after animation delay
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });
  });

  describe('Auto Hide', () => {
    it('should auto hide for low severity errors when autoHide is true', async () => {
      const lowSeverityError: ErrorState = {
        ...mockError,
        severity: 'low',
      };
      
      const onDismiss = jest.fn();
      render(
        <ErrorStateAnimation 
          error={lowSeverityError} 
          onDismiss={onDismiss}
          autoHide={true}
          autoHideDelay={100}
        />
      );
      
      // Should auto dismiss after delay
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should not auto hide for high severity errors', async () => {
      const highSeverityError: ErrorState = {
        ...mockError,
        severity: 'high',
      };
      
      const onDismiss = jest.fn();
      render(
        <ErrorStateAnimation 
          error={highSeverityError} 
          onDismiss={onDismiss}
          autoHide={true}
          autoHideDelay={100}
        />
      );
      
      // Should not auto dismiss
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });
});

describe('TradeErrorAnimation', () => {
  it('should render trade error with correct details', () => {
    render(
      <TradeErrorAnimation
        tradeId="trade-123"
        errorType="proposal_failed"
        message="Proposal could not be submitted"
      />
    );
    
    expect(screen.getByText('Trade Failed')).toBeInTheDocument();
    expect(screen.getByText('Proposal could not be submitted')).toBeInTheDocument();
  });

  it('should show trade ID in details', () => {
    render(
      <TradeErrorAnimation
        tradeId="trade-123"
        errorType="proposal_failed"
        message="Proposal could not be submitted"
      />
    );

    // Details should be visible by default since showDetails={true}
    expect(screen.getByText(/Trade ID: trade-123/)).toBeInTheDocument();
  });
});

describe('NetworkErrorAnimation', () => {
  it('should render network error with default message', () => {
    render(<NetworkErrorAnimation />);
    
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to TradeYa servers')).toBeInTheDocument();
  });

  it('should show offline mode option when provided', () => {
    const onOfflineMode = jest.fn();
    render(<NetworkErrorAnimation onOfflineMode={onOfflineMode} />);
    
    expect(screen.getByText('Recover')).toBeInTheDocument();
  });
});
