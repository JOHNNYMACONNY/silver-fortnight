// src/hooks/useRealtimeUpdates.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService, RealtimeUpdate } from '../services/realtime/realtimeService';
import { SocialStats, LeaderboardEntry, UserXP } from '../types/gamification';

export interface UseRealtimeSocialStatsOptions {
  userId: string;
  enabled?: boolean;
  onUpdate?: (stats: SocialStats) => void;
}

export interface UseRealtimeSocialStatsReturn {
  stats: SocialStats | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  isConnected: boolean;
}

/**
 * Hook for real-time social stats updates
 */
export const useRealtimeSocialStats = ({
  userId,
  enabled = true,
  onUpdate
}: UseRealtimeSocialStatsOptions): UseRealtimeSocialStatsReturn => {
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const subscriberIdRef = useRef<string>(`social_stats_${userId}_${Date.now()}`);

  const handleUpdate = useCallback((update: RealtimeUpdate<SocialStats>) => {
    if (update.type === 'social_stats' && update.userId === userId) {
      setStats(update.data);
      setLastUpdate(update.timestamp);
      setLoading(false);
      setError(null);
      setIsConnected(true);
      onUpdate?.(update.data);
    }
  }, [userId, onUpdate]);

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to updates
    realtimeService.subscribe(
      subscriberIdRef.current,
      handleUpdate,
      {
        userIds: [userId],
        types: ['social_stats']
      }
    );

    // Start the listener
    realtimeService.startSocialStatsListener(userId);

    return () => {
      realtimeService.unsubscribe(subscriberIdRef.current);
      realtimeService.stopListener(`social_stats_${userId}`);
    };
  }, [userId, enabled, handleUpdate]);

  return {
    stats,
    loading,
    error,
    lastUpdate,
    isConnected
  };
};

export interface UseRealtimeLeaderboardOptions {
  category: string;
  period: string;
  limit?: number;
  enabled?: boolean;
  onUpdate?: (entries: LeaderboardEntry[]) => void;
}

export interface UseRealtimeLeaderboardReturn {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  isConnected: boolean;
}

/**
 * Hook for real-time leaderboard updates
 */
export const useRealtimeLeaderboard = ({
  category,
  period,
  limit = 50,
  enabled = true,
  onUpdate
}: UseRealtimeLeaderboardOptions): UseRealtimeLeaderboardReturn => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const subscriberIdRef = useRef<string>(`leaderboard_${category}_${period}_${Date.now()}`);

  const handleUpdate = useCallback((update: RealtimeUpdate<{ category: string; period: string; entries: LeaderboardEntry[] }>) => {
    if (update.type === 'leaderboard' && update.data.category === category && update.data.period === period) {
      setEntries(update.data.entries);
      setLastUpdate(update.timestamp);
      setLoading(false);
      setError(null);
      setIsConnected(true);
      onUpdate?.(update.data.entries);
    }
  }, [category, period, onUpdate]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to updates
    realtimeService.subscribe(
      subscriberIdRef.current,
      handleUpdate,
      {
        types: ['leaderboard']
      }
    );

    // Start the listener
    realtimeService.startLeaderboardListener(category, period, limit);

    return () => {
      realtimeService.unsubscribe(subscriberIdRef.current);
      realtimeService.stopListener(`leaderboard_${category}_${period}`);
    };
  }, [category, period, limit, enabled, handleUpdate]);

  return {
    entries,
    loading,
    error,
    lastUpdate,
    isConnected
  };
};

export interface UseRealtimeXPOptions {
  userId: string;
  enabled?: boolean;
  onUpdate?: (xp: UserXP) => void;
}

export interface UseRealtimeXPReturn {
  xp: UserXP | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  isConnected: boolean;
}

/**
 * Hook for real-time XP updates
 */
export const useRealtimeXP = ({
  userId,
  enabled = true,
  onUpdate
}: UseRealtimeXPOptions): UseRealtimeXPReturn => {
  const [xp, setXp] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const subscriberIdRef = useRef<string>(`xp_${userId}_${Date.now()}`);

  const handleUpdate = useCallback((update: RealtimeUpdate<UserXP>) => {
    if (update.type === 'xp_update' && update.userId === userId) {
      setXp(update.data);
      setLastUpdate(update.timestamp);
      setLoading(false);
      setError(null);
      setIsConnected(true);
      onUpdate?.(update.data);
    }
  }, [userId, onUpdate]);

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to updates
    realtimeService.subscribe(
      subscriberIdRef.current,
      handleUpdate,
      {
        userIds: [userId],
        types: ['xp_update']
      }
    );

    // Start the listener
    realtimeService.startXPListener(userId);

    return () => {
      realtimeService.unsubscribe(subscriberIdRef.current);
      realtimeService.stopListener(`xp_${userId}`);
    };
  }, [userId, enabled, handleUpdate]);

  return {
    xp,
    loading,
    error,
    lastUpdate,
    isConnected
  };
};

export interface UseRealtimeFollowOptions {
  userId: string;
  enabled?: boolean;
  onUpdate?: (followersCount: number) => void;
}

export interface UseRealtimeFollowReturn {
  followersCount: number;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  isConnected: boolean;
}

/**
 * Hook for real-time follow/unfollow updates
 */
export const useRealtimeFollow = ({
  userId,
  enabled = true,
  onUpdate
}: UseRealtimeFollowOptions): UseRealtimeFollowReturn => {
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const subscriberIdRef = useRef<string>(`follow_${userId}_${Date.now()}`);

  const handleUpdate = useCallback((update: RealtimeUpdate<{ followersCount: number }>) => {
    if (update.type === 'follow' && update.userId === userId) {
      setFollowersCount(update.data.followersCount);
      setLastUpdate(update.timestamp);
      setLoading(false);
      setError(null);
      setIsConnected(true);
      onUpdate?.(update.data.followersCount);
    }
  }, [userId, onUpdate]);

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to updates
    realtimeService.subscribe(
      subscriberIdRef.current,
      handleUpdate,
      {
        userIds: [userId],
        types: ['follow']
      }
    );

    // Start the listener
    realtimeService.startFollowListener(userId);

    return () => {
      realtimeService.unsubscribe(subscriberIdRef.current);
      realtimeService.stopListener(`follow_${userId}`);
    };
  }, [userId, enabled, handleUpdate]);

  return {
    followersCount,
    loading,
    error,
    lastUpdate,
    isConnected
  };
};

/**
 * Hook for managing multiple real-time subscriptions
 */
export const useRealtimeManager = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState(realtimeService.getStats());

  useEffect(() => {
    const updateStats = () => {
      setStats(realtimeService.getStats());
      setIsConnected(realtimeService.getActiveListeners().length > 0);
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const cleanup = useCallback(() => {
    realtimeService.cleanup();
    setIsConnected(false);
    setStats(realtimeService.getStats());
  }, []);

  return {
    isConnected,
    stats,
    cleanup,
    getActiveListeners: () => realtimeService.getActiveListeners()
  };
};
