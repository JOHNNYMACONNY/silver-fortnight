import { getSyncFirebaseDb } from "../firebase-config";
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import {
  UserStreak,
  StreakType,
  XP_VALUES,
  XPSource,
} from "../types/gamification";
import {
  getStreakMilestoneThresholds,
  getStreakMaxFreezes,
  isAutoFreezeEnabled,
} from "./streakConfig";
import { ServiceResponse } from "../types/services";
import {
  awardXPWithLeaderboardUpdate,
  emitGamificationNotification,
} from "./gamification";
import { createNotification, NotificationType } from "./notifications/unifiedNotificationService";
import { removeUndefinedDeep } from "../utils/firestore";
import { logger } from '@utils/logging/logger';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface UpdateStreakResult {
  streak: UserStreak;
  hitMilestone?: number;
}

/**
 * Increment a user's streak for the given type if appropriate, awarding milestone XP.
 * Creates the streak if it does not exist. Returns updated streak and optional milestone.
 */
export const updateUserStreak = async (
  userId: string,
  type: StreakType,
  activityTime: Date = new Date()
): Promise<ServiceResponse<UpdateStreakResult>> => {
  try {
    const db = getSyncFirebaseDb();
    const streakId = `${userId}_${type}`;
    const streakRef = doc(db, "userStreaks", streakId);

    let milestoneHit: number | undefined;

    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(streakRef);
      const nowTs = Timestamp.fromDate(activityTime);

      let streak: UserStreak;
      if (!snap.exists()) {
        streak = {
          userId,
          type,
          currentStreak: 1,
          longestStreak: 1,
          lastActivity: nowTs,
          freezesUsed: 0,
          maxFreezes: getStreakMaxFreezes(1),
          createdAt: nowTs,
          updatedAt: nowTs,
        };
        // Clean undefined values before setting
        const cleanedStreak = removeUndefinedDeep(streak);
        tx.set(streakRef, cleanedStreak as any);
      } else {
        const existing = snap.data() as UserStreak;
        const last = existing.lastActivity?.toDate() ?? new Date(0);
        const diffDays = Math.floor(
          (activityTime.setHours(0, 0, 0, 0) -
            new Date(last).setHours(0, 0, 0, 0)) /
          ONE_DAY_MS
        );

        let nextCurrent = existing.currentStreak;
        let nextFreezesUsed = existing.freezesUsed || 0;
        if (diffDays === 0) {
          // same day; do not double-count
          nextCurrent = existing.currentStreak;
        } else if (diffDays === 1) {
          nextCurrent = existing.currentStreak + 1;
        } else if (
          diffDays === 2 &&
          isAutoFreezeEnabled(userId, true) &&
          (existing.freezesUsed ?? 0) < (existing.maxFreezes ?? 0)
        ) {
          // Auto-use a freeze for a single missed day gap
          nextCurrent = existing.currentStreak + 1;
          nextFreezesUsed = (existing.freezesUsed ?? 0) + 1;
        } else {
          // streak broken beyond freeze coverage
          nextCurrent = 1;
          // Do not change freezesUsed on hard reset
        }

        const longest = Math.max(existing.longestStreak, nextCurrent);

        streak = {
          ...existing,
          currentStreak: nextCurrent,
          longestStreak: longest,
          lastActivity: nowTs,
          lastFreezeAt:
            nextFreezesUsed !== (existing.freezesUsed ?? 0)
              ? nowTs
              : existing.lastFreezeAt,
          freezesUsed: nextFreezesUsed,
          updatedAt: nowTs,
        };
        // Clean undefined values before setting
        const cleanedStreak = removeUndefinedDeep(streak);
        tx.set(streakRef, cleanedStreak as any);
      }

      // Calculate milestone hit (only on incremented day)
      const thresholds = getStreakMilestoneThresholds();
      if (
        streak.currentStreak > 1 &&
        thresholds.includes(streak.currentStreak)
      ) {
        milestoneHit = streak.currentStreak;
      }

      return streak;
    });

    // Award milestone bonus and notify outside transaction (non-blocking to main write)
    if (milestoneHit) {
      try {
        await awardXPWithLeaderboardUpdate(
          userId,
          XP_VALUES.CHALLENGE_STREAK_BONUS,
          XPSource.CHALLENGE_STREAK,
          `${type}-${milestoneHit}`,
          `Streak milestone: ${milestoneHit} days (${type})`
        );
        // Notify user of milestone
        await createNotification({
          recipientId: userId,
          type: NotificationType.STREAK_MILESTONE,
          title: "Streak Milestone Reached!",
          message: `You hit a ${milestoneHit}-day ${type.replace(
            "_",
            " "
          )} streak! +${XP_VALUES.CHALLENGE_STREAK_BONUS} XP`,
          data: { type, milestone: milestoneHit },
          priority: 'medium',
          createdAt: Timestamp.now(),
        });
        // Emit realtime notification to in-app queue
        emitGamificationNotification({
          type: "streak_milestone",
          message: `You hit a ${milestoneHit}-day ${type.replace(
            "_",
            " "
          )} streak! +${XP_VALUES.CHALLENGE_STREAK_BONUS} XP`,
          userId,
          timestamp: new Date(),
        });
      } catch (e) {
        // Log but do not fail the core update
        logger.warn('Failed to award streak milestone XP', 'SERVICE', e);
      }
    }

    return {
      success: true,
      data: { streak: result, hitMilestone: milestoneHit },
    };
  } catch (error: any) {
    logger.error('updateUserStreak failed', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error: error?.message || "Failed to update streak",
    };
  }
};

/**
 * Convenience function: mark a completed challenge day for the user's challenge streak.
 */
export const markChallengeDay = async (
  userId: string,
  when: Date = new Date()
) => updateUserStreak(userId, "challenge", when);

/**
 * Convenience function: mark a login day for the user's login streak.
 */
export const markLoginDay = async (userId: string, when: Date = new Date()) =>
  updateUserStreak(userId, "login", when);

/**
 * Convenience function: mark a skill practice day for the user's skill streak.
 */
export const markSkillPracticeDay = async (
  userId: string,
  when: Date = new Date()
) => updateUserStreak(userId, "skill_practice", when);

/**
 * Fetch a user's streak document for a given type.
 */
export const getUserStreak = async (
  userId: string,
  type: StreakType
): Promise<ServiceResponse<UserStreak | null>> => {
  try {
    const db = getSyncFirebaseDb();
    const ref = doc(db, "userStreaks", `${userId}_${type}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: true, data: null };
    return { success: true, data: snap.data() as UserStreak };
  } catch (error: any) {
    logger.error('getUserStreak failed', 'SERVICE', {}, error as Error);
    return { success: false, error: error?.message || "Failed to load streak" };
  }
};

/**
 * Returns true if the user's skill practice streak has activity today.
 */
export const hasPracticedToday = async (
  userId: string,
  today: Date = new Date()
): Promise<boolean> => {
  try {
    const res = await getUserStreak(userId, "skill_practice");
    if (!res.success || !res.data?.lastActivity) return false;
    const last = res.data.lastActivity.toDate();
    const a = new Date(today);
    a.setHours(0, 0, 0, 0);
    const b = new Date(last);
    b.setHours(0, 0, 0, 0);
    return a.getTime() === b.getTime();
  } catch {
    return false;
  }
};
