import React, { ComponentType } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSecureAuth } from './SecureAuthProvider';
import { AUTH_CONSTANTS } from '../utils/constants';

interface SecureRouteConfig {
  requireAuth?: boolean;
  validateSession?: boolean;
  rateLimitKey?: string;
  rateLimitConfig?: {
    maxAttempts?: number;
    windowMs?: number;
    blockDuration?: number;
  };
}

interface SecureRouteOptions extends SecureRouteConfig {
  path: string;
  Component: ComponentType<any>;
}

/**
 * Default security configurations for different route types
 */
const DEFAULT_CONFIGS: Record<string, SecureRouteConfig> = {
  auth: {
    requireAuth: false,
    validateSession: false,
    rateLimitKey: 'auth',
    rateLimitConfig: {
      maxAttempts: AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS,
      windowMs: AUTH_CONSTANTS.RATE_LIMIT.WINDOW_MS,
      blockDuration: AUTH_CONSTANTS.RATE_LIMIT.BLOCK_DURATION
    }
  },
  protected: {
    requireAuth: true,
    validateSession: true,
    rateLimitKey: 'protected'
  },
  admin: {
    requireAuth: true,
    validateSession: true,
    rateLimitKey: 'admin'
  }
};

/**
 * Creates a secure route with the specified configuration
 */
export const createSecureRoute = ({
  path,
  Component,
  requireAuth,
  validateSession,
  rateLimitKey,
  rateLimitConfig
}: SecureRouteOptions): RouteObject => {
  const SecureComponent = withSecureAuth(Component, {
    requireAuth,
    validateSession,
    rateLimitKey
  });

  // If rate limit config is provided, update the rate limiter configuration
  if (rateLimitKey && rateLimitConfig) {
    import('../utils/rateLimiting').then(({ rateLimiter }) => {
      rateLimiter.updateConfig({
        ...rateLimitConfig
      });
    });
  }

  return {
    path,
    element: React.createElement(SecureComponent)
  };
};

/**
 * Creates a collection of secure routes with predefined configurations
 */
export const createSecureRoutes = (routes: Array<{
  path: string;
  Component: ComponentType<any>;
  type: keyof typeof DEFAULT_CONFIGS;
  config?: Partial<SecureRouteConfig>;
}>): RouteObject[] => {
  return routes.map(({ path, Component, type, config = {} }) => {
    const defaultConfig = DEFAULT_CONFIGS[type] || {};
    return createSecureRoute({
      path,
      Component,
      ...defaultConfig,
      ...config
    });
  });
};

/**
 * Helper function to secure existing routes array
 */
export const secureRoutes = (
  routes: RouteObject[],
  config: SecureRouteConfig
): RouteObject[] => {
  return routes.map(route => {
    if (typeof route.element === 'undefined') {
      return route;
    }

    const Component = () => route.element;
    const SecureComponent = withSecureAuth(Component, config);
    return {
      ...route,
      element: React.createElement(SecureComponent)
    };
  });
};

/**
 * Example usage:
 * 
 * const routes = createSecureRoutes([
 *   {
 *     path: '/login',
 *     Component: LoginPage,
 *     type: 'auth'
 *   },
 *   {
 *     path: '/dashboard',
 *     Component: DashboardPage,
 *     type: 'protected'
 *   },
 *   {
 *     path: '/admin',
 *     Component: AdminPage,
 *     type: 'admin',
 *     config: {
 *       rateLimitConfig: {
 *         maxAttempts: 3,
 *         windowMs: 300000
 *       }
 *     }
 *   }
 * ]);
 */
