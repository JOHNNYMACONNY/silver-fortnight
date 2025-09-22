// src/hooks/usePortfolioItems.ts

import { useCallback } from 'react';
import { useDataFetching } from './useDataFetching';
import { getUserPortfolioItems } from '../services/portfolio';
import { PortfolioItem } from '../types/portfolio';

export interface UsePortfolioItemsOptions {
  includePrivate?: boolean;
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: PortfolioItem[]) => void;
  onError?: (error: string) => void;
}

export interface UsePortfolioItemsReturn {
  data: PortfolioItem[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

/**
 * Hook for fetching portfolio items
 * Standardizes the data fetching pattern used in PortfolioTab.tsx
 */
export const usePortfolioItems = (
  userId: string,
  options: UsePortfolioItemsOptions = {}
): UsePortfolioItemsReturn => {
  const { includePrivate = false, ...fetchOptions } = options;

  const fetchPortfolioItems = useCallback(async () => {
    const portfolioOptions = includePrivate ? {} : { onlyVisible: true };
    const items = await getUserPortfolioItems(userId, portfolioOptions);
    
    // Convert to ServiceResponse format for consistency
    return {
      success: true,
      data: items
    };
  }, [userId, includePrivate]);

  return useDataFetching(fetchPortfolioItems, fetchOptions);
};
