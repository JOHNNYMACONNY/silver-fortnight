/**
 * Skill Recommendation Card Component
 * 
 * Displays AI-powered skill recommendations with confidence scores,
 * learning paths, and market demand information for TradeYa users.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BookOpen, 
  Star, 
  ExternalLink, 
  CheckCircle,
  Clock,
  Users,
  Target
} from 'lucide-react';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';

interface SkillRecommendationCardProps {
  recommendation: {
    skill: string;
    confidence: number;
    reason: string;
    learningPath: string[];
    relatedSkills: string[];
    marketDemand: number;
  };
  onLearnMore?: (skill: string) => void;
  onAddToInterests?: (skill: string) => void;
  className?: string;
}

export const SkillRecommendationCard: React.FC<SkillRecommendationCardProps> = ({
  recommendation,
  onLearnMore,
  onAddToInterests,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLearning, setIsLearning] = useState(false);

  const handleLearnMore = () => {
    onLearnMore?.(recommendation.skill);
  };

  const handleAddToInterests = async () => {
    setIsLearning(true);
    try {
      await onAddToInterests?.(recommendation.skill);
    } finally {
      setIsLearning(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getMarketDemandColor = (demand: number) => {
    if (demand >= 8) return 'text-green-600';
    if (demand >= 6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getMarketDemandLabel = (demand: number) => {
    if (demand >= 8) return 'Very High';
    if (demand >= 6) return 'High';
    if (demand >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {recommendation.skill}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {recommendation.reason}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(recommendation.confidence)}`}>
              {Math.round(recommendation.confidence * 100)}% match
            </span>
          </div>
        </div>

        {/* Market Demand */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Market Demand:</span>
            <span className={`text-sm font-medium ${getMarketDemandColor(recommendation.marketDemand)}`}>
              {getMarketDemandLabel(recommendation.marketDemand)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {recommendation.marketDemand.toFixed(1)}/10
            </span>
          </div>
        </div>

        {/* Related Skills */}
        {recommendation.relatedSkills.length > 0 && (
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Related Skills:
            </span>
            <div className="flex flex-wrap gap-2">
              {recommendation.relatedSkills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs"
                >
                  {skill}
                </span>
              ))}
              {recommendation.relatedSkills.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs">
                  +{recommendation.relatedSkills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAddToInterests}
            disabled={isLearning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            {isLearning ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Add to Interests</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        >
          <div className="p-6">
            {/* Learning Path */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Learning Path
              </h4>
              <div className="space-y-3">
                {recommendation.learningPath.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Insights */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Why This Skill?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      High Demand
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Growing job market
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Community
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Active learning community
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Future-Proof
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Long-term relevance
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Learn More Button */}
            <div className="flex justify-end">
              <button
                onClick={handleLearnMore}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
              >
                <span>Learn More</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SkillRecommendationCard;
