import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getFirebaseInstances } from '../firebase-config';
import { Trade, TradeStatus } from './firestore';
import { logger } from '@utils/logging/logger';

export interface TradeAnalytics {
  totalTrades: number;
  completedTrades: number;
  successRate: number;
  activeTrades: number;
  cancelledTrades: number;
  inProgressTrades: number;
  categories: {
    [category: string]: number;
  };
  averageCompletionTime?: number; // in days
}

export interface TradeAnalyticsOptions {
  timeRange?: {
    start: Date;
    end: Date;
  };
  includeNonPublic?: boolean;
  userId?: string; // For user-specific analytics
}

/**
 * Calculate comprehensive trade analytics from real data
 */
export const calculateTradeAnalytics = async (
  options: TradeAnalyticsOptions = {}
): Promise<TradeAnalytics> => {
  try {
    const { db } = await getFirebaseInstances();
    const tradesCollection = collection(db, 'trades');
    
    // Build query constraints
    const constraints = [];
    
    // Filter by visibility if needed
    if (!options.includeNonPublic) {
      constraints.push(where('visibility', '==', 'public'));
    }
    
    // Filter by user if specified
    if (options.userId) {
      constraints.push(where('creatorId', '==', options.userId));
    }
    
    // Filter by time range if specified
    if (options.timeRange) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(options.timeRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(options.timeRange.end))
      );
    }
    
    const q = query(tradesCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const trades = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Trade[];
    
    // Calculate analytics
    const totalTrades = trades.length;
    const completedTrades = trades.filter(trade => trade.status === 'completed').length;
    const activeStatuses: TradeStatus[] = ['open', 'in-progress', 'pending_confirmation', 'pending_evidence'];
    const activeTrades = trades.filter(trade => activeStatuses.includes(trade.status)).length;
    const cancelledTrades = trades.filter(trade => trade.status === 'cancelled').length;
    const inProgressStatuses: TradeStatus[] = ['in-progress', 'pending_confirmation', 'pending_evidence'];
    const inProgressTrades = trades.filter(trade => inProgressStatuses.includes(trade.status)).length;
    
    // Calculate success rate (completed / (completed + cancelled))
    const settledTrades = completedTrades + cancelledTrades;
    const successRate = settledTrades > 0 ? (completedTrades / settledTrades) * 100 : 0;
    
    // Calculate category distribution
    const categories: { [category: string]: number } = {};
    trades.forEach(trade => {
      if (trade.category) {
        categories[trade.category] = (categories[trade.category] || 0) + 1;
      }
    });
    
    // Calculate average completion time
    let averageCompletionTime: number | undefined;
    const completedTradesWithTime = trades.filter(trade => 
      trade.status === 'completed' && 
      trade.createdAt && 
      (trade.completedAt || trade.completionConfirmedAt)
    );
    
    if (completedTradesWithTime.length > 0) {
      const totalDays = completedTradesWithTime.reduce((sum, trade) => {
        const startTime = trade.createdAt.toDate();
        const endTime = (trade.completedAt || trade.completionConfirmedAt)?.toDate() || new Date();
        const daysDiff = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }, 0);
      
      averageCompletionTime = totalDays / completedTradesWithTime.length;
    }
    
    return {
      totalTrades,
      completedTrades,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      activeTrades,
      cancelledTrades,
      inProgressTrades,
      categories,
      averageCompletionTime
    };
    
  } catch (error) {
    logger.error('Error calculating trade analytics:', 'SERVICE', {}, error as Error);
    throw new Error('Failed to calculate trade analytics');
  }
};

/**
 * Get quick analytics for dashboard display
 */
export const getQuickTradeAnalytics = async (): Promise<{
  activeTrades: number;
  categories: number;
  successRate: number;
}> => {
  try {
    const analytics = await calculateTradeAnalytics({
      timeRange: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        end: new Date()
      }
    });
    
    return {
      activeTrades: analytics.activeTrades,
      categories: Object.keys(analytics.categories).length,
      successRate: analytics.successRate
    };
  } catch (error) {
    logger.error('Error getting quick trade analytics:', 'SERVICE', {}, error as Error);
    // Return fallback values
    return {
      activeTrades: 0,
      categories: 0,
      successRate: 0
    };
  }
};

/**
 * Get analytics for a specific time period
 */
export const getTradeAnalyticsForPeriod = async (
  days: number,
  options: TradeAnalyticsOptions = {}
): Promise<TradeAnalytics> => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  return calculateTradeAnalytics({
    ...options,
    timeRange: { start: startDate, end: endDate }
  });
};
