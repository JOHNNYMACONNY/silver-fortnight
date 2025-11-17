import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, ExternalLink, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardData,
  LEADERBOARD_CONFIGS
} from '../../types/gamification';
import { getLeaderboard } from '../../services/leaderboards';
import { useAuth } from '../../AuthContext';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../ui/Card';
import { Skeleton } from '../ui/skeletons/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { logger } from '@utils/logging/logger';

interface LeaderboardWidgetProps {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  limit?: number;
  title?: string;
  showViewAll?: boolean;
  refreshInterval?: number;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  category,
  period,
  limit = 5,
  title,
  showViewAll = true,
  refreshInterval = 300000 // 5 minutes
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const config = LEADERBOARD_CONFIGS.find(c => c.category === category && c.period === period);
  const displayTitle = title || config?.title || 'Leaderboard';

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getLeaderboard(category, period, limit, user?.uid);
      
      if (result.success && result.data) {
        setData(result.data);
        setError(null);
        setLastRefresh(new Date());
      } else {
        setError(result.error || 'Failed to load leaderboard');
      }
    } catch (err) {
      setError('Failed to load leaderboard');
      logger.error('Leaderboard widget error:', 'COMPONENT', {}, err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [category, period, limit, user?.uid]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-muted-foreground" />;
      case 3:
        return <Trophy className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const formatValue = (value: number): string => {
    if (category === LeaderboardCategory.COLLABORATION_RATING) {
      return `${(value / 10).toFixed(1)}/5.0`;
    }
    if (category.includes('xp')) {
      return `${value.toLocaleString()} XP`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Trophy className="w-8 h-8" />}
            title="Error"
            description={error}
            actionLabel="Retry"
            onAction={fetchData}
          />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{displayTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Trophy className="w-8 h-8" />}
            title="No Rankings Yet"
            description="Be the first to appear on the leaderboard!"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-xs text-primary-foreground"
              style={{ backgroundColor: config?.color || 'hsl(var(--primary))' }}
            >
              {React.createElement(config?.icon ?? Trophy, { className: 'h-4 w-4' })}
            </div>
            <CardTitle className="text-sm">{displayTitle}</CardTitle>
          </div>
          {showViewAll && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/leaderboards">
                View All
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.entries.slice(0, limit).map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
              entry.isCurrentUser 
                ? 'bg-primary/10 border border-primary/20' 
                : 'hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 text-center">{getRankIcon(entry.rank)}</div>
              <Avatar
                src={entry.userAvatar}
                alt={entry.userName || 'User'}
                fallback={entry.userName?.charAt(0).toUpperCase()}
                className="w-6 h-6"
              />
              <div className="text-sm font-medium truncate max-w-24">
                {entry.userName}
                {entry.isCurrentUser && <span className="text-xs text-primary ml-1">(You)</span>}
              </div>
            </div>
            <div className="text-sm font-semibold">{formatValue(entry.value)}</div>
          </motion.div>
        ))}
      </CardContent>
      {data.currentUserEntry && !data.entries.find(e => e.userId === data.currentUserEntry?.userId) && (
        <CardFooter className="flex-col items-start text-xs space-y-1">
          <div className="text-muted-foreground">Your Position</div>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <span className="font-bold">#{data.currentUserEntry.rank}</span>
              <span className="font-medium">{data.currentUserEntry.userName}</span>
            </div>
            <div className="font-semibold">{formatValue(data.currentUserEntry.value)}</div>
          </div>
        </CardFooter>
      )}
      <CardFooter className="text-xs text-muted-foreground justify-between">
        <span>{data.totalParticipants} participants</span>
        <span>Updated {lastRefresh.toLocaleTimeString()}</span>
      </CardFooter>
    </Card>
  );
};

export default LeaderboardWidget;
