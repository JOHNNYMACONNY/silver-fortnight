import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorRecoverySystem } from '../../components/errors/ErrorRecoverySystem';
import { networkResilience } from '../../services/networkResilience';
import { gracefulDegradation } from '../../services/gracefulDegradation';
import { AppError, ErrorCode, ErrorSeverity } from '../../types/errors';

// Mock dependencies
vi.mock('../../services/networkResilience');
vi.mock('../../services/gracefulDegradation');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock navigator APIs
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    getRegistrations: vi.fn(() => Promise.resolve([])),
    register: vi.fn(() => Promise.resolve())
  }
});

Object.defineProperty(window, 'caches', {
  value: {
    keys: vi.fn(() => Promise.resolve(['cache1', 'cache2'])),
    delete: vi.fn(() => Promise.resolve(true))
  }
});

// Mock localStorage and sessionStorage
const mockStorage = {
  clear: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

Object.defineProperty(window, 'localStorage', { value: mockStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockStorage });

describe('Error Recovery System', () => {
  const mockError = new AppError(
    'Test error message',
    ErrorCode.NETWORK_ERROR,
    ErrorSeverity.MEDIUM,
    { component: 'TestComponent' },
    'Something went wrong. Please try again.',
    [],
    true
  );

  const mockProps = {
    error: mockError,
    onRetry: vi.fn(),
    onRecover: vi.fn(),
    onReport: vi.fn(),
    showDiagnostics: false,
    allowOfflineMode: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders error recovery system with basic information', () => {
      render(<ErrorRecoverySystem {...mockProps} />);

      expect(screen.getByText('Error Recovery System')).toBeInTheDocument();
      expect(screen.getByText(mockError.userMessage)).toBeInTheDocument();
    });

    it('shows online status when connected', () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('shows offline status when disconnected', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<ErrorRecoverySystem {...mockProps} />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('displays recovery steps for network errors', () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      expect(screen.getByText('Recovery Steps')).toBeInTheDocument();
      expect(screen.getByText('Retry Operation')).toBeInTheDocument();
    });

    it('shows diagnostics when enabled', () => {
      render(<ErrorRecoverySystem {...mockProps} showDiagnostics={true} />);
      
      waitFor(() => {
        expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
      });
    });
  });

  describe('Recovery Steps', () => {
    it('generates appropriate recovery steps for network errors', () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      expect(screen.getByText('Retry Operation')).toBeInTheDocument();
      expect(screen.getByText('Attempt the failed operation again')).toBeInTheDocument();
    });

    it('generates cache clearing steps for cache errors', () => {
      const cacheError = new AppError(
        'Cache error',
        ErrorCode.CACHE_ERROR,
        ErrorSeverity.MEDIUM
      );

      render(<ErrorRecoverySystem {...mockProps} error={cacheError} />);
      
      expect(screen.getByText('Clear Application Cache')).toBeInTheDocument();
    });

    it('generates connection check steps when offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      render(<ErrorRecoverySystem {...mockProps} />);
      
      expect(screen.getByText('Check Internet Connection')).toBeInTheDocument();
    });

    it('executes individual recovery steps', async () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      const retryButton = screen.getByText('Run');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockProps.onRetry).toHaveBeenCalled();
      });
    });

    it('executes all recovery steps', async () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      const runAllButton = screen.getByText('Run All Steps');
      fireEvent.click(runAllButton);

      await waitFor(() => {
        expect(mockProps.onRetry).toHaveBeenCalled();
      });
    });
  });

  describe('Error Severity Handling', () => {
    it('displays correct styling for low severity errors', () => {
      const lowSeverityError = new AppError(
        'Low severity error',
        ErrorCode.VALIDATION_ERROR,
        ErrorSeverity.LOW
      );

      render(<ErrorRecoverySystem {...mockProps} error={lowSeverityError} />);
      
      const header = screen.getByText('Error Recovery System').closest('div');
      expect(header).toHaveClass('text-yellow-600');
    });

    it('displays correct styling for critical severity errors', () => {
      const criticalError = new AppError(
        'Critical error',
        ErrorCode.SYSTEM_ERROR,
        ErrorSeverity.CRITICAL
      );

      render(<ErrorRecoverySystem {...mockProps} error={criticalError} />);
      
      const header = screen.getByText('Error Recovery System').closest('div');
      expect(header).toHaveClass('text-red-800');
    });
  });

  describe('Action Buttons', () => {
    it('renders navigation action buttons', () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      expect(screen.getByText('Go Back')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Get Help')).toBeInTheDocument();
    });

    it('renders report button when onReport is provided', () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      expect(screen.getByText('Report Issue')).toBeInTheDocument();
    });

    it('calls onReport when report button is clicked', () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      const reportButton = screen.getByText('Report Issue');
      fireEvent.click(reportButton);

      expect(mockProps.onReport).toHaveBeenCalled();
    });

    it('navigates back when go back button is clicked', () => {
      const mockHistoryBack = vi.fn();
      Object.defineProperty(window, 'history', {
        value: { back: mockHistoryBack }
      });

      render(<ErrorRecoverySystem {...mockProps} />);
      
      const backButton = screen.getByText('Go Back');
      fireEvent.click(backButton);

      expect(mockHistoryBack).toHaveBeenCalled();
    });
  });

  describe('Network Status Updates', () => {
    it('updates status when network comes online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      render(<ErrorRecoverySystem {...mockProps} />);
      expect(screen.getByText('Offline')).toBeInTheDocument();

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.getByText('Online')).toBeInTheDocument();
      });
    });

    it('updates status when network goes offline', async () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      expect(screen.getByText('Online')).toBeInTheDocument();

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });
  });

  describe('Recovery Step Execution', () => {
    it('marks steps as completed when successful', async () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      const runButton = screen.getByText('Run');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });

    it('handles step failures gracefully', async () => {
      const failingProps = {
        ...mockProps,
        onRetry: vi.fn(() => { throw new Error('Retry failed'); })
      };

      render(<ErrorRecoverySystem {...failingProps} />);
      
      const runButton = screen.getByText('Run');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('shows loading state during step execution', async () => {
      const slowRetry = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const slowProps = { ...mockProps, onRetry: slowRetry };

      render(<ErrorRecoverySystem {...slowProps} />);
      
      const runAllButton = screen.getByText('Run All Steps');
      fireEvent.click(runAllButton);

      expect(screen.getByText('Recovering...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Run All Steps')).toBeInTheDocument();
      });
    });
  });

  describe('Cache Operations', () => {
    it('clears application cache when cache step is executed', async () => {
      const cacheError = new AppError(
        'Cache error',
        ErrorCode.CACHE_ERROR,
        ErrorSeverity.MEDIUM
      );

      render(<ErrorRecoverySystem {...mockProps} error={cacheError} />);
      
      const clearCacheButton = screen.getByText('Run');
      fireEvent.click(clearCacheButton);

      await waitFor(() => {
        expect(window.caches.keys).toHaveBeenCalled();
        expect(mockStorage.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Service Worker Operations', () => {
    it('refreshes service worker when service error occurs', async () => {
      const serviceError = new AppError(
        'Service worker error',
        ErrorCode.SERVICE_WORKER_ERROR,
        ErrorSeverity.MEDIUM
      );

      render(<ErrorRecoverySystem {...mockProps} error={serviceError} />);
      
      const refreshButton = screen.getByText('Run');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(navigator.serviceWorker.getRegistrations).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('supports keyboard navigation', () => {
      render(<ErrorRecoverySystem {...mockProps} />);
      
      const runButton = screen.getByText('Run');
      runButton.focus();
      expect(document.activeElement).toBe(runButton);
    });
  });
});
