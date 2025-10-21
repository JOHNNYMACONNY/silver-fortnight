import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../firebase-config';
import { LeaderboardCategory, LeaderboardPeriod } from '../types/gamification';

/**
 * Helper functions for leaderboard operations
 */

export interface PeriodRange {
  start: Timestamp;
  end: Timestamp;
}

/**
 * Calculate the date range for a given period
 */
export const calculatePeriodRange = (period: LeaderboardPeriod): PeriodRange => {
  const now = new Date();
  let start: Date;
  const end: Date = now;

  switch (period) {
    case LeaderboardPeriod.DAILY:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    
    case LeaderboardPeriod.WEEKLY:
      start = new Date(now);
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      break;
    
    case LeaderboardPeriod.MONTHLY:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    
    case LeaderboardPeriod.ALL_TIME:
    default:
      start = new Date('2024-01-01'); // Platform start date
      break;
  }

  return {
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end)
  };
};

/**
 * Build Firestore query for leaderboard data
 */
export const buildLeaderboardQuery = (
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  periodRange: PeriodRange,
  limitCount: number
) => {
  switch (category) {
    case LeaderboardCategory.TOTAL_XP:
      if (period === LeaderboardPeriod.ALL_TIME) {
        return query(
          collection(getSyncFirebaseDb(), 'userXP'),
          orderBy('totalXP', 'desc'),
          limit(limitCount)
        );
      } else {
        return query(
          collection(getSyncFirebaseDb(), 'leaderboardStats'),
          where('period', '==', period),
          where('createdAt', '>=', periodRange.start),
          where('createdAt', '<=', periodRange.end),
          orderBy('totalXP', 'desc'),
          limit(limitCount)
        );
      }

    case LeaderboardCategory.WEEKLY_XP:
      return query(
        collection(getSyncFirebaseDb(), 'leaderboardStats'),
        where('period', '==', 'weekly'),
        where('createdAt', '>=', periodRange.start),
        orderBy('totalXP', 'desc'),
        limit(limitCount)
      );

    case LeaderboardCategory.MONTHLY_XP:
      return query(
        collection(getSyncFirebaseDb(), 'leaderboardStats'),
        where('period', '==', 'monthly'),
        where('createdAt', '>=', periodRange.start),
        orderBy('totalXP', 'desc'),
        limit(limitCount)
      );

    case LeaderboardCategory.TRADE_COUNT:
      return query(
        collection(getSyncFirebaseDb(), 'userStats'),
        orderBy('completedTrades', 'desc'),
        limit(limitCount)
      );

    case LeaderboardCategory.COLLABORATION_RATING:
      return query(
        collection(getSyncFirebaseDb(), 'userStats'),
        where('collaborationRating', '>', 0),
        orderBy('collaborationRating', 'desc'),
        limit(limitCount)
      );

    case LeaderboardCategory.SKILL_ENDORSEMENTS:
      return query(
        collection(getSyncFirebaseDb(), 'userStats'),
        orderBy('totalEndorsements', 'desc'),
        limit(limitCount)
      );

    case LeaderboardCategory.QUICK_RESPONSES:
      return query(
        collection(getSyncFirebaseDb(), 'userStats'),
        orderBy('quickResponses', 'desc'),
        limit(limitCount)
      );

    case LeaderboardCategory.ACHIEVEMENT_COUNT:
      return query(
        collection(getSyncFirebaseDb(), 'userStats'),
        orderBy('achievementCount', 'desc'),
        limit(limitCount)
      );

    default:
      return query(
        collection(getSyncFirebaseDb(), 'userXP'),
        orderBy('totalXP', 'desc'),
        limit(limitCount)
      );
  }
};

/**
 * Build query to find a specific user's data
 */
export const buildUserRankQuery = (
  userId: string,
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  periodRange: PeriodRange
) => {
  switch (category) {
    case LeaderboardCategory.TOTAL_XP:
      if (period === LeaderboardPeriod.ALL_TIME) {
        return query(
          collection(getSyncFirebaseDb(), 'userXP'),
          where('userId', '==', userId)
        );
      } else {
        return query(
          collection(getSyncFirebaseDb(), 'leaderboardStats'),
          where('userId', '==', userId),
          where('period', '==', period),
          where('createdAt', '>=', periodRange.start),
          where('createdAt', '<=', periodRange.end)
        );
      }

    case LeaderboardCategory.WEEKLY_XP:
      return query(
        collection(getSyncFirebaseDb(), 'leaderboardStats'),
        where('userId', '==', userId),
        where('period', '==', 'weekly'),
        where('createdAt', '>=', periodRange.start)
      );

    case LeaderboardCategory.MONTHLY_XP:
      return query(
        collection(getSyncFirebaseDb(), 'leaderboardStats'),
        where('userId', '==', userId),
        where('period', '==', 'monthly'),
        where('createdAt', '>=', periodRange.start)
      );

    default:
      return query(
        collection(getSyncFirebaseDb(), 'userStats'),
        where('userId', '==', userId)
      );
  }
};

/**
 * Build query to calculate user's rank
 */
export const buildRankCalculationQuery = (
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  periodRange: PeriodRange,
  userValue: number
) => {
  switch (category) {
    case LeaderboardCategory.TOTAL_XP:
      if (period === LeaderboardPeriod.ALL_TIME) {
        return query(
          collection(getSyncFirebaseDb(), 'userXP'),
          where('totalXP', '>', userValue)
        );
      } else {
        return query(
          collection(getSyncFirebaseDb(), 'leaderboardStats'),
          where('period', '==', period),
          where('createdAt', '>=', periodRange.start),
          where('createdAt', '<=', periodRange.end),
          where('totalXP', '>', userValue)
        );
      }

    case LeaderboardCategory.WEEKLY_XP:
      return query(
        collection(getSyncFirebaseDb(), 'leaderboardStats'),
        where('period', '==', 'weekly'),
        where('createdAt', '>=', periodRange.start),
        where('totalXP', '>', userValue)
      );

    case LeaderboardCategory.MONTHLY_XP:
      return query(
        collection(getSyncFirebaseDb(), 'leaderboardStats'),
        where('period', '==', 'monthly'),
        where('createdAt', '>=', periodRange.start),
        where('totalXP', '>', userValue)
      );

    case LeaderboardCategory.COLLABORATION_RATING:
      return query(
        collection(getSyncFirebaseDb(), 'userStats'),
        where('collaborationRating', '>', userValue)
      );

    default:
      return query(
        collection(getSyncFirebaseDb(), 'userStats'),
        where('totalXP', '>', userValue)
      );
  }
};

/**
 * Helper functions for date calculations
 */
export const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

export const getMonthStart = (date: Date): string => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};
