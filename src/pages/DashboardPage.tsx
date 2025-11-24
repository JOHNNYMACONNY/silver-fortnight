import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp, Users, Trophy, Calendar, Plus, Search } from 'lucide-react';
import { LeaderboardCategory, LeaderboardPeriod } from '../types/gamification';
import { LeaderboardWidget } from '../components/features/LeaderboardWidget';

import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../AuthContext';
import { useUserPersonalization } from '../hooks/useUserPersonalization';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import Cluster from '../components/layout/primitives/Cluster';
import Grid from '../components/layout/primitives/Grid';
import { ThreeTierProgressionUI } from '../components/challenges/ThreeTierProgressionUI';
import { StreakWidget } from '../components/features/StreakWidget';
import { Button } from '../components/ui/Button';
import { semanticClasses } from '../utils/semanticColors';

const DashboardPage: React.FC = () => {
  const { stats, recentActivity, loading, error, refreshData } = useDashboardData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userType, tradeCount, profileCompleteness } = useUserPersonalization();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!user?.displayName) return user?.email?.split('@')[0] || 'Trader';
    // Extract first name from display name
    return user.displayName.split(' ')[0];
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
      <Box className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <Box className="animate-pulse">
          <Cluster justify="between" align="center" className="glassmorphic p-3 sm:p-4 md:p-6 mb-6 sm:mb-8 flex-wrap">
            <Stack gap="xs">
              <Box className="h-6 sm:h-8 glassmorphic rounded w-48 sm:w-64 mb-2"> </Box>
              <Box className="h-3 sm:h-4 glassmorphic rounded w-32 sm:w-48"> </Box>
            </Stack>
            <Cluster gap="sm" className="sm:gap-3">
              <Box className="h-10 sm:h-11 glassmorphic rounded w-12 sm:w-20"> </Box>
              <Box className="h-10 sm:h-11 glassmorphic rounded w-12 sm:w-24"> </Box>
              <Box className="h-10 sm:h-11 glassmorphic rounded w-12 sm:w-28"> </Box>
            </Cluster>
          </Cluster>
          <Grid columns={{ base: 1, lg: 3 }} gap={{ base: 'md', lg: 'lg' }}>
            <Box className="lg:col-span-2 glassmorphic rounded-lg h-48 sm:h-56 md:h-64"> </Box>
            <Box className="glassmorphic rounded-lg h-48 sm:h-56 md:h-64"> </Box>
          </Grid>
          <Grid columns={{ base: 1, lg: 2 }} gap={{ base: 'md', lg: 'lg' }} className="mt-6 sm:mt-8">
            <Box className="glassmorphic rounded-lg h-48 sm:h-56 md:h-64"> </Box>
            <Box className="glassmorphic rounded-lg h-48 sm:h-56 md:h-64"> </Box>
          </Grid>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      <Stack gap="md" className="sm:gap-6 lg:gap-8">
        <header>
          <Cluster className="glassmorphic rounded-xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8" wrap>
            <Stack gap="xs">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                {getGreeting()}, {getFirstName()}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {userType === 'new' ? (
                  <>Welcome! Complete your profile to get started with trading.</>
                ) : userType === 'regular' ? (
                  <>Welcome back to your trading dashboard</>
                ) : (
                  <>Advanced dashboard with analytics and insights</>
                )}
              </p>
              {userType === 'new' && profileCompleteness < 50 && (
                <p className="text-xs text-primary">
                  Profile: {profileCompleteness}% complete - Complete your profile to unlock more features
                </p>
              )}
            </Stack>
            <Cluster gap="sm" className="w-full md:w-auto sm:gap-3 md:gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 md:flex-none min-h-[44px] glassmorphic bg-cyan-500/20 hover:bg-cyan-500/30 active:bg-cyan-500/40 border-cyan-500/30 text-cyan-100 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300" 
                onClick={refreshData} 
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 md:flex-none min-h-[44px] glassmorphic bg-orange-500/20 hover:bg-orange-500/30 active:bg-orange-500/40 border-orange-500/30 text-orange-100 shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300" 
                onClick={() => navigate('/trades?action=create')}
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">New Trade</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 md:flex-none min-h-[44px] glassmorphic bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 border-purple-500/30 text-purple-100 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300" 
                onClick={() => navigate('/connections')}
              >
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            </Cluster>
          </Cluster>
        </header>

        {error && (
          <Box className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive">{error}</p>
          </Box>
        )}

        <Grid columns={{ base: 1, lg: 3 }} gap={{ base: 'md', lg: 'lg' }}>
          {/* Analytics Widget - Premium Glassmorphic - Mobile Optimized */}
          <Box className="lg:col-span-2 glassmorphic p-4 sm:p-5 md:p-6">
            <Cluster justify="between" align="center" className="mb-4 sm:mb-5 md:mb-6 flex-wrap gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Your Analytics
              </h2>
              <span className="text-xs sm:text-sm text-muted-foreground px-2 py-1 sm:px-3 glassmorphic rounded-lg">This Week</span>
            </Cluster>
            <Grid columns={{ base: 2, md: 4 }} gap={{ base: 'sm+', sm: 'md', md: 'md+' }}>
              <Box className="glassmorphic p-3 sm:p-4 text-center hover:bg-white/10 active:bg-white/15 transition-all duration-300 group touch-manipulation min-h-[100px] sm:min-h-[120px]">
                <Box className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 glassmorphic rounded-lg mx-auto mb-2 group-hover:shadow-orange-500/25">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </Box>
                <div className="text-xl sm:text-2xl font-bold text-primary">{stats?.tradesThisWeek ?? 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Trades This Week</div>
              </Box>
              <Box className="glassmorphic p-3 sm:p-4 text-center hover:bg-white/10 active:bg-white/15 transition-all duration-300 group touch-manipulation min-h-[100px] sm:min-h-[120px]">
                <Box className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 glassmorphic rounded-lg mx-auto mb-2 group-hover:shadow-green-500/25">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </Box>
                <div className="text-xl sm:text-2xl font-bold text-success">{stats?.currentXP ?? 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total XP</div>
              </Box>
              <Box className="glassmorphic p-3 sm:p-4 text-center hover:bg-white/10 active:bg-white/15 transition-all duration-300 group touch-manipulation min-h-[100px] sm:min-h-[120px]">
                <Box className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 glassmorphic rounded-lg mx-auto mb-2 group-hover:shadow-blue-500/25">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                </Box>
                <div className="text-xl sm:text-2xl font-bold text-info">+{stats?.xpEarnedThisWeek ?? 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">XP This Week</div>
              </Box>
              <Box className="glassmorphic p-3 sm:p-4 text-center hover:bg-white/10 active:bg-white/15 transition-all duration-300 group touch-manipulation min-h-[100px] sm:min-h-[120px]">
                <Box className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 glassmorphic rounded-lg mx-auto mb-2 group-hover:shadow-sky-500/25">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </Box>
                <div className="text-xl sm:text-2xl font-bold text-white">{stats?.activeConnections ?? 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Connections</div>
              </Box>
            </Grid>
          </Box>
          {/* Right Column - Premium Glassmorphic - Mobile Optimized */}
          <Stack gap="md" className="sm:gap-6 lg:gap-8">
            {/* Leaderboard Widget */}
            <Box className="glassmorphic p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                Top Traders
              </h2>
              <Box className="min-h-[180px] sm:min-h-[200px]">
                <LeaderboardWidget 
                  category={LeaderboardCategory.TOTAL_XP} 
                  period={LeaderboardPeriod.WEEKLY} 
                  limit={5} 
                  showViewAll={false}
                />
              </Box>
            </Box>

            {/* Compact Streaks Widget */}
            {user && (
              <Box className="glassmorphic p-4 sm:p-5 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Your Streaks
                </h2>
                <Stack gap="sm+" className="sm:gap-4">
                  <StreakWidget userId={user.uid} type="login" />
                  <StreakWidget userId={user.uid} type="challenge" />
                  <StreakWidget userId={user.uid} type="skill_practice" />
                </Stack>
              </Box>
            )}
          </Stack>
        </Grid>

        {/* Secondary Section - Premium Glassmorphic - Mobile Optimized */}
        <Grid columns={{ base: 1, lg: 2 }} gap={{ base: 'md', lg: 'lg' }} className="mt-6 sm:mt-8">
          {/* Recent Activity Widget - Mobile Optimized */}
          <Box className="glassmorphic p-4 sm:p-5 md:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <Stack gap="sm+" className="sm:gap-3.5">
                {recentActivity.map((activity) => (
                  <Cluster key={activity.id} align="start" gap="xs" className="p-2.5 sm:p-3 glassmorphic hover:bg-white/10 active:bg-white/15 transition-all duration-300 cursor-pointer touch-manipulation min-h-[60px]">
                    <Box className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      activity.type === 'xp' ? 'bg-success shadow-green-500/50' : 
                      activity.type === 'trade' ? 'bg-primary shadow-orange-500/50' : 
                      activity.type === 'connection' ? 'bg-info shadow-blue-500/50' :
                      'bg-secondary shadow-sky-500/50'
                    }`} />
                    <Box className="flex-1 min-w-0">
                      <Cluster justify="between" align="center" className="mb-1 gap-2">
                        {activity.type === 'xp' && activity.amount && (
                          <span className={`font-medium text-xs sm:text-sm ${activity.isPositive ? 'text-success' : 'text-destructive'}`}>
                            {activity.isPositive ? '+' : ''}{activity.amount} XP
                          </span>
                        )}
                        {activity.type === 'trade' && (
                          <span className="font-medium text-xs sm:text-sm text-primary">Trade Activity</span>
                        )}
                        {activity.type === 'connection' && (
                          <span className="font-medium text-xs sm:text-sm text-info">New Connection</span>
                        )}
                        {activity.type === 'achievement' && (
                          <span className="font-medium text-xs sm:text-sm text-secondary">Achievement</span>
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </Cluster>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                    </Box>
                  </Cluster>
                ))}
              </Stack>
            ) : (
              <Box className="text-center py-6 sm:py-8">
                <Box className="w-12 h-12 sm:w-16 sm:h-16 glassmorphic rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                </Box>
                <p className="text-sm sm:text-base text-muted-foreground">No recent activity</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Start trading to see your activity here!</p>
              </Box>
            )}
          </Box>

          {/* Quick Actions - Premium Glassmorphic - Mobile Optimized */}
          <Box className="glassmorphic p-4 sm:p-5 md:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">Quick Actions</h2>
            <Grid columns={2} gap={{ base: 'sm+', sm: 'md' }}>
              <button 
                onClick={() => navigate('/trades')}
                className="glassmorphic px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col items-center gap-1.5 sm:gap-2 text-center hover:bg-white/10 active:bg-white/15 hover:shadow-orange-500/25 transition-all duration-300 group touch-manipulation min-h-[76px] sm:min-h-[auto]"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Browse Trades</span>
              </button>
              <button 
                onClick={() => navigate('/challenges')}
                className="glassmorphic px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col items-center gap-1.5 sm:gap-2 text-center hover:bg-white/10 active:bg-white/15 hover:shadow-green-500/25 transition-all duration-300 group touch-manipulation min-h-[76px] sm:min-h-[auto]"
              >
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-success group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Challenges</span>
              </button>
              <button 
                onClick={() => navigate('/leaderboard')}
                className="glassmorphic px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col items-center gap-1.5 sm:gap-2 text-center hover:bg-white/10 active:bg-white/15 hover:shadow-sky-500/25 transition-all duration-300 group touch-manipulation min-h-[76px] sm:min-h-[auto]"
              >
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-secondary group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Leaderboard</span>
              </button>
              <button 
                onClick={() => navigate('/connections')}
                className="glassmorphic px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col items-center gap-1.5 sm:gap-2 text-center hover:bg-white/10 active:bg-white/15 hover:shadow-blue-500/25 transition-all duration-300 group touch-manipulation min-h-[76px] sm:min-h-[auto]"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-info group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Find Friends</span>
              </button>
            </Grid>
          </Box>
        </Grid>

        {/* Challenge Progression (Three-Tier) - Premium Glassmorphic - Mobile Optimized */}
        <Box className="glassmorphic p-4 sm:p-5 md:p-6 mt-6 sm:mt-8">
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
