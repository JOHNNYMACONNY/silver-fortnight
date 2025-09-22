// src/contexts/RealtimeContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { realtimeService, RealtimeStats } from '../services/realtime/realtimeService';
import { useAuth } from '../AuthContext';

export interface RealtimeContextValue {
  // Connection status
  isConnected: boolean;
  isReconnecting: boolean;
  
  // Statistics
  stats: RealtimeStats;
  
  // Active listeners
  activeListeners: string[];
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Listener management
  startUserListeners: (userId: string) => void;
  stopUserListeners: (userId: string) => void;
  startLeaderboardListeners: (category: string, period: string) => void;
  stopLeaderboardListeners: (category: string, period: string) => void;
  
  // Utility functions
  isListenerActive: (listenerId: string) => boolean;
  getConnectionHealth: () => 'healthy' | 'degraded' | 'offline';
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export interface RealtimeProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  autoConnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}) => {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [stats, setStats] = useState<RealtimeStats>(realtimeService.getStats());
  const [activeListeners, setActiveListeners] = useState<string[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [reconnectTimeout, setReconnectTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      setStats(realtimeService.getStats());
      setActiveListeners(realtimeService.getActiveListeners());
      setIsConnected(realtimeService.getActiveListeners().length > 0);
    };

    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (autoConnect && currentUser && !isConnected) {
      connect();
    }
  }, [autoConnect, currentUser, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      realtimeService.cleanup();
    };
  }, [reconnectTimeout]);

  const connect = useCallback(() => {
    if (isConnected) return;

    try {
      setIsReconnecting(false);
      setReconnectAttempts(0);
      
      // Start basic listeners if user is available
      if (currentUser) {
        startUserListeners(currentUser.uid);
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to real-time service:', error);
      setIsConnected(false);
    }
  }, [isConnected, currentUser]);

  const disconnect = useCallback(() => {
    realtimeService.cleanup();
    setIsConnected(false);
    setActiveListeners([]);
    setReconnectAttempts(0);
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      setReconnectTimeout(null);
    }
  }, [reconnectTimeout]);

  const reconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    setReconnectAttempts(prev => prev + 1);

    // Clear existing timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    // Schedule reconnection
    const timeout = setTimeout(() => {
      connect();
      setIsReconnecting(false);
    }, reconnectInterval);

    setReconnectTimeout(timeout);
  }, [reconnectAttempts, maxReconnectAttempts, reconnectInterval, connect, reconnectTimeout]);

  const startUserListeners = useCallback((userId: string) => {
    if (!userId) return;

    // Start social stats listener
    realtimeService.startSocialStatsListener(userId);
    
    // Start XP listener
    realtimeService.startXPListener(userId);
    
    // Start follow listener
    realtimeService.startFollowListener(userId);
    
    setActiveListeners(realtimeService.getActiveListeners());
  }, []);

  const stopUserListeners = useCallback((userId: string) => {
    if (!userId) return;

    // Stop user-specific listeners
    realtimeService.stopListener(`social_stats_${userId}`);
    realtimeService.stopListener(`xp_${userId}`);
    realtimeService.stopListener(`follow_${userId}`);
    
    setActiveListeners(realtimeService.getActiveListeners());
  }, []);

  const startLeaderboardListeners = useCallback((category: string, period: string) => {
    realtimeService.startLeaderboardListener(category, period);
    setActiveListeners(realtimeService.getActiveListeners());
  }, []);

  const stopLeaderboardListeners = useCallback((category: string, period: string) => {
    realtimeService.stopListener(`leaderboard_${category}_${period}`);
    setActiveListeners(realtimeService.getActiveListeners());
  }, []);

  const isListenerActive = useCallback((listenerId: string) => {
    return realtimeService.isListenerActive(listenerId);
  }, []);

  const getConnectionHealth = useCallback((): 'healthy' | 'degraded' | 'offline' => {
    if (!isConnected) return 'offline';
    
    const errorRate = stats.errorCount / Math.max(stats.totalUpdates, 1);
    if (errorRate > 0.1) return 'degraded';
    
    return 'healthy';
  }, [isConnected, stats]);

  // Monitor connection health
  useEffect(() => {
    const health = getConnectionHealth();
    if (health === 'offline' && !isReconnecting && reconnectAttempts < maxReconnectAttempts) {
      reconnect();
    }
  }, [getConnectionHealth, isReconnecting, reconnectAttempts, maxReconnectAttempts, reconnect]);

  const value: RealtimeContextValue = {
    isConnected,
    isReconnecting,
    stats,
    activeListeners,
    connect,
    disconnect,
    reconnect,
    startUserListeners,
    stopUserListeners,
    startLeaderboardListeners,
    stopLeaderboardListeners,
    isListenerActive,
    getConnectionHealth
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextValue => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

// Hook for real-time connection status display
export const useRealtimeStatus = () => {
  const { isConnected, isReconnecting, stats, getConnectionHealth } = useRealtime();
  
  const health = getConnectionHealth();
  
  const getStatusInfo = () => {
    if (isReconnecting) {
      return {
        status: 'reconnecting',
        text: 'Reconnecting...',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '🔄'
      };
    }
    
    if (!isConnected) {
      return {
        status: 'offline',
        text: 'Offline',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '🔴'
      };
    }
    
    switch (health) {
      case 'healthy':
        return {
          status: 'healthy',
          text: 'Live',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: '🟢'
        };
      case 'degraded':
        return {
          status: 'degraded',
          text: 'Unstable',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: '🟡'
        };
      default:
        return {
          status: 'offline',
          text: 'Offline',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: '🔴'
        };
    }
  };

  return {
    isConnected,
    isReconnecting,
    health,
    stats,
    statusInfo: getStatusInfo()
  };
};
