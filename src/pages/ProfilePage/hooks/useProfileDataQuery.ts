/**
 * React Query Hook for Profile Data
 * Phase 3B: Data Refetch Optimization
 * 
 * Replaces useProfileData with React Query for intelligent caching
 * and stale-while-revalidate strategy
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, getUserReviews } from '../../../services/firestore-exports';
import { getDashboardStats } from '../../../services/dashboard';
import { getUserSocialStats } from '../../../services/leaderboards';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

/**
 * User stats interface
 */
export interface UserStats {
  totalTrades: number;
  tradesThisWeek: number;
  currentXP: number;
  followersCount?: number;
}

/**
 * Reviews metadata interface
 */
export interface ReviewsMeta {
  avg: number;
  count: number;
}

/**
 * Review preview interface
 */
export interface ReviewPreview {
  rating: number;
  comment: string;
}

/**
 * Profile data response interface
 */
export interface ProfileDataResponse {
  userProfile: any;
  stats: UserStats | null;
  repScore: number | null;
  reviewsPreview: ReviewPreview[];
  reviewsMeta: ReviewsMeta | null;
}

/**
 * Fetch all profile data in parallel
 * Phase 3B: Parallelized data fetching for faster load times
 */
const fetchProfileData = async (
  targetUserId: string,
  currentUser: any,
  isOwnProfile: boolean
): Promise<ProfileDataResponse> => {
  try {
    // Parallel fetch all data (Phase 3B optimization)
    const [profileResult, statsResult, socialResult] = await Promise.all([
      getUserProfile(targetUserId),
      getDashboardStats(targetUserId),
      getUserSocialStats(targetUserId),
    ]);

    // Handle profile data
    let userProfile = null;
    if (profileResult.error) {
      logger.error('Error loading user profile:', 'PAGE', {}, profileResult.error as Error);
      // Fallback to Firebase Auth data for own profile
      if (isOwnProfile && currentUser) {
        userProfile = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || undefined,
          photoURL: currentUser.photoURL || undefined,
          metadata: {
            creationTime: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime,
          },
        };
      }
    } else {
      userProfile = profileResult.data;
    }

    // Handle stats data
    let stats: UserStats | null = null;
    let repScore: number | null = null;
    if ((statsResult as any)?.data) {
      const data = (statsResult as any).data;
      
      // Get actual follower count from userFollows collection
      let actualFollowersCount = 0;
      try {
        const db = (await import("../../../firebase-config")).db;
        if (db) {
          const followsQuery = query(
            collection(db, "userFollows"),
            where("followingId", "==", targetUserId)
          );
          const followsSnapshot = await getDocs(followsQuery);
          actualFollowersCount = followsSnapshot.size;
        } else {
          actualFollowersCount = (socialResult as any)?.data?.followersCount || 0;
        }
      } catch (error) {
        logger.warn('Could not fetch actual follower count, using socialStats:', 'PAGE', error);
        actualFollowersCount = (socialResult as any)?.data?.followersCount || 0;
      }

      stats = {
        totalTrades: data.totalTrades,
        tradesThisWeek: data.tradesThisWeek,
        currentXP: data.currentXP,
        followersCount: actualFollowersCount,
      };

      repScore = (socialResult as any)?.data?.reputationScore || 0;
    }

    // Try to get reviews (don't fail if permissions error)
    let reviewsPreview: ReviewPreview[] = [];
    let reviewsMeta: ReviewsMeta | null = null;
    try {
      const reviewsResult = await getUserReviews(targetUserId);
      if (reviewsResult && (reviewsResult as any)?.data && Array.isArray((reviewsResult as any).data)) {
        const all = (reviewsResult as any).data as Array<any>;
        const count = all.length;
        const avg = count > 0 ? all.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count : 0;
        reviewsMeta = { avg, count };
        reviewsPreview = all.slice(0, 2).map((r) => ({
          rating: Number(r.rating || 0),
          comment: String(r.comment || ""),
        }));
      }
    } catch (error) {
      logger.warn('Could not fetch reviews (permissions):', 'PAGE', error);
    }

    return {
      userProfile,
      stats,
      repScore,
      reviewsPreview,
      reviewsMeta,
    };
  } catch (error) {
    logger.error('Error fetching profile data:', 'PAGE', {}, error as Error);
    throw error;
  }
};

/**
 * React Query hook for profile data
 * Uses intelligent caching and stale-while-revalidate
 */
export const useProfileDataQuery = (
  targetUserId: string | undefined,
  currentUser: any,
  isOwnProfile: boolean
) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: () => fetchProfileData(targetUserId!, currentUser, isOwnProfile),
    enabled: !!targetUserId,
    // Phase 3B Fix: Use global config (refetchOnMount: false, staleTime: 5min)
    // This prevents unnecessary refetches and layout shifts
    // Data is fresh for 5 minutes, then background refetch when stale
  });
};

