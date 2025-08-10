import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Users
} from 'lucide-react';
import {
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardData,
  LEADERBOARD_CONFIGS
} from '../../types/gamification';
import { getLeaderboard, getMultipleLeaderboards } from '../../services/leaderboards';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/Card';
import { Skeleton } from '../ui/skeletons/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Avatar } from '../ui/Avatar';
import Box from '../layout/primitives/Box';
import Stack from '../layout/primitives/Stack';
import Cluster from '../layout/primitives/Cluster';
import { Button } from '../ui/Button';

interface LeaderboardProps {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  limit?: number;
  showCurrentUser?: boolean;
  compact?: boolean;
  refreshInterval?: number;
}

interface LeaderboardDashboardProps {
  userId?: string;
  showCompact?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  category,
  period,
  limit = 10,
  showCurrentUser = true,
  compact = false,
  refreshInterval = 300000 // 5 minutes
}) => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = LEADERBOARD_CONFIGS.find(c => c.category === category && c.period === period);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const result = await getLeaderboard(category, period, limit, user?.uid);
      
      if (result.success && result.data) {
        setLeaderboardData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load leaderboard');
      }
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    const interval = setInterval(fetchLeaderboard, refreshInterval);
    return () => clearInterval(interval);
  }, [category, period, limit, user?.uid, refreshInterval]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-accent" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Trophy className="w-5 h-5 text-secondary" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const formatValue = (value: number, category: LeaderboardCategory): string => {
    switch (category) {
      case LeaderboardCategory.TOTAL_XP:
      case LeaderboardCategory.WEEKLY_XP:
      case LeaderboardCategory.MONTHLY_XP:
        return `${value.toLocaleString()} XP`;
      case LeaderboardCategory.COLLABORATION_RATING:
        return `${(value / 10).toFixed(1)}/5.0`;
      default:
        return value.toLocaleString();
    }
  };

  const getRankChangeIndicator = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-success" />;
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={compact ? 'h-64' : 'h-96'}>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent>
          <Stack gap="sm">
            {Array.from({ length: limit }).map((_, i) => (
              <Cluster key={i} gap="sm" align="center">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Stack gap="xs" className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </Stack>
                <Skeleton className="h-4 w-16" />
              </Cluster>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Trophy className="w-12 h-12" />}
            title="Error"
            description={error}
            actionLabel="Try Again"
            onAction={fetchLeaderboard}
          />
        </CardContent>
      </Card>
    );
  }

  if (!leaderboardData || leaderboardData.entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config?.title || 'Leaderboard'}</CardTitle>
          <CardDescription>{config?.description || 'Top performers'}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Trophy className="w-12 h-12" />}
            title="No Rankings Yet"
            description="Complete trades and earn XP to appear on the leaderboard!"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ containerType: 'inline-size' }}>
      <CardHeader>
        <Cluster justify="between" align="center" gap="md">
          <Cluster gap="sm" align="center">
            <Box
              className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground"
              style={{ backgroundColor: config?.color || 'hsl(var(--primary))' }}
            >
              {config?.icon || '🏆'}
            </Box>
            <Stack gap="xs">
              <CardTitle>{config?.title || 'Leaderboard'}</CardTitle>
              <CardDescription>{config?.description || 'Top performers'}</CardDescription>
            </Stack>
          </Cluster>
          <Stack gap="xs" align="end" className="text-right text-sm text-muted-foreground">
            <div>{leaderboardData.totalParticipants} participants</div>
            <div className="text-xs">
              Updated {new Date(leaderboardData.lastUpdated.toDate()).toLocaleTimeString()}
            </div>
          </Stack>
        </Cluster>
      </CardHeader>

      <CardContent className={`${compact ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
        <Stack gap="xs">
          <AnimatePresence>
            {leaderboardData.entries.map((entry, index) => (
              <Box
                key={entry.userId}
                as={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg transition-colors ${
                  entry.isCurrentUser
                    ? 'bg-primary/10'
                    : 'hover:bg-muted/50'
                }`}
              >
                <Cluster justify="between" align="center" gap="sm">
                  <Cluster gap="sm" align="center">
                    <Box className="flex-shrink-0 w-8 text-center">{getRankIcon(entry.rank)}</Box>
                    <Avatar
                      src={entry.userAvatar}
                      alt={entry.userName || 'User'}
                      fallback={entry.userName?.charAt(0).toUpperCase()}
                      className="w-8 h-8"
                    />
                    <Stack gap="xs">
                      <div className="font-medium">
                        {entry.userName}
                        {entry.isCurrentUser && (
                          <span className="text-xs bg-primary/20 text-primary rounded-full" style={{ padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}>
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Rank #{entry.rank}
                      </div>
                    </Stack>
                  </Cluster>
                  <Stack gap="xs" align="end" className="text-right">
                    <div className="font-semibold">{formatValue(entry.value, category)}</div>
                    {entry.rankChange !== 0 && (
                      <Cluster gap="xs" align="center" justify="end" className="text-xs">
                        {getRankChangeIndicator(entry.rankChange)}
                        <span>{Math.abs(entry.rankChange)}</span>
                      </Cluster>
                    )}
                  </Stack>
                </Cluster>
              </Box>
            ))}
          </AnimatePresence>
        </Stack>
      </CardContent>
    </Card>
  );
};

export const LeaderboardDashboard: React.FC<LeaderboardDashboardProps> = ({
  userId,
  showCompact = false
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(
    LeaderboardCategory.TOTAL_XP
  );
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>(
    LeaderboardPeriod.ALL_TIME
  );
  const [multipleLeaderboards, setMultipleLeaderboards] = useState<Record<string, LeaderboardData> | null>(null);
  const [loading, setLoading] = useState(true);

  const effectiveUserId = userId || user?.uid;

  useEffect(() => {
    const fetchMultipleLeaderboards = async () => {
      try {
        setLoading(true);
        const configs = [
          { category: LeaderboardCategory.TOTAL_XP, period: LeaderboardPeriod.ALL_TIME, limit: 5 },
          { category: LeaderboardCategory.WEEKLY_XP, period: LeaderboardPeriod.WEEKLY, limit: 5 },
          { category: LeaderboardCategory.TRADE_COUNT, period: LeaderboardPeriod.ALL_TIME, limit: 5 }
        ];

        const result = await getMultipleLeaderboards(configs, effectiveUserId);
        
        if (result.success && result.data) {
          setMultipleLeaderboards(result.data);
        }
      } catch (error) {
        console.error('Failed to load leaderboards:', error);
        addToast('error', 'Failed to load leaderboards');
      } finally {
        setLoading(false);
      }
    };

    if (effectiveUserId) {
      fetchMultipleLeaderboards();
    }
  }, [effectiveUserId]);

  if (loading) {
    return (
      <Stack gap="lg">
        <Box className="animate-pulse">
          <Box className="h-8 bg-muted rounded w-1/3" style={{ marginBottom: '1rem' }}></Box>
          <Grid columns={{ base: 1, md: 3 }} gap="lg">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </Grid>
        </Box>
      </Stack>
    );
  }

  if (showCompact && multipleLeaderboards) {
    return (
      <Grid columns={{ base: 1, md: 3 }} gap="lg">
        {Object.entries(multipleLeaderboards).map(([key, _]) => {
          const [category, period] = key.split('_') as [LeaderboardCategory, LeaderboardPeriod];
          return (
            <Leaderboard
              key={key}
              category={category}
              period={period}
              limit={5}
              compact={true}
            />
          );
        })}
      </Grid>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Cluster justify="between" align="center" wrap={true} className="flex-col sm:flex-row">
        <Stack gap="xs">
          <h2 className="text-2xl font-bold text-foreground">Leaderboards</h2>
          <p className="text-muted-foreground">See how you rank against other traders</p>
        </Stack>
      </Cluster>

      {/* Category & Period Selectors */}
      <Cluster gap="md" wrap={true}>
        <Stack gap="xs">
          <label className="block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as LeaderboardCategory)}
            className="border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <option value={LeaderboardCategory.TOTAL_XP}>Total XP</option>
            <option value={LeaderboardCategory.WEEKLY_XP}>Weekly XP</option>
            <option value={LeaderboardCategory.MONTHLY_XP}>Monthly XP</option>
            <option value={LeaderboardCategory.TRADE_COUNT}>Trade Count</option>
            <option value={LeaderboardCategory.COLLABORATION_RATING}>Collaboration Rating</option>
          </select>
        </Stack>

        <Stack gap="xs">
          <label className="block text-sm font-medium text-foreground">
            Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as LeaderboardPeriod)}
            className="border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <option value={LeaderboardPeriod.ALL_TIME}>All Time</option>
            <option value={LeaderboardPeriod.MONTHLY}>Monthly</option>
            <option value={LeaderboardPeriod.WEEKLY}>Weekly</option>
            <option value={LeaderboardPeriod.DAILY}>Daily</option>
          </select>
        </Stack>
      </Cluster>

      {/* Main Leaderboard */}
      <Leaderboard
        category={selectedCategory}
        period={selectedPeriod}
        limit={25}
        showCurrentUser={true}
      />

      {/* Quick View Leaderboards */}
      {multipleLeaderboards && (
        <Stack gap="md">
          <h3 className="text-lg font-semibold text-foreground">Quick View</h3>
          <Grid columns={{ base: 1, md: 3 }} gap="lg">
            {Object.entries(multipleLeaderboards).map(([key, _]) => {
              const [category, period] = key.split('_') as [LeaderboardCategory, LeaderboardPeriod];
              return (
                <Leaderboard
                  key={key}
                  category={category}
                  period={period}
                  limit={5}
                  compact={true}
                />
              );
            })}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
};

export default LeaderboardDashboard;
