import { getSyncFirebaseDb } from '../firebase-config';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { ServiceResponse } from '../types/services';
import { 
  Challenge, 
  ChallengeType, 
  ChallengeDifficulty, 
  ChallengeCategory,
  UserChallenge 
} from '../types/gamification';
import { getUserThreeTierProgress } from './threeTierProgression';
import { getUserSkillAssessments } from './skillAssessment';
import { SkillLevel } from '../types/gamification';

const db = getSyncFirebaseDb;

// Advanced filtering types
export interface ChallengeDiscoveryFilters {
  types?: ChallengeType[];
  difficulties?: ChallengeDifficulty[];
  categories?: ChallengeCategory[];
  skills?: string[];
  timeEstimate?: {
    min?: number; // minutes
    max?: number; // minutes
  };
  xpRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  hasAIMentor?: boolean;
  maxParticipants?: number;
  status?: 'active' | 'upcoming' | 'completed';
  userSkillLevel?: SkillLevel;
}

export interface ChallengeRecommendation {
  challenge: Challenge;
  score: number; // 0-100 relevance score
  reasons: string[];
  matchedSkills: string[];
  difficultyMatch: 'perfect' | 'slightly-easy' | 'slightly-hard' | 'too-easy' | 'too-hard';
  estimatedCompletionTime: string;
}

export interface DiscoveryResult {
  challenges: Challenge[];
  recommendations: ChallengeRecommendation[];
  totalCount: number;
  appliedFilters: ChallengeDiscoveryFilters;
  searchMetadata: {
    searchTime: number;
    algorithmVersion: string;
    userContext: UserDiscoveryContext;
  };
}

export interface UserDiscoveryContext {
  userId: string;
  completedChallenges: number;
  currentTier: 'SOLO' | 'TRADE' | 'COLLABORATION';
  skillLevels: Record<string, SkillLevel>;
  preferences: UserPreferences;
  recentActivity: RecentActivity[];
}

export interface UserPreferences {
  preferredDifficulty?: ChallengeDifficulty;
  preferredCategories?: ChallengeCategory[];
  learningStyle?: 'visual' | 'hands-on' | 'theoretical' | 'collaborative';
  timeAvailability?: 'short-bursts' | 'focused-sessions' | 'flexible';
  motivationFactors?: ('competition' | 'learning' | 'networking' | 'achievement')[];
}

export interface RecentActivity {
  type: 'challenge_completed' | 'challenge_started' | 'skill_assessed' | 'tier_unlocked';
  challengeId?: string;
  skillName?: string;
  timestamp: Timestamp;
  outcome?: 'success' | 'abandoned' | 'in-progress';
}

/**
 * Discover challenges with advanced filtering and recommendations
 */
export const discoverChallenges = async (
  userId: string,
  filters: ChallengeDiscoveryFilters = {},
  searchQuery?: string,
  limitResults: number = 20
): Promise<ServiceResponse<DiscoveryResult>> => {
  const startTime = Date.now();
  
  try {
    // Get user context for personalization
    const userContext = await buildUserContext(userId);
    
    // Build base query
    let challengesQuery = collection(db(), 'challenges');
    const constraints: any[] = [];

    // Apply filters
    if (filters.types && filters.types.length > 0) {
      constraints.push(where('type', 'in', filters.types));
    }

    if (filters.difficulties && filters.difficulties.length > 0) {
      constraints.push(where('difficulty', 'in', filters.difficulties));
    }

    if (filters.categories && filters.categories.length > 0) {
      constraints.push(where('category', 'in', filters.categories));
    }

    if (filters.status) {
      const now = Timestamp.now();
      if (filters.status === 'active') {
        constraints.push(where('startDate', '<=', now));
        constraints.push(where('endDate', '>=', now));
      } else if (filters.status === 'upcoming') {
        constraints.push(where('startDate', '>', now));
      }
    }

    if (filters.createdAfter) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.createdAfter)));
    }

    if (filters.createdBefore) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.createdBefore)));
    }

    // Add ordering and limit
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitResults * 2)); // Get more for filtering

    const finalQuery = query(challengesQuery, ...constraints);
    const querySnapshot = await getDocs(finalQuery);

    let challenges: Challenge[] = [];
    querySnapshot.forEach((snap) => {
      const data = snap.data();
      const challenge = Object.assign({ id: snap.id }, data) as unknown as Challenge;
      challenges.push(challenge);
    });

    // Apply additional filters that can't be done in Firestore
    challenges = applyClientSideFilters(challenges, filters, searchQuery);

    // Generate recommendations
    const recommendations = await generateRecommendations(challenges, userContext);

    // Sort challenges by relevance
    const sortedChallenges = sortByRelevance(challenges, userContext, searchQuery);

    // Limit final results
    const finalChallenges = sortedChallenges.slice(0, limitResults);

    const searchTime = Date.now() - startTime;

    const result: DiscoveryResult = {
      challenges: finalChallenges,
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      totalCount: challenges.length,
      appliedFilters: filters,
      searchMetadata: {
        searchTime,
        algorithmVersion: '1.0.0',
        userContext
      }
    };

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error discovering challenges:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to discover challenges'
    };
  }
};

/**
 * Build user context for personalized recommendations
 */
const buildUserContext = async (userId: string): Promise<UserDiscoveryContext> => {
  try {
    // Get user progression
    const progressResponse = await getUserThreeTierProgress(userId);
    const progress = progressResponse.success ? progressResponse.data : null;

    // Get user skill assessments
    const skillsResponse = await getUserSkillAssessments(userId);
  const skillAssessments = skillsResponse.success ? (skillsResponse.data || []) : [];

    // Build skill levels map
    const skillLevels: Record<string, SkillLevel> = {};
    skillAssessments.forEach(assessment => {
      skillLevels[assessment.skillName] = assessment.currentLevel;
    });

    // Get user challenges (simplified - would need actual service)
    const completedChallenges = progress?.totalChallengesCompleted || 0;
    const currentTier = progress?.currentTier || 'SOLO';

    // Default preferences (would be stored in user profile)
    const preferences: UserPreferences = {
      preferredDifficulty: ChallengeDifficulty.INTERMEDIATE,
      preferredCategories: [ChallengeCategory.DEVELOPMENT],
      learningStyle: 'hands-on',
      timeAvailability: 'focused-sessions',
      motivationFactors: ['learning', 'achievement']
    };

    return {
      userId,
      completedChallenges,
      currentTier,
      skillLevels,
      preferences,
      recentActivity: [] // Would be populated from user activity log
    };
  } catch (error) {
    console.error('Error building user context:', error);
    // Return minimal context
    return {
      userId,
      completedChallenges: 0,
      currentTier: 'SOLO',
      skillLevels: {},
      preferences: {},
      recentActivity: []
    };
  }
};

/**
 * Apply filters that can't be done in Firestore
 */
const applyClientSideFilters = (
  challenges: Challenge[],
  filters: ChallengeDiscoveryFilters,
  searchQuery?: string
): Challenge[] => {
  return challenges.filter(challenge => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = (challenge.title || '').toLowerCase().includes(query);
      const matchesDescription = (challenge.description || '').toLowerCase().includes(query);
      const matchesTags = (challenge.tags ?? [])
        .filter((tag): tag is string => typeof tag === 'string')
        .some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      const challengeSkills = (challenge.tags ?? []).filter((t): t is string => typeof t === 'string');
      const hasMatchingSkill = filters.skills.some(skill => 
        challengeSkills.some(tag => tag.toLowerCase().includes((skill || '').toLowerCase()))
      );
      if (!hasMatchingSkill) return false;
    }

    // Time estimate filter
    if (filters.timeEstimate) {
      const timeEstimate = parseTimeEstimate(challenge.timeEstimate as string | undefined);
      if (filters.timeEstimate.min && timeEstimate < filters.timeEstimate.min) return false;
      if (filters.timeEstimate.max && timeEstimate > filters.timeEstimate.max) return false;
    }

    // XP range filter
    if (filters.xpRange) {
      const xp = challenge.rewards?.xp || 0;
      if (filters.xpRange.min && xp < filters.xpRange.min) return false;
      if (filters.xpRange.max && xp > filters.xpRange.max) return false;
    }

    // AI Mentor filter
    if (filters.hasAIMentor !== undefined) {
      // Would check challenge config for AI mentor availability
      // For now, assume all challenges have AI mentor option
    }

    // Max participants filter
    if (filters.maxParticipants) {
      const maxParticipants = challenge.maxParticipants || Infinity;
      if (maxParticipants > filters.maxParticipants) return false;
    }

    return true;
  });
};

/**
 * Generate personalized recommendations
 */
const generateRecommendations = async (
  challenges: Challenge[],
  userContext: UserDiscoveryContext
): Promise<ChallengeRecommendation[]> => {
  const recommendations: ChallengeRecommendation[] = [];

  for (const challenge of challenges) {
    const score = calculateRelevanceScore(challenge, userContext);
    const reasons = generateRecommendationReasons(challenge, userContext);
    const matchedSkills = findMatchedSkills(challenge, userContext);
    const difficultyMatch = assessDifficultyMatch(challenge, userContext);
    const estimatedCompletionTime = estimateCompletionTime(challenge, userContext);

    if (score > 30) { // Only recommend if score is above threshold
      recommendations.push({
        challenge,
        score,
        reasons,
        matchedSkills,
        difficultyMatch,
        estimatedCompletionTime
      });
    }
  }

  // Sort by score
  return recommendations.sort((a, b) => b.score - a.score);
};

/**
 * Calculate relevance score for a challenge
 */
const calculateRelevanceScore = (challenge: Challenge, userContext: UserDiscoveryContext): number => {
  let score = 50; // Base score

  // Tier appropriateness
  if (challenge.type === ChallengeType.SOLO && userContext.currentTier === 'SOLO') score += 20;
  if (challenge.type === ChallengeType.TRADE && userContext.currentTier === 'TRADE') score += 20;
  if (challenge.type === ChallengeType.COLLABORATION && userContext.currentTier === 'COLLABORATION') score += 20;

  // Difficulty match
  const userSkillLevels = Object.values(userContext.skillLevels);
  const avgSkillLevel = userSkillLevels.length > 0 
    ? userSkillLevels.reduce((sum, level) => sum + getSkillLevelNumber(level), 0) / userSkillLevels.length
    : 1;

  const challengeDifficultyNumber = getDifficultyNumber(challenge.difficulty);
  const difficultyDiff = Math.abs(avgSkillLevel - challengeDifficultyNumber);
  
  if (difficultyDiff === 0) score += 15;
  else if (difficultyDiff === 1) score += 10;
  else if (difficultyDiff === 2) score += 5;
  else score -= 10;

  // Skill relevance
  const challengeSkills = (challenge.tags ?? []).filter((t): t is string => typeof t === 'string');
  const userSkills = Object.keys(userContext.skillLevels);
  const skillMatches = challengeSkills.filter(skill => 
    userSkills.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
  ).length;
  score += skillMatches * 5;

  // Preference alignment
  if (challenge.category && userContext.preferences.preferredCategories?.includes(challenge.category)) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
};

// Helper functions
const parseTimeEstimate = (timeEstimate?: string): number => {
  if (!timeEstimate) return 60;
  const match = timeEstimate.match(/(\d+)/);
  return match ? parseInt(match[1]) : 60; // Default to 60 minutes
};

const getSkillLevelNumber = (level: SkillLevel): number => {
  switch (level) {
    case SkillLevel.BEGINNER: return 1;
    case SkillLevel.INTERMEDIATE: return 2;
    case SkillLevel.ADVANCED: return 3;
    case SkillLevel.EXPERT: return 4;
    default: return 1;
  }
};

const getDifficultyNumber = (difficulty: ChallengeDifficulty): number => {
  switch (difficulty) {
    case ChallengeDifficulty.BEGINNER: return 1;
    case ChallengeDifficulty.INTERMEDIATE: return 2;
    case ChallengeDifficulty.ADVANCED: return 3;
    case ChallengeDifficulty.EXPERT: return 4;
    default: return 1;
  }
};

const generateRecommendationReasons = (challenge: Challenge, userContext: UserDiscoveryContext): string[] => {
  const reasons = [];
  
  if (challenge.type.toString() === userContext.currentTier) {
    reasons.push(`Perfect for your current ${userContext.currentTier} tier`);
  }
  
  const challengeSkills = (challenge.tags ?? []).filter((t): t is string => typeof t === 'string');
  const userSkills = Object.keys(userContext.skillLevels);
  const matchingSkills = challengeSkills.filter(skill => 
    userSkills.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
  );
  
  if (matchingSkills.length > 0) {
    reasons.push(`Matches your ${matchingSkills.slice(0, 2).join(', ')} skills`);
  }
  
  if (challenge.category && userContext.preferences.preferredCategories?.includes(challenge.category)) {
    reasons.push('Aligns with your interests');
  }
  
  return reasons;
};

const findMatchedSkills = (challenge: Challenge, userContext: UserDiscoveryContext): string[] => {
  const challengeSkills = challenge.tags || [];
  const userSkills = Object.keys(userContext.skillLevels);
  
  return challengeSkills.filter(skill => 
    userSkills.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
  );
};

const assessDifficultyMatch = (challenge: Challenge, userContext: UserDiscoveryContext): ChallengeRecommendation['difficultyMatch'] => {
  const userSkillLevels = Object.values(userContext.skillLevels);
  const avgSkillLevel = userSkillLevels.length > 0 
    ? userSkillLevels.reduce((sum, level) => sum + getSkillLevelNumber(level), 0) / userSkillLevels.length
    : 1;

  const challengeDifficultyNumber = getDifficultyNumber(challenge.difficulty);
  const diff = challengeDifficultyNumber - avgSkillLevel;
  
  if (diff === 0) return 'perfect';
  if (diff === -1) return 'slightly-easy';
  if (diff === 1) return 'slightly-hard';
  if (diff <= -2) return 'too-easy';
  return 'too-hard';
};

const estimateCompletionTime = (challenge: Challenge, userContext: UserDiscoveryContext): string => {
  const baseTime = parseTimeEstimate(challenge.timeEstimate);
  const userSkillLevels = Object.values(userContext.skillLevels);
  const avgSkillLevel = userSkillLevels.length > 0 
    ? userSkillLevels.reduce((sum, level) => sum + getSkillLevelNumber(level), 0) / userSkillLevels.length
    : 1;

  const challengeDifficultyNumber = getDifficultyNumber(challenge.difficulty);
  const skillMultiplier = avgSkillLevel / challengeDifficultyNumber;
  
  const safeMultiplier = skillMultiplier || 1;
  const estimatedTime = Math.round(baseTime / safeMultiplier);
  
  if (estimatedTime < 60) return `${estimatedTime} minutes`;
  if (estimatedTime < 120) return '1-2 hours';
  if (estimatedTime < 240) return '2-4 hours';
  return '4+ hours';
};

const sortByRelevance = (challenges: Challenge[], userContext: UserDiscoveryContext, searchQuery?: string): Challenge[] => {
  return challenges.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, userContext);
    const scoreB = calculateRelevanceScore(b, userContext);
    
    // If search query exists, boost exact matches
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const aExactMatch = a.title.toLowerCase().includes(queryLower);
      const bExactMatch = b.title.toLowerCase().includes(queryLower);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
    }
    
    return scoreB - scoreA;
  });
};
