import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getChallenges, joinChallenge, getUserChallenges, onActiveChallenges, getRecommendedChallenges, getFeaturedDaily, getFeaturedWeekly } from '../services/challenges';
import { Challenge, ChallengeFilters, ChallengeSortBy, ChallengeStatus, ChallengeType, ChallengeDifficulty, ChallengeCategory } from '../types/gamification';
import { useToast } from '../contexts/ToastContext';
import { Award, Filter, Search, Clock, Calendar, Users, Trophy, Dumbbell, ArrowRight } from 'lucide-react';
import { ChallengeCalendar } from '../components/features/challenges/ChallengeCalendar';
import { ChallengeCard } from '../components/features/challenges/ChallengeCard';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from '../components/ui/Tooltip';
import { cn } from '../utils/cn';
import { useBusinessMetrics } from '../contexts/PerformanceContext';
import { Button } from '../components/ui/Button';
import { markSkillPracticeDay, hasPracticedToday } from '../services/streaks';
// HomePage patterns imports
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import AnimatedHeading from '../components/ui/AnimatedHeading';
import GradientMeshBackground from '../components/ui/GradientMeshBackground';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { classPatterns, animations } from '../utils/designSystem';
import { semanticClasses } from '../utils/semanticColors';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';
import Cluster from '../components/layout/primitives/Cluster';
import Grid from '../components/layout/primitives/Grid';
import { motion } from 'framer-motion';
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';


export const ChallengesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { track } = useBusinessMetrics();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<Challenge[]>([]);
  const [featuredDaily, setFeaturedDaily] = useState<Challenge | null>(null);
  const [featuredWeekly, setFeaturedWeekly] = useState<Challenge | null>(null);
  const [practicedToday, setPracticedToday] = useState<boolean>(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | ''>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChallengeDifficulty | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | ''>('');
  const [selectedType, setSelectedType] = useState<ChallengeType | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'mine'>('all');
  
  // EnhancedSearchBar state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Search handler
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedDifficulty) count++;
    if (selectedStatus) count++;
    if (selectedType) count++;
    setActiveFiltersCount(count);
  }, [selectedCategory, selectedDifficulty, selectedStatus, selectedType]);

  // Categories using the new enum
  const categories = Object.values(ChallengeCategory);
  const difficulties = Object.values(ChallengeDifficulty);
  const statuses = Object.values(ChallengeStatus);
  const types = Object.values(ChallengeType);

  useEffect(() => {
    fetchChallenges();
    if (currentUser) {
      fetchUserChallenges();
    }
    // Check practiced-today indicator (non-blocking)
    (async () => {
      if (!currentUser?.uid) return;
      try {
        const practiced = await hasPracticedToday(currentUser.uid);
        setPracticedToday(practiced);
      } catch {}
    })();
    // Load featured challenges (non-blocking)
    (async () => {
      try {
        const [d, w] = await Promise.all([getFeaturedDaily(), getFeaturedWeekly()]);
        setFeaturedDaily(d);
        setFeaturedWeekly(w);
      } catch {}
    })();
    // Subscribe to live updates of active challenges
    const unsubscribe = onActiveChallenges((live) => {
      setLiveCount(live.length);
      // Optionally merge live data into the list when filters allow only active
      // Here we keep it as a badge indicator to avoid disrupting filter logic
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Apply type filter from query param (e.g., /challenges?type=solo)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam && Object.values(ChallengeType).includes(typeParam as ChallengeType)) {
      setSelectedType(typeParam as ChallengeType);
    }
  }, [location.search]);

  useEffect(() => {
    // Fetch recommended challenges (non-blocking)
    (async () => {
      try {
        const res = await getRecommendedChallenges(currentUser?.uid || '');
        if (res.success && res.challenges) {
          setRecommended(res.challenges.slice(0, 3));
          // Track impressions for recommendations
          try { track('challenge_recommendation_impressions', res.challenges.length); } catch {}
        }
      } catch (e) {
        // Silent fail for recommendations
      }
    })();
  }, [currentUser]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, selectedDifficulty, selectedStatus, selectedType, challenges, activeTab, userChallenges]);

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: ChallengeFilters = {
        limit: 50,
        sortBy: ChallengeSortBy.START_DATE,
        sortOrder: 'desc'
      };

      const challengesResult = await getChallenges(filters);
      if (!challengesResult.success) {
        throw new Error(challengesResult.error || 'Failed to fetch challenges');
      }
      
      setChallenges(challengesResult.challenges);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenges');
      addToast('error', err.message || 'Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChallenges = async () => {
    if (!currentUser?.uid) return;

    try {
      const userChallengesResult = await getUserChallenges(currentUser.uid);
      if (userChallengesResult.success && userChallengesResult.challenges) {
        setUserChallenges(userChallengesResult.challenges);
      }
    } catch (err) {
      console.error('Error fetching user challenges:', err);
    }
  };

  const applyFilters = () => {
    let result = [...challenges];

    // Tab filter
    if (activeTab === 'active') {
      result = result.filter((c) => c.status === ChallengeStatus.ACTIVE);
    } else if (activeTab === 'mine') {
      const myIds = new Set(userChallenges.map((uc: any) => uc.id));
      result = result.filter((c) => myIds.has(c.id));
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((challenge: Challenge) =>
        (challenge.title && challenge.title.toLowerCase().includes(term)) ||
        (challenge.description && challenge.description.toLowerCase().includes(term)) ||
        (challenge.tags && challenge.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((challenge: Challenge) => challenge.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty) {
      result = result.filter((challenge: Challenge) => challenge.difficulty === selectedDifficulty);
    }

    // Apply status filter
    if (selectedStatus) {
      result = result.filter((challenge: Challenge) => challenge.status === selectedStatus);
    }

    // Apply type filter
    if (selectedType) {
      result = result.filter((challenge: Challenge) => challenge.type === selectedType);
    }

    setFilteredChallenges(result);
    // Track zero-result state for analytics
    try {
      if (result.length === 0) {
        track('challenge_filters_zero_results', 1);
      }
    } catch {}
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSelectedStatus('');
    setSelectedType('');
    try { track('challenge_filters_cleared', 1); } catch {}
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!currentUser?.uid) {
      addToast('error', 'Please log in to join challenges');
      return;
    }

    try {
      const result = await joinChallenge(challengeId, currentUser.uid);
      if (result.success) {
        addToast('success', 'Successfully joined challenge!');
        // Track join event
        try {
          track('challenge_joins', 1);
          if (recommended.some((c) => c.id === challengeId)) {
            track('challenge_recommendation_joins', 1);
          }
        } catch {}
        fetchChallenges();
        fetchUserChallenges();
      } else {
        addToast('error', result.error || 'Failed to join challenge');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to join challenge');
    }
  };

  return (
    <Box className={classPatterns.homepageContainer}>
      <PerformanceMonitor pageName="ChallengesPage" />
      <Stack gap="md">
        {/* Hero Section */}
        <Box className={classPatterns.homepageHero}>
          <GradientMeshBackground 
            variant="secondary" 
            intensity="medium" 
            className={classPatterns.homepageHeroContent}
          >
            <div className="flex items-center gap-3 mb-4">
              <AnimatedHeading 
                as="h1" 
                animation="kinetic" 
                className="text-4xl md:text-5xl font-bold text-foreground"
              >
                Challenges
              </AnimatedHeading>
              {liveCount !== null && (
                <Badge variant="default" topic="success" className="text-xs animate-pulse">
                  Live: {liveCount}
                </Badge>
              )}
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl animate-fadeIn mb-6">
              Participate in challenges to improve your skills and compete with the community.
            </p>
            <Cluster gap="sm" align="center">
              <Button 
                variant="default" 
                size="md" 
                onClick={() => navigate('/challenges/create')}
                className="bg-primary hover:bg-primary/90"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Create Challenge
              </Button>
              <Button variant="outline" size="md" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Badge variant="secondary" className="text-xs">
                {filteredChallenges.length} Challenges
              </Badge>
            </Cluster>
          </GradientMeshBackground>
        </Box>

        {/* Tabs: All / Active / My Challenges */}
        <Card variant="glass" className="rounded-lg shadow-sm border border-border">
          <CardContent className="p-4">
            <Cluster gap="sm" justify="center">
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'mine', label: 'My Challenges' },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  variant={activeTab === tab.key ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={activeTab === tab.key}
                >
                  {tab.label}
                </Button>
              ))}
            </Cluster>
          </CardContent>
        </Card>

        {/* Daily Practice Quick Action */}
        {currentUser?.uid && (
          <Card variant="glass" className="rounded-xl p-4 md:p-6 mb-6 ">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium text-foreground">Daily Practice</div>
                  <div className="text-xs text-muted-foreground">
                    {practicedToday ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-success" aria-hidden />
                        Practiced today
                      </span>
                    ) : (
                      'Log a quick practice session to progress your skill streak.'
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await markSkillPracticeDay(currentUser.uid);
                    addToast('success', "Logged today's practice");
                    setPracticedToday(true);
                  } catch {
                    addToast('error', 'Failed to log practice');
                  }
                }}
              >
                Log practice
              </Button>
            </div>
          </Card>
        )}

        {/* Featured Challenges */}
        {(featuredDaily || featuredWeekly) && (
          <Card variant="glass" className="rounded-xl p-4 md:p-6 mb-6 ">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {featuredDaily && (
                <Tooltip content={<div>Today's featured daily challenge. Base + bonus XP available.</div>}>
                  <Link to={`/challenges/${featuredDaily.id}`} className="inline-flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    Featured today
                  </Link>
                </Tooltip>
              )}
              {featuredWeekly && (
                <Tooltip content={<div>This week's featured challenge. Complete for base + bonus XP.</div>}>
                  <Link to={`/challenges/${featuredWeekly.id}`} className="inline-flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    Featured this week
                  </Link>
                </Tooltip>
              )}
            </div>
          </Card>
        )}

        {/* Challenge Calendar */}
        <Card variant="glass" className="rounded-xl p-4 md:p-6 mb-6 ">
          <ChallengeCalendar />
        </Card>

        {/* Enhanced Search Section with HomePage-style card */}
        <Card variant="glass" className="rounded-xl p-4 md:p-6 mb-6 ">
          <CardHeader className={classPatterns.homepageCardHeader}>
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              Find Your Perfect Challenge
              <Badge variant="secondary" className="text-xs">
                {filteredChallenges.length} Challenges
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className={classPatterns.homepageCardContent}>
            <EnhancedSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={handleSearch}
              onToggleFilters={() => setShowFilterPanel(true)}
              hasActiveFilters={activeFiltersCount > 0}
              activeFiltersCount={activeFiltersCount}
              resultsCount={filteredChallenges.length}
              isLoading={loading}
              placeholder="Search challenges by title, description, or skills..."
              topic="success"
            />
          </CardContent>
        </Card>

        {/* Recommended Challenges */}
        {recommended.length > 0 && (
          <Card variant="glass" className="rounded-xl p-6 md:p-8 mb-8">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    Recommended for you
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Personalized challenges based on your skills and interests
                  </p>
                </div>
                <Badge variant="secondary" topic="success" className={cn("text-xs", semanticClasses('success').badge)}>
                  {recommended.length} Challenges
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
                {recommended.map((challenge, index) => {
                  const successClasses = semanticClasses('success');
                  return (
                    <motion.div
                      key={challenge.id}
                      className="h-full"
                      {...animations.homepageCardEntrance}
                      transition={{
                        ...animations.homepageCardEntrance.transition,
                        delay: index * 0.1
                      }}
                    >
                      <ChallengeCard
                        challenge={challenge}
                        onSelect={() => navigate(`/challenges/${challenge.id}`)}
                        footer={
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/challenges/${challenge.id}`}
                              className={cn("text-sm font-medium hover:underline", successClasses.link)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Details
                            </Link>
                            <Badge 
                              variant="secondary" 
                              topic="success" 
                              className={cn("text-xs", successClasses.badge)}
                            >
                              <Trophy className="h-3 w-3 mr-1" />
                              {(challenge.rewards && typeof challenge.rewards.xp === 'number') ? challenge.rewards.xp : 0} XP
                            </Badge>
                          </div>
                        }
                      />
                    </motion.div>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        {showFilters && (
          <Card variant="glass" className="rounded-lg shadow-sm border border-border transition-all">
            <CardHeader className={classPatterns.homepageCardHeader}>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                Filter Challenges
                <Badge variant="secondary" className="text-xs">
                  {categories.length + difficulties.length + statuses.length + types.length} Options
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={classPatterns.homepageCardContent}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-1">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ChallengeCategory | '')}
                className="w-full rounded-md border border-border-primary px-3 py-2 text-text-primary bg-background-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors duration-200"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-text-primary mb-1">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as ChallengeDifficulty | '')}
                className="w-full rounded-md border border-border-primary px-3 py-2 text-text-primary bg-background-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors duration-200"
              >
                <option value="">All Difficulties</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-text-primary mb-1">
                Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ChallengeStatus | '')}
                className="w-full rounded-md border border-border-primary px-3 py-2 text-text-primary bg-background-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors duration-200"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-text-primary mb-1">
                Type
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ChallengeType | '')}
                className="w-full rounded-md border border-border-primary px-3 py-2 text-text-primary bg-background-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors duration-200"
              >
                <option value="">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card text-card-foreground p-4 rounded-lg shadow-sm animate-pulse">
              <div className="h-4 bg-background-tertiary rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-background-tertiary rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-background-tertiary rounded w-1/2 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-8 bg-background-tertiary rounded w-24"></div>
                <div className="h-4 bg-background-tertiary rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-destructive text-destructive-foreground p-4 rounded-md text-center">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-2 text-sm font-medium text-text-primary">No challenges found</h3>
          <p className="mt-1 text-sm text-text-muted">
            {activeTab === 'mine'
              ? 'You have not joined any challenges yet.'
              : activeTab === 'active'
                ? 'No active challenges match your filters.'
                : 'Try adjusting your filters.'}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={resetFilters} aria-label="Clear filters">
              Clear filters
            </Button>
          </div>
        </div>
      )}

        {!loading && !error && filteredChallenges.length > 0 && (
          <>
            <AnimatedHeading as="h2" animation="slide" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
              Available Challenges
            </AnimatedHeading>
            <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
              {filteredChallenges.map((challenge, index) => {
                const isUserJoined = userChallenges.some((uc: any) => (uc.id || uc.challengeId) === challenge.id);
                const difficultyValue = challenge.difficulty || ChallengeDifficulty.BEGINNER;
                return (
                  <motion.div
                    key={challenge.id}
                    className="h-full"
                    {...animations.homepageCardEntrance}
                    transition={{
                      ...animations.homepageCardEntrance.transition,
                      delay: index * 0.1
                    }}
                  >
                    <ChallengeCard
                      challenge={{ ...challenge, difficulty: difficultyValue }}
                      onSelect={() => navigate(`/challenges/${challenge.id}`)}
                      footer={
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/challenges/${challenge.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Details
                          </Link>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleJoinChallenge(challenge.id); }}
                            disabled={isUserJoined}
                            variant={isUserJoined ? 'secondary' : 'primary'}
                            size="sm"
                          >
                            {isUserJoined ? 'Joined' : 'Join Challenge'}
                          </Button>
                        </div>
                      }
                    />
                  </motion.div>
                );
              })}
            </Grid>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default ChallengesPage;
