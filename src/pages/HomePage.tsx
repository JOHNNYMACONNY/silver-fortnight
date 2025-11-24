import React from 'react';
import { Link } from 'react-router-dom';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import AnimatedHeading from '../components/ui/AnimatedHeading';
import GradientMeshBackground from '../components/ui/GradientMeshBackground';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import { themeClasses } from '../utils/themeUtils';
import { semanticClasses } from '../utils/semanticColors';
import { TopicLink } from '../components/ui/TopicLink';
import { Skeleton } from '../components/ui/skeletons/Skeleton';
import {
  HomePageDataProvider,
  useHomeStats,
  useCollaborationHighlights,
  useChallengeSpotlight,
  useCommunityActivity,
} from '../hooks/useHomePageData';

const activityAccentMap: Record<string, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

const activityBackgroundMap: Record<string, string> = {
  green: 'bg-green-50 dark:bg-green-950/20',
  blue: 'bg-blue-50 dark:bg-blue-950/20',
  purple: 'bg-purple-50 dark:bg-purple-950/20',
  orange: 'bg-orange-50 dark:bg-orange-950/20',
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return '—';
  return value.toLocaleString();
};

const formatTimeLabel = (value?: Date) => {
  if (!value) return '';
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const HomePageContent: React.FC = () => {
  const { stats, loading: statsLoading, error: statsError } = useHomeStats();
  const {
    highlights,
    loading: highlightsLoading,
    error: highlightsError,
  } = useCollaborationHighlights();
  const {
    challenge,
    loading: challengeLoading,
    error: challengeError,
  } = useChallengeSpotlight();
  const {
    activity,
    loading: activityLoading,
    error: activityError,
  } = useCommunityActivity();

  const statsPending = statsLoading && !stats;
  const activityPending = activityLoading && activity.length === 0;
  const noHighlights = !highlightsLoading && highlights.length === 0;
  const noActivity = !activityLoading && activity.length === 0;
  const lastUpdatedDate = stats?.community.lastUpdated
    ? (stats.community.lastUpdated as any).toDate?.() ??
      (stats.community.lastUpdated as any)
    : undefined;

  return (
    <Box className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PerformanceMonitor pageName="HomePage" />
      <Stack gap="md">
        {/* Hero Section with GradientMeshBackground */}
        <Box className="relative rounded-2xl overflow-hidden mb-12">
          <GradientMeshBackground variant="primary" intensity="medium" className="p-12 md:p-16">
            <AnimatedHeading as="h1" animation="kinetic" className="text-display-large md:text-5xl text-foreground mb-4">
              Welcome to TradeYa
            </AnimatedHeading>
            <p className="text-body-large text-muted-foreground max-w-2xl animate-fadeIn">
              Connect with others, exchange skills, and collaborate on exciting collaborations.
            </p>
          </GradientMeshBackground>
        </Box>

        {/* Featured Content Section with Asymmetric Layout */}
        <AnimatedHeading as="h2" animation="slide" className="text-section-heading md:text-3xl text-foreground mb-6">
          Discover What's Possible
        </AnimatedHeading>

        {/* Asymmetric Layout Grid */}
        <BentoGrid
          layoutPattern="asymmetric"
          visualRhythm="alternating"
          contentAwareLayout={true}
          className="mb-8"
          gap="lg"
        >
          {/* ROW 1: Small (1/3) + Large (2/3) */}
          <BentoItem
            asymmetricSize="small"
            contentType="feature"
            layoutRole="simple"
          >
            <Card 
              variant="premium" 
              tilt={true}
              depth="lg"
              glow="subtle"
              glowColor="orange"
              interactive={true}
              className="min-h-[280px] md:min-h-[320px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-component-title">Quick Actions</CardTitle>
                  <Badge variant="secondary" className="text-caption">Popular</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-body-small text-muted-foreground mb-3">
                  Get started quickly with our most popular features.
                </p>
                <div className="space-y-2">
                  <Link to="/trades" className={`flex items-center justify-between p-2 min-h-[44px] ${semanticClasses('trades').bgSubtle} rounded-lg hover:bg-primary/15 transition-colors`}>
                    <span className={`text-body-small font-medium ${semanticClasses('trades').text}`}>Browse Trades</span>
                    <span className={semanticClasses('trades').text}>→</span>
                  </Link>
                  <Link to="/collaborations" className={`flex items-center justify-between p-2 min-h-[44px] ${semanticClasses('collaboration').bgSubtle} rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors shadow-sm`}> 
                    <span className={`text-body-small font-medium ${semanticClasses('collaboration').text}`}>Find Collaborations</span>
                    <span className={semanticClasses('collaboration').text}>→</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </BentoItem>

          <BentoItem
            asymmetricSize="large"
            contentType="mixed"
            layoutRole="complex"
          >
            <Card 
              variant="premium" 
              tilt={true}
              depth="lg"
              glow="subtle"
              glowColor="orange"
              interactive={true}
              className="min-h-[280px] md:min-h-[320px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-body-large font-semibold">Skill Trades</CardTitle>
                  <Badge variant="default" topic="trades" className="text-caption">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-body-small text-muted-foreground mb-3">
                  Exchange your skills with others in the community. Find the perfect match for your needs.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className={`text-center p-3 ${semanticClasses('trades').bgSubtle} rounded-lg`}>
                    {statsPending ? (
                      <Skeleton className="h-7 w-16 mx-auto mb-2" />
                    ) : (
                      <div className={`text-body-large font-bold ${semanticClasses('trades').text}`}>
                        {formatNumber(stats?.trades.active)}
                      </div>
                    )}
                    <div className="text-caption text-muted-foreground">Active Trades</div>
                  </div>
                  <div className={`text-center p-3 ${semanticClasses('community').bgSubtle} rounded-lg`}>
                    {statsPending ? (
                      <Skeleton className="h-7 w-16 mx-auto mb-2" />
                    ) : (
                      <div className={`text-body-large font-bold ${semanticClasses('community').text}`}>
                        {formatNumber(stats?.trades.completed)}
                      </div>
                    )}
                    <div className="text-caption text-muted-foreground">Completed</div>
                  </div>
                </div>
                {statsError && (
                  <p className="text-caption text-destructive mt-2">
                    {statsError}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <TopicLink to="/trades" topic="trades" className="w-full text-center text-body-small font-medium transition-colors">
                  Start Trading Skills →
                </TopicLink>
              </CardFooter>
            </Card>
          </BentoItem>

          {/* ROW 2: Large (2/3) + Small (1/3) */}
          <BentoItem
            asymmetricSize="large"
            contentType="mixed"
            layoutRole="complex"
          >
            <Card 
              variant="premium" 
              tilt={true}
              depth="lg"
              glow="subtle"
              glowColor="purple"
              interactive={true}
              className="min-h-[280px] md:min-h-[320px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-body-large font-semibold">Collaborations</CardTitle>
                  <Badge variant="default" topic="collaboration" className="text-caption">Team</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-body-small text-muted-foreground mb-3">
                  Join collaborative efforts or start your own. Find team members with the skills you need.
                </p>
                <div className="space-y-2">
                  {highlightsLoading && highlights.length === 0 ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`highlight-skeleton-${index}`}
                        className="p-3 rounded-lg border border-border/50"
                      >
                        <Skeleton className="h-4 w-2/3 mb-2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    ))
                  ) : noHighlights ? (
                    <p className="text-caption text-muted-foreground">
                      No collaborations are recruiting right now.
                    </p>
                  ) : (
                    highlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-white/40 dark:bg-neutral-900/40"
                      >
                        <div className="pr-3">
                          <p className="text-caption font-semibold text-foreground">
                            {highlight.title}
                          </p>
                          <p className="text-caption text-muted-foreground line-clamp-2">
                            {highlight.summary}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-body-small font-bold text-foreground">
                            {formatNumber(highlight.openRoles)}
                          </p>
                          <p className="text-caption text-muted-foreground">
                            roles open
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {highlightsError && (
                  <p className="text-caption text-destructive mt-2">
                    {highlightsError}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <TopicLink to="/collaborations" topic="collaboration" className="w-full text-center text-body-small font-medium transition-colors">
                  Explore Collaborations →
                </TopicLink>
              </CardFooter>
            </Card>
          </BentoItem>

          <BentoItem
            asymmetricSize="small"
            contentType="feature"
            layoutRole="simple"
          >
            <Card 
              variant="premium" 
              tilt={true}
              depth="lg"
              glow="subtle"
              glowColor="purple"
              interactive={true}
              className="min-h-[280px] md:min-h-[320px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-body-large font-semibold">Challenges</CardTitle>
                  <Badge variant="default" topic="success" className="text-caption">Rewards</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                {challengeLoading && !challenge ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ) : challenge ? (
                  <div className="space-y-2">
                    <p className="text-body-small text-muted-foreground">
                      {challenge.title}
                    </p>
                    {challenge.deadline && (
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-caption font-medium">
                          Ends at {formatTimeLabel(challenge.deadline)}
                        </div>
                        {challenge.rewardSummary && (
                          <div className="text-caption text-muted-foreground">
                            Reward: {challenge.rewardSummary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-body-small text-muted-foreground">
                    No active challenges right now. Check back soon!
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <TopicLink to="/challenges" topic="success" className="w-full text-center text-body-small font-medium transition-colors">
                  View Challenges →
                </TopicLink>
              </CardFooter>
              {challengeError && (
                <div className="px-5 pb-4">
                  <p className="text-caption text-destructive">{challengeError}</p>
                </div>
              )}
            </Card>
          </BentoItem>

          {/* ROW 3: Small (1/3) + Large (2/3) */}
          <BentoItem
            asymmetricSize="small"
            contentType="stats"
            layoutRole="simple"
          >
            <Card 
              variant="premium" 
              tilt={true}
              depth="lg"
              glow="subtle"
              glowColor="blue"
              interactive={true}
              className="min-h-[280px] md:min-h-[300px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-body-large font-semibold">Community Stats</CardTitle>
                  <Badge variant="status-glow" className="text-caption">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div className="space-y-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    {statsPending ? (
                      <Skeleton className="h-7 w-20 mx-auto mb-1" />
                    ) : (
                      <div className="text-body-large font-bold text-green-600 dark:text-green-400">
                        {formatNumber(stats?.community.activeUsers)}
                      </div>
                    )}
                    <div className="text-caption text-muted-foreground">
                      Active Users (7d)
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    {statsPending ? (
                      <Skeleton className="h-7 w-20 mx-auto mb-1" />
                    ) : (
                      <div className="text-body-large font-bold text-purple-600 dark:text-purple-400">
                        {formatNumber(stats?.community.skillsTraded)}
                      </div>
                    )}
                    <div className="text-caption text-muted-foreground">
                      Skills Traded
                    </div>
                  </div>
                  <div className="text-caption text-muted-foreground text-center">
                    {statsPending
                      ? 'Measuring collaboration momentum...'
                      : `${formatNumber(
                          stats?.community.collaborations
                        )} collaborations in progress`}
                  </div>
                  {lastUpdatedDate && (
                    <p className="text-caption text-muted-foreground text-center">
                      Updated {formatTimeLabel(lastUpdatedDate)}
                    </p>
                  )}
                </div>
              </CardContent>
              {statsError && (
                <div className="px-5 pb-4">
                  <p className="text-caption text-destructive">{statsError}</p>
                </div>
              )}
            </Card>
          </BentoItem>

          <BentoItem
            asymmetricSize="large"
            contentType="mixed"
            layoutRole="complex"
          >
            <Card 
              variant="premium" 
              tilt={true}
              depth="lg"
              glow="subtle"
              glowColor="blue"
              interactive={true}
              className="min-h-[280px] md:min-h-[300px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-body-large font-semibold">Recent Activity</CardTitle>
                  <Badge variant="status-glow" className="text-caption">Real-time</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div className="space-y-2">
                  {activityPending ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`activity-skeleton-${index}`}
                        className="p-2 rounded-lg border border-border/40"
                      >
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))
                  ) : noActivity ? (
                    <p className="text-caption text-muted-foreground">
                      Things are quiet right now. Start a trade or collaboration to get featured here.
                    </p>
                  ) : (
                    activity.map((item) => {
                      const dotColor = activityAccentMap[item.accent] || 'bg-primary';
                      const bgColor = activityBackgroundMap[item.accent] || 'bg-primary/10';
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${bgColor}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                            <span className="text-caption">{item.description}</span>
                          </div>
                          <span className="text-caption text-muted-foreground">
                            {formatTimeLabel(item.timestamp)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <TopicLink to="/users" topic="community" className="w-full text-center text-body-small font-medium transition-colors">
                  Browse Community →
                </TopicLink>
              </CardFooter>
              {activityError && (
                <div className="px-5 pb-4">
                  <p className="text-caption text-destructive">{activityError}</p>
                </div>
              )}
            </Card>
          </BentoItem>
        </BentoGrid>

        {/* Additional Features Section */}
        <Box className="mt-8">
          <AnimatedHeading as="h2" animation="slide" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            More Ways to Connect
          </AnimatedHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              variant="premium" 
              tilt={true}
              depth="md"
              glow="subtle"
              glowColor="blue"
              interactive={true}
              className="min-h-[200px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-body-large font-semibold">User Directory</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-body-small text-muted-foreground mb-3">
                  Discover talented individuals in our community and connect with people who share your interests.
                </p>
              </CardContent>
              <CardFooter>
                <TopicLink to="/users" topic="community" className="w-full text-center text-body-small font-medium transition-colors">
                  Browse Users →
                </TopicLink>
              </CardFooter>
            </Card>

            <Card 
              variant="premium" 
              tilt={true}
              depth="md"
              glow="subtle"
              glowColor="purple"
              interactive={true}
              className="min-h-[200px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-body-large font-semibold">Messages</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-body-small text-muted-foreground mb-3">
                  Connect and communicate with other members through our integrated messaging system.
                </p>
              </CardContent>
              <CardFooter>
                <TopicLink to="/messages" topic="collaboration" className="w-full text-center text-body-small font-medium transition-colors">
                  Open Messages →
                </TopicLink>
              </CardFooter>
            </Card>

            <Card 
              variant="premium" 
              tilt={true}
              depth="md"
              glow="subtle"
              glowColor="purple"
              interactive={true}
              className="min-h-[200px] flex flex-col cursor-pointer"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-body-large font-semibold">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-body-small text-muted-foreground mb-3">
                  See who's leading the community and get inspired by top performers.
                </p>
              </CardContent>
              <CardFooter>
                <TopicLink to="/leaderboard" topic="success" className="w-full text-center text-body-small font-medium transition-colors">
                  View Leaderboard →
                </TopicLink>
              </CardFooter>
            </Card>
        </div>
        </Box>
      </Stack>
    </Box>
  );
};

const HomePage: React.FC = () => (
  <HomePageDataProvider>
    <HomePageContent />
  </HomePageDataProvider>
);

export default HomePage;
