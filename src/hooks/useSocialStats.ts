// src/hooks/useSocialStats.ts

import { useCallback } from 'react';
import { useDataFetching } from './useDataFetching';
import { getUserSocialStats } from '../services/leaderboards';
import { SocialStats } from '../types/gamification';

export interface UseSocialStatsOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: SocialStats) => void;
  onError?: (error: string) => void;
}

export interface UseSocialStatsReturn {
  data: SocialStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

/**
 * Hook for fetching user social statistics
 * Standardizes the data fetching pattern used in SocialFeatures.tsx
 */
export const useSocialStats = (
  userId: string,
  options: UseSocialStatsOptions = {}
): UseSocialStatsReturn => {
  const fetchSocialStats = useCallback(() => 
    getUserSocialStats(userId), 
    [userId]
  );

  return useDataFetching<SocialStats>(fetchSocialStats, options);
};
