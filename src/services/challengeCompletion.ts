import { getSyncFirebaseDb } from '../firebase-config';
import {
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  Timestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { ServiceResponse } from '../types/services';
import { 
  Challenge, 
  UserChallenge, 
  ChallengeType,
  ChallengeDifficulty,
  ChallengeStatus,
  ChallengeCategory
} from '../types/gamification';
import { awardXP, XPSource, XP_VALUES } from './gamification';
import { updateProgressionOnChallengeCompletion } from './threeTierProgression';
import { checkAndUnlockAchievements } from './achievements';
import { createNotification } from './notifications';
import { generateChallengePortfolioItem } from './portfolio';

const db = getSyncFirebaseDb();

export interface ChallengeCompletionData {
  completionMethod: 'manual' | 'ai-verified' | 'peer-reviewed' | 'time-based';
  submissionData?: {
    code?: string;
    description?: string;
    files?: string[];
    screenshots?: string[];
    links?: string[];
    // New: embedded evidence objects for rich link previews
    embeddedEvidence?: import('../types/evidence').EmbeddedEvidence[];
  };
  timeSpent?: number; // minutes
  difficultyRating?: 1 | 2 | 3 | 4 | 5; // User's perceived difficulty
  qualityScore?: number; // 0-100, from AI or peer review
  feedback?: string;
  mentorNotes?: string;
}

export interface CompletionReward {
  xp: number;
  bonusXP: number;
  achievements: string[];
  badges: string[];
  tierProgress?: {
    tierUnlocked?: string;
    progressMade: number;
  };
  specialRewards?: {
    type: 'early_completion' | 'perfect_score' | 'first_attempt' | 'streak_bonus';
    description: string;
    value: number;
  }[];
}

export interface ChallengeCompletionResult {
  success: boolean;
  userChallenge?: UserChallenge;
  rewards?: CompletionReward;
  nextRecommendations?: Challenge[];
  error?: string;
}

/**
 * Complete a challenge with comprehensive reward calculation
 */
export const completeChallenge = async (
  userId: string,
  challengeId: string,
  completionData: ChallengeCompletionData
): Promise<ChallengeCompletionResult> => {
  try {
    return await runTransaction(db, async (transaction) => {
      // Get challenge and user challenge data
      const challengeRef = doc(db, 'challenges', challengeId);
      const userChallengeRef = doc(db, 'userChallenges', `${userId}_${challengeId}`);
      
      const [challengeDoc, userChallengeDoc] = await Promise.all([
        transaction.get(challengeRef),
        transaction.get(userChallengeRef)
      ]);

      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      if (!userChallengeDoc.exists()) {
        throw new Error('User challenge not found');
      }

      const challenge = Object.assign({ id: challengeDoc.id }, challengeDoc.data()) as unknown as Challenge;
      const userChallenge = userChallengeDoc.data() as UserChallenge;

      if ((userChallenge.status as any) === ChallengeStatus.COMPLETED) {
        throw new Error('Challenge already completed');
      }

      // Calculate completion time
      const startTime = userChallenge.startedAt?.toDate() || new Date();
      const completionTime = new Date();
      const timeSpentMinutes = completionData.timeSpent || 
        Math.round((completionTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Update user challenge
      const updatedUserChallenge: any = {
        ...userChallenge,
        status: ChallengeStatus.COMPLETED as unknown as UserChallenge['status'],
        completedAt: Timestamp.fromDate(completionTime),
        completionTimeMinutes: timeSpentMinutes,
        completionMethod: completionData.completionMethod,
        submissionData: completionData.submissionData,
        difficultyRating: completionData.difficultyRating,
        qualityScore: completionData.qualityScore,
        feedback: completionData.feedback,
        mentorNotes: completionData.mentorNotes,
        progress: userChallenge.maxProgress || 100,
        lastUpdated: Timestamp.now()
      };

      transaction.set(userChallengeRef, updatedUserChallenge as any, { merge: true });

      // Calculate rewards
      const rewards = await calculateCompletionRewards(
        userId,
        challenge,
        updatedUserChallenge,
        completionData
      );

      // Award XP
      await awardXP(
        userId,
        rewards.xp + rewards.bonusXP,
        XPSource.CHALLENGE_COMPLETION,
        challengeId,
        `Completed: ${challenge.title}`
      );

      // Update three-tier progression
      if ([ChallengeType.SOLO, ChallengeType.TRADE, ChallengeType.COLLABORATION].includes(challenge.type)) {
        const progressResult = await updateProgressionOnChallengeCompletion(
          userId,
          challenge.type,
          challenge.category ? [challenge.category] : []
        );

        if (progressResult.success && progressResult.data) {
          rewards.tierProgress = {
            progressMade: 1,
            tierUnlocked: progressResult.data.unlockedTiers?.slice(-1)[0]
          };
        }
      }

      // Create completion record for analytics
      const completionRecord = {
        userId,
        challengeId,
        challengeType: challenge.type,
        challengeDifficulty: challenge.difficulty,
        challengeCategory: challenge.category,
        completionTime: timeSpentMinutes,
        completionMethod: completionData.completionMethod,
        qualityScore: completionData.qualityScore,
        difficultyRating: completionData.difficultyRating,
        xpAwarded: rewards.xp + rewards.bonusXP,
        completedAt: Timestamp.now()
      };

      const completionRef = doc(collection(db, 'challengeCompletions'));
      transaction.set(completionRef, completionRecord);

      return {
        success: true,
        userChallenge: updatedUserChallenge,
        rewards
      };
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete challenge'
    };
  }
};

/**
 * Calculate comprehensive rewards for challenge completion
 */
const calculateCompletionRewards = async (
  userId: string,
  challenge: Challenge,
  userChallenge: UserChallenge,
  completionData: ChallengeCompletionData
): Promise<CompletionReward> => {
  const rewards: CompletionReward = {
    xp: 0,
    bonusXP: 0,
    achievements: [],
    badges: [],
    specialRewards: []
  };

  // Base XP from challenge
  rewards.xp = challenge.rewards?.xp || getDifficultyBaseXP(challenge.difficulty);

  // Quality bonus
  if (completionData.qualityScore) {
    const qualityBonus = Math.round((completionData.qualityScore / 100) * rewards.xp * 0.5);
    rewards.bonusXP += qualityBonus;
    
    if (completionData.qualityScore >= 90) {
      rewards.specialRewards?.push({
        type: 'perfect_score',
        description: 'Exceptional quality work!',
        value: qualityBonus
      });
    }
  }

  // Early completion bonus
  if (userChallenge.completionTimeMinutes && challenge.timeEstimate) {
    const estimatedMinutes = parseTimeEstimate(challenge.timeEstimate);
    const completionRatio = userChallenge.completionTimeMinutes / estimatedMinutes;
    
    if (completionRatio <= 0.75) {
      const earlyBonus = Math.round(rewards.xp * 0.25);
      rewards.bonusXP += earlyBonus;
      rewards.specialRewards?.push({
        type: 'early_completion',
        description: 'Completed ahead of schedule!',
        value: earlyBonus
      });
    }
  }

  // First attempt bonus
  if ((userChallenge as any).attempts === 1) {
    const firstAttemptBonus = Math.round(rewards.xp * 0.15);
    rewards.bonusXP += firstAttemptBonus;
    rewards.specialRewards?.push({
      type: 'first_attempt',
      description: 'Nailed it on the first try!',
      value: firstAttemptBonus
    });
  }

  // Difficulty perception bonus (if user rated it easier than expected)
  if (completionData.difficultyRating) {
    const expectedDifficulty = getDifficultyNumber(challenge.difficulty);
    if (completionData.difficultyRating < expectedDifficulty) {
      const masteryBonus = (expectedDifficulty - completionData.difficultyRating) * 10;
      rewards.bonusXP += masteryBonus;
    }
  }

  // Check for streak bonuses (would need streak tracking)
  // This is a placeholder for future implementation
  const streakBonus = await calculateStreakBonus(userId, challenge.type);
  if (streakBonus > 0) {
    rewards.bonusXP += streakBonus;
    rewards.specialRewards?.push({
      type: 'streak_bonus',
      description: 'Challenge completion streak!',
      value: streakBonus
    });
  }

  return rewards;
};

/**
 * Get base XP for difficulty level
 */
const getDifficultyBaseXP = (difficulty: ChallengeDifficulty): number => {
  switch (difficulty) {
    case ChallengeDifficulty.BEGINNER: return 100;
    case ChallengeDifficulty.INTERMEDIATE: return 200;
    case ChallengeDifficulty.ADVANCED: return 350;
    case ChallengeDifficulty.EXPERT: return 500;
    default: return 100;
  }
};

/**
 * Get difficulty as number for calculations
 */
const getDifficultyNumber = (difficulty: ChallengeDifficulty): number => {
  switch (difficulty) {
    case ChallengeDifficulty.BEGINNER: return 1;
    case ChallengeDifficulty.INTERMEDIATE: return 2;
    case ChallengeDifficulty.ADVANCED: return 3;
    case ChallengeDifficulty.EXPERT: return 4;
    default: return 1;
  }
};

/**
 * Parse time estimate string to minutes
 */
const parseTimeEstimate = (timeEstimate: string): number => {
  const match = timeEstimate.match(/(\d+)/);
  if (!match) return 60;
  
  const number = parseInt(match[1]);
  if (timeEstimate.toLowerCase().includes('hour')) {
    return number * 60;
  }
  return number; // Assume minutes
};

/**
 * Calculate streak bonus (placeholder implementation)
 */
const calculateStreakBonus = async (userId: string, challengeType: ChallengeType): Promise<number> => {
  // This would check user's recent completion history
  // For now, return 0 as placeholder
  return 0;
};

/**
 * Send completion notification and trigger achievement checks
 */
export const handlePostCompletionActions = async (
  userId: string,
  challenge: Challenge,
  rewards: CompletionReward,
  userChallenge?: UserChallenge
): Promise<void> => {
  try {
    // Send completion notification
    await createNotification({
      recipientId: userId,
      type: 'challenge_completed',
      title: 'Challenge Completed! 🎉',
      message: `You've completed "${challenge.title}" and earned ${rewards.xp + rewards.bonusXP} XP!`,
      data: {
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        xpEarned: rewards.xp + rewards.bonusXP,
        specialRewards: rewards.specialRewards
      },
      createdAt: Timestamp.now()
    });

    // Check for new achievements
    const newAchievements = await checkAndUnlockAchievements(userId);
    if (newAchievements.length > 0) {
      rewards.achievements = newAchievements.map(a => a.id);
    }

    // Send tier unlock notification if applicable
    if (rewards.tierProgress?.tierUnlocked) {
      await createNotification({
        recipientId: userId,
        type: 'tier_unlocked',
        title: 'New Tier Unlocked! 🚀',
        message: `You've unlocked ${rewards.tierProgress.tierUnlocked} challenges!`,
        data: {
          tierUnlocked: rewards.tierProgress.tierUnlocked
        },
        createdAt: Timestamp.now()
      });
    }

    // Generate portfolio item for the challenge completion
    // Note: We continue even if portfolio generation fails to avoid blocking challenge completion
    if (userChallenge) {
      try {
        await generateChallengePortfolioItem(
          {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            category: challenge.category,
            tags: challenge.tags,
            objectives: challenge.objectives
          },
          userChallenge,
          userId,
          true // defaultVisibility
        );
      } catch (portfolioError: any) {
        // Log portfolio generation error but don't fail the challenge completion
        console.warn('Portfolio generation failed for challenge:', portfolioError.message);
      }
    }
  } catch (error) {
    console.error('Error handling post-completion actions:', error);
    // Don't throw - these are non-critical actions
  }
};

/**
 * Get user's completion statistics
 */
export const getUserCompletionStats = async (userId: string): Promise<ServiceResponse<any>> => {
  try {
    // This would aggregate completion data from challengeCompletions collection
    // For now, return placeholder data
    const stats = {
      totalCompleted: 0,
      averageCompletionTime: 0,
      averageQualityScore: 0,
      completionsByDifficulty: {
        [ChallengeDifficulty.BEGINNER]: 0,
        [ChallengeDifficulty.INTERMEDIATE]: 0,
        [ChallengeDifficulty.ADVANCED]: 0,
        [ChallengeDifficulty.EXPERT]: 0
      },
      completionsByType: {
        [ChallengeType.SOLO]: 0,
        [ChallengeType.TRADE]: 0,
        [ChallengeType.COLLABORATION]: 0
      },
      streaks: {
        current: 0,
        longest: 0
      },
      totalXPEarned: 0
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting completion stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get completion stats'
    };
  }
};
