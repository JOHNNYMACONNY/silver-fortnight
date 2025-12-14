/**
 * React Query Provider Configuration
 * Phase 3B: Data Refetch Optimization
 * 
 * Provides intelligent caching and stale-while-revalidate strategy
 * to reduce data refetch time from 6649ms to <500ms
 */

import React from 'react';
import {
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { logger } from '@utils/logging/logger';

/**
 * Global QueryClient configuration
 * 
 * Optimized for ProfilePage performance:
 * - staleTime: 5 minutes (data considered fresh for 5 min)
 * - cacheTime: 10 minutes (unused data kept in cache for 10 min)
 * - refetchOnWindowFocus: false (prevent unnecessary refetches)
 * - refetchOnMount: false (use cached data on mount)
 * - retry: 1 (only retry once on failure)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Unused data is garbage collected after 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Don't refetch on window focus (prevents unnecessary network requests)
      refetchOnWindowFocus: false,
      
      // Don't refetch on mount if data is fresh (use cached data)
      refetchOnMount: false,
      
      // Refetch on reconnect (good for offline/online scenarios)
      refetchOnReconnect: true,
      
      // Only retry once on failure (fail fast)
      retry: 1,
      
      // Retry delay: 1 second
      retryDelay: 1000,
      
      // Enable background refetching for stale data
      refetchInterval: false, // Don't auto-refetch (manual control)
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Retry delay: 1 second
      retryDelay: 1000,
    },
  },
  
  // Global query cache configuration
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Log query errors
      logger.error(
        `Query error for key: ${JSON.stringify(query.queryKey)}`,
        'REACT_QUERY',
        { queryKey: query.queryKey },
        error as Error
      );
    },
    onSuccess: (data, query) => {
      // Log successful queries in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          `Query success for key: ${JSON.stringify(query.queryKey)}`,
          'REACT_QUERY',
          { queryKey: query.queryKey }
        );
      }
    },
  }),
  
  // Global mutation cache configuration
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Log mutation errors
      logger.error(
        `Mutation error`,
        'REACT_QUERY',
        { mutationKey: mutation.options.mutationKey },
        error as Error
      );
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      // Log successful mutations in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          `Mutation success`,
          'REACT_QUERY',
          { mutationKey: mutation.options.mutationKey }
        );
      }
    },
  }),
});

/**
 * QueryClientProvider component
 * Wraps the application with React Query provider
 */
export const QueryClientProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
};

/**
 * Export queryClient for direct access (e.g., for invalidation)
 */
export { queryClient };

