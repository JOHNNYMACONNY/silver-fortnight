import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, MessageSquare, Users, Search } from 'lucide-react';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import AnimatedHeading from '../components/ui/AnimatedHeading';
import GradientMeshBackground from '../components/ui/GradientMeshBackground';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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

const TRADE_EXAMPLES = [
  {
    id: 'design-dev',
    label: 'Design ↔ Dev',
    giveHandle: '@ui_lex',
    giveRole: 'UX Designer',
    giveSkills: ['Wireframes', 'Design system', 'Figma prototypes'],
    getHandle: '@dev_marc',
    getRole: 'Frontend Dev',
    getSkills: ['React build', 'Responsive layout', 'Deploy help'],
    result: 'A shipped landing page for both portfolios.',
  },
  {
    id: 'video-web',
    label: 'Video ↔ Web',
    giveHandle: '@cutby_jo',
    giveRole: 'Video Editor',
    giveSkills: ['TikTok cuts', 'Color grade', 'Captions'],
    getHandle: '@studio_cara',
    getRole: 'Web Designer',
    getSkills: ['Landing page', 'Brand section', 'Showreel embed'],
    result: 'An edited reel plus a clean portfolio site.',
  },
  {
    id: 'audio-art',
    label: 'Mixing ↔ Cover Art',
    giveHandle: '@mixby_jay',
    giveRole: 'Mix Engineer',
    giveSkills: ['Mix', 'Master', 'Vocal polish'],
    getHandle: '@visua_lis',
    getRole: 'Cover Artist',
    getSkills: ['Single cover', 'Canvas loop', 'Social assets'],
    result: 'A release-ready track with matching visuals.',
  },
] as const;

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
  const prefersReducedMotion = useReducedMotion();
  const [tradeIndex, setTradeIndex] = useState(0);
  const currentTrade = useMemo(() => TRADE_EXAMPLES[tradeIndex], [tradeIndex]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }
    const rotationInterval = setInterval(() => {
      setTradeIndex((prev) => (prev + 1) % TRADE_EXAMPLES.length);
    }, 8000);

    return () => clearInterval(rotationInterval);
  }, [prefersReducedMotion]);

  return (
    <Box className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PerformanceMonitor pageName="HomePage" />
      <Stack gap="lg">
        {/* Micro-Hero: Compact Welcome Mat (Not a Billboard) */}
        <Box className="relative rounded-2xl overflow-hidden">
          <GradientMeshBackground variant="primary" intensity="light" className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 lg:gap-10 items-start md:items-center">
              {/* Left: Explainer copy */}
              <div className="md:col-span-2 relative z-10 space-y-4 sm:space-y-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-primary-200 bg-primary-500/10 ring-1 ring-primary-500/30 w-fit">
                  Skill-trade network for builders
                </span>
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                    Swap skills. Ship projects.
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                    Post what you can do and what you need. TradeYa connects you with people who'll swap their
                    skills for yours, so you both walk away with real work for your portfolio.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/signup" className="w-full sm:w-auto">
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 shadow-lg shadow-primary-500/30 focus-visible:ring-2 focus-visible:ring-primary-200"
                    >
                      Start a trade
                    </Button>
                  </Link>
                  <Link to="/trades" className="w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full sm:w-auto border border-white/15 text-secondary-500 hover:bg-secondary-500/10 dark:hover:bg-secondary-500/15 px-6 py-3"
                    >
                      Browse live trades
                    </Button>
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground/80">No credits. No coins. Just fair trades.</p>
              </div>

              {/* Right: Trade flow card */}
              <div className="md:col-span-3 flex w-full justify-center">
                <div className="w-full max-w-xl space-y-3 sm:space-y-4" aria-live="polite">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold text-white/80 bg-white/5 ring-1 ring-white/10">
                    <span>How TradeYa works</span>
                    <span className="text-white/60">•</span>
                    <span className="truncate">{currentTrade.label}</span>
                  </div>

                  <div aria-label="Example skill trade flow" role="group">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={currentTrade.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="rounded-2xl bg-slate-950/40 p-4 md:p-5 ring-1 ring-white/10 backdrop-blur-md shadow-[0_18px_60px_rgba(0,0,0,0.55)] focus-within:ring-2 focus-within:ring-primary-400"
                      >
                        {/* Mobile: Stacked layout - hidden on md and above */}
                        <div className="flex flex-col gap-4 md:!hidden">
                          {/* You Give Section */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">You give</p>
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary-500/70 via-secondary-500/60 to-secondary-400/70 ring-2 ring-white/20" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white truncate">{currentTrade.giveHandle}</p>
                                <p className="text-xs text-white/70 truncate">{currentTrade.giveRole}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {currentTrade.giveSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-white/80 ring-1 ring-white/10"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Trade Exchange Indicator - Mobile */}
                          <div className="flex items-center justify-center py-2">
                            <div className="relative flex h-10 w-10 items-center justify-center">
                              {/* Subtle background circle */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-white/0 border border-white/10" />

                              {/* Elegant breathing glow effect */}
                              {!prefersReducedMotion && (
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary-500/10 via-primary-500/5 to-secondary-500/10"
                                  animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                    scale: [1, 1.05, 1],
                                  }}
                                  transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                              )}

                              {/* Single elegant arrow */}
                              <div className="relative z-10">
                                <ArrowLeftRight className="h-5 w-5 text-white/70" strokeWidth={1.5} />
                              </div>
                            </div>
                          </div>

                          {/* You Get Section */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">You get</p>
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-secondary-500/60 via-secondary-400/70 to-primary-400/70 ring-2 ring-white/20" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white truncate">{currentTrade.getHandle}</p>
                                <p className="text-xs text-white/70 truncate">{currentTrade.getRole}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {currentTrade.getSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-white/80 ring-1 ring-white/10"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Desktop: Grid layout - hidden below md, shown on md and above */}
                        <div className="!hidden md:!grid md:grid-cols-[1fr_auto_1fr] md:items-center gap-4 md:gap-6">
                          <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">You give</p>
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500/70 via-secondary-500/60 to-secondary-400/70 ring-2 ring-white/20" />
                              <div>
                                <p className="text-sm font-semibold text-white">{currentTrade.giveHandle}</p>
                                <p className="text-xs text-white/70">{currentTrade.giveRole}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {currentTrade.giveSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <div className="relative flex h-14 w-14 items-center justify-center">
                              {/* Subtle background circle */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-white/0 border border-white/10" />

                              {/* Elegant breathing glow effect */}
                              {!prefersReducedMotion && (
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary-500/10 via-primary-500/5 to-secondary-500/10"
                                  animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                    scale: [1, 1.05, 1],
                                  }}
                                  transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                              )}

                              {/* Single elegant arrow */}
                              <div className="relative z-10">
                                <ArrowLeftRight className="h-6 w-6 text-white/70" strokeWidth={1.5} />
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-secondary-100">Trade agreed</p>
                          </div>

                          <div className="space-y-3 text-right">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">You get</p>
                            <div className="flex items-center justify-end gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{currentTrade.getHandle}</p>
                                <p className="text-xs text-white/70">{currentTrade.getRole}</p>
                              </div>
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-secondary-500/60 via-secondary-400/70 to-primary-400/70 ring-2 ring-white/20" />
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              {currentTrade.getSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-white/80 md:flex-row md:items-center md:justify-between">
                          <p className="font-medium text-sm md:text-base">{currentTrade.result}</p>
                          <div className="inline-flex items-center gap-2 text-xs font-semibold text-success-500">
                            <span className="h-2 w-2 rounded-full bg-success-500 motion-safe:animate-pulse" />
                            Trade completed
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-semibold text-white/80">
                    {['1. Post your trade', '2. Match with a collaborator', '3. Build something real'].map((step) => (
                      <span key={step} className="rounded-full bg-white/5 px-2.5 sm:px-3 py-1 ring-1 ring-white/10">
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GradientMeshBackground>
        </Box>

        {/* Featured Content Section with Asymmetric Layout */}
        <AnimatedHeading
          as="h2"
          animation="slide"
          className="text-3xl md:text-4xl font-bold text-foreground"
        >
          Discover What's Possible
        </AnimatedHeading>

        {/* Consolidated Bento Grid */}
        <BentoGrid
          layoutPattern="symmetric"
          columns={{ base: 1, md: 2, lg: 3 }}
          gap="xl"
          className="grid-flow-dense"
        >
          {/* GROUP 1: Quick Actions (Sm) + Skill Trades (Lg) + Directory (Sm) */}

          <BentoItem colSpan={1} rowSpan={1} className="h-full">
            <Card
              variant="glass"
              tilt={true}
              depth="md"
              glow="subtle"
              interactive={true}
              className="h-full flex flex-col p-6 md:p-8"
            >
              <CardHeader className="pb-4 mb-4 border-b border-white/10 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl md:text-2xl font-semibold">Quick Actions</CardTitle>
                  <Badge variant="secondary" className="text-caption">
                    Popular
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-base text-muted-foreground">
                  Get started quickly with our most used tools.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/trades"
                    className={`flex items-center justify-between px-3 py-3 min-h-[48px] rounded-lg transition-colors ${semanticClasses('trades').bgSubtle}`}
                  >
                    <span className={`text-base font-medium ${semanticClasses('trades').text}`}>Browse Trades</span>
                    <span className={semanticClasses('trades').text}>→</span>
                  </Link>
                  <Link
                    to="/collaborations"
                    className={`flex items-center justify-between px-3 py-3 min-h-[48px] rounded-lg transition-colors ${semanticClasses('collaboration').bgSubtle}`}
                  >
                    <span className={`text-base font-medium ${semanticClasses('collaboration').text}`}>Find Collaborations</span>
                    <span className={semanticClasses('collaboration').text}>→</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </BentoItem>

          <BentoItem colSpan={{ base: 1, md: 2, lg: 2 }} rowSpan={{ base: 1, md: 1, lg: 2 }} className="h-full">
            <Card
              variant="premium"
              tilt={true}
              depth="xl"
              glow="strong"
              glowColor="orange"
              interactive={true}
              className="h-full flex flex-col p-8 ring-2 ring-primary-500/50"
            >
              <CardHeader className="pb-6 mb-6 border-b border-white/15 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl md:text-4xl font-bold">Skill Trades</CardTitle>
                  <Badge variant="default" topic="trades" className="text-caption">
                    Active
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground">
                  Exchange your skills with others in the community and find the perfect match for your goals.
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`text-center p-4 rounded-xl ${semanticClasses('trades').bgSubtle}`}>
                    {statsPending ? (
                      <Skeleton className="h-8 w-20 mx-auto mb-2" />
                    ) : (
                      <div className={`text-3xl font-bold ${semanticClasses('trades').text}`}>
                        {formatNumber(stats?.trades.active)}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">Active Trades</div>
                  </div>
                  <div className={`text-center p-4 rounded-xl ${semanticClasses('community').bgSubtle}`}>
                    {statsPending ? (
                      <Skeleton className="h-8 w-20 mx-auto mb-2" />
                    ) : (
                      <div className={`text-3xl font-bold ${semanticClasses('community').text}`}>
                        {formatNumber(stats?.trades.completed)}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">Completed Trades</div>
                  </div>
                </div>
                {statsError && <p className="text-sm text-destructive">{statsError}</p>}
              </CardContent>
              <CardFooter className="pt-4">
                <TopicLink
                  to="/trades"
                  topic="trades"
                  className="w-full text-center text-base font-semibold transition-colors"
                >
                  Start Trading Skills →
                </TopicLink>
              </CardFooter>
            </Card>
          </BentoItem>

          {/* DIRECTORY CARD MOVED DOWN TO GROUP 2 */}
          {/* CHALLENGES CARD MOVED UP TO GROUP 1 */}

          <BentoItem colSpan={1} rowSpan={1} className="h-full">
            <Card
              variant="glass"
              tilt={true}
              depth="md"
              glow="subtle"
              interactive={true}
              className="h-full flex flex-col p-6 md:p-8"
            >
              <CardHeader className="pb-4 mb-4 border-b border-white/10 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-semibold">Challenges</CardTitle>
                  <Badge variant="default" topic="success" className="text-caption">
                    Rewards
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {challengeLoading && !challenge ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ) : challenge ? (
                  <div className="space-y-3">
                    <p className="text-base text-muted-foreground">{challenge.title}</p>
                    {challenge.deadline && (
                      <div className="p-3 bg-success-500/10 text-success-500 rounded-lg">
                        <div className="text-sm font-medium">
                          Ends at {formatTimeLabel(challenge.deadline)}
                        </div>
                        {challenge.rewardSummary && (
                          <div className="text-sm text-success-100/80">
                            Reward: {challenge.rewardSummary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground">
                    No active challenges right now. Check back soon!
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-4">
                <TopicLink
                  to="/challenges"
                  topic="success"
                  className="w-full text-center text-base font-medium transition-colors"
                >
                  View Challenges →
                </TopicLink>
              </CardFooter>
              {challengeError && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-destructive">{challengeError}</p>
                </div>
              )}
            </Card>
          </BentoItem>

          {/* GROUP 2: Collaborations (Lg) + Directory (Sm) + Start DM (Sm) */}

          <BentoItem colSpan={{ base: 1, md: 2, lg: 2 }} rowSpan={{ base: 1, md: 1, lg: 2 }} className="h-full">
            <Card
              variant="glass"
              tilt={true}
              depth="md"
              glow="subtle"
              interactive={true}
              className="h-full flex flex-col p-6 md:p-8"
            >
              <CardHeader className="pb-4 mb-4 border-b border-white/10 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl md:text-3xl font-semibold">Collaborations</CardTitle>
                  <Badge variant="default" topic="collaboration" className="text-caption">
                    Team
                  </Badge>
                </div>
                <p className="text-base md:text-lg text-muted-foreground">
                  Join collaborative efforts or start your own team with the right talent.
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {highlightsLoading && highlights.length === 0 ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`highlight-skeleton-${index}`}
                      className="p-4 rounded-xl border border-border/40 glassmorphic"
                    >
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))
                ) : noHighlights ? (
                  <p className="text-sm text-muted-foreground">No collaborations are recruiting right now.</p>
                ) : (
                  highlights.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-white/40 dark:bg-neutral-900/40"
                    >
                      <div className="pr-4">
                        <p className="text-sm font-semibold text-foreground">{highlight.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{highlight.summary}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {formatNumber(highlight.openRoles)}
                        </p>
                        <p className="text-sm text-muted-foreground">roles open</p>
                      </div>
                    </div>
                  ))
                )}
                {highlightsError && <p className="text-sm text-destructive">{highlightsError}</p>}
              </CardContent>
              <CardFooter className="pt-4">
                <TopicLink
                  to="/collaborations"
                  topic="collaboration"
                  className="w-full text-center text-base font-medium transition-colors"
                >
                  Explore Collaborations →
                </TopicLink>
              </CardFooter>
            </Card>
          </BentoItem>

          <BentoItem colSpan={1} rowSpan={1} className="h-full">
            <Card
              variant="glass"
              interactive={true}
              className="h-full flex flex-col justify-between p-6 md:p-8 hover:-translate-y-0.5 hover:shadow-md transition-transform relative overflow-hidden"
            >
              {/* Decorative watermark icon */}
              <div className="absolute bottom-4 right-4 pointer-events-none">
                <Search className="w-32 h-32 text-secondary-500/10" strokeWidth={1.5} />
              </div>

              <div className="space-y-4 relative z-10">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Browse Directory
                </CardTitle>
                <p className="text-base text-muted-foreground">
                  Search by skills and tags to find people you&apos;d actually trade with.
                </p>
              </div>
              <CardFooter className="mt-4 px-0 relative z-10">
                <Link
                  to="/users"
                  className="text-base font-medium text-secondary-500 hover:text-secondary-400 inline-flex items-center gap-1"
                >
                  Open directory →
                </Link>
              </CardFooter>
            </Card>
          </BentoItem>

          <BentoItem colSpan={1} rowSpan={1} className="h-full">
            <Card
              variant="glass"
              interactive={true}
              className="h-full flex flex-col justify-between p-6 md:p-8 hover:-translate-y-0.5 hover:shadow-md transition-transform relative overflow-hidden"
            >
              {/* Decorative watermark icon */}
              <div className="absolute bottom-4 right-4 pointer-events-none">
                <MessageSquare className="w-32 h-32 text-primary-500/10" strokeWidth={1.5} />
              </div>

              <div className="space-y-4 relative z-10">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Start a DM
                </CardTitle>
                <p className="text-base text-muted-foreground">
                  Reach out, share ideas, and warm up a trade before you post it.
                </p>
              </div>
            </Card>
          </BentoItem>

          {/* GROUP 3: Community Stats (Sm) + Recent Activity (Lg) + Active (Sm) */}

          <BentoItem colSpan={1} rowSpan={1} className="h-full">
            <Card
              variant="glass"
              tilt={true}
              depth="md"
              glow="subtle"
              interactive={true}
              className="h-full flex flex-col p-6 md:p-8"
            >
              <CardHeader className="pb-4 mb-4 border-b border-white/10 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-semibold">Community</CardTitle>
                  <Badge variant="status-glow" className="text-caption">
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-5">
                <div className="text-center p-4 bg-success-500/10 rounded-xl">
                  {statsPending ? (
                    <Skeleton className="h-8 w-20 mx-auto mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-success-500">
                      {formatNumber(stats?.community.activeUsers)}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">Active Users (7d)</div>
                </div>
                <div className="text-center p-4 bg-secondary-500/10 rounded-xl">
                  {statsPending ? (
                    <Skeleton className="h-8 w-20 mx-auto mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-secondary-500">
                      {formatNumber(stats?.community.skillsTraded)}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">Skills Traded</div>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  {statsPending
                    ? 'Measuring collaboration momentum...'
                    : `${formatNumber(stats?.community.collaborations)} collaborations in progress`}
                </div>
              </CardContent>
              {statsError && (
                <div className="px-5 pb-4">
                  <p className="text-caption text-destructive">{statsError}</p>
                </div>
              )}
            </Card>
          </BentoItem>

          <BentoItem colSpan={{ base: 1, md: 2, lg: 2 }} rowSpan={{ base: 1, md: 1, lg: 2 }} className="h-full">
            <Card
              variant="glass"
              tilt={true}
              depth="md"
              glow="subtle"
              interactive={true}
              className="h-full flex flex-col p-6 md:p-8"
            >
              <CardHeader className="pb-4 mb-4 border-b border-white/10 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl md:text-3xl font-semibold">Recent Activity</CardTitle>
                  <Badge variant="status-glow" className="text-caption">
                    Real-time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2.5 sm:space-y-3">
                {activityPending ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`activity-skeleton-${index}`}
                      className="p-3 rounded-xl border border-border/40 glassmorphic"
                    >
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))
                ) : noActivity ? (
                  <p className="text-base text-muted-foreground">
                    Things are quiet right now. Start a trade or collaboration to get featured here.
                  </p>
                ) : (
                  activity.map((item) => {
                    const dotColor = activityAccentMap[item.accent] || 'bg-primary';
                    const bgColor = activityBackgroundMap[item.accent] || 'bg-primary/10';
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-lg ${bgColor} transition-colors hover:opacity-90`}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${dotColor} shrink-0 mt-1.5 sm:mt-0`} />
                          <span className="text-sm font-medium text-foreground line-clamp-2 break-words">
                            {item.description}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap ml-2">
                          {formatTimeLabel(item.timestamp)}
                        </span>
                      </div>
                    );
                  })
                )}
                {activityError && <p className="text-sm text-destructive">{activityError}</p>}
              </CardContent>
              <CardFooter className="pt-4">
                <TopicLink
                  to="/users"
                  topic="community"
                  className="w-full text-center text-base font-medium transition-colors"
                >
                  Browse Community →
                </TopicLink>
              </CardFooter>
            </Card>
          </BentoItem>

          <BentoItem colSpan={1} rowSpan={1} className="h-full">
            <Card
              variant="glass"
              interactive={true}
              className="h-full flex flex-col justify-between p-6 md:p-8 hover:-translate-y-0.5 hover:shadow-md transition-transform relative overflow-hidden"
            >
              {/* Decorative watermark icon */}
              <div className="absolute bottom-4 right-4 pointer-events-none">
                <Users className="w-32 h-32 text-success-500/10" strokeWidth={1.5} />
              </div>

              <div className="space-y-4 relative z-10">
                <CardTitle className="text-xl font-semibold text-foreground">
                  See who&apos;s active
                </CardTitle>
                <p className="text-base text-muted-foreground">
                  Spot members who are trading, shipping, and showing up consistently.
                </p>
              </div>
            </Card>
          </BentoItem>

        </BentoGrid>
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

