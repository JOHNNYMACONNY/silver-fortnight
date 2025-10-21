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
  LeaderboardEntry,
  LeaderboardData,
  LeaderboardCategory,
  LeaderboardPeriod,
  UserFollow,
  SocialStats
} from '../types/gamification';
import { ServiceResponse } from '../types/services';
import { createNotification } from './notifications';
import { 
  calculatePeriodRange, 
  buildLeaderboardQuery, 
  buildUserRankQuery, 
  buildRankCalculationQuery,
  getWeekStart,
  getMonthStart
} from './leaderboard-helpers';
import { globalCache } from '../utils/cache';

/**
 * Compute and persist composite reputation for a user
 * Formula: XP (50%), trades (30%), followers (20%) → 0–100
 * Normalization caps: XP/5000, trades/100, followers/1000
 */
export const recomputeUserReputation = async (userId: string): Promise<void> => {
  try {
    const db = getSyncFirebaseDb();

    // Fetch current followers count from socialStats
    const socialStatsRef = doc(db, 'socialStats', userId);
    const socialSnap = await getDoc(socialStatsRef);
    const followersCount = socialSnap.exists() ? ((socialSnap.data() as SocialStats)?.followersCount || 0) : 0;

    // Fetch total XP directly from userXP collection (avoid circular imports)
    const userXPRef = doc(db, 'userXP', userId);
    const userXPSnap = await getDoc(userXPRef);
    const totalXP = userXPSnap.exists() ? (userXPSnap.data() as any)?.totalXP || 0 : 0;

    // Count trades: created + participated
    const tradesCol = collection(db, 'trades');
    const [createdSnap, participatedSnap] = await Promise.all([
      getDocs(query(tradesCol, where('creatorId', '==', userId))),
      getDocs(query(tradesCol, where('participantId', '==', userId)))
    ]);
    const totalTrades = (createdSnap?.size || 0) + (participatedSnap?.size || 0);

    // Compute composite score
    const xpNorm = Math.min(1, Number(totalXP || 0) / 5000);
    const tradesNorm = Math.min(1, Number(totalTrades || 0) / 100);
    const followersNorm = Math.min(1, Number(followersCount || 0) / 1000);
    const composite = Math.round(100 * (0.5 * xpNorm + 0.3 * tradesNorm + 0.2 * followersNorm));

    // Upsert to socialStats
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(socialStatsRef);
      if (snap.exists()) {
        tx.update(socialStatsRef, {
          reputationScore: composite,
          reputationLastComputedAt: Timestamp.now(),
          lastUpdated: Timestamp.now(),
        } as Partial<SocialStats> as any);
      } else {
        const initial: SocialStats = {
          userId,
          followersCount: followersCount || 0,
          followingCount: 0,
          leaderboardAppearances: 0,
          topRanks: {} as any,
          reputationScore: composite,
          reputationLastComputedAt: Timestamp.now(),
          lastUpdated: Timestamp.now(),
        };
        tx.set(socialStatsRef, initial as any);
      }
    });
  } catch (err) {
    console.warn('Failed to recompute reputation for', userId, err);
  }
};

/**
 * Phase 2B.1 - Leaderboard System Implementation
 */

/**
 * Get leaderboard data for a specific category and period
 */
export const getLeaderboard = async (
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  limitCount: number = 50,
  currentUserId?: string
): Promise<ServiceResponse<LeaderboardData>> => {
  const cacheKey = `leaderboard_${category}_${period}_${limitCount}_${currentUserId || 'anonymous'}`;
  
  // Check cache first
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const periodRange = calculatePeriodRange(period);
    const leaderboardQuery = buildLeaderboardQuery(category, period, periodRange, limitCount);
    
    const snapshot = await getDocs(leaderboardQuery);
    const entries: LeaderboardEntry[] = [];
    
    // Process leaderboard entries
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data() as any;
      const entry: LeaderboardEntry = {
        id: doc.id,
        userId: data.userId || '',
        userName: data.userName || data.displayName || 'Unknown User',
        userAvatar: data.userAvatar || data.avatar,
        rank: index + 1,
        value: data.value || data.totalXP || data.xp || 0,
        rankChange: data.rankChange || 0,
        isCurrentUser: currentUserId ? data.userId === currentUserId : false
      };
      entries.push(entry);
    });

    // Find current user entry if not in top results
    let currentUserEntry: LeaderboardEntry | undefined;
    if (currentUserId && !entries.find(e => e.userId === currentUserId)) {
      currentUserEntry = await findUserRankInLeaderboard(currentUserId, category, period);
    } else if (currentUserId) {
      currentUserEntry = entries.find(e => e.userId === currentUserId);
    }

    const leaderboardData: LeaderboardData = {
      entries,
      currentUserEntry,
      totalParticipants: snapshot.size,
      lastUpdated: Timestamp.now(),
      period,
      category
    };

    const result = { success: true, data: leaderboardData };
    
    // Cache the result for 2 minutes
    globalCache.set(cacheKey, result, 2 * 60 * 1000);
    
    return result;
  } catch (error: any) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: error.message || 'Failed to get leaderboard' };
  }
};

/**
 * Get leaderboard scoped to a user's following ("My Circle").
 * Note: Uses client-provided following IDs; results merged and ranked locally.
 */
export const getCircleLeaderboard = async (
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  followingUserIds: string[],
  currentUserId?: string
): Promise<ServiceResponse<LeaderboardData>> => {
  try {
    if (!followingUserIds || followingUserIds.length === 0) {
      return { success: true, data: { entries: [], currentUserEntry: undefined, totalParticipants: 0, lastUpdated: Timestamp.now(), period, category } } as any;
    }
    const periodRange = calculatePeriodRange(period);
    const chunks: string[][] = [];
    for (let i = 0; i < followingUserIds.length; i += 10) {
      chunks.push(followingUserIds.slice(i, i + 10));
    }
    const entries: LeaderboardEntry[] = [];
    // For each chunk, query the appropriate collection and merge
    for (const chunk of chunks) {
      let q;
      switch (category) {
        case LeaderboardCategory.TOTAL_XP:
          if (period === LeaderboardPeriod.ALL_TIME) {
            q = query(collection(getSyncFirebaseDb(), 'userXP'), where('userId', 'in', chunk));
          } else {
            q = query(
              collection(getSyncFirebaseDb(), 'leaderboardStats'),
              where('userId', 'in', chunk),
              where('period', '==', period),
              where('createdAt', '>=', periodRange.start),
              where('createdAt', '<=', periodRange.end)
            );
          }
          break;
        case LeaderboardCategory.WEEKLY_XP:
          q = query(
            collection(getSyncFirebaseDb(), 'leaderboardStats'),
            where('userId', 'in', chunk),
            where('period', '==', 'weekly'),
            where('createdAt', '>=', periodRange.start)
          );
          break;
        case LeaderboardCategory.MONTHLY_XP:
          q = query(
            collection(getSyncFirebaseDb(), 'leaderboardStats'),
            where('userId', 'in', chunk),
            where('period', '==', 'monthly'),
            where('createdAt', '>=', periodRange.start)
          );
          break;
        default:
          q = query(collection(getSyncFirebaseDb(), 'userXP'), where('userId', 'in', chunk));
          break;
      }
      const snap = await getDocs(q);
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as any;
        entries.push({
          id: docSnap.id,
          userId: data.userId || '',
          userName: data.userName || data.displayName || 'Unknown User',
          userAvatar: data.userAvatar || data.avatar,
          rank: 0, // temp; compute after sorting
          value: data.value || data.totalXP || data.xp || 0,
          rankChange: data.rankChange || 0,
          isCurrentUser: currentUserId ? data.userId === currentUserId : false
        });
      });
    }
    // Sort and rank
    entries.sort((a, b) => (b.value || 0) - (a.value || 0));
    entries.forEach((e, i) => (e.rank = i + 1));
    // Determine current user entry if not already in entries
    let currentUserEntry = entries.find(e => e.userId === currentUserId);
    if (!currentUserEntry && currentUserId) {
      currentUserEntry = await findUserRankInLeaderboard(currentUserId, category, period);
    }
    const data: LeaderboardData = {
      entries,
      currentUserEntry,
      totalParticipants: entries.length,
      lastUpdated: Timestamp.now(),
      period,
      category
    };
    return { success: true, data };
  } catch (error: any) {
    console.error('Error getting circle leaderboard:', error);
    return { success: false, error: error.message || 'Failed to get circle leaderboard' };
  }
};

/**
 * Find a specific user's rank in a leaderboard
 */
export const findUserRankInLeaderboard = async (
  userId: string,
  category: LeaderboardCategory,
  period: LeaderboardPeriod
): Promise<LeaderboardEntry | undefined> => {
  try {
    const periodRange = calculatePeriodRange(period);
    const userRankQuery = buildUserRankQuery(userId, category, period, periodRange);
    
    const snapshot = await getDocs(userRankQuery);
    
    if (snapshot.empty) {
      return undefined;
    }

    const userData = snapshot.docs[0].data() as any;
    
    // Count users with higher values to determine rank
    const rankQuery = buildRankCalculationQuery(category, period, periodRange, userData.value || userData.totalXP || 0);
    const rankSnapshot = await getDocs(rankQuery);
    
    const rank = rankSnapshot.size + 1;

    return {
      userId,
      userName: userData.userName || userData.displayName || 'Unknown User',
      userAvatar: userData.userAvatar || userData.avatar,
      rank,
      value: userData.value || userData.totalXP || userData.xp || 0,
      rankChange: userData.rankChange || 0,
      isCurrentUser: true
    };
  } catch (error: any) {
    console.error('Error finding user rank:', error);
    return undefined;
  }
};

/**
 * Update user's leaderboard stats after XP gain
 */
export const updateLeaderboardStats = async (
  userId: string,
  xpGained: number
): Promise<ServiceResponse<void>> => {
  try {
    // Get user profile for display information
    const userDoc = await getDoc(doc(getSyncFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data() as any;
    const currentWeek = getWeekStart(new Date());
    const currentMonth = getMonthStart(new Date());

    // Update weekly XP stats
    const weeklyStatsRef = doc(getSyncFirebaseDb(), 'leaderboardStats', `${userId}_weekly_${currentWeek}`);
    await runTransaction(getSyncFirebaseDb(), async (transaction) => {
      const weeklySnapshot = await transaction.get(weeklyStatsRef);
      
      if (weeklySnapshot.exists()) {
        const weeklyData = weeklySnapshot.data() as any;
        const currentWeeklyXP = weeklyData?.totalXP || 0;
        transaction.update(weeklyStatsRef, {
          totalXP: currentWeeklyXP + xpGained,
          lastUpdated: Timestamp.now()
        });
      } else {
        transaction.set(weeklyStatsRef, {
          userId,
          userName: userData?.displayName || userData?.name || 'Unknown User',
          userAvatar: userData?.avatar || userData?.profilePicture,
          totalXP: xpGained,
          period: 'weekly',
          periodStart: currentWeek,
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now()
        });
      }
    });

    // Update monthly XP stats
    const monthlyStatsRef = doc(getSyncFirebaseDb(), 'leaderboardStats', `${userId}_monthly_${currentMonth}`);
    await runTransaction(getSyncFirebaseDb(), async (transaction) => {
      const monthlySnapshot = await transaction.get(monthlyStatsRef);
      
      if (monthlySnapshot.exists()) {
        const monthlyData = monthlySnapshot.data() as any;
        const currentMonthlyXP = monthlyData?.totalXP || 0;
        transaction.update(monthlyStatsRef, {
          totalXP: currentMonthlyXP + xpGained,
          lastUpdated: Timestamp.now()
        });
      } else {
        transaction.set(monthlyStatsRef, {
          userId,
          userName: userData?.displayName || userData?.name || 'Unknown User',
          userAvatar: userData?.avatar || userData?.profilePicture,
          totalXP: xpGained,
          period: 'monthly',
          periodStart: currentMonth,
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now()
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating leaderboard stats:', error);
    return { success: false, error: error.message || 'Failed to update leaderboard stats' };
  }
};

/**
 * Get multiple leaderboards at once
 */
export const getMultipleLeaderboards = async (
  configs: { category: LeaderboardCategory; period: LeaderboardPeriod; limit?: number }[],
  currentUserId?: string
): Promise<ServiceResponse<Record<string, LeaderboardData>>> => {
  try {
    const results: Record<string, LeaderboardData> = {};
    
    for (const config of configs) {
      const key = `${config.category}_${config.period}`;
      const leaderboardResult = await getLeaderboard(
        config.category,
        config.period,
        config.limit || 10,
        currentUserId
      );
      
      if (leaderboardResult.success && leaderboardResult.data) {
        results[key] = leaderboardResult.data;
      }
    }

    return { success: true, data: results };
  } catch (error: any) {
    console.error('Error getting multiple leaderboards:', error);
    return { success: false, error: error.message || 'Failed to get leaderboards' };
  }
};

/**
 * Social Features Implementation
 */

/**
 * Follow a user
 */
export const followUser = async (
  followerId: string,
  followingId: string
): Promise<ServiceResponse<void>> => {
  try {
    if (followerId === followingId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    // Check if already following
    const existingFollowQuery = query(
      collection(getSyncFirebaseDb(), 'userFollows'),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    
    const existingSnapshot = await getDocs(existingFollowQuery);
    if (!existingSnapshot.empty) {
      return { success: false, error: 'Already following this user' };
    }

    // Get following user's info
    const followingUserDoc = await getDoc(doc(getSyncFirebaseDb(), 'users', followingId));
    if (!followingUserDoc.exists()) {
      return { success: false, error: 'User to follow not found' };
    }

    const followingUserData = followingUserDoc.data() as any;

    // Create follow relationship
    const followRef = doc(collection(getSyncFirebaseDb(), 'userFollows'));
    const followData: UserFollow = {
      followerId,
      followingId,
      followingUserName: followingUserData?.displayName || followingUserData?.name || 'Unknown User',
      followingUserAvatar: followingUserData?.avatar || followingUserData?.profilePicture,
      createdAt: Timestamp.now()
    };

    await setDoc(followRef, followData);

    // Update social stats
    await updateSocialStats(followerId, 'following', 1);
    await updateSocialStats(followingId, 'followers', 1);

    // Recompute reputation for both users (followers count changed)
    await Promise.all([
      recomputeUserReputation(followerId),
      recomputeUserReputation(followingId)
    ]);

    // Create notification for followed user
    await createNotification({
      recipientId: followingId,
      type: 'new_follower',
      title: 'New Follower! 👥',
      message: `${followingUserData?.displayName || 'A user'} started following you`,
      data: { followerId },
      createdAt: Timestamp.now()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error following user:', error);
    return { success: false, error: error.message || 'Failed to follow user' };
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<ServiceResponse<void>> => {
  try {
    const followQuery = query(
      collection(getSyncFirebaseDb(), 'userFollows'),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    
    const snapshot = await getDocs(followQuery);
    if (snapshot.empty) {
      return { success: false, error: 'Not following this user' };
    }

    // Delete follow relationship
    const followDoc = snapshot.docs[0];
    await updateDoc(followDoc.ref, { deletedAt: Timestamp.now() });

    // Update social stats
    await updateSocialStats(followerId, 'following', -1);
    await updateSocialStats(followingId, 'followers', -1);

    // Recompute reputation for both users
    await Promise.all([
      recomputeUserReputation(followerId),
      recomputeUserReputation(followingId)
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message || 'Failed to unfollow user' };
  }
};

/**
 * Get user's social stats
 */
export const getUserSocialStats = async (userId: string): Promise<ServiceResponse<SocialStats>> => {
  try {
    const socialStatsRef = doc(getSyncFirebaseDb(), 'socialStats', userId);
    const snapshot = await getDoc(socialStatsRef);

    if (!snapshot.exists()) {
      // Initialize stats if they don't exist
      const defaultStats: SocialStats = {
        userId,
        followersCount: 0,
        followingCount: 0,
        leaderboardAppearances: 0,
        topRanks: {} as Record<LeaderboardCategory, number>,
        lastUpdated: Timestamp.now()
      };

      await setDoc(socialStatsRef, defaultStats);
      return { success: true, data: defaultStats };
    }

    return { success: true, data: snapshot.data() as SocialStats };
  } catch (error: any) {
    console.error('Error getting social stats:', error);
    return { success: false, error: error.message || 'Failed to get social stats' };
  }
};

/**
 * Helper Functions
 */

const updateSocialStats = async (
  userId: string,
  type: 'followers' | 'following',
  change: number
): Promise<void> => {
  const statsRef = doc(getSyncFirebaseDb(), 'socialStats', userId);
  await runTransaction(getSyncFirebaseDb(), async (transaction) => {
    const snapshot = await transaction.get(statsRef);
    
    if (snapshot.exists()) {
      const currentStats = snapshot.data() as SocialStats;
      const updateField = type === 'followers' ? 'followersCount' : 'followingCount';
      const newCount = Math.max(0, currentStats[updateField] + change);
      
      const payload: Partial<SocialStats> = {
        [updateField]: newCount,
        lastUpdated: Timestamp.now(),
      } as any;
      transaction.update(statsRef, payload);
    } else {
      const initialStats: SocialStats = {
        userId,
        followersCount: type === 'followers' ? Math.max(0, change) : 0,
        followingCount: type === 'following' ? Math.max(0, change) : 0,
        leaderboardAppearances: 0,
        topRanks: {} as Record<LeaderboardCategory, number>,
        lastUpdated: Timestamp.now()
      };
      
      transaction.set(statsRef, initialStats);
    }
  });
};

/**
 * Update gamification service to trigger leaderboard updates
 */
export const triggerLeaderboardUpdate = async (userId: string, xpGained: number): Promise<void> => {
  try {
    await updateLeaderboardStats(userId, xpGained);
  } catch (error) {
    console.warn('Failed to update leaderboard stats:', error);
  }
};
