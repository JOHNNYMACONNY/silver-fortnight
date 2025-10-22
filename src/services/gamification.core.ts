import { getSyncFirebaseDb } from '../firebase-config';
import { doc, collection, Timestamp, runTransaction } from 'firebase/firestore';
import { UserXP, XPTransaction, XPSource, LevelCalculationResult, LEVEL_TIERS, XPAwardResult } from '../types/gamification';

/**
 * Lightweight core for transactional XP award and level calculation.
 * No achievements, notifications, or leaderboard imports to keep test graph minimal.
 */

export const calculateLevelCore = (totalXP: number): LevelCalculationResult => {
  let currentLevel = 1;
  let currentLevelTier = LEVEL_TIERS[0];

  for (const tier of LEVEL_TIERS) {
    if (totalXP >= tier.minXP && totalXP <= tier.maxXP) {
      currentLevel = tier.level;
      currentLevelTier = tier;
      break;
    }
  }

  const nextLevelTier = LEVEL_TIERS.find(tier => tier.level === currentLevel + 1);
  const xpToNextLevel = nextLevelTier ? nextLevelTier.minXP - totalXP : 0;

  const levelStartXP = currentLevelTier.minXP;
  const levelEndXP = currentLevelTier.maxXP === Infinity ? totalXP + 1000 : currentLevelTier.maxXP;
  const progressPercentage = Math.min(100, ((totalXP - levelStartXP) / (levelEndXP - levelStartXP)) * 100);

  return {
    currentLevel,
    currentLevelTier,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    progressPercentage,
  };
};

export const awardXPCore = async (
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
      const userXPSnap = await transaction.get(userXPRef as any);

      let currentXP: UserXP;

      if (!userXPSnap.exists()) {
        currentXP = {
          userId,
          totalXP: 0,
          currentLevel: 1,
          xpToNextLevel: LEVEL_TIERS[0].maxXP,
          lastUpdated: Timestamp.now(),
          createdAt: Timestamp.now(),
        };
      } else {
        currentXP = userXPSnap.data() as UserXP;
      }

      const newTotalXP = currentXP.totalXP + amount;
      const levelResult = calculateLevelCore(newTotalXP);
      const leveledUp = levelResult.currentLevel > currentXP.currentLevel;

      const updatedXP: UserXP = {
        ...currentXP,
        totalXP: newTotalXP,
        currentLevel: levelResult.currentLevel,
        xpToNextLevel: levelResult.xpToNextLevel,
        lastUpdated: Timestamp.now(),
      };

      transaction.set(userXPRef as any, updatedXP);

      const xpTransactionRef = doc(collection(db, 'xpTransactions'));
      const xpTransaction: XPTransaction = {
        id: (xpTransactionRef as any).id,
        userId,
        amount,
        source,
        sourceId,
        description: description || `${source} reward`,
        createdAt: Timestamp.now(),
      };

      transaction.set(xpTransactionRef as any, xpTransaction);

      return {
        success: true,
        xpAwarded: amount,
        newLevel: leveledUp ? levelResult.currentLevel : undefined,
        leveledUp,
        newAchievements: [],
      } as XPAwardResult;
    });

    return result;
  } catch (error: any) {
    return {
      success: false,
      xpAwarded: 0,
      leveledUp: false,
      error: error?.message || 'Failed to award XP',
      newAchievements: [],
    } as XPAwardResult;
  }
};

export interface LeaderboardDeps {
  triggerLeaderboardUpdate?: (userId: string, deltaXP: number) => Promise<void>;
  recomputeUserReputation?: (userId: string) => Promise<void>;
}

export const awardXPWithLeaderboardUpdateCore = async (
  userId: string,
  amount: number,
  source: XPSource,
  sourceId?: string,
  description?: string,
  deps?: LeaderboardDeps
): Promise<XPAwardResult> => {
  const res = await awardXPCore(userId, amount, source, sourceId, description);
  if (res.success && res.xpAwarded > 0) {
    try {
      await deps?.triggerLeaderboardUpdate?.(userId, res.xpAwarded);
      await deps?.recomputeUserReputation?.(userId);
    } catch (e) {
      // swallow leaderboard errors
    }
  }
  return res;
};

