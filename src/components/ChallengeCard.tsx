import { useState } from 'react';
import { Challenge } from '../types';
import { Trophy, Clock, Users, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { joinChallenge, claimChallengeRewards } from '../lib/challenges';

// Helper function to format badge names into shorter titles
const formatBadgeTitle = (badgeName: string): string => {
  // Remove common prefixes
  const withoutPrefix = badgeName.replace(/^(Weekly|Monthly)/, '');
  
  // Split on camelCase and special characters
  const words = withoutPrefix.split(/(?=[A-Z])|[&_-]/);
  
  // Filter out common words and join remaining words
  const relevantWords = words.filter(word => 
    ![
      'Data',
      'And',
      'The',
      'Of',
      ''  // Remove empty strings from split
    ].includes(word)
  );
  
  // Take only first 2-3 words to keep it concise
  const shortTitle = relevantWords.slice(0, 2).join(' ');
  
  return shortTitle;
};

import { useAuth } from '../contexts/AuthContext';
import { ChallengeBadge } from './ChallengeBadge';

interface ChallengeCardProps {
  challenge: Challenge;
  userProgress?: {
    progress: number;
    completed: boolean;
    claimedRewards: boolean;
  };
}

export function ChallengeCard({ challenge, userProgress }: ChallengeCardProps) {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const isParticipating = challenge.participants.includes(user?.uid || '');
  const hasCompleted = challenge.completions.includes(user?.uid || '');
  const canClaimRewards = hasCompleted && !userProgress?.claimedRewards;

  const timeLeft = new Date(challenge.endDate).getTime() - Date.now();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      await joinChallenge(user.uid, challenge.id);
    } catch (err) {
      console.error('Failed to join challenge:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!user) return;
    setClaiming(true);
    try {
      await claimChallengeRewards(user.uid, challenge);
    } catch (err) {
      console.error('Failed to claim rewards:', err);
    } finally {
      setClaiming(false);
    }
  };

  // Determine badge type based on challenge properties
  const getBadgeType = (challengeData: Challenge) => {
    const requirements = challengeData.requirements[0];
    
    // First check skill category if it exists
    if (requirements.skillCategory) {
      const category = requirements.skillCategory.toLowerCase();
      if (category.includes('audio') || category.includes('music') || category.includes('sound')) return 'audio';
      if (category.includes('visual') || category.includes('design') || category.includes('photo')) return 'visual';
      if (category.includes('code') || category.includes('programming')) return 'code';
      if (category.includes('writing') || category.includes('content')) return 'writing';
      if (category.includes('data') || category.includes('analytics')) return 'analytics';
    }
    
    // Check for social/community type
    if (requirements.type.toLowerCase().includes('social')) return 'community';
    
    // Fall back to challenge type if no specific category matched
    if (challengeData.type === 'weekly') return 'weekly';
    if (challengeData.type === 'monthly') return 'monthly';
    
    // Default fallback
    return 'skill';
  };

  return (
    <div className="card group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
              {challenge.title}
            </h3>
            <p className="text-gray-700">{challenge.description}</p>
          </div>
          <span className={`
            px-3 py-1.5 rounded-full text-sm font-medium
            ${challenge.type === 'weekly' 
              ? 'bg-accent-sage/20 text-accent-moss border border-accent-sage/30' 
              : 'bg-accent-clay/20 text-accent-rust border border-accent-clay/30'}
          `}>
            {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
          </span>
        </div>

        {/* Requirements */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-accent-ochre" />
            Requirements
          </h4>
          <div className="space-y-2">
            {challenge.requirements.map((req, index) => (
              <div 
                key={index} 
                className={`flex items-center p-2 rounded-lg transition-colors
                  ${userProgress && userProgress.progress >= req.count
                    ? 'bg-accent-sage/20 text-accent-moss border border-accent-sage/30'
                    : 'bg-earth-700/50 text-gray-900'}`}
              >
                <CheckCircle className={`h-4 w-4 mr-2 flex-shrink-0 ${
                  userProgress && userProgress.progress >= req.count
                    ? 'text-accent-moss'
                    : 'text-gray-500'
                }`} />
                <span>
                  {req.count} {req.type}
                  {req.skillCategory && ` in ${req.skillCategory}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent-ochre" />
            Rewards
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center px-3 py-1.5 bg-accent-clay/20 text-accent-rust rounded-lg border border-accent-clay/30">
              <Trophy className="h-4 w-4 mr-2" />
              <span className="font-display text-sm font-medium group-hover:animate-text-shimmer">{challenge.rewards.xp} XP</span>
            </div>
            {challenge.rewards.badge && (
              <div className="flex items-center gap-2">
                <ChallengeBadge
                  type={getBadgeType(challenge)}
                  name={challenge.rewards.badge}
                  size="md"
                  isLocked={!hasCompleted}
                  progress={userProgress?.progress || 0}
                />
                <span className="text-sm text-gray-700">{formatBadgeTitle(challenge.rewards.badge)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-sm text-gray-700 mb-6">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {challenge.participants.length} participants
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-earth-700">
          {!isParticipating && !hasCompleted && (
            <button
              onClick={handleJoin}
              disabled={joining || daysLeft <= 0}
              className="btn-primary w-full flex items-center justify-center gap-2 group"
            >
              {joining ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Joining...
                </>
              ) : (
                <>
                  Join Challenge
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          )}

          {canClaimRewards && (
            <button
              onClick={handleClaimRewards}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-accent-sage to-accent-clay text-white py-2 rounded-lg
                         hover:from-accent-clay hover:to-accent-sage transition-all duration-300
                         font-medium shadow-lg hover:shadow-accent-clay/50 flex items-center justify-center gap-2"
            >
              {claiming ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Claiming...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  Claim Rewards
                </>
              )}
            </button>
          )}

          {hasCompleted && !canClaimRewards && (
            <div className="text-center text-accent-moss font-medium flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Challenge Completed!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
