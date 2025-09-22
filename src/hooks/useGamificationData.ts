// src/hooks/useGamificationData.ts

import { useCallback } from 'react';
import { useParallelDataFetching } from './useDataFetching';
import { getUserXP, getUserXPHistory } from '../services/gamification';
import { getUserAchievements } from '../services/achievements';
import { UserXP, XPTransaction } from '../types/gamification';
import { UserAchievement } from '../types/gamification';

export interface GamificationData {
  xp: UserXP;
  history: XPTransaction[];
  achievements: UserAchievement[];
}

export interface UseGamificationDataOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: GamificationData) => void;
  onError?: (error: string) => void;
}

export interface UseGamificationDataReturn {
  data: GamificationData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

/**
 * Hook for fetching comprehensive gamification data
 * Standardizes the data fetching pattern used in GamificationDashboard.tsx
 */
export const useGamificationData = (
  userId: string,
  options: UseGamificationDataOptions = {}
): UseGamificationDataReturn => {
  const fetchFunctions = {
    xp: useCallback(() => getUserXP(userId), [userId]),
    history: useCallback(() => getUserXPHistory(userId, 10), [userId]),
    achievements: useCallback(() => getUserAchievements(userId), [userId])
  };

  return useParallelDataFetching<GamificationData>(fetchFunctions, options);
};
