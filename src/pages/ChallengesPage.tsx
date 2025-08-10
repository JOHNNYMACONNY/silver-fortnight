import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getChallenges, joinChallenge, getUserChallenges, onActiveChallenges, getRecommendedChallenges } from '../services/challenges';
import { Challenge, ChallengeFilters, ChallengeSortBy, ChallengeStatus, ChallengeType, ChallengeDifficulty, ChallengeCategory } from '../types/gamification';
import { useToast } from '../contexts/ToastContext';
import { Award, Filter, Search, Clock, Calendar, Users, Trophy } from 'lucide-react';
import { ChallengeCard } from '../components/features/challenges/ChallengeCard';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';


export const ChallengesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<Challenge[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | ''>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChallengeDifficulty | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | ''>('');
  const [selectedType, setSelectedType] = useState<ChallengeType | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'mine'>('all');

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
    // Subscribe to live updates of active challenges
    const unsubscribe = onActiveChallenges((live) => {
      setLiveCount(live.length);
      // Optionally merge live data into the list when filters allow only active
      // Here we keep it as a badge indicator to avoid disrupting filter logic
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Fetch recommended challenges (non-blocking)
    (async () => {
      try {
        const res = await getRecommendedChallenges(currentUser?.uid || '');
        if (res.success && res.challenges) {
          setRecommended(res.challenges.slice(0, 3));
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
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSelectedStatus('');
    setSelectedType('');
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-text-primary">Challenges</h1>
            {liveCount !== null && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                title="Live active challenges"
                aria-live="polite"
              >
                Live: {liveCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">Participate in coding challenges to improve your skills</p>
        </div>

        <div className="mt-4 md:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-border-primary rounded-md shadow-sm text-sm font-medium text-text-secondary bg-background-secondary hover:bg-background-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors duration-200"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Tabs: All / Active / My Challenges */}
      <div className="mb-4 flex items-center gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'mine', label: 'My Challenges' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background-secondary text-text-secondary border-border-primary hover:bg-background-tertiary'
            }`}
            aria-pressed={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
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
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-tertiary" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-border-primary rounded-md leading-5 bg-background-secondary text-text-primary placeholder-text-tertiary focus:outline-none focus:placeholder-text-tertiary focus:ring-1 focus:ring-ring focus:border-ring sm:text-sm transition-colors duration-200"
            placeholder="Search challenges..."
          />
        </div>
      </div>

      {showFilters && (
        <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border-primary mb-6 transition-all">
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
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Reset
            </button>
          </div>
        </div>
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
          <p className="mt-1 text-sm text-text-muted">Try adjusting your filters.</p>
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
                    <button
                      onClick={(e) => { e.stopPropagation(); handleJoinChallenge(challenge.id); }}
                      disabled={isUserJoined}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isUserJoined 
                          ? 'bg-background-tertiary text-text-tertiary cursor-not-allowed' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isUserJoined ? 'Joined' : 'Join Challenge'}
                    </button>
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
