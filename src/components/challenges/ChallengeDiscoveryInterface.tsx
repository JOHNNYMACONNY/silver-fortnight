import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  ChallengeDiscoveryFilters,
  ChallengeRecommendation,
  DiscoveryResult,
  discoverChallenges
} from '../../services/challengeDiscovery';
import { 
  Challenge, 
  ChallengeType, 
  ChallengeDifficulty, 
  ChallengeCategory 
} from '../../types/gamification';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ChallengeCard } from '../features/challenges/ChallengeCard';
import { Input } from '../ui/Input';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Target, 
  TrendingUp,
  Zap,
  Users,
  Award,
  ChevronDown,
  X,
  Sparkles
} from 'lucide-react';

interface ChallengeDiscoveryInterfaceProps {
  userId: string;
  onChallengeSelect?: (challenge: Challenge) => void;
  className?: string;
}

export const ChallengeDiscoveryInterface: React.FC<ChallengeDiscoveryInterfaceProps> = ({
  userId,
  onChallengeSelect,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ChallengeDiscoveryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'recommended'>('recommended');

  useEffect(() => {
    handleSearch();
  }, [userId]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await discoverChallenges(userId, filters, searchQuery, 20);
      if (response.success && response.data) {
        setDiscoveryResult(response.data);
      }
    } catch (error) {
      console.error('Error discovering challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, filters, searchQuery]);

  const handleFilterChange = (key: keyof ChallengeDiscoveryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case ChallengeDifficulty.BEGINNER: return 'text-green-400 bg-green-500/20 border-green-500/30';
      case ChallengeDifficulty.INTERMEDIATE: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case ChallengeDifficulty.ADVANCED: return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case ChallengeDifficulty.EXPERT: return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    }
  };

  const getTypeIcon = (type: ChallengeType) => {
    switch (type) {
      case ChallengeType.SOLO: return <Target className="w-4 h-4" />;
      case ChallengeType.TRADE: return <Users className="w-4 h-4" />;
      case ChallengeType.COLLABORATION: return <Users className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getMatchColor = (match: ChallengeRecommendation['difficultyMatch']) => {
    switch (match) {
      case 'perfect': return 'text-green-400';
      case 'slightly-easy': return 'text-blue-400';
      case 'slightly-hard': return 'text-yellow-400';
      case 'too-easy': return 'text-gray-400';
      case 'too-hard': return 'text-red-400';
    }
  };

  const renderChallengeCard = (challenge: Challenge, recommendation?: ChallengeRecommendation) => (
    <ChallengeCard
      key={challenge.id}
      challenge={challenge}
      recommendation={recommendation}
      onSelect={(c) => onChallengeSelect?.(c)}
    />
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <Search className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Discover Challenges</h2>
        </div>
        <p className="text-gray-300">
          Find the perfect challenges for your skill level and interests
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search challenges by title, description, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={cn(
              "border-white/20",
              hasActiveFilters && "border-blue-500/50 bg-blue-500/10"
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge className="ml-2 bg-blue-500/20 text-blue-300">
                {Object.keys(filters).length + (searchQuery ? 1 : 0)}
              </Badge>
            )}
          </Button>
          <Button onClick={handleSearch} className="bg-gradient-to-r from-blue-500 to-purple-500">
            Search
          </Button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Challenge Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Challenge Type
                  </label>
                  <select
                    value={filters.types?.[0] || ''}
                    onChange={(e) => handleFilterChange('types', e.target.value ? [e.target.value as ChallengeType] : undefined)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Types</option>
                    <option value={ChallengeType.SOLO}>Solo</option>
                    <option value={ChallengeType.TRADE}>Trade</option>
                    <option value={ChallengeType.COLLABORATION}>Collaboration</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulties?.[0] || ''}
                    onChange={(e) => handleFilterChange('difficulties', e.target.value ? [e.target.value as ChallengeDifficulty] : undefined)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Difficulties</option>
                    <option value={ChallengeDifficulty.BEGINNER}>Beginner</option>
                    <option value={ChallengeDifficulty.INTERMEDIATE}>Intermediate</option>
                    <option value={ChallengeDifficulty.ADVANCED}>Advanced</option>
                    <option value={ChallengeDifficulty.EXPERT}>Expert</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.categories?.[0] || ''}
                    onChange={(e) => handleFilterChange('categories', e.target.value ? [e.target.value as ChallengeCategory] : undefined)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Categories</option>
                    <option value={ChallengeCategory.SKILL_DEVELOPMENT}>Skill Development</option>
                    <option value={ChallengeCategory.PROJECT_BASED}>Project Based</option>
                    <option value={ChallengeCategory.COMMUNITY}>Community</option>
                    <option value={ChallengeCategory.COMPETITION}>Competition</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  disabled={!hasActiveFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  onClick={() => setShowFilters(false)}
                  size="sm"
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant={viewMode === 'recommended' ? 'default' : 'outline'}
          onClick={() => setViewMode('recommended')}
          size="sm"
        >
          <Star className="w-4 h-4 mr-2" />
          Recommended
        </Button>
        <Button
          variant={viewMode === 'all' ? 'default' : 'outline'}
          onClick={() => setViewMode('all')}
          size="sm"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          All Results
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-3 text-gray-300">Discovering challenges...</span>
        </div>
      ) : discoveryResult ? (
        <div className="space-y-6">
          {/* Search Metadata */}
          <div className="text-center text-sm text-gray-400">
            Found {discoveryResult.totalCount} challenges in {discoveryResult.searchMetadata.searchTime}ms
            {discoveryResult.recommendations.length > 0 && (
              <span className="ml-2">• {discoveryResult.recommendations.length} personalized recommendations</span>
            )}
          </div>

          {/* Challenge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewMode === 'recommended' ? (
              // Show recommendations first
              <>
                {discoveryResult.recommendations.map((rec) => 
                  renderChallengeCard(rec.challenge, rec)
                )}
                {discoveryResult.recommendations.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No recommendations yet</h3>
                    <p className="text-gray-500">Complete more challenges to get personalized recommendations</p>
                  </div>
                )}
              </>
            ) : (
              // Show all challenges
              discoveryResult.challenges.map((challenge) => {
                const recommendation = discoveryResult.recommendations.find(r => r.challenge.id === challenge.id);
                return renderChallengeCard(challenge, recommendation);
              })
            )}
          </div>

          {/* No Results */}
          {discoveryResult.challenges.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No challenges found</h3>
              <p className="text-gray-500">Try adjusting your search terms or filters</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
