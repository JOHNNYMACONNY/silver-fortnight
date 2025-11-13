import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  UserMinus,
  Users,
  TrendingUp,
  Award,
  Star,
  Heart
} from 'lucide-react';
import {
  SocialStats,
  LeaderboardCategory
} from '../../types/gamification';
import {
  followUser,
  unfollowUser,
  getUserSocialStats,
  checkIsFollowing
} from '../../services/leaderboards';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getProfileImageUrl } from '../../utils/imageUtils';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface SocialFeaturesProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  showFollowButton?: boolean;
  showStats?: boolean;
  compact?: boolean;
  surface?: 'embedded' | 'standalone';
}

interface UserSocialStatsProps {
  userId: string;
  compact?: boolean;
  onFollowersClick?: () => void;
  onLeaderboardClick?: () => void;
}

export const SocialFeatures: React.FC<SocialFeaturesProps> = ({
  userId,
  userName,
  userAvatar,
  showFollowButton = true,
  showStats = true,
  compact = false,
  surface = 'standalone'
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    const fetchSocialStats = async () => {
      try {
        setStatsLoading(true);
        const result = await getUserSocialStats(userId);
        let stats = result.success && result.data ? result.data : null;
        
        // Query actual follower count from userFollows for accuracy
        if (stats) {
          try {
            const { db } = await import('../../firebase-config');
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            
            // Get actual followers count
            const followersQuery = query(
              collection(db, 'userFollows'),
              where('followingId', '==', userId)
            );
            const followersSnapshot = await getDocs(followersQuery);
            
            // Get actual following count
            const followingQuery = query(
              collection(db, 'userFollows'),
              where('followerId', '==', userId)
            );
            const followingSnapshot = await getDocs(followingQuery);
            
            // Update stats with actual counts
            stats = {
              ...stats,
              followersCount: followersSnapshot.size,
              followingCount: followingSnapshot.size
            };
          } catch (error) {
            console.warn('Could not fetch actual follow counts, using socialStats:', error);
          }
        }
        
        setSocialStats(stats);
      } catch (error) {
        console.error('Failed to load social stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchSocialStats();
  }, [userId]);

  // Check if current user is following this user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user?.uid || isOwnProfile) {
        setIsFollowing(false);
        return;
      }

      try {
        const following = await checkIsFollowing(user.uid, userId);
        setIsFollowing(following);
      } catch (error) {
        console.error('Failed to check follow status:', error);
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [user?.uid, userId, isOwnProfile]);

  const handleFollow = async () => {
    if (!user?.uid) {
      addToast('error', 'Please sign in to follow users');
      return;
    }

    try {
      setLoading(true);
      const result = await followUser(user.uid, userId);
      
      if (result.success) {
        setIsFollowing(true);
        // ON-DEMAND CALCULATION: Refresh stats to get accurate follower count
        const updatedStats = await getUserSocialStats(userId);
        if (updatedStats.success && updatedStats.data) {
          setSocialStats(updatedStats.data);
        }
        addToast('success', `You're now following ${userName}!`);
      } else {
        addToast('error', result.error || 'Failed to follow user');
      }
    } catch (error) {
      addToast('error', 'Failed to follow user');
      console.error('Follow error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const result = await unfollowUser(user.uid, userId);
      
      if (result.success) {
        setIsFollowing(false);
        // ON-DEMAND CALCULATION: Refresh stats to get accurate follower count
        const updatedStats = await getUserSocialStats(userId);
        if (updatedStats.success && updatedStats.data) {
          setSocialStats(updatedStats.data);
        }
        addToast('success', `Unfollowed ${userName}`);
      } else {
        addToast('error', result.error || 'Failed to unfollow user');
      }
    } catch (error) {
      addToast('error', 'Failed to unfollow user');
      console.error('Unfollow error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopRankDisplay = () => {
    if (!socialStats?.topRanks) return null;
    
    const topRanks = Object.entries(socialStats.topRanks)
      .filter(([, rank]) => rank > 0)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3);

    if (topRanks.length === 0) return null;

    return topRanks.map(([category, rank]) => {
      const categoryNames: Record<string, string> = {
        [LeaderboardCategory.TOTAL_XP]: 'XP',
        [LeaderboardCategory.TRADE_COUNT]: 'Trades',
        [LeaderboardCategory.COLLABORATION_RATING]: 'Collaboration'
      };

      const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-accent-foreground bg-[color:var(--color-accent-foreground)/0.12]';
        if (rank <= 3) return 'text-secondary-foreground bg-[color:var(--color-secondary-foreground)/0.12]';
        if (rank <= 10) return 'text-primary bg-primary/10';
        return 'bg-muted text-muted-foreground';
      };

      return (
        <div key={category} className={`px-2 py-1 rounded-full text-xs font-medium ${getRankColor(rank)}`}>
          #{rank} {categoryNames[category] || category}
        </div>
      );
    });
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        {showStats && socialStats && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{socialStats.followersCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>{socialStats.leaderboardAppearances}</span>
            </div>
          </div>
        )}
        
        {showFollowButton && !isOwnProfile && user && (
          <Button
            type="button"
            onClick={isFollowing ? handleUnfollow : handleFollow}
            disabled={loading}
            isLoading={loading}
            variant="glass-toggle"
            size="sm"
            data-active={isFollowing}
            aria-pressed={isFollowing}
            className="rounded-full px-3"
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 mr-1" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  const statTileClass = cn(
    'glassmorphic border-glass px-4 py-3 rounded-xl text-center transition-all duration-200',
    'shadow-sm hover:shadow-md'
  );

  const content = (
    <div className="space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {userAvatar ? (
            <img
              src={getProfileImageUrl(userAvatar, 48)}
              alt={userName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 glassmorphic border-glass rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground text-lg">{userName}</h3>
            <p className="text-sm text-muted-foreground">
              {isOwnProfile ? 'Your Profile' : 'Trader Profile'}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          {showFollowButton && !isOwnProfile && user && (
            <Button
              type="button"
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={loading}
              isLoading={loading}
              variant="glass-toggle"
              size="sm"
              data-active={isFollowing}
              aria-pressed={isFollowing}
              className="rounded-full w-full justify-center h-auto px-4 py-3 sm:w-auto sm:py-2"
            >
              {isFollowing ? (
                <>
                  <UserMinus className="w-5 h-5 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="space-y-4 sm:space-y-5">
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glassmorphic border-glass h-16 rounded-xl"></div>
                ))}
              </div>
            </div>
          ) : socialStats ? (
            <>
              {/* Basic Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={statTileClass}>
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {socialStats.followersCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>

                <div className={statTileClass}>
                  <div className="flex items-center justify-center mb-1">
                    <Heart className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {socialStats.followingCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>

                <div className={statTileClass}>
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {socialStats.leaderboardAppearances.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Leaderboard Spots</div>
                </div>

                <div className={statTileClass}>
                  <div className="flex items-center justify-center mb-1">
                    <Award className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {Object.keys(socialStats.topRanks || {}).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Top Rankings</div>
                </div>
              </div>

              {/* Top Ranks */}
              {socialStats.topRanks && Object.keys(socialStats.topRanks).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground flex items-center">
                    <Star className="w-4 h-4 mr-2 text-accent-foreground" />
                    Best Rankings
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {getTopRankDisplay()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No social stats available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (surface === 'embedded') {
    return content;
  }

  return (
    <div className="glassmorphic border-glass rounded-2xl p-6 shadow-lg text-card-foreground">
      {content}
    </div>
  );
};

export const UserSocialStats: React.FC<UserSocialStatsProps> = ({
  userId,
  compact = false,
  onFollowersClick,
  onLeaderboardClick
}) => {
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get socialStats for most data
        const result = await getUserSocialStats(userId);
        let stats = result.success && result.data ? result.data : null;
        
        // Query actual follower count from userFollows for accuracy
        if (stats) {
          try {
            const { db } = await import('../../firebase-config');
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            
            // Get actual followers count
            const followersQuery = query(
              collection(db, 'userFollows'),
              where('followingId', '==', userId)
            );
            const followersSnapshot = await getDocs(followersQuery);
            
            // Get actual following count
            const followingQuery = query(
              collection(db, 'userFollows'),
              where('followerId', '==', userId)
            );
            const followingSnapshot = await getDocs(followingQuery);
            
            // Update stats with actual counts
            stats = {
              ...stats,
              followersCount: followersSnapshot.size,
              followingCount: followingSnapshot.size
            };
          } catch (error) {
            console.warn('Could not fetch actual follow counts, using socialStats:', error);
          }
        }
        
        setSocialStats(stats);
      } catch (error) {
        console.error('Failed to load social stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex space-x-4">
          <div className="h-4 bg-muted rounded w-16"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (!socialStats) return null;

  if (compact) {
    return (
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={onFollowersClick}
          className="flex items-center space-x-1 hover:text-foreground transition-colors cursor-pointer"
          aria-label={`${socialStats.followersCount} followers`}
        >
          <Users className="w-4 h-4" />
          <span>{socialStats.followersCount}</span>
        </button>
        <button
          type="button"
          onClick={onLeaderboardClick}
          className="flex items-center space-x-1 hover:text-foreground transition-colors cursor-pointer"
          aria-label={`${socialStats.leaderboardAppearances} leaderboard appearances`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{socialStats.leaderboardAppearances}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-lg font-bold text-foreground">
          {socialStats.followersCount.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">Followers</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-foreground">
          {socialStats.followingCount.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">Following</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-foreground">
          {socialStats.leaderboardAppearances.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">Rankings</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-foreground">
          {Object.keys(socialStats.topRanks || {}).length}
        </div>
        <div className="text-sm text-muted-foreground">Top Spots</div>
      </div>
    </div>
  );
};

export default SocialFeatures;
