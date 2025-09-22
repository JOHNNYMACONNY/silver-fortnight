/**
 * User Match Card Component
 * 
 * Displays AI-powered user matches with compatibility scores,
 * potential trades, and communication insights for TradeYa users.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  X
} from 'lucide-react';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';

interface UserMatchCardProps {
  match: {
    userId: string;
    compatibility: number;
    reasons: string[];
    potentialTrades: string[];
    communicationScore: number;
    skillComplementarity: number;
  };
  onConnect?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  onDismiss?: (userId: string) => void;
  className?: string;
}

export const UserMatchCard: React.FC<UserMatchCardProps> = ({
  match,
  onConnect,
  onViewProfile,
  onDismiss,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect?.(match.userId);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleViewProfile = () => {
    onViewProfile?.(match.userId);
  };

  const handleDismiss = () => {
    onDismiss?.(match.userId);
  };

  const getCompatibilityColor = (compatibility: number) => {
    if (compatibility >= 0.8) return 'text-green-600 bg-green-100';
    if (compatibility >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getCompatibilityLabel = (compatibility: number) => {
    if (compatibility >= 0.8) return 'Excellent Match';
    if (compatibility >= 0.6) return 'Good Match';
    return 'Potential Match';
  };

  const getCommunicationColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
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
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {match.userId.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User {match.userId.slice(-4)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {getCompatibilityLabel(match.compatibility)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompatibilityColor(match.compatibility)}`}>
              {Math.round(match.compatibility * 100)}% match
            </span>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Compatibility Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Compatibility:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round(match.compatibility * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Communication:</span>
            <span className={`text-sm font-medium ${getCommunicationColor(match.communicationScore)}`}>
              {Math.round(match.communicationScore * 100)}%
            </span>
          </div>
        </div>

        {/* Potential Trades */}
        {match.potentialTrades.length > 0 && (
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Potential Trades:
            </span>
            <div className="flex flex-wrap gap-2">
              {match.potentialTrades.slice(0, 2).map((trade, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md text-xs"
                >
                  {trade}
                </span>
              ))}
              {match.potentialTrades.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs">
                  +{match.potentialTrades.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            {isConnecting ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Connect</span>
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
            {/* Match Reasons */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Why You're a Great Match
              </h4>
              <div className="space-y-2">
                {match.reasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Compatibility Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Skill Complementarity
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Math.round(match.skillComplementarity * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${match.skillComplementarity * 100}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Communication Style
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Math.round(match.communicationScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${match.communicationScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* All Potential Trades */}
            {match.potentialTrades.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  All Potential Trades
                </h4>
                <div className="space-y-2">
                  {match.potentialTrades.map((trade, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <ArrowRight className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {trade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleViewProfile}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>View Profile</span>
              </button>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {isConnecting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    <span>Start Conversation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UserMatchCard;
