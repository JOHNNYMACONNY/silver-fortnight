import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getDashboardStats, getRecentActivity, DashboardStats, RecentActivity } from '../services/dashboard';
import { logger } from '@utils/logging/logger';

export const useDashboardData = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch stats and recent activity in parallel
        const [statsResult, activityResult] = await Promise.all([
          getDashboardStats(currentUser.uid),
          getRecentActivity(currentUser.uid, 5)
        ]);

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        } else {
          setError(statsResult.error || 'Failed to load dashboard stats');
        }

        if (activityResult.success && activityResult.data) {
          setRecentActivity(activityResult.data);
        }

      } catch (err) {
        logger.error('Error fetching dashboard data:', 'APP', {}, err as Error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser?.uid]);

  const refreshData = async () => {
    if (!currentUser?.uid) return;

    try {
      setError(null);
      
      const [statsResult, activityResult] = await Promise.all([
        getDashboardStats(currentUser.uid),
        getRecentActivity(currentUser.uid, 5)
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (activityResult.success && activityResult.data) {
        setRecentActivity(activityResult.data);
      }
    } catch (err) {
      logger.error('Error refreshing dashboard data:', 'APP', {}, err as Error);
      setError('Failed to refresh dashboard data');
    }
  };

  return {
    stats,
    recentActivity,
    loading,
    error,
    refreshData
  };
};
