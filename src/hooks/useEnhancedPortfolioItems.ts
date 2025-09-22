// src/hooks/useEnhancedPortfolioItems.ts

import { useCallback } from 'react';
import { useEnhancedDataFetching } from './useEnhancedDataFetching';
import { getUserPortfolioItems } from '../services/portfolio';
import { PortfolioItem } from '../types/portfolio';

export interface UseEnhancedPortfolioItemsOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  cacheStrategy?: 'aggressive' | 'balanced' | 'conservative';
  onSuccess?: (data: PortfolioItem[]) => void;
  onError?: (error: string) => void;
}

export interface UseEnhancedPortfolioItemsReturn {
  data: PortfolioItem[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  isStale: boolean;
  cacheHit: boolean;
  lastFetched: number | null;
}

/**
 * Enhanced hook for fetching portfolio items with intelligent caching
 * Portfolio data changes moderately, so we use balanced caching by default
 */
export const useEnhancedPortfolioItems = (
  userId: string,
  options: UseEnhancedPortfolioItemsOptions = {}
): UseEnhancedPortfolioItemsReturn => {
  const { cacheStrategy = 'balanced' } = options;

  // Configure cache based on strategy
  const getCacheConfig = () => {
    const baseConfig = {
      enabled: true,
      tags: [`user:${userId}`, 'portfolio'],
      persist: true, // Portfolio data is worth persisting
      staleWhileRevalidate: true,
      backgroundRefresh: false
    };

    switch (cacheStrategy) {
      case 'aggressive':
        return {
          ...baseConfig,
          ttl: 20 * 60 * 1000, // 20 minutes
          priority: 'high' as const,
          backgroundRefresh: true
        };
      case 'conservative':
        return {
          ...baseConfig,
          ttl: 3 * 60 * 1000, // 3 minutes
          priority: 'medium' as const,
          backgroundRefresh: false
        };
      default: // balanced
        return {
          ...baseConfig,
          ttl: 10 * 60 * 1000, // 10 minutes
          priority: 'medium' as const,
          backgroundRefresh: true
        };
    }
  };

  const fetchPortfolioItems = useCallback(async () => {
    try {
      const data = await getUserPortfolioItems(userId);
      return { success: true, data, error: null };
    } catch (error) {
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio items' 
      };
    }
  }, [userId]);

  return useEnhancedDataFetching<PortfolioItem[]>(fetchPortfolioItems, {
    ...options,
    cache: getCacheConfig(),
    keyGenerator: () => `portfolio_items_${userId}`
  });
};
