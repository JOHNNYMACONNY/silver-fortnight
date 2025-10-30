import { getUserTrades } from './firestore';
import { getUserXP, getUserXPHistory } from './gamification';
import { getConnections } from './firestore-exports';
import { ServiceResponse } from '../types/services';

export interface DashboardStats {
  tradesThisWeek: number;
  totalTrades: number;
  currentXP: number;
  xpEarnedThisWeek: number;
  activeConnections: number;
  totalConnections: number;
}

export interface RecentActivity {
  id: string;
  type: 'trade' | 'xp' | 'connection' | 'achievement';
  description: string;
  timestamp: Date;
  amount?: number; // For XP gains
  isPositive?: boolean;
}

export const getDashboardStats = async (userId: string): Promise<ServiceResponse<DashboardStats>> => {
  try {
    // Fetch XP separately to ensure it doesn't fail silently
    const xpData = await getUserXP(userId);
    
    // Fetch other data in parallel
    const [tradesResult, connectionsResult] = await Promise.allSettled([
      getUserTrades(userId, { includeNonPublic: true }),
      getConnections(userId)
    ]);

    // Calculate trades this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Handle trades data with fallbacks
    let totalTrades = 0;
    let tradesThisWeek = 0;
    
    if (tradesResult.status === 'fulfilled' && tradesResult.value.data) {
      totalTrades = tradesResult.value.data.length;
      tradesThisWeek = tradesResult.value.data.filter(trade => 
        trade.createdAt && trade.createdAt.toDate() > oneWeekAgo
      ).length;
    }

    // Handle XP data
    let currentXP = 0;
    if (xpData.success && xpData.data) {
      currentXP = xpData.data.totalXP;
    } else {
      console.warn('⚠️ Failed to fetch XP data:', xpData.error);
    }
    
    // Calculate XP gained this week (with error handling)
    let xpEarnedThisWeek = 0;
    try {
      const xpHistoryResult = await getUserXPHistory(userId, 50);
      if (xpHistoryResult.success && xpHistoryResult.data) {
        xpEarnedThisWeek = xpHistoryResult.data
          .filter(transaction => transaction.createdAt.toDate() > oneWeekAgo)
          .reduce((sum, transaction) => sum + transaction.amount, 0);
      }
    } catch (error) {
      console.warn('Could not fetch XP history:', error);
      // XP this week will remain 0
    }

    // Handle connections data with fallbacks
    let totalConnections = 0;
    if (connectionsResult.status === 'fulfilled' && connectionsResult.value.data) {
      totalConnections = connectionsResult.value.data.length;
    }
    
    // For now, assume all connections are "active" - we could enhance this later
    const activeConnections = totalConnections;

    const stats: DashboardStats = {
      tradesThisWeek,
      totalTrades,
      currentXP,
      xpEarnedThisWeek,
      activeConnections,
      totalConnections
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default stats instead of failing completely
    return {
      success: true,
      data: {
        tradesThisWeek: 0,
        totalTrades: 0,
        currentXP: 0,
        xpEarnedThisWeek: 0,
        activeConnections: 0,
        totalConnections: 0
      }
    };
  }
};

export const getRecentActivity = async (userId: string, limit: number = 10): Promise<ServiceResponse<RecentActivity[]>> => {
  try {
    const activities: RecentActivity[] = [];

    // Get recent XP transactions with error handling
    try {
      const xpHistoryResult = await getUserXPHistory(userId, limit);
      if (xpHistoryResult.success && xpHistoryResult.data) {
        for (const transaction of xpHistoryResult.data.slice(0, Math.min(limit, xpHistoryResult.data.length))) {
          activities.push({
            id: `xp-${transaction.id || Math.random()}`,
            type: 'xp',
            description: transaction.description || `Earned ${transaction.amount} XP`,
            timestamp: transaction.createdAt.toDate(),
            amount: transaction.amount,
            isPositive: transaction.amount > 0
          });
        }
      }
    } catch (error) {
      console.warn('Could not fetch XP history for activity:', error);
    }

    // Get recent trades with error handling
    try {
      const tradesResult = await getUserTrades(userId, { includeNonPublic: true });
      if (tradesResult.data) {
        const recentTrades = tradesResult.data
          .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
          .slice(0, Math.min(3, tradesResult.data.length));

        for (const trade of recentTrades) {
          activities.push({
            id: `trade-${trade.id}`,
            type: 'trade',
            description: `Completed trade: ${trade.title}`,
            timestamp: trade.createdAt.toDate()
          });
        }
      }
    } catch (error) {
      console.warn('Could not fetch trades for activity:', error);
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      success: true,
      data: activities.slice(0, limit)
    };
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return {
      success: true,
      data: [] // Return empty array instead of failing
    };
  }
};
