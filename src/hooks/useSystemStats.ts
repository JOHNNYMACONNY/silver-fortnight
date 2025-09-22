import { useState, useEffect } from 'react';
import { getSystemStats, SystemStats } from '../services/firestore-extensions';

export interface UseSystemStatsReturn {
  stats: SystemStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook for fetching global system statistics
 * Used for displaying community-wide stats on home page and other public areas
 */
export const useSystemStats = (): UseSystemStatsReturn => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemStats();
      
      if (result.data) {
        setStats(result.data);
        setLastUpdated(result.data.lastUpdated.toDate());
      } else {
        setError(result.error?.message || 'Failed to load system statistics');
      }
    } catch (err) {
      console.error('Error fetching system stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh,
    lastUpdated
  };
};
