import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Leaderboard } from '../components/features/Leaderboard';
import { SocialFeatures } from '../components/features/SocialFeatures';
import { LeaderboardCategory, LeaderboardPeriod } from '../types/gamification';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Award, Trophy, Users, Calendar, TrendingUp } from '../utils/icons';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeletons/Skeleton';
import { getUserXP, UserXP } from '../services/gamification';
import { getLeaderboard } from '../services/leaderboards';
import Stack from '../components/layout/primitives/Stack';


const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(LeaderboardCategory.TOTAL_XP);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);
  
  // Quick Stats state
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [weeklyXP, setWeeklyXP] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Award className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-text-primary">
            Leaderboards
          </h1>
        </div>
        <p className="text-lg text-text-secondary">
          Compete with other TradeYa users and climb the ranks!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Leaderboard */}
        <div className="lg:col-span-3">
          <Leaderboard
            category={selectedCategory}
            period={selectedPeriod}
            limit={20}
            showCurrentUser={true}
            compact={false}
            headerControls={
              <Stack gap="md">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      variant={selectedCategory === category.value ? 'default' : 'outline'}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {category.icon}
                      {category.label}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {periods.map((period) => (
                    <Button
                      key={period.value}
                      onClick={() => setSelectedPeriod(period.value)}
                      variant={selectedPeriod === period.value ? 'default' : 'outline'}
                      size="sm"
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </Stack>
            }
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Social Features */}
          <Card variant="glass" className="rounded-lg shadow-sm border border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  Social
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <SocialFeatures 
                userId={currentUser.uid} 
                userName={currentUser.displayName || 'User'} 
              />
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card variant="glass" className="rounded-lg shadow-sm border border-border">
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">
                Quick Stats
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Your Rank</span>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-12" />
                  ) : (
                    <span className="font-semibold text-primary">
                      #{userRank || '--'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Total XP</span>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className="font-semibold text-secondary">
                      {userXP?.totalXP.toLocaleString() || 0}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">This Week</span>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className="font-semibold text-accent">
                      {weeklyXP?.toLocaleString() || 0} XP
                    </span>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
