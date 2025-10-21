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

/**
 * HomePage component
 *
 * Landing page for the TradeYa application using asymmetric layout system
 * Following established card and BentoGrid standards
 */
const HomePage: React.FC = () => {
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
                  <Link to="/trades" className={`flex items-center justify-between p-2 ${semanticClasses('trades').bgSubtle} rounded-lg hover:bg-primary/15 transition-colors`}>
                    <span className={`text-body-small font-medium ${semanticClasses('trades').text}`}>Browse Trades</span>
                    <span className={semanticClasses('trades').text}>→</span>
                  </Link>
                  <Link to="/collaborations" className={`flex items-center justify-between p-2 ${semanticClasses('collaboration').bgSubtle} rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors shadow-sm`}> 
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
                    <div className={`text-body-large font-bold ${semanticClasses('trades').text}`}>1,247</div>
                    <div className="text-caption text-muted-foreground">Active Trades</div>
                  </div>
                  <div className={`text-center p-3 ${semanticClasses('community').bgSubtle} rounded-lg`}>
                    <div className={`text-body-large font-bold ${semanticClasses('community').text} dark:text-blue-400`}>892</div>
                    <div className="text-caption text-muted-foreground">Completed</div>
                  </div>
                </div>
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
                  <div className="flex items-center space-x-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-caption">Design Team - 3 members needed</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-caption">Mobile App - 2 developers</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-caption">Content Creation - Writers & Designers</span>
                  </div>
                </div>
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
                <p className="text-body-small text-muted-foreground mb-3">
                  Participate in weekly and monthly challenges to showcase your skills and win rewards.
                </p>
                <div className="space-y-2">
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-caption font-medium">UI/UX Design Sprint</div>
                    <div className="text-caption text-muted-foreground">Ends in 3 days</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <TopicLink to="/challenges" topic="success" className="w-full text-center text-body-small font-medium transition-colors">
                  View Challenges →
                </TopicLink>
              </CardFooter>
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
                    <div className="text-body-large font-bold text-green-600 dark:text-green-400">5,892</div>
                    <div className="text-caption text-muted-foreground">Active Users</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="text-body-large font-bold text-purple-600 dark:text-purple-400">1,247</div>
                    <div className="text-caption text-muted-foreground">Skills Traded</div>
                  </div>
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
                <div className="space-y-1">
                  {/* Activity item with gradient border to next */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg transition-all duration-300 hover:bg-green-100 dark:hover:bg-green-950/30">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-caption">New trade: Web Dev for UI Design</span>
                    </div>
                    {/* Gradient connector to next item */}
                    <div className="absolute left-4 top-full w-px h-2 bg-gradient-to-b from-green-500/60 to-blue-500/60 animate-pulse"></div>
                  </div>
                  
                  {/* Activity item with gradient border to next */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-950/30">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-caption">Joined: Mobile App Team</span>
                    </div>
                    {/* Gradient connector to next item */}
                    <div className="absolute left-4 top-full w-px h-2 bg-gradient-to-b from-blue-500/60 to-purple-500/60 animate-pulse"></div>
                  </div>
                  
                  {/* Activity item with gradient border to next */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg transition-all duration-300 hover:bg-purple-100 dark:hover:bg-purple-950/30">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-caption">Completed: UI/UX Design Sprint</span>
                    </div>
                    {/* Gradient connector to next item */}
                    <div className="absolute left-4 top-full w-px h-2 bg-gradient-to-b from-purple-500/60 to-primary/60 animate-pulse"></div>
                  </div>
                  
                  {/* Final activity item */}
                  <div className="flex items-center space-x-3 p-2 bg-primary/10 rounded-lg transition-all duration-300 hover:bg-primary/15">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-caption">New user: Sarah Chen (Designer)</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <TopicLink to="/users" topic="community" className="w-full text-center text-body-small font-medium transition-colors">
                  Browse Community →
                </TopicLink>
              </CardFooter>
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

export default HomePage;
