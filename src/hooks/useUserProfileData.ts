// src/hooks/useUserProfileData.ts

import { useCallback } from 'react';
import { useParallelDataFetching } from './useDataFetching';
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
}

/**
 * Hook for fetching comprehensive user profile data
 * Replaces the complex inline data fetching in ProfilePage.tsx
 */
export const useUserProfileData = (
  userId: string,
  options: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchInterval?: number;
  } = {}
): UserProfileDataReturn => {
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

  const { data, loading, error, refetch, isRefetching } = useParallelDataFetching(
    fetchFunctions,
    options
  );

  // Compute derived values
  const reputationScore = data ? (() => {
    const stats = data.stats as DashboardStats;
    const social = data.social as SocialStats;
    
    if (!stats || !social) return null;
    
    // Composite reputation: XP (50%), trades (30%), followers (20%)
    const xpNorm = Math.min(1, Number(stats.currentXP || 0) / 5000);
    const tradesNorm = Math.min(1, Number(stats.totalTrades || 0) / 100);
    const followersNorm = Math.min(1, Number(social.followersCount || 0) / 1000);
    
    return Math.round(100 * (0.5 * xpNorm + 0.3 * tradesNorm + 0.2 * followersNorm));
  })() : null;

  const reviewsMeta = data?.reviews ? (() => {
    const reviews = data.reviews as any[];
    const count = reviews.length;
    const avg = count > 0 
      ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / count 
      : 0;
    return { avg, count };
  })() : null;

  const reviewsPreview = data?.reviews ? (() => {
    const reviews = data.reviews as any[];
    return reviews.slice(0, 2).map((r: any) => ({ 
      rating: Number(r.rating || 0), 
      comment: String(r.comment || '') 
    }));
  })() : [];

  return {
    data: data as UserProfileData | null,
    loading,
    error,
    refetch,
    isRefetching,
    reputationScore,
    reviewsMeta,
    reviewsPreview
  };
};
