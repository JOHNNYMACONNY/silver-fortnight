import { getSyncFirebaseDb } from '../firebase-config';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  runTransaction,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import {
  ThreeTierProgress,
  TierRequirement,
  SkillProgressionData,
  ChallengeType,
  XP_VALUES,
  XPSource
} from '../types/gamification';
import { ServiceResponse } from '../types/services';
import { awardXP } from './gamification';

const db = getSyncFirebaseDb;

// Tier unlock requirements
const TIER_REQUIREMENTS: Record<string, TierRequirement> = {
  TRADE: {
    tier: 'TRADE',
    requiredCompletions: 3,
    requiredSkillLevel: 2,
    description: 'Complete 3 Solo challenges and reach skill level 2 in any skill'
  },
  COLLABORATION: {
    tier: 'COLLABORATION',
    requiredCompletions: 5,
    requiredSkillLevel: 3,
    description: 'Complete 5 Trade challenges and reach skill level 3 in any skill'
  }
};

/**
 * Get user's three-tier progression status
 */
export const getUserThreeTierProgress = async (userId: string): Promise<ServiceResponse<ThreeTierProgress>> => {
  try {
    const progressRef = doc(db(), 'threeTierProgress', userId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      // Initialize new user with Solo tier unlocked
      const initialProgress: ThreeTierProgress = {
        userId,
        soloCompletions: 0,
        tradeCompletions: 0,
        collaborationCompletions: 0,
        unlockedTiers: ['SOLO'],
        currentTier: 'SOLO',
        nextTierRequirements: TIER_REQUIREMENTS.TRADE,
        totalChallengesCompleted: 0,
        skillProgression: [],
        lastUpdated: Timestamp.now()
      };

      await setDoc(progressRef, initialProgress);
      return { success: true, data: initialProgress };
    }

    return { success: true, data: progressDoc.data() as ThreeTierProgress };
  } catch (error) {
    console.error('Error getting three-tier progress:', error);
    return { success: false, error: 'Failed to get progression status' };
  }
};

/**
 * Update progression when user completes a challenge
 */
export const updateProgressionOnChallengeCompletion = async (
  userId: string,
  challengeType: ChallengeType,
  skillsImproved: string[] = []
): Promise<ServiceResponse<ThreeTierProgress>> => {
  try {
    const progressRef = doc(db(), 'threeTierProgress', userId);
    
    return await runTransaction(db(), async (transaction) => {
      const progressDoc = await transaction.get(progressRef);
      let progress: ThreeTierProgress;

      if (!progressDoc.exists()) {
        // Initialize if doesn't exist
        progress = {
          userId,
          soloCompletions: 0,
          tradeCompletions: 0,
          collaborationCompletions: 0,
          unlockedTiers: ['SOLO'],
          currentTier: 'SOLO',
          nextTierRequirements: TIER_REQUIREMENTS.TRADE,
          totalChallengesCompleted: 0,
          skillProgression: [],
          lastUpdated: Timestamp.now()
        };
      } else {
        progress = progressDoc.data() as ThreeTierProgress;
      }

      // Update completion counts
      switch (challengeType) {
        case ChallengeType.SOLO:
          progress.soloCompletions++;
          break;
        case ChallengeType.TRADE:
          progress.tradeCompletions++;
          break;
        case ChallengeType.COLLABORATION:
          progress.collaborationCompletions++;
          break;
      }

      progress.totalChallengesCompleted++;
      progress.lastUpdated = Timestamp.now();

      // Update skill progression
      for (const skill of skillsImproved) {
        const existingSkill = progress.skillProgression.find(s => s.skillName === skill);
        if (existingSkill) {
          existingSkill.currentLevel = Math.min(existingSkill.currentLevel + 0.5, 5);
          existingSkill.progressPercentage = (existingSkill.currentLevel / existingSkill.targetLevel) * 100;
        } else {
          progress.skillProgression.push({
            skillName: skill,
            beforeLevel: 1,
            currentLevel: 1.5,
            targetLevel: 5,
            progressPercentage: 30
          });
        }
      }

      // Check for tier unlocks
      const newUnlocks = await checkTierUnlocks(progress);
      if (newUnlocks.length > 0) {
        progress.unlockedTiers = [...new Set([...progress.unlockedTiers, ...newUnlocks])];
        
        // Award tier unlock bonus
        for (const tier of newUnlocks) {
          await awardXP(
            userId,
            XP_VALUES.TIER_UNLOCK_BONUS,
            XPSource.ACHIEVEMENT,
            `tier-unlock-${tier}`,
            `Unlocked ${tier} challenges!`
          );
        }
      }

      // Update next tier requirements
      progress.nextTierRequirements = getNextTierRequirement(progress);

      transaction.set(progressRef, progress);
      return { success: true, data: progress };
    });
  } catch (error) {
    console.error('Error updating three-tier progression:', error);
    return { success: false, error: 'Failed to update progression' };
  }
};

/**
 * Check if user can unlock new tiers
 */
const checkTierUnlocks = async (progress: ThreeTierProgress): Promise<('TRADE' | 'COLLABORATION')[]> => {
  const unlocks: ('TRADE' | 'COLLABORATION')[] = [];

  // Check Trade tier unlock
  if (!progress.unlockedTiers.includes('TRADE')) {
    const tradeReq = TIER_REQUIREMENTS.TRADE;
    const hasRequiredCompletions = progress.soloCompletions >= tradeReq.requiredCompletions;
    const hasRequiredSkillLevel = progress.skillProgression.some(s => s.currentLevel >= (tradeReq.requiredSkillLevel || 0));
    
    if (hasRequiredCompletions && hasRequiredSkillLevel) {
      unlocks.push('TRADE');
    }
  }

  // Check Collaboration tier unlock
  if (!progress.unlockedTiers.includes('COLLABORATION')) {
    const collabReq = TIER_REQUIREMENTS.COLLABORATION;
    const hasRequiredCompletions = progress.tradeCompletions >= collabReq.requiredCompletions;
    const hasRequiredSkillLevel = progress.skillProgression.some(s => s.currentLevel >= (collabReq.requiredSkillLevel || 0));
    
    if (hasRequiredCompletions && hasRequiredSkillLevel) {
      unlocks.push('COLLABORATION');
    }
  }

  return unlocks;
};

/**
 * Get next tier requirement for user
 */
const getNextTierRequirement = (progress: ThreeTierProgress): TierRequirement | undefined => {
  if (!progress.unlockedTiers.includes('TRADE')) {
    return TIER_REQUIREMENTS.TRADE;
  }
  if (!progress.unlockedTiers.includes('COLLABORATION')) {
    return TIER_REQUIREMENTS.COLLABORATION;
  }
  return undefined; // All tiers unlocked
};

/**
 * Check if user can access a specific challenge tier
 */
export const canAccessTier = async (userId: string, tier: 'SOLO' | 'TRADE' | 'COLLABORATION'): Promise<boolean> => {
  // Reward-based model: all tiers are accessible at all times.
  // Progression impacts rewards/recommendations, not access locks.
  return true;
};

/**
 * Get recommended next challenges for user based on progression
 */
export const getRecommendedChallenges = async (userId: string): Promise<ServiceResponse<any[]>> => {
  try {
    const progressResponse = await getUserThreeTierProgress(userId);
    if (!progressResponse.success || !progressResponse.data) {
      return { success: false, error: 'Failed to get user progression' };
    }

    const progress = progressResponse.data;
    const recommendations = [];

    // Recommend based on current tier and progress
    if (progress.currentTier === 'SOLO' && progress.soloCompletions < 3) {
      recommendations.push({
        type: 'SOLO',
        reason: 'Complete more Solo challenges to unlock Trade challenges',
        priority: 'high'
      });
    } else if (progress.unlockedTiers.includes('TRADE') && progress.tradeCompletions < 5) {
      recommendations.push({
        type: 'TRADE',
        reason: 'Practice skill trading to unlock Collaboration challenges',
        priority: 'high'
      });
    } else if (progress.unlockedTiers.includes('COLLABORATION')) {
      recommendations.push({
        type: 'COLLABORATION',
        reason: 'Ready for team-based challenges',
        priority: 'medium'
      });
    }

    return { success: true, data: recommendations };
  } catch (error) {
    console.error('Error getting recommended challenges:', error);
    return { success: false, error: 'Failed to get recommendations' };
  }
};
