import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp, Users, Trophy, Calendar, Search } from 'lucide-react';
import { PlusCircle } from '../utils/icons';
import { LeaderboardCategory, LeaderboardPeriod } from '../types/gamification';
import { LeaderboardWidget } from '../components/features/LeaderboardWidget';

import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../AuthContext';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import Cluster from '../components/layout/primitives/Cluster';
import Grid from '../components/layout/primitives/Grid';
import { ThreeTierProgressionUI } from '../components/challenges/ThreeTierProgressionUI';
import { StreakWidget } from '../components/features/StreakWidget';
import { Button } from '../components/ui/Button';
import { semanticClasses } from '../utils/semanticColors';
import { StandardPageHeader } from '../components/layout/StandardPageHeader';

const DashboardPage: React.FC = () => {
  const { stats, recentActivity, loading, error, refreshData } = useDashboardData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Box className="animate-pulse">
          <Cluster justify="between" align="center" className="mb-8">
            <Stack gap="xs">
              <Box className="h-8 bg-muted rounded w-64 mb-2"> </Box>
              <Box className="h-4 bg-muted rounded w-48"> </Box>
            </Stack>
            <Cluster gap="sm">
              <Box className="h-10 bg-muted rounded w-20"> </Box>
              <Box className="h-10 bg-muted rounded w-24"> </Box>
              <Box className="h-10 bg-muted rounded w-28"> </Box>
            </Cluster>
          </Cluster>
          <Grid columns={{ base: 1, lg: 3 }} gap="lg">
            <Box className="lg:col-span-2 bg-muted rounded-lg h-64"> </Box>
            <Box className="bg-muted rounded-lg h-64"> </Box>
          </Grid>
          <Grid columns={{ base: 1, lg: 2 }} gap="lg" className="mt-8">
            <Box className="bg-muted rounded-lg h-64"> </Box>
            <Box className="bg-muted rounded-lg h-64"> </Box>
          </Grid>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Stack gap="lg">
        <StandardPageHeader
          title={`${getGreeting()}, ${user?.displayName || user?.email?.split('@')[0] || 'Trader'}!`}
          description="Welcome back to your trading dashboard"
          isLoading={loading}
          loadingMessage="Loading dashboard..."
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={refreshData} title="Refresh data">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="primary" size="md" onClick={() => navigate('/trades/new')}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Trade
              </Button>
              <Button variant="secondary" size="md" onClick={() => navigate('/connections')}>
                <Users className="w-4 h-4 mr-2" />
                Invite Friend
              </Button>
            </div>
          }
        />

        {error && (
          <Box className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive">{error}</p>
          </Box>
        )}

        <Grid columns={{ base: 1, lg: 3 }} gap="lg">
          {/* Analytics Widget - Enhanced */}
          <Box className="lg:col-span-2 bg-card text-card-foreground rounded-lg shadow border border-border p-6">
            <Cluster justify="between" align="center" className="mb-4">
              <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Your Analytics
              </h2>
              <span className="text-sm text-muted-foreground">This Week</span>
            </Cluster>
            <Grid columns={{ base: 2, md: 4 }} gap="md">
              <Box className="bg-primary/10 rounded-lg p-4 text-center">
                <Box className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                </Box>
                <div className="text-2xl font-bold text-primary">{stats?.tradesThisWeek ?? 0}</div>
                <div className="text-sm text-muted-foreground">Trades This Week</div>
              </Box>
              <Box className="bg-success/10 rounded-lg p-4 text-center">
                <Box className="flex items-center justify-center w-10 h-10 bg-success/20 rounded-lg mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                </Box>
                <div className="text-2xl font-bold text-success">{stats?.currentXP ?? 0}</div>
                <div className="text-sm text-muted-foreground">Total XP</div>
              </Box>
              <Box className="bg-info/10 rounded-lg p-4 text-center">
                <Box className="flex items-center justify-center w-10 h-10 bg-info/20 rounded-lg mx-auto mb-2">
                  <Trophy className="w-5 h-5 text-info" />
                </Box>
                <div className="text-2xl font-bold text-info">+{stats?.xpEarnedThisWeek ?? 0}</div>
                <div className="text-sm text-muted-foreground">XP This Week</div>
              </Box>
              <Box className="bg-secondary/10 rounded-lg p-4 text-center">
                <Box className="flex items-center justify-center w-10 h-10 bg-secondary/20 rounded-lg mx-auto mb-2">
                  <Users className="w-5 h-5 text-secondary" />
                </Box>
                <div className="text-2xl font-bold text-secondary">{stats?.activeConnections ?? 0}</div>
                <div className="text-sm text-muted-foreground">Connections</div>
              </Box>
            </Grid>
          </Box>
          {/* Leaderboard Widget */}
          <Box className="bg-card text-card-foreground rounded-lg shadow border border-border p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Traders
            </h2>
            <Box className="min-h-[200px]">
              <LeaderboardWidget 
                category={LeaderboardCategory.TOTAL_XP} 
                period={LeaderboardPeriod.WEEKLY} 
                limit={5} 
                showViewAll={false}
              />
            </Box>
            {/* Minimal Streak UI */}
            {user && (
              <>
                <Box className="mt-6">
                  <StreakWidget userId={user.uid} type="login" />
                </Box>
                <Box className="mt-4">
                  <StreakWidget userId={user.uid} type="challenge" />
                </Box>
                <Box className="mt-4">
                  <StreakWidget userId={user.uid} type="skill_practice" />
                </Box>
              </>
            )}
          </Box>
        </Grid>

        {/* Secondary Section */}
        <Grid columns={{ base: 1, lg: 2 }} gap="lg" className="mt-8">
          {/* Recent Activity Widget */}
          <Box className="bg-card text-card-foreground rounded-lg shadow border border-border p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <Stack gap="sm">
                {recentActivity.map((activity) => (
                  <Cluster key={activity.id} align="start" gap="xs" className="p-3 bg-muted/50 rounded-lg">
                    <Box className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'xp' ? 'bg-success' : 
                      activity.type === 'trade' ? 'bg-primary' : 'bg-info'
                    }`} />
                    <Box className="flex-1 min-w-0">
                      <Cluster justify="between" align="center">
                        {activity.type === 'xp' && activity.amount && (
                          <span className={`font-medium text-sm ${activity.isPositive ? 'text-success' : 'text-destructive'}`}>
                            +{activity.amount} XP Earned
                          </span>
                        )}
                        {activity.type === 'trade' && (
                          <span className="font-medium text-sm text-primary">Trade Completed</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </Cluster>
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    </Box>
                  </Cluster>
                ))}
              </Stack>
            ) : (
              <Box className="text-center py-8">
                <Box className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </Box>
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground">Start trading to see your activity here!</p>
              </Box>
            )}
          </Box>

          {/* Quick Actions */}
          <Box className="bg-card text-card-foreground rounded-lg shadow border border-border p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Quick Actions</h2>
            <Grid columns={2} gap="sm">
              <button 
                onClick={() => navigate('/trades')}
                className={`px-4 py-3 rounded-lg transition flex flex-col items-center gap-2 text-center ${semanticClasses('trades').bgSolid} text-white hover:bg-primary/90`}
              >
                <Search className="w-6 h-6" />
                <span className="text-sm font-medium">Browse Trades</span>
              </button>
              <button 
                onClick={() => navigate('/challenges')}
                className="bg-success text-success-foreground px-4 py-3 rounded-lg hover:bg-success/90 transition flex flex-col items-center gap-2 text-center"
              >
                <Trophy className="w-6 h-6" />
                <span className="text-sm font-medium">Challenges</span>
              </button>
              <button 
                onClick={() => navigate('/leaderboard')}
                className="bg-secondary text-secondary-foreground px-4 py-3 rounded-lg hover:bg-secondary/90 transition flex flex-col items-center gap-2 text-center"
              >
                <Trophy className="w-6 h-6" />
                <span className="text-sm font-medium">Leaderboard</span>
              </button>
              <button 
                onClick={() => navigate('/connections')}
                className="bg-info text-info-foreground px-4 py-3 rounded-lg hover:bg-info/90 transition flex flex-col items-center gap-2 text-center"
              >
                <Users className="w-6 h-6" />
                <span className="text-sm font-medium">Find Friends</span>
              </button>
            </Grid>

            {/* Progress Summary */}
            <Box className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
              <h3 className="font-medium text-foreground mb-3">Your Progress Summary</h3>
              <Grid columns={2} gap="md" className="text-center">
                <Box>
                  <div className="text-xl font-bold text-primary">{stats?.totalTrades ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Total Trades</div>
                </Box>
                <Box>
                  <div className="text-xl font-bold text-success">{stats?.currentXP ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </Box>
              </Grid>
            </Box>
          </Box>
        </Grid>

        {/* Challenge Progression (Three-Tier) */}
        <Box className="bg-card text-card-foreground rounded-lg shadow border border-border p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Challenge Progression</h2>
          <ThreeTierProgressionUI onTierSelect={(tier) => {
            const type = tier.toLowerCase();
            navigate(`/challenges?type=${type}`);
          }} />
        </Box>
      </Stack>
    </Box>
  );
};

export default DashboardPage;
