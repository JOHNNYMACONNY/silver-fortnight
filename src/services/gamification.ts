import { getSyncFirebaseDb } from '../firebase-config';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  updateDoc
} from 'firebase/firestore';
import {
  UserXP,
  XPTransaction,
  XPSource,
  XPAwardResult,
  LevelCalculationResult,
  LEVEL_TIERS,
  XP_VALUES,
  CHALLENGE_XP_VALUES,
  Achievement
} from '../types/gamification';
import { ServiceResponse } from '../types/services';
import { createNotification } from './notifications';
import { triggerLeaderboardUpdate, recomputeUserReputation } from './leaderboards';

import { ServiceResult } from '../types/ServiceError';

// Real-time notification support
let notificationCallback: ((notification: any) => void) | null = null;

/**
 * Set callback for real-time gamification notifications
 */
export const setGamificationNotificationCallback = (callback: (notification: any) => void) => {
  notificationCallback = callback;
};

/**
 * Trigger real-time notification
 */
const triggerRealtimeNotification = (notification: any) => {
  if (notificationCallback) {
    notificationCallback(notification);
  }
};

/**
 * Public helper to emit a realtime gamification notification to the in-app queue
 */
export const emitGamificationNotification = (notification: any) => {
  triggerRealtimeNotification(notification);
};

/**
 * Core XP and Level Management
 */

/**
 * Award XP to a user for a specific action
 */
export const awardXP = async (
  userId: string,
  amount: number,
  source: XPSource,
  sourceId?: string,
  description?: string
): Promise<XPAwardResult> => {
  try {
    const db = getSyncFirebaseDb();
    const result = await runTransaction(db, async (transaction) => {
      const userXPRef = doc(db, 'userXP', userId);
      const userXPSnap = await transaction.get(userXPRef);

      let currentXP: UserXP;

      if (!userXPSnap.exists()) {
        currentXP = {
          userId,
          totalXP: 0,
          currentLevel: 1,
          xpToNextLevel: LEVEL_TIERS[0].maxXP,
          lastUpdated: Timestamp.now(),
          createdAt: Timestamp.now()
        };
      } else {
        currentXP = userXPSnap.data() as UserXP;
      }

      // Calculate new XP total
      const newTotalXP = currentXP.totalXP + amount;
      const levelResult = calculateLevel(newTotalXP);
      const leveledUp = levelResult.currentLevel > currentXP.currentLevel;

      // Update user XP record
      const updatedXP: UserXP = {
        ...currentXP,
        totalXP: newTotalXP,
        currentLevel: levelResult.currentLevel,
        xpToNextLevel: levelResult.xpToNextLevel,
        lastUpdated: Timestamp.now()
      };

      transaction.set(userXPRef, updatedXP);

      // Create XP transaction record
      const xpTransactionRef = doc(collection(db, 'xpTransactions'));
      const xpTransaction: XPTransaction = {
        id: xpTransactionRef.id,
        userId,
        amount,
        source,
        sourceId,
        description: description || `${source} reward`,
        createdAt: Timestamp.now()
      };

      transaction.set(xpTransactionRef, xpTransaction);

      return {
        success: true,
        xpAwarded: amount,
        newLevel: leveledUp ? levelResult.currentLevel : undefined,
        leveledUp,
        newAchievements: [] as Achievement[] // Will be populated by achievement check
      };
    });

    // Trigger real-time XP gain notification
    if (result.success) {
      triggerRealtimeNotification({
        type: 'xp_gain',
        amount,
        source,
        sourceId,
        description: description || `${source} reward`,
        timestamp: new Date(),
        userId
      });
    }

    // Check for new achievements after XP award
    if (result.success) {
      try {
        // Dynamic import to avoid circular dependency
        const { checkAndUnlockAchievements } = await import('./achievements');
        const newAchievements = await checkAndUnlockAchievements(userId);
        result.newAchievements = newAchievements;

        // Send achievement notifications and trigger real-time notifications
        for (const achievement of newAchievements) {
          await createAchievementNotification(userId, achievement);

          // Trigger real-time achievement notification
          triggerRealtimeNotification({
            type: 'achievement_unlock',
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            achievementDescription: achievement.description,
            achievementIcon: achievement.icon,
            xpReward: achievement.xpReward,
            rarity: achievement.rarity,
            timestamp: new Date(),
            userId
          });
        }
      } catch (achievementError: any) {
        console.warn('Achievement checking failed:', achievementError.message);
        result.newAchievements = [];
      }

      // Send level up notification if applicable
      if (result.leveledUp && result.newLevel) {
        await createLevelUpNotification(userId, result.newLevel);

        // Trigger real-time level up notification
        const levelTier = LEVEL_TIERS.find(tier => tier.level === result.newLevel);
        triggerRealtimeNotification({
          type: 'level_up',
          newLevel: result.newLevel,
          previousLevel: result.newLevel - 1,
          levelTitle: levelTier?.title || 'Unknown',
          benefits: levelTier?.benefits,
          timestamp: new Date(),
          userId
        });
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error awarding XP:', error);
    return {
      success: false,
      xpAwarded: 0,
      leveledUp: false,
      error: error.message || 'Failed to award XP'
    };
  }
};

/**
 * Calculate user level based on total XP
 */
export const calculateLevel = (totalXP: number): LevelCalculationResult => {
  let currentLevel = 1;
  let currentLevelTier = LEVEL_TIERS[0];

  // Find the appropriate level tier
  for (const tier of LEVEL_TIERS) {
    if (totalXP >= tier.minXP && totalXP <= tier.maxXP) {
      currentLevel = tier.level;
      currentLevelTier = tier;
      break;
    }
  }

  // Calculate XP needed for next level
  const nextLevelTier = LEVEL_TIERS.find(tier => tier.level === currentLevel + 1);
  const xpToNextLevel = nextLevelTier ? nextLevelTier.minXP - totalXP : 0;

  // Calculate progress percentage within current level
  const levelStartXP = currentLevelTier.minXP;
  const levelEndXP = currentLevelTier.maxXP === Infinity ? totalXP + 1000 : currentLevelTier.maxXP;
  const progressPercentage = Math.min(100, ((totalXP - levelStartXP) / (levelEndXP - levelStartXP)) * 100);

  return {
    currentLevel,
    currentLevelTier,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    progressPercentage
  };
};

/**
 * Get user's current XP and level information
 */
export const getUserXP = async (userId: string): Promise<ServiceResponse<UserXP>> => {
  try {
    const db = getSyncFirebaseDb();
    const userXPRef = doc(db, 'userXP', userId);
    const userXPSnap = await getDoc(userXPRef);

    if (!userXPSnap.exists()) {
      // Return default XP data for new users
      const defaultXP: UserXP = {
        userId,
        totalXP: 0,
        currentLevel: 1,
        xpToNextLevel: LEVEL_TIERS[0].maxXP,
        lastUpdated: Timestamp.now(),
        createdAt: Timestamp.now()
      };

      return {
        success: true,
        data: defaultXP
      };
    }

    return {
      success: true,
      data: userXPSnap.data() as UserXP
    };
  } catch (error: any) {
    console.error('Error getting user XP:', error);
    return {
      success: false,
      error: error.message || 'Failed to get user XP'
    };
  }
};

/**
 * Get user's XP transaction history
 */
export const getUserXPHistory = async (
  userId: string,
  limitCount: number = 50
): Promise<ServiceResponse<XPTransaction[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const xpTransactionsRef = collection(db, 'xpTransactions');
    const q = query(
      xpTransactionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => doc.data() as XPTransaction);

    return {
      success: true,
      data: transactions
    };
  } catch (error: any) {
    console.error('Error getting user XP history:', error);
    return {
      success: false,
      error: error.message || 'Failed to get XP history'
    };
  }
};

/**
 * Notification helpers
 */
const createLevelUpNotification = async (userId: string, newLevel: number): Promise<void> => {
  const levelTier = LEVEL_TIERS.find(tier => tier.level === newLevel);

  await createNotification({
    recipientId: userId,
    type: 'level_up',
    title: 'Level Up! 🎉',
    message: `Congratulations! You've reached level ${newLevel} - ${levelTier?.title || 'Unknown'}!`,
    data: {
      newLevel,
      levelTitle: levelTier?.title,
      benefits: levelTier?.benefits
    },
    createdAt: Timestamp.now()
  });
};

const createAchievementNotification = async (userId: string, achievement: Achievement): Promise<void> => {
  await createNotification({
    recipientId: userId,
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked! 🏆',
    message: `You've earned the "${achievement.title}" achievement!`,
    data: {
      achievementId: achievement.id,
      achievementTitle: achievement.title,
      xpReward: achievement.xpReward
    },
    createdAt: Timestamp.now()
  });
};

/**
 * Convenience functions for common XP awards
 */
export const awardTradeCompletionXP = async (
  userId: string,
  isQuickResponse: boolean = false,
  isFirstTrade: boolean = false
): Promise<XPAwardResult> => {
  let amount = XP_VALUES.TRADE_COMPLETION;
  let description = 'Trade completion';

  if (isQuickResponse) {
    amount += XP_VALUES.QUICK_RESPONSE_BONUS;
    description += ' (quick response bonus)';
  }

  if (isFirstTrade) {
    amount += XP_VALUES.FIRST_TRADE_BONUS;
    description += ' (first trade bonus)';
  }

  return awardXPWithLeaderboardUpdate(userId, amount, XPSource.TRADE_COMPLETION, undefined, description);
};

export const awardRoleCompletionXP = async (
  userId: string,
  roleId: string,
  isComplex: boolean = false
): Promise<XPAwardResult> => {
  const amount = isComplex ? XP_VALUES.ROLE_COMPLETION_COMPLEX : XP_VALUES.ROLE_COMPLETION_BASE;
  const description = `Role completion${isComplex ? ' (complex role)' : ''}`;

  return awardXPWithLeaderboardUpdate(userId, amount, XPSource.ROLE_COMPLETION, roleId, description);
};

export const awardEvidenceSubmissionXP = async (
  userId: string,
  sourceId: string
): Promise<XPAwardResult> => {
  return awardXPWithLeaderboardUpdate(userId, XP_VALUES.EVIDENCE_SUBMISSION, XPSource.EVIDENCE_SUBMISSION, sourceId, 'Evidence submission');
};

/**
 * Enhanced XP award functions with leaderboard integration
 */
export const awardXPWithLeaderboardUpdate = async (
  userId: string,
  amount: number,
  source: XPSource,
  sourceId?: string,
  description?: string
): Promise<XPAwardResult> => {
  const result = await awardXP(userId, amount, source, sourceId, description);

  // Update leaderboard stats if XP was successfully awarded
  if (result.success && result.xpAwarded > 0) {
    try {
      // Use the statically imported functions to update leaderboard and reputation.
      await triggerLeaderboardUpdate(userId, result.xpAwarded);
      // Also recompute composite reputation since XP changed
      await recomputeUserReputation(userId);
    } catch (error) {
      console.warn('Failed to update leaderboard stats:', error);
      // Don't fail the main XP award if leaderboard update fails
    }
  }

  return result;
};

// ServiceResult adapters (non-breaking): wrap XPAwardResult in ServiceResponse

const toServiceResult = <T>(res: { success: boolean; error?: string } & any, data: T): ServiceResult<T> => {
  return res.success
    ? { data, error: null }
    : { data: null, error: { code: 'gamification-error', message: res.error || 'Unknown error' } };
};

export const awardXP_SR = async (
  userId: string,
  amount: number,
  source: XPSource,
  sourceId?: string,
  description?: string
): Promise<ServiceResult<XPAwardResult>> => {
  const res = await awardXP(userId, amount, source, sourceId, description);
  return toServiceResult(res, res);
};

export const awardXPWithLeaderboardUpdate_SR = async (
  userId: string,
  amount: number,
  source: XPSource,
  sourceId?: string,
  description?: string
): Promise<ServiceResult<XPAwardResult>> => {
  const res = await awardXPWithLeaderboardUpdate(userId, amount, source, sourceId, description);
  return toServiceResult(res, res);
};

// Re-export types/constants for convenience where modules import from services/gamification
export { XPSource, XP_VALUES } from '../types/gamification';
