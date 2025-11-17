import { getSyncFirebaseDb } from '../firebase-config';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import {
  Achievement,
  UserAchievement,
  AchievementCategory,
  AchievementRarity,
  ConditionType,
  XP_VALUES,
  XPSource
} from '../types/gamification';
import { ServiceResponse } from '../types/services';
import { createNotification, NotificationType } from './notifications/unifiedNotificationService';
import { awardXP } from './gamification';
import { getUserStats as getAggregatedUserStats } from './userStats';
import { logger } from '@utils/logging/logger';

/**
 * Predefined achievements for the TradeYa platform
 */
export const ACHIEVEMENTS: Achievement[] = [
  // Trading Achievements
  {
    id: 'first_trade',
    title: 'First Trade',
    description: 'Complete your first trade on TradeYa',
    category: AchievementCategory.TRADING,
    rarity: AchievementRarity.COMMON,
    icon: '🤝',
    xpReward: 50,
    unlockConditions: [
      { type: ConditionType.TRADE_COUNT, target: 1 }
    ],
    createdAt: Timestamp.now()
  },
  {
    id: 'trade_veteran',
    title: 'Trade Veteran',
    description: 'Complete 10 successful trades',
    category: AchievementCategory.TRADING,
    rarity: AchievementRarity.UNCOMMON,
    icon: '📈',
    xpReward: 100,
    unlockConditions: [
      { type: ConditionType.TRADE_COUNT, target: 10 }
    ],
    createdAt: Timestamp.now()
  },
  {
    id: 'trade_master',
    title: 'Trade Master',
    description: 'Complete 50 successful trades',
    category: AchievementCategory.TRADING,
    rarity: AchievementRarity.RARE,
    icon: '🏆',
    xpReward: 250,
    unlockConditions: [
      { type: ConditionType.TRADE_COUNT, target: 50 }
    ],
    createdAt: Timestamp.now()
  },
  {
    id: 'quick_responder',
    title: 'Quick Responder',
    description: 'Respond to 5 trade confirmations within 24 hours',
    category: AchievementCategory.TRADING,
    rarity: AchievementRarity.UNCOMMON,
    icon: '⚡',
    xpReward: 75,
    unlockConditions: [
      { type: ConditionType.QUICK_RESPONSES, target: 5 }
    ],
    createdAt: Timestamp.now()
  },

  // Collaboration Achievements
  {
    id: 'first_collaboration',
    title: 'Team Player',
    description: 'Complete your first collaboration role',
    category: AchievementCategory.COLLABORATION,
    rarity: AchievementRarity.COMMON,
    icon: '👥',
    xpReward: 75,
    unlockConditions: [
      { type: ConditionType.ROLE_COUNT, target: 1 }
    ],
    createdAt: Timestamp.now()
  },
  {
    id: 'collaboration_specialist',
    title: 'Collaboration Specialist',
    description: 'Complete 5 collaboration roles',
    category: AchievementCategory.COLLABORATION,
    rarity: AchievementRarity.UNCOMMON,
    icon: '🎯',
    xpReward: 150,
    unlockConditions: [
      { type: ConditionType.ROLE_COUNT, target: 5 }
    ],
    createdAt: Timestamp.now()
  },
  {
    id: 'team_leader',
    title: 'Team Leader',
    description: 'Complete 20 collaboration roles',
    category: AchievementCategory.COLLABORATION,
    rarity: AchievementRarity.RARE,
    icon: '👑',
    xpReward: 300,
    unlockConditions: [
      { type: ConditionType.ROLE_COUNT, target: 20 }
    ],
    createdAt: Timestamp.now()
  },

  // Milestone Achievements
  {
    id: 'xp_milestone_1000',
    title: 'Rising Star',
    description: 'Earn 1,000 total XP',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.UNCOMMON,
    icon: '⭐',
    xpReward: 100,
    unlockConditions: [
      { type: ConditionType.XP_TOTAL, target: 1000 }
    ],
    createdAt: Timestamp.now()
  },
  {
    id: 'xp_milestone_5000',
    title: 'Platform Expert',
    description: 'Earn 5,000 total XP',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.RARE,
    icon: '🌟',
    xpReward: 250,
    unlockConditions: [
      { type: ConditionType.XP_TOTAL, target: 5000 }
    ],
    createdAt: Timestamp.now()
  },
  {
    id: 'evidence_expert',
    title: 'Evidence Expert',
    description: 'Submit evidence for 15 completed trades/roles',
    category: AchievementCategory.SKILL,
    rarity: AchievementRarity.UNCOMMON,
    icon: '📋',
    xpReward: 125,
    unlockConditions: [
      { type: ConditionType.EVIDENCE_COUNT, target: 15 }
    ],
    createdAt: Timestamp.now()
  },

  // Special Achievements
  {
    id: 'platform_pioneer',
    title: 'Platform Pioneer',
    description: 'One of the first 100 users to complete a trade',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    icon: '🚀',
    xpReward: 500,
    unlockConditions: [
      { type: ConditionType.TRADE_COUNT, target: 1 }
    ],
    isHidden: true,
    createdAt: Timestamp.now()
  }
];

/**
 * Initialize achievements in the database
 */
export const initializeAchievements = async (): Promise<ServiceResponse<void>> => {
  try {
    const batch: Promise<any>[] = [];
    
    for (const achievement of ACHIEVEMENTS) {
      const db = getSyncFirebaseDb();
      const achievementRef = doc(db, 'achievements', achievement.id);
      batch.push(setDoc(achievementRef, achievement));
    }

    await Promise.all(batch);
    return { success: true };
  } catch (error: any) {
    logger.error('Error initializing achievements:', 'SERVICE', {}, error as Error);
    return { success: false, error: error.message || 'Failed to initialize achievements' };
  }
};

/**
 * Check and unlock achievements for a user
 */
export const checkAndUnlockAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const newAchievements: Achievement[] = [];

    // Get user's current achievements
    const db = getSyncFirebaseDb();
    const userAchievementsQuery = query(
      collection(db, 'userAchievements'),
      where('userId', '==', userId)
    );
    const userAchievementsSnap = await getDocs(userAchievementsQuery);
    const unlockedAchievementIds = new Set(
      userAchievementsSnap.docs.map(snap => (snap.data() as any).achievementId)
    );

    // Get user stats for checking conditions
    const userStats = await getUserStats(userId);

    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      if (unlockedAchievementIds.has(achievement.id)) {
        continue; // Already unlocked
      }

      const isUnlocked = await checkAchievementConditions(achievement, userStats);
      
      if (isUnlocked) {
        await unlockAchievement(userId, achievement);
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  } catch (error: any) {
    logger.error('Error checking achievements:', 'SERVICE', {}, error as Error);
    return [];
  }
};

/**
 * Unlock a specific achievement for a user
 */
export const unlockAchievement = async (
  userId: string,
  achievement: Achievement
): Promise<ServiceResponse<void>> => {
  try {
    const db = getSyncFirebaseDb();
    await runTransaction(db, async (transaction) => {
      // Create user achievement record
      const userAchievementRef = doc(collection(db, 'userAchievements'));
      const userAchievement: UserAchievement = {
        id: userAchievementRef.id,
        userId,
        achievementId: achievement.id,
        unlockedAt: Timestamp.now(),
        isNotified: false
      };

      transaction.set(userAchievementRef, userAchievement);
    });

    // Award XP for achievement
    await awardXP(userId, achievement.xpReward, XPSource.ACHIEVEMENT_UNLOCK, achievement.id, `Achievement: ${achievement.title}`);

    // Send notification
    await createNotification({
      recipientId: userId,
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: 'Achievement Unlocked! 🏆',
      message: `You've earned the "${achievement.title}" achievement! (+${achievement.xpReward} XP)`,
      data: {
        achievementId: achievement.id,
        achievementTitle: achievement.title,
        xpReward: achievement.xpReward
      },
      priority: 'high',
      createdAt: Timestamp.now()
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Error unlocking achievement:', 'SERVICE', {}, error as Error);
    return { success: false, error: error.message || 'Failed to unlock achievement' };
  }
};

/**
 * Get user's unlocked achievements
 */
export const getUserAchievements = async (userId: string): Promise<ServiceResponse<UserAchievement[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const userAchievementsQuery = query(
      collection(db, 'userAchievements'),
      where('userId', '==', userId)
    );
    const userAchievementsSnap = await getDocs(userAchievementsQuery);
    const achievements = userAchievementsSnap.docs.map(snap => snap.data() as UserAchievement);

    return { success: true, data: achievements };
  } catch (error: any) {
    logger.error('Error getting user achievements:', 'SERVICE', {}, error as Error);
    return { success: false, error: error.message || 'Failed to get user achievements' };
  }
};

/**
 * Helper functions
 */
interface UserStats {
  tradeCount: number;
  roleCount: number;
  totalXP: number;
  quickResponses: number;
  evidenceCount: number;
}

const getUserStats = async (userId: string): Promise<UserStats> => {
  const res = await getAggregatedUserStats(userId);
  // Map to local shape used by achievement checks
  return {
    tradeCount: res.tradeCount ?? 0,
    roleCount: res.roleCount ?? 0,
    totalXP: res.totalXP ?? 0,
    quickResponses: res.quickResponses ?? 0,
    evidenceCount: res.evidenceCount ?? 0,
  } as UserStats;
};

const checkAchievementConditions = async (
  achievement: Achievement,
  userStats: UserStats
): Promise<boolean> => {
  for (const condition of achievement.unlockConditions) {
    let currentValue = 0;

    switch (condition.type) {
      case ConditionType.TRADE_COUNT:
        currentValue = userStats.tradeCount;
        break;
      case ConditionType.ROLE_COUNT:
        currentValue = userStats.roleCount;
        break;
      case ConditionType.XP_TOTAL:
        currentValue = userStats.totalXP;
        break;
      case ConditionType.QUICK_RESPONSES:
        currentValue = userStats.quickResponses;
        break;
      case ConditionType.EVIDENCE_COUNT:
        currentValue = userStats.evidenceCount;
        break;
      default:
        continue;
    }

    if (currentValue < condition.target) {
      return false;
    }
  }

  return true;
};
