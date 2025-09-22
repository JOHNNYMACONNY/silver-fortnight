import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getRecentActivity } from '../services/dashboard';

export interface ActivityItem {
  id: string;
  type: 'trade' | 'collaboration' | 'challenge' | 'user' | 'xp';
  description: string;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: {
    amount?: number;
    isPositive?: boolean;
    status?: string;
  };
}

export interface UseRecentActivityFeedReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook for fetching recent activity feed for home page
 * Combines multiple data sources to show community activity
 */
export const useRecentActivityFeed = (limit: number = 10): UseRecentActivityFeedReturn => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const activityItems: ActivityItem[] = [];

      // Get user-specific recent activity if authenticated
      if (currentUser?.uid) {
        const result = await getRecentActivity(currentUser.uid, Math.min(5, limit));
        if (result.success && result.data) {
          for (const activity of result.data) {
            activityItems.push({
              id: activity.id,
              type: activity.type as any,
              description: activity.description,
              timestamp: activity.timestamp,
              user: {
                id: currentUser.uid,
                name: currentUser.displayName || 'You',
                avatar: currentUser.photoURL || undefined
              },
              metadata: {
                amount: activity.amount,
                isPositive: activity.isPositive
              }
            });
          }
        }
      }

      // Add some mock community activities for demo purposes
      // In a real implementation, you might fetch these from a separate service
      const communityActivities: ActivityItem[] = [
        {
          id: 'community-1',
          type: 'trade',
          description: 'New trade: Web Dev for UI Design',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          user: {
            id: 'user-1',
            name: 'Alex Chen'
          }
        },
        {
          id: 'community-2',
          type: 'collaboration',
          description: 'Joined: Mobile App Team',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          user: {
            id: 'user-2',
            name: 'Sarah Johnson'
          }
        },
        {
          id: 'community-3',
          type: 'challenge',
          description: 'Completed: UI/UX Design Sprint',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          user: {
            id: 'user-3',
            name: 'Mike Rodriguez'
          }
        },
        {
          id: 'community-4',
          type: 'user',
          description: 'New user: Sarah Chen (Designer)',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
          user: {
            id: 'user-4',
            name: 'Sarah Chen'
          }
        }
      ];

      // Combine and sort activities
      const allActivities = [...activityItems, ...communityActivities]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      setActivities(allActivities);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching recent activity feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchActivities();
  };

  useEffect(() => {
    fetchActivities();
  }, [currentUser?.uid, limit]);

  return {
    activities,
    loading,
    error,
    refresh,
    lastUpdated
  };
};
