/**
 * AI Recommendations Dashboard
 * 
 * Comprehensive dashboard displaying AI-powered recommendations,
 * user matches, and intelligent insights for TradeYa users.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Filter,
  Search,
  Settings,
  BarChart3,
  Lightbulb,
  Target
} from 'lucide-react';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';
import SkillRecommendationCard from './SkillRecommendationCard';
import UserMatchCard from './UserMatchCard';

interface AIRecommendationsDashboardProps {
  userId: string;
  className?: string;
}

export const AIRecommendationsDashboard: React.FC<AIRecommendationsDashboardProps> = ({
  userId,
  className = '',
}) => {
  const {
    skillRecommendations,
    userMatches,
    isLoading,
    error,
    hasRecommendations,
    hasMatches,
    refreshRecommendations,
    getTopRecommendations,
    getTopMatches,
    getHighConfidenceRecommendations,
    getHighCompatibilityMatches,
    clearError,
  } = useAIRecommendations(userId);

  const [activeTab, setActiveTab] = useState<'skills' | 'matches' | 'insights'>('skills');
  const [filter, setFilter] = useState<'all' | 'high-confidence' | 'trending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter recommendations based on current filter
  const getFilteredRecommendations = () => {
    let filtered = skillRecommendations;

    switch (filter) {
      case 'high-confidence':
        filtered = getHighConfidenceRecommendations(0.8);
        break;
      case 'trending':
        filtered = skillRecommendations.filter(rec => 
          rec.marketDemand >= 7
        );
        break;
      default:
        filtered = skillRecommendations;
    }

    if (searchQuery) {
      filtered = filtered.filter(rec =>
        rec.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.relatedSkills.some(skill =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    return filtered;
  };

  // Filter matches based on current filter
  const getFilteredMatches = () => {
    let filtered = userMatches;

    if (filter === 'high-confidence') {
      filtered = getHighCompatibilityMatches(0.8);
    }

    if (searchQuery) {
      filtered = filtered.filter(match =>
        match.potentialTrades.some(trade =>
          trade.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    return filtered;
  };

  const handleLearnMore = (skill: string) => {
    console.log('Learn more about skill:', skill);
    // Implement navigation to skill details page
  };

  const handleAddToInterests = async (skill: string) => {
    console.log('Add skill to interests:', skill);
    // Implement adding skill to user interests
  };

  const handleConnect = (userId: string) => {
    console.log('Connect with user:', userId);
    // Implement user connection logic
  };

  const handleViewProfile = (userId: string) => {
    console.log('View profile:', userId);
    // Implement navigation to user profile
  };

  const handleDismiss = (userId: string) => {
    console.log('Dismiss match:', userId);
    // Implement dismissing match
  };

  const filteredRecommendations = getFilteredRecommendations();
  const filteredMatches = getFilteredMatches();

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-600" />
                AI Recommendations
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Personalized skill suggestions and user matches powered by AI
              </p>
            </div>
            <button
              onClick={refreshRecommendations}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'skills', label: 'Skill Recommendations', icon: TrendingUp },
                { id: 'matches', label: 'User Matches', icon: Users },
                { id: 'insights', label: 'AI Insights', icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search skills or matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All</option>
              <option value="high-confidence">High Confidence</option>
              <option value="trending">Trending</option>
            </select>
            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Settings className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Loading skill recommendations...</p>
                  </div>
                </div>
              ) : filteredRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecommendations.map((recommendation, index) => (
                    <SkillRecommendationCard
                      key={index}
                      recommendation={recommendation}
                      onLearnMore={handleLearnMore}
                      onAddToInterests={handleAddToInterests}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No skill recommendations found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Try adjusting your filters or refresh to get new recommendations.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Finding compatible users...</p>
                  </div>
                </div>
              ) : filteredMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMatches.map((match, index) => (
                    <UserMatchCard
                      key={index}
                      match={match}
                      onConnect={handleConnect}
                      onViewProfile={handleViewProfile}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No user matches found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Try adjusting your filters or refresh to find new matches.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Recommendation Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recommendation Stats
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Recommendations:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {skillRecommendations.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">High Confidence:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getHighConfidenceRecommendations(0.8).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Trending Skills:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {skillRecommendations.filter(rec => rec.marketDemand >= 7).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Match Stats
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Matches:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {userMatches.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">High Compatibility:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getHighCompatibilityMatches(0.8).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Avg. Compatibility:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {userMatches.length > 0 
                          ? Math.round(userMatches.reduce((sum, match) => sum + match.compatibility, 0) / userMatches.length * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Insights
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Trending:</strong> AI and blockchain skills are in high demand
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Opportunity:</strong> Your profile has great potential for growth
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Tip:</strong> Consider adding more skills to increase matches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIRecommendationsDashboard;
