import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, RouteObject } from 'react-router-dom';
import { createSecureRoute, createSecureRoutes, secureRoutes } from '../secureRoutes';
import { withSecureAuth } from '../SecureAuthProvider';
import { rateLimiter } from '../../utils/rateLimiting';
import { AUTH_CONSTANTS } from '../../utils/constants';

// Mock dependencies
jest.mock('../SecureAuthProvider', () => ({
  withSecureAuth: jest.fn((component, _config) => component)
}));

jest.mock('../../utils/rateLimiting', () => ({
  rateLimiter: {
    updateConfig: jest.fn()
  }
}));

describe('secureRoutes', () => {
  const TestComponent: React.FC<{ testProp?: string }> = ({ testProp }) => (
    <div>Test Component {testProp}</div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSecureRoute', () => {
    it('creates a route with security configuration', () => {
      const route = createSecureRoute({
        path: '/test',
        Component: TestComponent,
        requireAuth: true,
        validateSession: true,
        rateLimitKey: 'test-route'
      });

      expect(route).toEqual({
        path: '/test',
        element: expect.any(Object)
      });

      expect(withSecureAuth).toHaveBeenCalledWith(
        TestComponent,
        {
          requireAuth: true,
          validateSession: true,
          rateLimitKey: 'test-route'
        }
      );
    });

    it('updates rate limiting configuration when provided', async () => {
      const rateLimitConfig = {
        maxAttempts: 3,
        windowMs: 60000,
        blockDuration: 300000,
        backoffMultiplier: 2
      };

      createSecureRoute({
        path: '/test',
        Component: TestComponent,
        rateLimitKey: 'test-route',
        rateLimitConfig
      });

      // Wait for dynamic import to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(rateLimiter.updateConfig).toHaveBeenCalledWith({
        ...rateLimitConfig,
        identifier: 'test-route'
      });
    });
  });

  describe('createSecureRoutes', () => {
    it('creates multiple routes with predefined configurations', () => {
      const routes = createSecureRoutes([
        {
          path: '/login',
          Component: TestComponent,
          type: 'auth'
        },
        {
          path: '/dashboard',
          Component: TestComponent,
          type: 'protected'
        }
      ]);

      expect(routes).toHaveLength(2);
      expect(routes[0].path).toBe('/login');
      expect(routes[1].path).toBe('/dashboard');

      // Verify auth route configuration
      expect(withSecureAuth).toHaveBeenCalledWith(
        TestComponent,
        expect.objectContaining({
          requireAuth: false,
          validateSession: false,
          rateLimitKey: 'auth'
        })
      );

      // Verify protected route configuration
      expect(withSecureAuth).toHaveBeenCalledWith(
        TestComponent,
        expect.objectContaining({
          requireAuth: true,
          validateSession: true,
          rateLimitKey: 'protected'
        })
      );
    });

    it('merges custom configuration with defaults', async () => {
      const routes = createSecureRoutes([
        {
          path: '/admin',
          Component: TestComponent,
          type: 'admin',
          config: {
            rateLimitConfig: {
              maxAttempts: 3,
              windowMs: 300000
            }
          }
        }
      ]);

      expect(routes[0].path).toBe('/admin');
      expect(withSecureAuth).toHaveBeenCalledWith(
        TestComponent,
        expect.objectContaining({
          requireAuth: true,
          validateSession: true,
          rateLimitKey: 'admin'
        })
      );

      // Verify rate limit config update
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(rateLimiter.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAttempts: 3,
          windowMs: 300000,
          identifier: 'admin'
        })
      );
    });
  });

  describe('secureRoutes', () => {
    it('secures existing routes with provided configuration', () => {
      const existingRoutes: RouteObject[] = [
        {
          path: '/test1',
          element: <TestComponent testProp="1" />
        },
        {
          path: '/test2',
          element: <TestComponent testProp="2" />
        }
      ];

      const securityConfig = {
        requireAuth: true,
        validateSession: true,
        rateLimitKey: 'test'
      };

      const securedRoutes = secureRoutes(existingRoutes, securityConfig);

      expect(securedRoutes).toHaveLength(2);
      expect(securedRoutes[0].path).toBe('/test1');
      expect(securedRoutes[1].path).toBe('/test2');

      // Verify security configuration was applied to both routes
      expect(withSecureAuth).toHaveBeenCalledTimes(2);
      expect(withSecureAuth).toHaveBeenCalledWith(
        expect.any(Function),
        securityConfig
      );
    });

    it('preserves routes without elements', () => {
      const existingRoutes: RouteObject[] = [
        {
          path: '/test1',
          element: <TestComponent />
        },
        {
          path: '/test2'
        }
      ];

      const securedRoutes = secureRoutes(existingRoutes, {});

      expect(securedRoutes).toHaveLength(2);
      expect(withSecureAuth).toHaveBeenCalledTimes(1);
      expect(securedRoutes[1]).toEqual(existingRoutes[1]);
    });
  });

  describe('integration tests', () => {
    const renderRoute = (route: RouteObject) => {
      return render(
        <BrowserRouter>
          {route.element}
        </BrowserRouter>
      );
    };

    it('renders secured component correctly', () => {
      // Re-enable actual withSecureAuth for this test
      (withSecureAuth as jest.Mock).mockImplementationOnce((Component, _config) => {
        const Wrapped = (props: any) => <Component {...props} />;
        return Wrapped;
      });

      const route = createSecureRoute({
        path: '/test',
        Component: TestComponent,
        requireAuth: true
      });

      renderRoute(route);
      expect(screen.getByText(/test component/i)).toBeInTheDocument();
    });

    it('applies rate limiting configuration correctly', async () => {
      const route = createSecureRoute({
        path: '/rate-limited',
        Component: TestComponent,
        rateLimitKey: 'test',
        rateLimitConfig: {
          maxAttempts: AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS,
          windowMs: AUTH_CONSTANTS.RATE_LIMIT.WINDOW_MS
        }
      });

      renderRoute(route);

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(rateLimiter.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAttempts: AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS,
          windowMs: AUTH_CONSTANTS.RATE_LIMIT.WINDOW_MS,
          identifier: 'test'
        })
      );
    });
  });
});
