// src/components/features/RealtimeSocialFeatures.tsx

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  UserMinus,
  Users,
  TrendingUp,
  Award,
  Star,
  Heart,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import {
  SocialStats,
  LeaderboardCategory
} from '../../types/gamification';
import {
  followUser,
  unfollowUser
} from '../../services/leaderboards';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getProfileImageUrl } from '../../utils/imageUtils';
import { useRealtimeSocialStats, useRealtimeFollow } from '../../hooks/useRealtimeUpdates';
import { cn } from '../../utils/cn';

interface RealtimeSocialFeaturesProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  showFollowButton?: boolean;
  showStats?: boolean;
  compact?: boolean;
  showConnectionStatus?: boolean;
}

interface UserSocialStatsProps {
  userId: string;
  compact?: boolean;
  showConnectionStatus?: boolean;
}

export const RealtimeSocialFeatures: React.FC<RealtimeSocialFeaturesProps> = ({
  userId,
  userName,
  userAvatar,
  showFollowButton = true,
  showStats = true,
  compact = false,
  showConnectionStatus = true
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real-time social stats
  const { 
    stats: socialStats, 
    loading: statsLoading, 
    isConnected: statsConnected,
    lastUpdate: statsLastUpdate 
  } = useRealtimeSocialStats({
    userId,
    enabled: showStats,
    onUpdate: (stats) => {
      console.log('Social stats updated:', stats);
    }
  });

  // Real-time follow count
  const { 
    followersCount, 
    isConnected: followConnected,
    lastUpdate: followLastUpdate 
  } = useRealtimeFollow({
    userId,
    enabled: showStats,
    onUpdate: (count) => {
      console.log('Followers count updated:', count);
    }
  });

  const handleFollow = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.uid, userId);
        setIsFollowing(false);
        addToast('success', 'Unfollowed successfully');
      } else {
        await followUser(user.uid, userId);
        setIsFollowing(true);
        addToast('success', 'Following successfully');
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      addToast('error', 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = () => {
    if (statsConnected && followConnected) {
      return { connected: true, text: 'Live', icon: Wifi, color: 'text-green-500' };
    } else if (statsConnected || followConnected) {
      return { connected: false, text: 'Partial', icon: RefreshCw, color: 'text-yellow-500' };
    } else {
      return { connected: false, text: 'Offline', icon: WifiOff, color: 'text-red-500' };
    }
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {showConnectionStatus && (
          <div className="flex items-center gap-1">
            <ConnectionIcon className={cn("h-3 w-3", connectionStatus.color)} />
            <span className={cn("text-xs", connectionStatus.color)}>
              {connectionStatus.text}
            </span>
          </div>
        )}
        {showFollowButton && user && user.uid !== userId && (
          <button
            onClick={handleFollow}
            disabled={loading}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
              isFollowing
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            )}
          >
            {loading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isFollowing ? (
              <UserMinus className="h-3 w-3" />
            ) : (
              <UserPlus className="h-3 w-3" />
            )}
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
        {showStats && socialStats && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{followersCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{socialStats.rank || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <ConnectionIcon className={cn("h-4 w-4", connectionStatus.color)} />
            <span className={cn("text-sm font-medium", connectionStatus.color)}>
              {connectionStatus.text}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {statsLastUpdate && `Updated ${new Date(statsLastUpdate).toLocaleTimeString()}`}
          </div>
        </div>
      )}

      {/* Follow Button */}
      {showFollowButton && user && user.uid !== userId && (
        <button
          onClick={handleFollow}
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            isFollowing
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          )}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isFollowing ? (
            <UserMinus className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}

      {/* Social Stats */}
      {showStats && (
        <UserSocialStats 
          userId={userId} 
          compact={false}
          showConnectionStatus={showConnectionStatus}
        />
      )}
    </div>
  );
};

const UserSocialStats: React.FC<UserSocialStatsProps> = ({
  userId,
  compact = false,
  showConnectionStatus = true
}) => {
  const { 
    stats: socialStats, 
    loading: statsLoading, 
    isConnected: statsConnected,
    lastUpdate: statsLastUpdate 
  } = useRealtimeSocialStats({
    userId,
    onUpdate: (stats) => {
      console.log('Social stats updated in UserSocialStats:', stats);
    }
  });

  const { 
    followersCount, 
    isConnected: followConnected,
    lastUpdate: followLastUpdate 
  } = useRealtimeFollow({
    userId,
    onUpdate: (count) => {
      console.log('Followers count updated in UserSocialStats:', count);
    }
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
        <span className="ml-2 text-sm text-gray-500">Loading stats...</span>
      </div>
    );
  }

  if (!socialStats) {
    return (
      <div className="text-center p-4 text-gray-500">
        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No social stats available</p>
      </div>
    );
  }

  const getTopRankDisplay = (rank: number | undefined): string => {
    if (!rank) return 'N/A';
    if (rank <= 3) return `#${rank}`;
    if (rank <= 10) return `Top 10`;
    if (rank <= 100) return `Top 100`;
    return `#${rank}`;
  };

  const stats = [
    {
      label: 'Followers',
      value: followersCount,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Following',
      value: socialStats.followingCount || 0,
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Rank',
      value: getTopRankDisplay(socialStats.rank as number),
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Reputation',
      value: socialStats.reputationScore || 0,
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {showConnectionStatus && (
          <div className="flex items-center gap-1">
            {statsConnected && followConnected ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
          </div>
        )}
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center gap-1 text-sm">
              <Icon className="h-3 w-3 text-gray-500" />
              <span className="font-medium">{stat.value}</span>
              <span className="text-gray-500">{stat.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {statsConnected && followConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Live Updates</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Offline</span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {statsLastUpdate && `Updated ${new Date(statsLastUpdate).toLocaleTimeString()}`}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg flex items-center gap-3",
                stat.bgColor
              )}
            >
              <Icon className={cn("h-5 w-5", stat.color)} />
              <div>
                <div className={cn("text-lg font-bold", stat.color)}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      {socialStats.weeklyXP && socialStats.weeklyXP > 0 && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">This Week</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            +{socialStats.weeklyXP} XP
          </div>
        </div>
      )}
    </div>
  );
};
