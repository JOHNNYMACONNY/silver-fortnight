// src/hooks/usePortfolioData.ts

import { useState, useEffect, useCallback } from 'react';
import { PortfolioItem } from '../types/portfolio';
import { getPortfolioStatsForDisplay, getPortfolioStatsFallback } from '../services/portfolioStats';
import { getUserPortfolioItems } from '../services/portfolio';

export interface UsePortfolioDataReturn {
  // Portfolio items
  portfolioItems: PortfolioItem[];
  portfolioItemsLoading: boolean;
  portfolioItemsError: string | null;
  
  // Statistics
  stats: {
    totalProjects: number;
    averageRating: number;
    skillsCount: number;
    completedTrades: number;
    featuredProjects: number;
    recentProjects: number;
  };
  statsLoading: boolean;
  statsError: string | null;
  
  // Actions
  refreshPortfolio: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export interface UsePortfolioDataOptions {
  includePrivate?: boolean;
  timeRange?: 'all' | 'month' | 'quarter' | 'year';
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

/**
 * Custom hook for managing portfolio data and statistics
 */
export function usePortfolioData(
  userId: string,
  options: UsePortfolioDataOptions = {}
): UsePortfolioDataReturn {
  const {
    includePrivate = false,
    timeRange = 'all',
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  // Portfolio items state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioItemsLoading, setPortfolioItemsLoading] = useState(false);
  const [portfolioItemsError, setPortfolioItemsError] = useState<string | null>(null);

  // Statistics state
  const [stats, setStats] = useState({
    totalProjects: 0,
    averageRating: 0,
    skillsCount: 0,
    completedTrades: 0,
    featuredProjects: 0,
    recentProjects: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch portfolio items
  const fetchPortfolioItems = useCallback(async () => {
    if (!userId) return;
    
    setPortfolioItemsLoading(true);
    setPortfolioItemsError(null);
    
    try {
      const portfolioOptions = includePrivate ? {} : { onlyVisible: true };
      const items = await getUserPortfolioItems(userId, portfolioOptions);
      setPortfolioItems(items);
    } catch (error) {
      console.error('Error fetching portfolio items:', error);
      setPortfolioItemsError(error instanceof Error ? error.message : 'Failed to fetch portfolio items');
    } finally {
      setPortfolioItemsLoading(false);
    }
  }, [userId, includePrivate]);

  // Fetch portfolio statistics
  const fetchStats = useCallback(async () => {
    if (!userId) return;
    
    setStatsLoading(true);
    setStatsError(null);
    
    try {
      const result = await getPortfolioStatsForDisplay(userId, {
        includePrivate,
        timeRange
      });
      
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setStatsError(result.error || 'Failed to fetch portfolio statistics');
        setStats({
          totalProjects: 0,
          averageRating: 0,
          skillsCount: 0,
          completedTrades: 0,
          featuredProjects: 0,
          recentProjects: 0
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio stats:', error);
      setStatsError(error instanceof Error ? error.message : 'Failed to fetch portfolio statistics');
      setStats({
        totalProjects: 0,
        averageRating: 0,
        skillsCount: 0,
        completedTrades: 0,
        featuredProjects: 0,
        recentProjects: 0
      });
    } finally {
      setStatsLoading(false);
    }
  }, [userId, includePrivate, timeRange]);

  // Refresh portfolio items
  const refreshPortfolio = useCallback(async () => {
    await fetchPortfolioItems();
  }, [fetchPortfolioItems]);

  // Refresh statistics
  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPortfolioItems(), fetchStats()]);
  }, [fetchPortfolioItems, fetchStats]);

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      refreshAll();
    }
  }, [userId, refreshAll]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !userId) return;
    
    const interval = setInterval(() => {
      refreshAll();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAll, userId]);

  return {
    // Portfolio items
    portfolioItems,
    portfolioItemsLoading,
    portfolioItemsError,
    
    // Statistics
    stats,
    statsLoading,
    statsError,
    
    // Actions
    refreshPortfolio,
    refreshStats,
    refreshAll
  };
}
