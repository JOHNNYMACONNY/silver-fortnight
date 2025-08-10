import { getSyncFirebaseDb } from '../firebase-config';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { 
  AICodeReview, 
  CodeSubmission, 
  aiCodeReviewService 
} from './ai/codeReviewService';
import { ServiceResponse } from '../types/services';
import { awardXP, XPSource } from './gamification';
import { updateProgressionOnChallengeCompletion } from './threeTierProgression';
import { ChallengeType } from '../types/gamification';

const db = getSyncFirebaseDb;

// Challenge AI Integration Types
export interface ChallengeSubmissionWithReview {
  id: string;
  userId: string;
  challengeId: string;
  submission: CodeSubmission;
  aiReview?: AICodeReview;
  manualReview?: ManualReview;
  status: 'pending' | 'ai-reviewed' | 'manually-reviewed' | 'approved' | 'needs-revision';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  approvedAt?: Timestamp;
  xpAwarded?: number;
}

export interface ManualReview {
  reviewerId: string;
  reviewerName: string;
  score: number;
  feedback: string;
  suggestions: string[];
  approved: boolean;
  reviewedAt: Timestamp;
}

export interface AIReviewMetrics {
  totalReviews: number;
  averageScore: number;
  averageReviewTime: number;
  skillLevelDistribution: Record<string, number>;
  commonIssues: Array<{
    category: string;
    frequency: number;
    description: string;
  }>;
}

/**
 * Submit code for AI review in a challenge context
 */
export const submitCodeForReview = async (
  userId: string,
  challengeId: string,
  code: string,
  language: string,
  description?: string
): Promise<ServiceResponse<ChallengeSubmissionWithReview>> => {
  try {
    const submission: CodeSubmission = {
      id: `submission_${userId}_${challengeId}_${Date.now()}`,
      userId,
      challengeId,
      code,
      language,
      description,
      submittedAt: new Date()
    };

    // Get AI review
    const reviewResponse = await aiCodeReviewService.reviewCode(submission);
    
    if (!reviewResponse.success || !reviewResponse.data) {
      return {
        success: false,
        error: reviewResponse.error || 'Failed to get AI review'
      };
    }

    const aiReview = reviewResponse.data;

    // Create submission record
    const submissionWithReview: ChallengeSubmissionWithReview = {
      id: submission.id,
      userId,
      challengeId,
      submission,
      aiReview,
      status: 'ai-reviewed',
      submittedAt: Timestamp.fromDate(submission.submittedAt),
      reviewedAt: Timestamp.fromDate(aiReview.reviewedAt)
    };

    // Save to Firestore
    const submissionRef = doc(db(), 'challengeSubmissions', submission.id);
    await setDoc(submissionRef, submissionWithReview);

    // Award XP based on AI review score
    await awardXPForSubmission(userId, challengeId, aiReview);

    return {
      success: true,
      data: submissionWithReview
    };
  } catch (error) {
    console.error('Error submitting code for review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit code'
    };
  }
};

/**
 * Get user's submissions for a challenge
 */
export const getUserChallengeSubmissions = async (
  userId: string,
  challengeId: string
): Promise<ServiceResponse<ChallengeSubmissionWithReview[]>> => {
  try {
    const submissionsRef = collection(db(), 'challengeSubmissions');
    const q = query(
      submissionsRef,
      where('userId', '==', userId),
      where('challengeId', '==', challengeId)
    );

    const querySnapshot = await getDocs(q);
    const submissions: ChallengeSubmissionWithReview[] = [];

    querySnapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() } as ChallengeSubmissionWithReview);
    });

    // Sort by submission date (newest first)
    submissions.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis());

    return {
      success: true,
      data: submissions
    };
  } catch (error) {
    console.error('Error getting user submissions:', error);
    return {
      success: false,
      error: 'Failed to get submissions'
    };
  }
};

/**
 * Approve a submission (manual review)
 */
export const approveSubmission = async (
  submissionId: string,
  reviewerId: string,
  reviewerName: string,
  manualReview: Omit<ManualReview, 'reviewerId' | 'reviewerName' | 'reviewedAt'>
): Promise<ServiceResponse<ChallengeSubmissionWithReview>> => {
  try {
    const submissionRef = doc(db(), 'challengeSubmissions', submissionId);
    
    return await runTransaction(db(), async (transaction) => {
      const submissionDoc = await transaction.get(submissionRef);
      
      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }

      const submission = submissionDoc.data() as ChallengeSubmissionWithReview;
      
      const fullManualReview: ManualReview = {
        ...manualReview,
        reviewerId,
        reviewerName,
        reviewedAt: Timestamp.now()
      };

      const updatedSubmission: ChallengeSubmissionWithReview = {
        ...submission,
        manualReview: fullManualReview,
        status: manualReview.approved ? 'approved' : 'needs-revision',
        approvedAt: manualReview.approved ? Timestamp.now() : undefined
      };

      transaction.update(submissionRef, updatedSubmission);

      // If approved, award additional XP and update progression
      if (manualReview.approved) {
        await awardXP(
          submission.userId,
          50, // Bonus XP for manual approval
          XPSource.ACHIEVEMENT,
          `manual-approval-${submissionId}`,
          'Code approved by mentor!'
        );

        // Update three-tier progression if this is a tier-based challenge
        // This would need challenge type information
        // await updateProgressionOnChallengeCompletion(submission.userId, challengeType, []);
      }

      return {
        success: true,
        data: updatedSubmission
      };
    });
  } catch (error) {
    console.error('Error approving submission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve submission'
    };
  }
};

/**
 * Award XP based on AI review score
 */
const awardXPForSubmission = async (
  userId: string,
  challengeId: string,
  aiReview: AICodeReview
): Promise<void> => {
  try {
    // Base XP for submission
    let xpAmount = 25;

    // Bonus XP based on score
    if (aiReview.overallScore >= 90) {
      xpAmount += 75; // Excellent work
    } else if (aiReview.overallScore >= 80) {
      xpAmount += 50; // Great work
    } else if (aiReview.overallScore >= 70) {
      xpAmount += 35; // Good work
    } else if (aiReview.overallScore >= 60) {
      xpAmount += 20; // Decent work
    } else {
      xpAmount += 10; // Effort bonus
    }

    // Skill level bonus
    switch (aiReview.estimatedSkillLevel) {
      case 'expert':
        xpAmount += 25;
        break;
      case 'advanced':
        xpAmount += 15;
        break;
      case 'intermediate':
        xpAmount += 10;
        break;
      case 'beginner':
        xpAmount += 5;
        break;
    }

    await awardXP(
      userId,
      xpAmount,
      XPSource.CHALLENGE_COMPLETION,
      `ai-review-${aiReview.id}`,
      `Code review completed! Score: ${aiReview.overallScore}/100`
    );
  } catch (error) {
    console.error('Error awarding XP for submission:', error);
  }
};

/**
 * Get AI review metrics for analytics
 */
export const getAIReviewMetrics = async (
  challengeId?: string,
  userId?: string,
  timeRange?: { start: Date; end: Date }
): Promise<ServiceResponse<AIReviewMetrics>> => {
  try {
    const submissionsRef = collection(db(), 'challengeSubmissions');
    let q = query(submissionsRef);

    // Apply filters
    if (challengeId) {
      q = query(q, where('challengeId', '==', challengeId));
    }
    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    const querySnapshot = await getDocs(q);
    const submissions: ChallengeSubmissionWithReview[] = [];

    querySnapshot.forEach((doc) => {
      const submission = doc.data() as ChallengeSubmissionWithReview;
      
      // Apply time range filter
      if (timeRange) {
        const submissionDate = submission.submittedAt.toDate();
        if (submissionDate < timeRange.start || submissionDate > timeRange.end) {
          return;
        }
      }

      if (submission.aiReview) {
        submissions.push(submission);
      }
    });

    // Calculate metrics
    const totalReviews = submissions.length;
    const averageScore = totalReviews > 0 
      ? submissions.reduce((sum, s) => sum + (s.aiReview?.overallScore || 0), 0) / totalReviews 
      : 0;
    const averageReviewTime = totalReviews > 0
      ? submissions.reduce((sum, s) => sum + (s.aiReview?.reviewTimeMs || 0), 0) / totalReviews
      : 0;

    // Skill level distribution
    const skillLevelDistribution: Record<string, number> = {};
    submissions.forEach(s => {
      const level = s.aiReview?.estimatedSkillLevel || 'unknown';
      skillLevelDistribution[level] = (skillLevelDistribution[level] || 0) + 1;
    });

    // Common issues (simplified - would need more sophisticated analysis)
    const commonIssues = [
      {
        category: 'code-quality',
        frequency: Math.floor(totalReviews * 0.6),
        description: 'Code structure and readability improvements needed'
      },
      {
        category: 'best-practices',
        frequency: Math.floor(totalReviews * 0.4),
        description: 'Framework and language best practices'
      },
      {
        category: 'performance',
        frequency: Math.floor(totalReviews * 0.3),
        description: 'Performance optimization opportunities'
      }
    ];

    const metrics: AIReviewMetrics = {
      totalReviews,
      averageScore,
      averageReviewTime,
      skillLevelDistribution,
      commonIssues
    };

    return {
      success: true,
      data: metrics
    };
  } catch (error) {
    console.error('Error getting AI review metrics:', error);
    return {
      success: false,
      error: 'Failed to get metrics'
    };
  }
};

/**
 * Check if AI review service is available
 */
export const checkAIServiceStatus = async (): Promise<ServiceResponse<boolean>> => {
  try {
    const isAvailable = await aiCodeReviewService.isServiceAvailable();
    return {
      success: true,
      data: isAvailable
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to check AI service status'
    };
  }
};
