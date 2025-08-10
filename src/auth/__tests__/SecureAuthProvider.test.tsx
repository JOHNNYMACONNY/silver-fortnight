import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SecureAuthProvider, useSecureAuth, withSecureAuth } from '../SecureAuthProvider';
import { tokenValidator } from '../../utils/tokenUtils';
import { rateLimiter } from '../../utils/rateLimiting';
import { securityMonitor } from '../../services/securityMonitoring';
import { useAuth } from '../../AuthContext';
import { User } from 'firebase/auth';

// Mock dependencies
jest.mock('../../AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn()
}));

jest.mock('../../utils/tokenUtils', () => ({
  tokenValidator: {
    validateToken: jest.fn(),
    clearCache: jest.fn()
  }
}));

jest.mock('../../utils/rateLimiting', () => ({
  rateLimiter: {
    checkLimit: jest.fn(),
    getStatus: jest.fn(),
    resetAll: jest.fn()
  }
}));

jest.mock('../../services/securityMonitoring', () => ({
  securityMonitor: {
    logEvent: jest.fn()
  }
}));

describe('SecureAuthProvider', () => {
  const mockUser = { uid: 'test-user' } as User;
  const mockAuthContext = {
    currentUser: mockUser,
    logout: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockAuthContext);
  });

  describe('useSecureAuth hook', () => {
    const TestComponent = () => {
      const secureAuth = useSecureAuth();
      return <div data-testid="test">{JSON.stringify(secureAuth)}</div>;
    };

    it('provides security context to children', () => {
      render(
        <SecureAuthProvider>
          <TestComponent />
        </SecureAuthProvider>
      );

      expect(screen.getByTestId('test')).toBeDefined();
    });

    it('throws error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSecureAuth must be used within SecureAuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('session validation', () => {
    const TestComponent = () => {
      const { validateSession } = useSecureAuth();
      React.useEffect(() => {
        validateSession();
      }, [validateSession]);
      return null;
    };

    it('validates session successfully', async () => {
      (tokenValidator.validateToken as jest.Mock).mockResolvedValue({
        isValid: true,
        claims: { exp: Date.now() + 3600000 }
      });

      await act(async () => {
        render(
          <SecureAuthProvider>
            <TestComponent />
          </SecureAuthProvider>
        );
      });

      expect(tokenValidator.validateToken).toHaveBeenCalledWith(mockUser);
      expect(securityMonitor.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'token',
          severity: 'low'
        })
      );
    });

    it('handles invalid session', async () => {
      (tokenValidator.validateToken as jest.Mock).mockResolvedValue({
        isValid: false,
        error: 'Invalid token'
      });

      await act(async () => {
        render(
          <SecureAuthProvider>
            <TestComponent />
          </SecureAuthProvider>
        );
      });

      expect(mockAuthContext.logout).toHaveBeenCalled();
      expect(securityMonitor.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'token',
          severity: 'high'
        })
      );
    });
  });

  describe('rate limiting', () => {
    const TestComponent = () => {
      const { checkRateLimit } = useSecureAuth();
      React.useEffect(() => {
        checkRateLimit('test-action');
      }, [checkRateLimit]);
      return null;
    };

    it('allows requests within limit', async () => {
      (rateLimiter.checkLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remainingAttempts: 4
      });

      await act(async () => {
        render(
          <SecureAuthProvider>
            <TestComponent />
          </SecureAuthProvider>
        );
      });

      expect(rateLimiter.checkLimit).toHaveBeenCalledWith('test-action');
      expect(securityMonitor.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rate_limit',
          severity: 'low'
        })
      );
    });

    it('blocks requests when limit exceeded', async () => {
      (rateLimiter.checkLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: Date.now() + 300000
      });

      await act(async () => {
        render(
          <SecureAuthProvider>
            <TestComponent />
          </SecureAuthProvider>
        );
      });

      expect(securityMonitor.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rate_limit',
          severity: 'medium'
        })
      );
    });
  });

  describe('withSecureAuth HOC', () => {
    const TestComponent = () => <div data-testid="protected">Protected Content</div>;
    const WrappedComponent = withSecureAuth(TestComponent, {
      requireAuth: true,
      validateSession: true,
      rateLimitKey: 'test-route'
    });

    it('renders protected component when all checks pass', async () => {
      (tokenValidator.validateToken as jest.Mock).mockResolvedValue({ isValid: true });
      (rateLimiter.checkLimit as jest.Mock).mockResolvedValue({ allowed: true });

      await act(async () => {
        render(
          <SecureAuthProvider>
            <WrappedComponent />
          </SecureAuthProvider>
        );
      });

      expect(screen.getByTestId('protected')).toBeDefined();
    });

    it('shows error when authentication is required but missing', async () => {
      (useAuth as jest.Mock).mockReturnValue({ currentUser: null });

      await act(async () => {
        render(
          <SecureAuthProvider>
            <WrappedComponent />
          </SecureAuthProvider>
        );
      });

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
    });

    it('shows error when rate limit is exceeded', async () => {
      (tokenValidator.validateToken as jest.Mock).mockResolvedValue({ isValid: true });
      (rateLimiter.checkLimit as jest.Mock).mockResolvedValue({ allowed: false });

      await act(async () => {
        render(
          <SecureAuthProvider>
            <WrappedComponent />
          </SecureAuthProvider>
        );
      });

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
    });
  });
});
