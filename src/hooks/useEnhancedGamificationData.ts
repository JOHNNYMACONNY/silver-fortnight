// src/hooks/useEnhancedGamificationData.ts

import { useCallback } from 'react';
import { useEnhancedParallelDataFetching } from './useEnhancedDataFetching';
import { getUserXP, getUserXPHistory } from '../services/gamification';
import { getUserAchievements } from '../services/achievements';
import { UserXP, XPTransaction, UserAchievement } from '../types/gamification';

export interface GamificationData {
  userXP: UserXP;
  xpHistory: XPTransaction[];
  userAchievements: UserAchievement[];
}

export interface UseEnhancedGamificationDataOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  cacheStrategy?: 'aggressive' | 'balanced' | 'conservative';
  onSuccess?: (data: GamificationData) => void;
  onError?: (error: string) => void;
}

export interface UseEnhancedGamificationDataReturn {
  data: GamificationData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  results: Partial<GamificationData>;
  cacheStats: Record<string, { hit: boolean; stale: boolean }>;
  isStale: boolean;
}

/**
 * Enhanced hook for fetching gamification data with intelligent caching
 * Gamification data changes frequently, so we use conservative caching by default
 */
export const useEnhancedGamificationData = (
  userId: string,
  options: UseEnhancedGamificationDataOptions = {}
): UseEnhancedGamificationDataReturn => {
  const { cacheStrategy = 'conservative' } = options;

  // Configure cache based on strategy
  const getCacheConfig = (dataType: 'xp' | 'history' | 'achievements') => {
    const baseConfig = {
      enabled: true,
      tags: [`user:${userId}`, 'gamification', dataType],
      persist: false,
      staleWhileRevalidate: true,
      backgroundRefresh: false
    };

    // Different TTLs for different data types
    const ttlMap = {
      xp: 2 * 60 * 1000, // 2 minutes - changes frequently
      history: 10 * 60 * 1000, // 10 minutes - changes less frequently
      achievements: 30 * 60 * 1000 // 30 minutes - changes rarely
    };

    switch (cacheStrategy) {
      case 'aggressive':
        return {
          ...baseConfig,
          ttl: ttlMap[dataType] * 2,
          priority: 'high' as const,
          backgroundRefresh: true
        };
      case 'conservative':
        return {
          ...baseConfig,
          ttl: ttlMap[dataType] * 0.5,
          priority: 'medium' as const,
          backgroundRefresh: false
        };
      default: // balanced
        return {
          ...baseConfig,
          ttl: ttlMap[dataType],
          priority: 'medium' as const,
          backgroundRefresh: true
        };
    }
  };

  const fetchFunctions = {
    userXP: useCallback(async () => {
      const result = await getUserXP(userId);
      return { success: result.success, data: result.data, error: result.error };
    }, [userId]),
    xpHistory: useCallback(async () => {
      const result = await getUserXPHistory(userId);
      return { success: result.success, data: result.data, error: result.error };
    }, [userId]),
    userAchievements: useCallback(async () => {
      const result = await getUserAchievements(userId);
      return { success: result.success, data: result.data, error: result.error };
    }, [userId])
  };

  const {
    data,
    loading,
    error,
    refetch,
    isRefetching,
    results,
    cacheStats
  } = useEnhancedParallelDataFetching(fetchFunctions, {
    ...options,
    cache: getCacheConfig('xp'), // Use XP config as base
    keyGenerator: (key) => `gamification_${userId}_${key}`
  });

  // Check if any data is stale
  const isStale = Object.values(cacheStats).some(stat => stat.stale);

  return {
    data: data as GamificationData | null,
    loading,
    error,
    refetch,
    isRefetching,
    results: results as Partial<GamificationData>,
    cacheStats,
    isStale
  };
};
