/**
 * React Query Hook for Trades Data
 * Phase 3B: Data Refetch Optimization
 * 
 * Replaces useTradesData with React Query for intelligent caching
 */

import { useQuery } from '@tanstack/react-query';
import { tradeService } from '../../../services/entities/TradeService';
import { logger } from '@utils/logging/logger';

/**
 * Trade data interface
 */
export interface TradeData {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  participantId?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Fetch trades for a user
 */
const fetchTrades = async (targetUserId: string): Promise<TradeData[]> => {
  try {
    const res = await tradeService.getActiveTradesForUser(targetUserId);
    if (res.error) {
      logger.error('Failed to load trades:', 'PAGE', {}, res.error as Error);
      return [];
    }
    return (res.data as TradeData[]) || [];
  } catch (error) {
    logger.error('Error fetching trades:', 'PAGE', {}, error as Error);
    return [];
  }
};

/**
 * React Query hook for trades data
 */
export const useTradesDataQuery = (
  targetUserId: string | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['trades', targetUserId],
    queryFn: () => fetchTrades(targetUserId!),
    enabled: !!targetUserId && enabled,
    // Data is fresh for 5 minutes (inherited from global config)
    staleTime: 5 * 60 * 1000,
  });
};

