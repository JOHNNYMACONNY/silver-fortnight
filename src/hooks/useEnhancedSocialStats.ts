// src/hooks/useEnhancedSocialStats.ts

import { useCallback } from 'react';
import { useEnhancedDataFetching } from './useEnhancedDataFetching';
import { getUserSocialStats } from '../services/leaderboards';
import { SocialStats } from '../types/gamification';

export interface UseEnhancedSocialStatsOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  cacheStrategy?: 'aggressive' | 'balanced' | 'conservative';
  onSuccess?: (data: SocialStats) => void;
  onError?: (error: string) => void;
}

export interface UseEnhancedSocialStatsReturn {
  data: SocialStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  isStale: boolean;
  cacheHit: boolean;
  lastFetched: number | null;
}

/**
 * Enhanced hook for fetching social statistics with intelligent caching
 * Provides different caching strategies based on data volatility
 */
export const useEnhancedSocialStats = (
  userId: string,
  options: UseEnhancedSocialStatsOptions = {}
): UseEnhancedSocialStatsReturn => {
  const { cacheStrategy = 'balanced' } = options;

  // Configure cache based on strategy
  const getCacheConfig = () => {
    const baseConfig = {
      enabled: true,
      tags: [`user:${userId}`, 'social-stats'],
      persist: false,
      staleWhileRevalidate: true,
      backgroundRefresh: false
    };

    switch (cacheStrategy) {
      case 'aggressive':
        return {
          ...baseConfig,
          ttl: 15 * 60 * 1000, // 15 minutes
          priority: 'high' as const,
          backgroundRefresh: true
        };
      case 'conservative':
        return {
          ...baseConfig,
          ttl: 2 * 60 * 1000, // 2 minutes
          priority: 'medium' as const,
          backgroundRefresh: false
        };
      default: // balanced
        return {
          ...baseConfig,
          ttl: 5 * 60 * 1000, // 5 minutes
          priority: 'medium' as const,
          backgroundRefresh: true
        };
    }
  };

  const fetchSocialStats = useCallback(async () => {
    const result = await getUserSocialStats(userId);
    return { success: result.success, data: result.data, error: result.error };
  }, [userId]);

  return useEnhancedDataFetching<SocialStats>(fetchSocialStats, {
    ...options,
    cache: getCacheConfig(),
    keyGenerator: () => `social_stats_${userId}`
  });
};
