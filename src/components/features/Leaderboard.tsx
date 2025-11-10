import React, { useState, useEffect, ReactNode } from 'react';
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
import { getLeaderboard, getMultipleLeaderboards, getCircleLeaderboard } from '../../services/leaderboards';
import { getRelatedUserIds } from '../../services/firestore';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/Card';
import { Skeleton } from '../ui/skeletons/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Avatar } from '../ui/Avatar';
import Box from '../layout/primitives/Box';
import Stack from '../layout/primitives/Stack';
import Cluster from '../layout/primitives/Cluster';
import Grid from '../layout/primitives/Grid';
import { Button } from '../ui/Button';

interface LeaderboardProps {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  limit?: number;
  showCurrentUser?: boolean;
  compact?: boolean;
  refreshInterval?: number;
  wrapped?: boolean; // Control whether to render Card wrapper
  headerControls?: ReactNode;
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
  refreshInterval = 300000, // 5 minutes
  wrapped = true, // Default to true for backward compatibility
  headerControls
}) => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMyCircle, setShowMyCircle] = useState(false);
  const [followingCount, setFollowingCount] = useState<number | null>(null);

  const config = LEADERBOARD_CONFIGS.find(c => c.category === category && c.period === period);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      let result;
      if (showMyCircle && user?.uid) {
        // Fetch following IDs and then circle leaderboard
        const rel = await getRelatedUserIds(user.uid, 'following', { limit: 100 });
        const followingIds = rel.data?.ids || [];
        if (followingIds.length === 0) {
          setLeaderboardData({ entries: [], currentUserEntry: undefined, totalParticipants: 0, lastUpdated: new Date() as any, period, category } as any);
          setError(null);
          setLoading(false);
          return;
        }
        result = await getCircleLeaderboard(category, period, followingIds, user?.uid);
      } else {
        result = await getLeaderboard(category, period, limit, user?.uid);
      }
      
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
  }, [category, period, limit, user?.uid, refreshInterval, showMyCircle]);

  // Load following count to gate the My Circle toggle
  useEffect(() => {
    (async () => {
      try {
        if (!user?.uid) {
          setFollowingCount(null);
          return;
        }
        // Load persisted My Circle preference
        try {
          const v = window.localStorage.getItem(`leaderboard-circle-${user.uid}`);
          if (v === '1') setShowMyCircle(true);
        } catch {}
        const rel = await getRelatedUserIds(user.uid, 'following', { limit: 1 });
        setFollowingCount(rel.data?.ids?.length || 0);
      } catch {
        setFollowingCount(null);
      }
    })();
  }, [user?.uid]);

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
    const content = (
      <>
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
      </>
    );

    return wrapped ? (
      <Card variant="glass" className={compact ? 'h-64' : 'h-96'}>
        {content}
      </Card>
    ) : content;
  }

  if (error) {
    const content = (
      <CardContent className="pt-6">
        <EmptyState
          icon={<Trophy className="w-12 h-12" />}
          title="Error"
          description={error}
          actionLabel="Try Again"
          onAction={fetchLeaderboard}
        />
      </CardContent>
    );

    return wrapped ? (
      <Card variant="glass">
        {content}
      </Card>
    ) : content;
  }

  if (!leaderboardData || leaderboardData.entries.length === 0) {
    const content = (
      <>
        <CardHeader>
          <CardTitle>{config?.title || 'Leaderboard'}</CardTitle>
          <CardDescription>{config?.description || 'Top performers'}</CardDescription>
        </CardHeader>
        <CardContent>
          {showMyCircle ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No Circle Rankings Yet"
              description="People you follow haven't appeared on this leaderboard yet."
              actionLabel="Show Global"
              onAction={() => setShowMyCircle(false)}
            />
          ) : (
            <EmptyState
              icon={<Trophy className="w-12 h-12" />}
              title="No Rankings Yet"
              description="Complete trades and earn XP to appear on the leaderboard!"
            />
          )}
        </CardContent>
      </>
    );

    return wrapped ? (
      <Card variant="glass">
        {content}
      </Card>
    ) : content;
  }

  // Leaderboard entries content
  const entriesContent = (
    <Stack gap="xs">
      <AnimatePresence>
        {leaderboardData.entries.map((entry, index) => (
          <motion.div
            key={entry.userId}
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
                      <span className="ml-2 text-xs bg-primary/20 text-primary rounded-full px-2 py-1">
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
          </motion.div>
        ))}
      </AnimatePresence>
      {leaderboardData.currentUserEntry && !leaderboardData.entries.find(e => e.userId === leaderboardData.currentUserEntry!.userId) && (
        <div className="mt-2 border-t border-border pt-2">
          <div className="text-xs text-muted-foreground mb-1">Your rank</div>
          <div className="p-3 rounded-lg bg-primary/5">
            <Cluster justify="between" align="center" gap="sm">
              <Cluster gap="sm" align="center">
                <Box className="flex-shrink-0 w-8 text-center">{getRankIcon(leaderboardData.currentUserEntry.rank)}</Box>
                <Avatar
                  src={leaderboardData.currentUserEntry.userAvatar}
                  alt={leaderboardData.currentUserEntry.userName || 'You'}
                  fallback={(leaderboardData.currentUserEntry.userName || 'Y').charAt(0).toUpperCase()}
                  className="w-8 h-8"
                />
                <Stack gap="xs">
                  <div className="font-medium">You</div>
                  <div className="text-sm text-muted-foreground">Rank #{leaderboardData.currentUserEntry.rank}</div>
                </Stack>
              </Cluster>
              <Stack gap="xs" align="end" className="text-right">
                <div className="font-semibold">{formatValue(leaderboardData.currentUserEntry.value, category)}</div>
              </Stack>
            </Cluster>
          </div>
        </div>
      )}
    </Stack>
  );

  // When wrapped=false, only render entries without header
  if (!wrapped) {
    return entriesContent;
  }

  // When wrapped=true, render full Card with header
  return (
    <Card variant="glass" className="@container glassmorphic border-glass hover:shadow-md transition-shadow duration-300" interactive={true}>
      <CardHeader>
        <Stack gap="md">
          <Cluster justify="between" align="center" gap="md">
            <Cluster gap="sm" align="center">
              <Box
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground ${config?.color ? '' : 'bg-primary'}`}
                style={config?.color ? { backgroundColor: config.color } : undefined}
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
              {user?.uid && (followingCount ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !showMyCircle;
                    setShowMyCircle(next);
                    try { window.localStorage.setItem(`leaderboard-circle-${user!.uid}`, next ? '1' : '0'); } catch {}
                  }}
                  className="text-xs text-primary hover:underline"
                  aria-pressed={showMyCircle}
                  title={showMyCircle ? 'Showing only people you follow' : 'View leaderboard for people you follow'}
                >
                  {showMyCircle ? 'Showing: My Circle' : 'Filter: My Circle'}
                </button>
              )}
            </Stack>
          </Cluster>
          {headerControls && (
            <div className="w-full">
              {headerControls}
            </div>
          )}
        </Stack>
      </CardHeader>
      <CardContent className={`${compact ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
        {entriesContent}
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
          <Box className="h-8 bg-muted rounded w-1/3 mb-4">&nbsp;</Box>
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
