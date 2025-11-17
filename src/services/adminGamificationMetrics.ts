import { getSyncFirebaseDb } from '../firebase-config';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { ServiceResult } from '../types/ServiceError';
import { logger } from '@utils/logging/logger';

export interface GamificationMetrics7d {
  startDate: Date;
  endDate: Date;
  totals: {
    xpAwards: number;
    achievements: number;
    streakMilestones: number;
    uniqueXpRecipients: number;
  };
  perDay: {
    xpAwardsByDate: Record<string, number>;
    achievementsByDate: Record<string, number>;
    streakMilestonesByDate: Record<string, number>;
  };
}

const dateKeyUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);

export const getGamificationMetrics7d = async (): Promise<ServiceResult<GamificationMetrics7d>> => {
  try {
    const db = getSyncFirebaseDb();

    // Define a consistent UTC 7-day window [startDateUTC..endDateUTC]
    const now = new Date();
    const endDateUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startDateUTC = new Date(endDateUTC);
    startDateUTC.setUTCDate(endDateUTC.getUTCDate() - 6);

    const startTs = Timestamp.fromDate(startDateUTC);

    // Init counters
    const xpAwardsByDate: Record<string, number> = {};
    const achievementsByDate: Record<string, number> = {};
    const streakMilestonesByDate: Record<string, number> = {};

    // xpTransactions (single read used for both per-day and unique recipients)
    let txSnap: any | null = null;
    try {
      txSnap = await getDocs(query(collection(db, 'xpTransactions'), where('createdAt', '>=', startTs)));
      txSnap.forEach((doc: any) => {
        const d = (doc.data() as any);
        const dt: Date = (d.createdAt?.toDate?.() as Date) || new Date();
        const key = dateKeyUTC(dt);
        xpAwardsByDate[key] = (xpAwardsByDate[key] || 0) + 1;
      });
    } catch (e) {
      logger.warn('[adminGamificationMetrics] xpTransactions aggregation failed:', 'SERVICE', e);
    }

    // userAchievements
    try {
      const uaSnap = await getDocs(query(collection(db, 'userAchievements'), where('unlockedAt', '>=', startTs)));
      uaSnap.forEach((doc) => {
        const d = (doc.data() as any);
        const dt: Date = (d.unlockedAt?.toDate?.() as Date) || new Date();
        const key = dateKeyUTC(dt);
        achievementsByDate[key] = (achievementsByDate[key] || 0) + 1;
      });
    } catch (e) {
      logger.warn('[adminGamificationMetrics] userAchievements aggregation failed:', 'SERVICE', e);
    }

    // streak milestones via notifications type 'streak_milestone'
    try {
      const nSnap = await getDocs(query(collection(db, 'notifications'), where('createdAt', '>=', startTs), where('type', '==', 'streak_milestone')));
      nSnap.forEach((doc) => {
        const d = (doc.data() as any);
        const dt: Date = (d.createdAt?.toDate?.() as Date) || new Date();
        const key = dateKeyUTC(dt);
        streakMilestonesByDate[key] = (streakMilestonesByDate[key] || 0) + 1;
      });
    } catch (e) {
      logger.warn('[adminGamificationMetrics] streak milestones aggregation failed:', 'SERVICE', e);
    }

    // Unique XP recipients over 7d (reuse txSnap if available)
    const uniqueXpRecipients = new Set<string>();
    try {
      if (!txSnap) {
        txSnap = await getDocs(query(collection(db, 'xpTransactions'), where('createdAt', '>=', startTs)));
      }
      txSnap.forEach((doc: any) => {
        const d = (doc.data() as any);
        if (d.userId) uniqueXpRecipients.add(d.userId);
      });
    } catch (e) {
      logger.warn('[adminGamificationMetrics] unique recipients aggregation failed:', 'SERVICE', e);
    }

    // Zero-fill per-day for the 7-day window
    for (let i = 0; i < 7; i++) {
      const day = new Date(endDateUTC);
      day.setUTCDate(endDateUTC.getUTCDate() - i);
      const key = day.toISOString().slice(0, 10);
      xpAwardsByDate[key] = xpAwardsByDate[key] || 0;
      achievementsByDate[key] = achievementsByDate[key] || 0;
      streakMilestonesByDate[key] = streakMilestonesByDate[key] || 0;
    }

    // Totals
    const xpTotal = Object.values(xpAwardsByDate).reduce((a, b) => a + b, 0);
    const achTotal = Object.values(achievementsByDate).reduce((a, b) => a + b, 0);
    const streakTotal = Object.values(streakMilestonesByDate).reduce((a, b) => a + b, 0);

    return {
      data: {
        startDate: startDateUTC,
        endDate: endDateUTC,
        totals: {
          xpAwards: xpTotal,
          achievements: achTotal,
          streakMilestones: streakTotal,
          uniqueXpRecipients: uniqueXpRecipients.size,
        },
        perDay: {
          xpAwardsByDate,
          achievementsByDate,
          streakMilestonesByDate,
        },
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: { code: 'admin-metrics-error', message: error?.message || 'Failed to collect gamification metrics' } };
  }
};

