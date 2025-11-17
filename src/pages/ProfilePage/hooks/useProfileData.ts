import { useState, useEffect } from "react";
import { getUserProfile } from "../../../services/firestore-exports";
import { getDashboardStats } from "../../../services/dashboard";
import { getUserSocialStats } from "../../../services/leaderboards";
import { getUserReviews } from "../../../services/firestore-exports";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { BannerData } from "../../../utils/imageUtils";
import { logger } from '@utils/logging/logger';

/**
 * UserProfile interface representing the complete user profile data
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  handle?: string;
  verified?: boolean;
  handlePrivate?: boolean;
  tagline?: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  website?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  profilePicture?: string;
  banner?: BannerData | string | null;
}

/**
 * Stats interface for user statistics
 */
export interface UserStats {
  totalTrades: number;
  tradesThisWeek: number;
  currentXP?: number;
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
 * Return type for useProfileData hook
 */
export interface ProfileDataHookReturn {
  userProfile: UserProfile | null;
  loading: boolean;
  stats: UserStats | null;
  repScore: number | null;
  reviewsPreview: ReviewPreview[];
  reviewsLoading: boolean;
  reviewsMeta: ReviewsMeta | null;
  mutualFollows: { count: number; names: string[] };
  setUserProfile: (
    profile: UserProfile | ((prev: UserProfile | null) => UserProfile | null)
  ) => void;
  setMutualFollows: (follows: { count: number; names: string[] }) => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing profile data
 * Handles user profile, stats, reviews, and reputation score
 *
 * @param targetUserId - The ID of the user whose profile to fetch
 * @param currentUser - The current authenticated user (for own profile fallback)
 * @param isOwnProfile - Whether this is the current user's own profile
 * @returns ProfileDataHookReturn object with profile data and loading states
 *
 * @example
 * const { userProfile, loading, stats, repScore } = useProfileData(userId, currentUser, isOwnProfile);
 */
export const useProfileData = (
  targetUserId: string | undefined,
  currentUser: any,
  isOwnProfile: boolean
): ProfileDataHookReturn => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [repScore, setRepScore] = useState<number | null>(null);
  const [reviewsPreview, setReviewsPreview] = useState<ReviewPreview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewsMeta, setReviewsMeta] = useState<ReviewsMeta | null>(null);
  const [mutualFollows, setMutualFollows] = useState<{
    count: number;
    names: string[];
  }>({ count: 0, names: [] });

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      try {
        if (targetUserId) {
          const { data: profile, error } = await getUserProfile(targetUserId);
          if (error) {
            logger.error('Error loading user profile:', 'PAGE', {}, error as Error);
            // Fallback to Firebase Auth data for own profile if Firestore fetch fails
            if (isOwnProfile && currentUser) {
              setUserProfile({
                uid: currentUser.uid,
                email: currentUser.email || "",
                displayName: currentUser.displayName || undefined,
                photoURL: currentUser.photoURL || undefined,
                metadata: {
                  creationTime: currentUser.metadata.creationTime,
                  lastSignInTime: currentUser.metadata.lastSignInTime,
                },
              });
            }
          } else if (profile) {
            // Merge Firestore data with Firebase Auth metadata for own profile
            if (isOwnProfile && currentUser) {
              setUserProfile({
                ...profile,
                metadata: {
                  creationTime: currentUser.metadata.creationTime,
                  lastSignInTime: currentUser.metadata.lastSignInTime,
                },
              } as UserProfile);
            } else {
              setUserProfile(profile as UserProfile);
            }
          }
        }
      } catch (error) {
        logger.error('Error loading user profile:', 'PAGE', {}, error as Error);
        // Fallback to Firebase Auth data for own profile if there's an error
        if (isOwnProfile && currentUser) {
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || undefined,
            photoURL: currentUser.photoURL || undefined,
            metadata: {
              creationTime: currentUser.metadata.creationTime,
              lastSignInTime: currentUser.metadata.lastSignInTime,
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [targetUserId, currentUser, isOwnProfile]);

  // Load stats and reviews
  useEffect(() => {
    if (!targetUserId) return;
    if (stats && repScore !== null) return; // Don't refetch if we already have data

    (async () => {
      try {
        setReviewsLoading(true);
        const [statsResult, socialResult] = await Promise.all([
          getDashboardStats(targetUserId),
          getUserSocialStats(targetUserId),
        ]);

        // Try to get reviews, but don't fail if there's a permissions error
        let reviewsResult: any = null;
        try {
          reviewsResult = await getUserReviews(targetUserId);
        } catch (error) {
          logger.warn('Could not fetch reviews (permissions):', 'PAGE', error);
        }

        if ((statsResult as any)?.data) {
          const data = (statsResult as any).data;
          setStats({
            totalTrades: data.totalTrades,
            tradesThisWeek: data.tradesThisWeek,
            currentXP: data.currentXP,
          });

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
              actualFollowersCount =
                (socialResult as any)?.data?.followersCount || 0;
            }
          } catch (error) {
            logger.warn('Could not fetch actual follower count, using socialStats:', 'PAGE', error);
            actualFollowersCount =
              (socialResult as any)?.data?.followersCount || 0;
          }

          // Composite reputation: XP (50%), trades (30%), followers (20%)
          const xpNorm = Math.min(1, Number(data.currentXP || 0) / 5000);
          const tradesNorm = Math.min(1, Number(data.totalTrades || 0) / 100);
          const followersNorm = Math.min(1, actualFollowersCount / 1000);
          const composite = Math.round(
            100 * (0.5 * xpNorm + 0.3 * tradesNorm + 0.2 * followersNorm)
          );
          setRepScore(composite);
        }

        if (
          reviewsResult &&
          (reviewsResult as any)?.data &&
          Array.isArray((reviewsResult as any).data)
        ) {
          const all = (reviewsResult as any).data as Array<any>;
          const count = all.length;
          const avg =
            count > 0
              ? all.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count
              : 0;
          setReviewsMeta({ avg, count });
          const list = all.slice(0, 2).map((r) => ({
            rating: Number(r.rating || 0),
            comment: String(r.comment || ""),
          }));
          setReviewsPreview(list);
        }
      } catch (error) {
        logger.error('Error fetching profile stats:', 'PAGE', {}, error as Error);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [targetUserId, stats, repScore]);

  const refetch = async () => {
    setStats(null);
    setRepScore(null);
    setReviewsPreview([]);
    setReviewsMeta(null);
  };

  return {
    userProfile,
    loading,
    stats,
    repScore,
    reviewsPreview,
    reviewsLoading,
    reviewsMeta,
    mutualFollows,
    setUserProfile,
    setMutualFollows,
    refetch,
  };
};
