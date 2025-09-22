// src/hooks/useEnhancedUserProfileData.ts

import { useCallback } from 'react';
import { useEnhancedParallelDataFetching } from './useEnhancedDataFetching';
import { getDashboardStats, DashboardStats } from '../services/dashboard';
import { getUserSocialStats } from '../services/leaderboards';
import { getUserReviews } from '../services/firestore-exports';
import { SocialStats } from '../types/gamification';

export interface UserProfileData {
  stats: DashboardStats;
  social: SocialStats;
  reviews: any[];
}

export interface UserProfileDataReturn {
  data: UserProfileData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  // Computed values
  reputationScore: number | null;
  reviewsMeta: { avg: number; count: number } | null;
  reviewsPreview: Array<{ rating: number; comment: string }>;
  // Cache information
  cacheStats: Record<string, { hit: boolean; stale: boolean }>;
  isStale: boolean;
}

/**
 * Enhanced hook for fetching comprehensive user profile data with intelligent caching
 * Replaces the basic useUserProfileData with advanced caching strategies
 */
export const useEnhancedUserProfileData = (
  userId: string,
  options: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchInterval?: number;
    cacheStrategy?: 'aggressive' | 'balanced' | 'conservative';
  } = {}
): UserProfileDataReturn => {
  const { cacheStrategy = 'balanced' } = options;

  // Configure cache strategy
  const getCacheConfig = (priority: 'low' | 'medium' | 'high' | 'critical', ttl: number) => {
    const baseConfig = {
      enabled: true,
      ttl,
      priority,
      tags: [`user:${userId}`, 'profile-data'],
      persist: priority === 'critical',
      staleWhileRevalidate: true,
      backgroundRefresh: cacheStrategy === 'aggressive'
    };

    switch (cacheStrategy) {
      case 'aggressive':
        return { ...baseConfig, ttl: ttl * 2, backgroundRefresh: true };
      case 'conservative':
        return { ...baseConfig, ttl: ttl * 0.5, backgroundRefresh: false };
      default:
        return baseConfig;
    }
  };

  const fetchFunctions = {
    stats: useCallback(async () => {
      const result = await getDashboardStats(userId);
      return { success: result.success, data: result.data, error: result.error };
    }, [userId]),
    social: useCallback(async () => {
      const result = await getUserSocialStats(userId);
      return { success: result.success, data: result.data, error: result.error };
    }, [userId]),
    reviews: useCallback(async () => {
      const result = await getUserReviews(userId);
      return { success: !result.error, data: result.data, error: result.error?.message };
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
    cache: getCacheConfig('high', 10 * 60 * 1000), // 10 minutes for profile data
    keyGenerator: (key) => `user_profile_${userId}_${key}`
  });

  // Compute derived values
  const reputationScore = results?.stats ? (results.stats as DashboardStats).currentXP : null;
  
  const reviewsMeta = results?.reviews ? (() => {
    const reviews = results.reviews as any[];
    if (!reviews.length) return null;
    const avg = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;
    return { avg: Math.round(avg * 10) / 10, count: reviews.length };
  })() : null;

  const reviewsPreview = results?.reviews ? (results.reviews as any[])
    .slice(0, 3)
    .map(review => ({ rating: review.rating || 0, comment: review.comment || '' })) : [];

  // Check if any data is stale
  const isStale = Object.values(cacheStats).some(stat => stat.stale);

  return {
    data: data as UserProfileData | null,
    loading,
    error,
    refetch,
    isRefetching,
    reputationScore,
    reviewsMeta,
    reviewsPreview,
    cacheStats,
    isStale
  };
};
