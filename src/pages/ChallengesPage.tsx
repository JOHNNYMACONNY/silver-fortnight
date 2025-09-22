import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { getChallenges, joinChallenge, getUserChallenges, onActiveChallenges, getRecommendedChallenges, getFeaturedDaily, getFeaturedWeekly } from '../services/challenges';
import { Challenge, ChallengeFilters, ChallengeSortBy, ChallengeStatus, ChallengeType, ChallengeDifficulty, ChallengeCategory } from '../types/gamification';
import { useToast } from '../contexts/ToastContext';
import { Award, Filter, Search, Clock, Calendar, Users, Trophy, X } from 'lucide-react';
import { ChallengeCalendar } from '../components/features/challenges/ChallengeCalendar';
import { ChallengeCard } from '../components/features/challenges/ChallengeCard';
import { ChallengesPageHeader } from '../components/challenges/ChallengesPageHeader';
import { DailyPracticeSection } from '../components/challenges/DailyPracticeSection';
import { DailyPracticeErrorBoundary } from '../components/challenges/DailyPracticeErrorBoundary';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from '../components/ui/Tooltip';
import { cn } from '../utils/cn';
import { useBusinessMetrics } from '../contexts/PerformanceContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EnhancedSearchBar } from '../components/features/search/EnhancedSearchBar';
import { EnhancedFilterPanel } from '../components/features/search/EnhancedFilterPanel';
import { useUrlTabState } from '../hooks/useUrlTabState';

// Challenge-specific filter interface
interface ChallengeFilterState {
  challengeCategory?: ChallengeCategory | '';
  difficulty?: ChallengeDifficulty | '';
  challengeStatus?: ChallengeStatus | '';
  challengeType?: ChallengeType | '';
}

export const ChallengesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { track } = useBusinessMetrics();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<Challenge[]>([]);
  const [featuredDaily, setFeaturedDaily] = useState<Challenge | null>(null);
  const [featuredWeekly, setFeaturedWeekly] = useState<Challenge | null>(null);

  // Unified search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState<ChallengeFilterState>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // URL-based tab state management
  const { activeTab: urlActiveTab, setActiveTab: setUrlActiveTab } = useUrlTabState({
    defaultTab: 'all',
    validTabs: ['all', 'active', 'mine'],
    hashPrefix: 'challenges-',
    persistToLocalStorage: true,
    localStorageKey: 'tradeya_challenges_active_tab'
  });
  
  // Type-safe active tab
  const activeTab = urlActiveTab as 'all' | 'active' | 'mine';
  const setActiveTab = (tab: 'all' | 'active' | 'mine') => setUrlActiveTab(tab);

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
      setFilters(prev => ({ ...prev, challengeType: typeParam as ChallengeType }));
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoized filter function for better performance
  const filteredChallenges = useMemo(() => {
    let result = [...challenges];

    // Tab filter
    if (activeTab === 'active') {
      result = result.filter((c) => c.status === ChallengeStatus.ACTIVE);
    } else if (activeTab === 'mine') {
      const myIds = new Set(userChallenges.map((uc: any) => uc.id));
      result = result.filter((c) => myIds.has(c.id));
    }

    // Apply debounced search term filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter((challenge: Challenge) =>
        (challenge.title && challenge.title.toLowerCase().includes(term)) ||
        (challenge.description && challenge.description.toLowerCase().includes(term)) ||
        (challenge.tags && challenge.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    // Apply filters
    if (filters.challengeCategory) {
      result = result.filter((challenge: Challenge) => challenge.category === filters.challengeCategory);
    }

    if (filters.difficulty) {
      result = result.filter((challenge: Challenge) => challenge.difficulty === filters.difficulty);
    }

    if (filters.challengeStatus) {
      result = result.filter((challenge: Challenge) => challenge.status === filters.challengeStatus);
    }

    if (filters.challengeType) {
      result = result.filter((challenge: Challenge) => challenge.type === filters.challengeType);
    }

    return result;
  }, [challenges, activeTab, userChallenges, debouncedSearchTerm, filters]);

  // Track zero-result state for analytics
  useEffect(() => {
    if (filteredChallenges.length === 0 && challenges.length > 0) {
      try {
        track('challenge_filters_zero_results', 1);
      } catch {}
    }
  }, [filteredChallenges.length, challenges.length]);

  // Legacy function for compatibility (now just updates state)
  const applyFilters = useCallback(() => {
    // This is now handled by the memoized filteredChallenges
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilters({});
    try { track('challenge_filters_cleared', 1); } catch {}
  }, [track]);

  const handleFiltersChange = useCallback((newFilters: ChallengeFilterState) => {
    setFilters(newFilters);
  }, []);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== '' && v !== undefined).length;
  }, [filters]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Component */}
      <ChallengesPageHeader
        liveCount={liveCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-8"
        isLoading={loading}
        loadingMessage="Loading challenges..."
      />

      <div className="glassmorphic rounded-xl p-4 md:p-6 mb-6">
        {/* Daily Practice quick action */}
        {currentUser?.uid && (
          <DailyPracticeErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Daily Practice Error:', error, errorInfo);
              // Could send to error tracking service here
            }}
          >
            <DailyPracticeSection 
              userId={currentUser.uid}
              showStreakInfo={true}
              enableAnimations={true}
              onPracticeLogged={() => {
                // Optional: Add any additional logic when practice is logged
                console.log('Practice logged successfully');
              }}
            />
          </DailyPracticeErrorBoundary>
        )}

        {(featuredDaily || featuredWeekly) && (
          <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
            {featuredDaily && (
              <Tooltip content={<div>Today’s featured daily challenge. Base + bonus XP available.</div>}>
                <Link to={`/challenges/${featuredDaily.id}`} className="inline-flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  Featured today
                </Link>
              </Tooltip>
            )}
            {featuredWeekly && (
              <Tooltip content={<div>This week’s featured challenge. Complete for base + bonus XP.</div>}>
                <Link to={`/challenges/${featuredWeekly.id}`} className="inline-flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  Featured this week
                </Link>
              </Tooltip>
            )}
          </div>
        )}

        {/* Minimal calendar strip */}
        <div className="mb-6">
          <ChallengeCalendar />
        </div>

        {recommended.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Recommended for you</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommended.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
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
                      <span className="text-xs inline-flex items-center px-2 py-1 bg-background-secondary text-text-secondary rounded-full">
                        <Trophy className="h-3 w-3 mr-1" />
                        {(challenge.rewards && typeof challenge.rewards.xp === 'number') ? challenge.rewards.xp : 0} XP
                      </span>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        )}
        {/* Search and Filter Bar */}
        <div className="mb-6">
          <EnhancedSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={(term) => setSearchTerm(term)}
            onToggleFilters={() => setShowFilterPanel(true)}
            hasActiveFilters={activeFilterCount > 0}
            activeFiltersCount={activeFilterCount}
            resultsCount={filteredChallenges.length}
            isLoading={loading}
            placeholder="Search challenges by title, description, or tags..."
          />
        </div>
      </div>

        {/* Filter Panel */}
        <EnhancedFilterPanel
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          filters={{
            challengeCategory: filters.challengeCategory || '',
            difficulty: filters.difficulty || '',
            challengeStatus: filters.challengeStatus || '',
            challengeType: filters.challengeType || ''
          }}
          onFiltersChange={(newFilters: any) => {
            setFilters({
              challengeCategory: newFilters.challengeCategory || '',
              difficulty: newFilters.difficulty || '',
              challengeStatus: newFilters.challengeStatus || '',
              challengeType: newFilters.challengeType || ''
            });
          }}
          onClearFilters={resetFilters}
          availableSkills={[]} // Challenges don't use skills
          persistenceKey="challenges-filters"
        />

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => {
            const isUserJoined = userChallenges.some((uc: any) => (uc.id || uc.challengeId) === challenge.id);
            const difficultyValue = challenge.difficulty || ChallengeDifficulty.BEGINNER;
            return (
              <ChallengeCard
                key={challenge.id}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;
