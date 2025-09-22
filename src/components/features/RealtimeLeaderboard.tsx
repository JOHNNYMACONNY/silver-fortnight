// src/components/features/RealtimeLeaderboard.tsx

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock
} from 'lucide-react';
import { LeaderboardEntry, LeaderboardCategory, LeaderboardPeriod } from '../../types/gamification';
import { useRealtimeLeaderboard } from '../../hooks/useRealtimeUpdates';
import { getProfileImageUrl } from '../../utils/imageUtils';
import { cn } from '../../utils/cn';

interface RealtimeLeaderboardProps {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  limit?: number;
  showConnectionStatus?: boolean;
  showLastUpdate?: boolean;
  compact?: boolean;
  onUserClick?: (userId: string) => void;
}

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  rank: number;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  entry,
  rank,
  currentUserId,
  onUserClick
}) => {
  const isCurrentUser = currentUserId === entry.userId;
  const isTopThree = rank <= 3;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
        getRankColor(rank),
        isCurrentUser && "ring-2 ring-blue-500 ring-opacity-50"
      )}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-8 flex justify-center">
        {isTopThree ? getRankIcon(rank) : getRankIcon(rank)}
      </div>

      {/* User Info */}
      <div 
        className="flex-1 flex items-center gap-3 cursor-pointer"
        onClick={() => onUserClick?.(entry.userId)}
      >
        <div className="relative">
          <img
            src={getProfileImageUrl(entry.userId, entry.photoURL as any)}
            alt={entry.displayName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          {isCurrentUser && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold truncate",
              isCurrentUser ? "text-blue-700" : "text-gray-900"
            )}>
              {entry.displayName}
            </h3>
            {isCurrentUser && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                You
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            @{entry.handle || entry.userId.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Score */}
      <div className="flex-shrink-0 text-right">
        <div className="text-lg font-bold text-gray-900">
          {entry.score?.toLocaleString() || 'N/A'}
        </div>
        <div className="text-xs text-gray-500">
          {entry.category === 'totalXP' ? 'XP' : 
           entry.category === 'weeklyXP' ? 'Weekly XP' :
           entry.category === 'tradeCount' ? 'Trades' :
           entry.category === 'collaborationRating' ? 'Rating' : 'Score'}
        </div>
      </div>
    </div>
  );
};

export const RealtimeLeaderboard: React.FC<RealtimeLeaderboardProps> = ({
  category,
  period,
  limit = 50,
  showConnectionStatus = true,
  showLastUpdate = true,
  compact = false,
  onUserClick
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    entries,
    loading,
    error,
    lastUpdate,
    isConnected
  } = useRealtimeLeaderboard({
    category,
    period,
    limit,
    onUpdate: (newEntries) => {
      console.log('Leaderboard updated:', newEntries);
    }
  });

  // Get current user ID (you might want to get this from auth context)
  useEffect(() => {
    // This would typically come from your auth context
    // For now, we'll leave it as null
    setCurrentUserId(null);
  }, []);

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading leaderboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <WifiOff className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const getCategoryTitle = (category: LeaderboardCategory) => {
    switch (category) {
      case LeaderboardCategory.TOTAL_XP:
        return 'Total XP';
      case LeaderboardCategory.WEEKLY_XP:
        return 'Weekly XP';
      case LeaderboardCategory.TRADE_COUNT:
        return 'Trade Count';
      case LeaderboardCategory.COLLABORATION_RATING:
        return 'Collaboration Rating';
      default:
        return 'Leaderboard';
    }
  };

  const getPeriodTitle = (period: LeaderboardPeriod) => {
    switch (period) {
      case LeaderboardPeriod.ALL_TIME:
        return 'All Time';
      case LeaderboardPeriod.MONTHLY:
        return 'This Month';
      case LeaderboardPeriod.WEEKLY:
        return 'This Week';
      default:
        return '';
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">
              {getCategoryTitle(category)}
            </h3>
            {showConnectionStatus && (
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
              </div>
            )}
          </div>
          {showLastUpdate && lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Top 3 */}
        <div className="space-y-1">
          {entries.slice(0, 3).map((entry, index) => (
            <LeaderboardItem
              key={entry.id || entry.userId}
              entry={entry}
              rank={index + 1}
              currentUserId={currentUserId || undefined}
              onUserClick={onUserClick}
            />
          ))}
        </div>

        {entries.length > 3 && (
          <div className="text-center">
            <span className="text-xs text-gray-500">
              +{entries.length - 3} more
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {getCategoryTitle(category)}
            </h2>
            <p className="text-sm text-gray-500">
              {getPeriodTitle(period)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {showConnectionStatus && (
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Offline</span>
                </>
              )}
            </div>
          )}
          
          {showLastUpdate && lastUpdate && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Updated {new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{entries.length} participants</span>
        </div>
        {isConnected && (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>Live updates</span>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="text-center p-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
            <p className="text-gray-500">
              Be the first to appear on this leaderboard!
            </p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <LeaderboardItem
              key={entry.id || entry.userId}
              entry={entry}
              rank={index + 1}
              currentUserId={currentUserId || undefined}
              onUserClick={onUserClick}
            />
          ))
        )}
      </div>

      {/* Loading indicator for updates */}
      {loading && entries.length > 0 && (
        <div className="flex items-center justify-center py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
          <span className="ml-2 text-sm text-gray-500">Updating...</span>
        </div>
      )}
    </div>
  );
};
