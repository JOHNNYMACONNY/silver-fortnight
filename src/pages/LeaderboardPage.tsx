import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Leaderboard } from '../components/features/Leaderboard';
import { SocialFeatures } from '../components/features/SocialFeatures';
import { LeaderboardCategory, LeaderboardPeriod } from '../types/gamification';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Award, Trophy, Users, Calendar, TrendingUp, ChevronDown } from '../utils/icons';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeletons/Skeleton';
import { getUserXP } from '../services/gamification';
import type { UserXP } from '../types/gamification';
import { getLeaderboard } from '../services/leaderboards';
import Stack from '../components/layout/primitives/Stack';
import { cn } from '../utils/cn';


const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(LeaderboardCategory.TOTAL_XP);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);
  
  // Quick Stats state
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [weeklyXP, setWeeklyXP] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [socialExpanded, setSocialExpanded] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(true);

  const categories = [
    { value: LeaderboardCategory.TOTAL_XP, label: 'Total XP', icon: <Trophy className="h-4 w-4" /> },
    { value: LeaderboardCategory.WEEKLY_XP, label: 'Weekly XP', icon: <Calendar className="h-4 w-4" /> },
    { value: LeaderboardCategory.TRADE_COUNT, label: 'Trade Count', icon: <TrendingUp className="h-4 w-4" /> },
    { value: LeaderboardCategory.COLLABORATION_RATING, label: 'Completion Rate', icon: <Award className="h-4 w-4" /> },
  ];

  const periods = [
    { value: LeaderboardPeriod.ALL_TIME, label: 'All Time' },
    { value: LeaderboardPeriod.MONTHLY, label: 'This Month' },
    { value: LeaderboardPeriod.WEEKLY, label: 'This Week' },
  ];

  // Fetch user stats for Quick Stats section
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setStatsLoading(true);
        
        // Fetch user XP
        const xpResult = await getUserXP(currentUser.uid);
        if (xpResult.success && xpResult.data) {
          setUserXP(xpResult.data);
        }
        
        // Fetch user rank from total XP leaderboard
        const rankResult = await getLeaderboard(
          LeaderboardCategory.TOTAL_XP,
          LeaderboardPeriod.ALL_TIME,
          100,
          currentUser.uid
        );
        if (rankResult.success && rankResult.data?.currentUserEntry) {
          setUserRank(rankResult.data.currentUserEntry.rank);
        }
        
        // Fetch weekly XP
        const weeklyResult = await getLeaderboard(
          LeaderboardCategory.WEEKLY_XP,
          LeaderboardPeriod.WEEKLY,
          100,
          currentUser.uid
        );
        if (weeklyResult.success && weeklyResult.data?.currentUserEntry) {
          setWeeklyXP(weeklyResult.data.currentUserEntry.value);
        }
      } catch (error) {
        console.error('Failed to load user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchUserStats();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 639px)');

    const applyViewportState = (matches: boolean) => {
      setIsMobileViewport(matches);
      if (matches) {
        setSocialExpanded(false);
        setStatsExpanded(false);
      } else {
        setSocialExpanded(true);
        setStatsExpanded(true);
      }
    };

    applyViewportState(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => applyViewportState(event.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card variant="glass" className="rounded-lg shadow-sm border border-border">
          <CardBody className="p-8 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Join the Competition!
            </h2>
            <p className="mb-6 text-text-secondary">
              Sign in to view leaderboards and compete with other TradeYa users.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <Card variant="premium" depth="lg" className="mb-6 border border-border/60">
        <CardBody className="p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-text-primary">
                Leaderboards
              </h1>
            </div>
            <p className="text-base sm:text-lg text-text-secondary max-w-xl">
              Compete with other TradeYa users and climb the ranks!
            </p>
          </div>
        </CardBody>
      </Card>

      <section className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          {/* Main Leaderboard */}
          <div className="min-w-0">
              <Leaderboard
                category={selectedCategory}
                period={selectedPeriod}
                limit={20}
                showCurrentUser={true}
                compact={false}
                headerControls={
                  <Card variant="glass" depth="sm" className="px-4 py-4 sm:p-6 border border-border/50">
                    <Stack gap="md" className="w-full">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {categories.map((category) => {
                          const isActive = selectedCategory === category.value;
                          return (
                            <Button
                              key={category.value}
                              type="button"
                              onClick={() => setSelectedCategory(category.value)}
                              variant="glass-toggle"
                              size="sm"
                              className={cn(
                                'flex items-center gap-2 justify-center w-full sm:w-auto h-auto',
                                'py-3 sm:py-2'
                              )}
                              data-active={isActive}
                              aria-pressed={isActive}
                            >
                              {category.icon}
                              {category.label}
                            </Button>
                          );
                        })}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {periods.map((period) => {
                          const isActive = selectedPeriod === period.value;
                          return (
                            <Button
                              key={period.value}
                              type="button"
                              onClick={() => setSelectedPeriod(period.value)}
                              variant="glass-toggle"
                              size="sm"
                              className="w-full justify-center h-auto py-3 sm:w-auto sm:py-2"
                              data-active={isActive}
                              aria-pressed={isActive}
                            >
                              {period.label}
                            </Button>
                          );
                        })}
                      </div>
                    </Stack>
                  </Card>
                }
              />
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6 sm:gap-8 min-w-0">
              {/* Social Features */}
              <Card variant="glass" className="rounded-lg shadow-sm border border-border">
                <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-text-primary mb-1 sm:mb-0">
                        Social
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:hidden text-text-secondary hover:text-text-primary"
                      onClick={() => setSocialExpanded(prev => !prev)}
                      aria-expanded={socialExpanded}
                      aria-controls="leaderboard-social-panel"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          socialExpanded ? 'rotate-180' : 'rotate-0'
                        )}
                      />
                    </Button>
                  </div>
                  {isMobileViewport && !socialExpanded && (
                    <div className="mt-3 text-xs text-text-secondary">
                      See followers, invites, and network stats at a glance.
                    </div>
                  )}
                </CardHeader>
                {(!isMobileViewport || socialExpanded) && (
                  <CardBody className="px-4 pb-4 sm:px-6">
                    <div id="leaderboard-social-panel" className="space-y-5 sm:space-y-6">
                      <SocialFeatures
                        userId={currentUser.uid}
                        userName={currentUser.displayName || 'User'}
                        surface="embedded"
                      />
                    </div>
                  </CardBody>
                )}
                {isMobileViewport && !socialExpanded && (
                  <CardBody className="px-4 pb-4 sm:hidden">
                    <SocialFeatures
                      userId={currentUser.uid}
                      userName={currentUser.displayName || 'User'}
                      surface="embedded"
                      compact
                      showFollowButton={false}
                    />
                  </CardBody>
                )}
              </Card>

              {/* Quick Stats */}
              <Card variant="glass" className="rounded-lg shadow-sm border border-border">
                <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-text-primary mb-1 sm:mb-0">
                      Quick Stats
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:hidden text-text-secondary hover:text-text-primary"
                      onClick={() => setStatsExpanded(prev => !prev)}
                      aria-expanded={statsExpanded}
                      aria-controls="leaderboard-quick-stats"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          statsExpanded ? 'rotate-180' : 'rotate-0'
                        )}
                      />
                    </Button>
                  </div>
                  {isMobileViewport && !statsExpanded && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                      {statsLoading ? (
                        <span className="animate-pulse">Loading stats…</span>
                      ) : (
                        <>
                          <span>Rank #{userRank ?? '--'}</span>
                          <span>Total XP: {userXP?.totalXP.toLocaleString() || 0}</span>
                          <span>This Week: {weeklyXP?.toLocaleString() || 0} XP</span>
                        </>
                      )}
                    </div>
                  )}
                </CardHeader>
                {(!isMobileViewport || statsExpanded) && (
                  <CardBody className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <div id="leaderboard-quick-stats" className="space-y-5 sm:space-y-6">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-text-secondary">Your Rank</span>
                        {statsLoading ? (
                          <Skeleton className="h-5 w-14" />
                        ) : (
                          <span className="font-semibold text-primary text-base sm:text-lg">
                            #{userRank || '--'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-text-secondary">Total XP</span>
                        {statsLoading ? (
                          <Skeleton className="h-5 w-20" />
                        ) : (
                          <span className="font-semibold text-secondary-foreground text-base sm:text-lg">
                            {userXP?.totalXP.toLocaleString() || 0}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-text-secondary">This Week</span>
                        {statsLoading ? (
                          <Skeleton className="h-5 w-20" />
                        ) : (
                          <span className="font-semibold text-accent-foreground text-base sm:text-lg">
                            {weeklyXP?.toLocaleString() || 0} XP
                          </span>
                        )}
                      </div>
                    </div>
                  </CardBody>
                )}
              </Card>
            </div>
          </div>
      </section>
    </div>
  );
};

export default LeaderboardPage;
