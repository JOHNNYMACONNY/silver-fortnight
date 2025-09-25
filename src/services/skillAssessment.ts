 

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
  orderBy,
  limit,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { ServiceResponse } from '../types/services';
import { SkillLevel, UserSkill } from '../types/gamification';
import { awardXP } from './gamification';
import { XPSource } from '../types/gamification';

const getDb = () => getSyncFirebaseDb();

// Skill Assessment Types
export interface SkillAssessment {
  id: string;
  userId: string;
  skillName: string;
  assessmentType: 'self' | 'peer' | 'ai' | 'challenge' | 'project';
  currentLevel: SkillLevel;
  previousLevel?: SkillLevel;
  confidence: number; // 1-10 scale
  evidence: AssessmentEvidence[];
  assessorId?: string; // For peer assessments
  assessorName?: string;
  feedback?: string;
  recommendations: string[];
  nextMilestones: SkillMilestone[];
  createdAt: Timestamp;
  validatedAt?: Timestamp;
}

export interface AssessmentEvidence {
  type: 'project' | 'challenge' | 'endorsement' | 'certification' | 'portfolio';
  title: string;
  description: string;
  url?: string;
  score?: number;
  date: Timestamp;
}

export interface SkillMilestone {
  level: SkillLevel;
  description: string;
  requirements: string[];
  estimatedTimeToComplete: string;
  xpReward: number;
}

export interface SkillProgressAnalytics {
  skillName: string;
  currentLevel: SkillLevel;
  progressPercentage: number;
  timeToNextLevel: string;
  strengthAreas: string[];
  improvementAreas: string[];
  recentActivity: SkillActivity[];
  trendDirection: 'improving' | 'stable' | 'declining';
  competencyScore: number; // 0-100
}

export interface SkillActivity {
  type: 'challenge_completed' | 'project_finished' | 'peer_review' | 'self_assessment';
  title: string;
  impact: 'positive' | 'neutral' | 'negative';
  xpGained: number;
  date: Timestamp;
}

export interface SkillGap {
  skillName: string;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  estimatedTimeToClose: string;
}

// Skill level progression requirements
const SKILL_LEVEL_REQUIREMENTS: Record<SkillLevel, { xp: number; milestones: string[] }> = {
  [SkillLevel.BEGINNER]: {
    xp: 0,
    milestones: ['Complete basic tutorial', 'Understand fundamentals']
  },
  [SkillLevel.INTERMEDIATE]: {
    xp: 500,
    milestones: ['Complete 3 projects', 'Demonstrate practical application', 'Receive peer validation']
  },
  [SkillLevel.ADVANCED]: {
    xp: 1500,
    milestones: ['Lead a project', 'Mentor others', 'Solve complex problems', 'Create original work']
  },
  [SkillLevel.EXPERT]: {
    xp: 3000,
    milestones: ['Teach others', 'Innovate in the field', 'Recognized expertise', 'Contribute to community']
  }
};

/**
 * Create or update a skill assessment
 */
export const createSkillAssessment = async (
  assessment: Omit<SkillAssessment, 'id' | 'createdAt'>
): Promise<ServiceResponse<SkillAssessment>> => {
  try {
    const db = getDb();
    const assessmentId = `assessment_${assessment.userId}_${assessment.skillName}_${Date.now()}`;
    const fullAssessment: SkillAssessment = {
      ...assessment,
      id: assessmentId,
      createdAt: Timestamp.now()
    };

    // Save assessment
    const assessmentRef = doc(db, 'skillAssessments', assessmentId);
    await setDoc(assessmentRef, fullAssessment);

    // Update user skill record
    await updateUserSkill(assessment.userId, assessment.skillName, assessment.currentLevel);

    // Award XP for self-assessment
    if (assessment.assessmentType === 'self') {
      await awardXP(
        assessment.userId,
        25,
        XPSource.ACHIEVEMENT_UNLOCK,
        `self-assessment-${assessmentId}`,
        `Self-assessed ${assessment.skillName} skill`
      );
    }

    return {
      success: true,
      data: fullAssessment
    };
  } catch (error) {
    console.error('Error creating skill assessment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create assessment'
    };
  }
};

/**
 * Get user's skill assessments
 */
export const getUserSkillAssessments = async (
  userId: string,
  skillName?: string
): Promise<ServiceResponse<SkillAssessment[]>> => {
  try {
    const db = getDb();
    const assessmentsRef = collection(db, 'skillAssessments');
    let q = query(
      assessmentsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (skillName) {
      q = query(q, where('skillName', '==', skillName));
    }

    const querySnapshot = await getDocs(q);
    const assessments: SkillAssessment[] = querySnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as SkillAssessment));

    return {
      success: true,
      data: assessments
    };
  } catch (error) {
    console.error('Error getting skill assessments:', error);
    return {
      success: false,
      error: 'Failed to get assessments'
    };
  }
};

/**
 * Update user skill record
 */
const updateUserSkill = async (
  userId: string,
  skillName: string,
  level: SkillLevel
): Promise<void> => {
  try {
    const db = getDb();
    const skillId = `${userId}_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const skillRef = doc(db, 'userSkills', skillId);
    
    const skillDoc = await getDoc(skillRef);
    const currentXP = SKILL_LEVEL_REQUIREMENTS[level].xp;

    if (skillDoc.exists()) {
      const existingSkill = skillDoc.data() as UserSkill;
      await updateDoc(skillRef, {
        level,
        xp: Math.max(existingSkill.xp, currentXP),
        lastUsed: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      const newSkill: UserSkill = {
        userId,
        skillName,
        level,
        xp: currentXP,
        endorsements: 0,
        lastUsed: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      await setDoc(skillRef, newSkill);
    }
  } catch (error) {
    console.error('Error updating user skill:', error);
  }
};

/**
 * Get skill progress analytics for a user
 */
export const getSkillProgressAnalytics = async (
  userId: string,
  skillName: string
): Promise<ServiceResponse<SkillProgressAnalytics>> => {
  try {
    const db = getDb();
    // Get skill assessments
    const assessmentsResponse = await getUserSkillAssessments(userId, skillName);
    if (!assessmentsResponse.success || !assessmentsResponse.data) {
      return {
        success: false,
        error: 'Failed to get skill assessments'
      };
    }

    const assessments = assessmentsResponse.data;
    if (assessments.length === 0) {
      return {
        success: false,
        error: 'No assessments found for this skill'
      };
    }

    const latestAssessment = assessments[0];
    const currentLevel = latestAssessment.currentLevel;

    // Calculate progress percentage within current level
    const currentLevelXP = SKILL_LEVEL_REQUIREMENTS[currentLevel].xp;
    const nextLevel = getNextSkillLevel(currentLevel);
    const nextLevelXP = nextLevel ? SKILL_LEVEL_REQUIREMENTS[nextLevel].xp : currentLevelXP;
    
    // Get user's actual XP for this skill
    const skillId = `${userId}_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const skillRef = doc(db, 'userSkills', skillId);
    const skillDoc = await getDoc(skillRef);
    const userXP = skillDoc.exists() ? (skillDoc.data() as UserSkill).xp : 0;

    const progressPercentage = nextLevel 
      ? Math.min(100, ((userXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
      : 100;

    // Analyze trend
    const trendDirection = analyzeTrend(assessments);

    // Calculate competency score
    const competencyScore = calculateCompetencyScore(assessments, userXP);

    // Generate recent activity
    const recentActivity = generateRecentActivity(assessments);

    const analytics: SkillProgressAnalytics = {
      skillName,
      currentLevel,
      progressPercentage,
      timeToNextLevel: estimateTimeToNextLevel(progressPercentage, trendDirection),
      strengthAreas: extractStrengthAreas(assessments),
      improvementAreas: extractImprovementAreas(assessments),
      recentActivity,
      trendDirection,
      competencyScore
    };

    return {
      success: true,
      data: analytics
    };
  } catch (error) {
    console.error('Error getting skill progress analytics:', error);
    return {
      success: false,
      error: 'Failed to get analytics'
    };
  }
};

/**
 * Identify skill gaps for a user
 */
export const identifySkillGaps = async (
  userId: string,
  targetSkills: { skillName: string; targetLevel: SkillLevel }[]
): Promise<ServiceResponse<SkillGap[]>> => {
  try {
    const gaps: SkillGap[] = [];

    for (const target of targetSkills) {
      const assessmentsResponse = await getUserSkillAssessments(userId, target.skillName);
      
      let currentLevel = SkillLevel.BEGINNER;
      if (assessmentsResponse.success && assessmentsResponse.data && assessmentsResponse.data.length > 0) {
        currentLevel = assessmentsResponse.data[0].currentLevel;
      }

      if (isLevelLower(currentLevel, target.targetLevel)) {
        const gap: SkillGap = {
          skillName: target.skillName,
          currentLevel,
          targetLevel: target.targetLevel,
          priority: calculateGapPriority(currentLevel, target.targetLevel),
          suggestedActions: generateSuggestedActions(currentLevel, target.targetLevel, target.skillName),
          estimatedTimeToClose: estimateTimeToCloseGap(currentLevel, target.targetLevel)
        };
        gaps.push(gap);
      }
    }

    // Sort by priority
    gaps.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return {
      success: true,
      data: gaps
    };
  } catch (error) {
    console.error('Error identifying skill gaps:', error);
    return {
      success: false,
      error: 'Failed to identify skill gaps'
    };
  }
};

// Helper functions
const getNextSkillLevel = (currentLevel: SkillLevel): SkillLevel | null => {
  const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
};

const isLevelLower = (current: SkillLevel, target: SkillLevel): boolean => {
  const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
  return levels.indexOf(current) < levels.indexOf(target);
};

const analyzeTrend = (assessments: SkillAssessment[]): 'improving' | 'stable' | 'declining' => {
  if (assessments.length < 2) return 'stable';
  
  const recent = assessments.slice(0, 3);
  const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
  
  let improvements = 0;
  let declines = 0;
  
  for (let i = 0; i < recent.length - 1; i++) {
    const currentIndex = levels.indexOf(recent[i].currentLevel);
    const previousIndex = levels.indexOf(recent[i + 1].currentLevel);
    
    if (currentIndex > previousIndex) improvements++;
    else if (currentIndex < previousIndex) declines++;
  }
  
  if (improvements > declines) return 'improving';
  if (declines > improvements) return 'declining';
  return 'stable';
};

const calculateCompetencyScore = (assessments: SkillAssessment[], userXP: number): number => {
  if (assessments.length === 0) return 0;
  
  const latestAssessment = assessments[0];
  const baseScore = latestAssessment.confidence * 10; // Convert 1-10 to 0-100
  const xpBonus = Math.min(20, userXP / 100); // Up to 20 bonus points from XP
  
  return Math.min(100, Math.round(baseScore + xpBonus));
};

const generateRecentActivity = (assessments: SkillAssessment[]): SkillActivity[] => {
  return assessments.slice(0, 5).map(assessment => ({
    type: 'self_assessment' as const,
    title: `${assessment.skillName} assessment`,
    impact: 'positive' as const,
    xpGained: 25,
    date: assessment.createdAt
  }));
};

const extractStrengthAreas = (assessments: SkillAssessment[]): string[] => {
  // Extract from feedback and evidence
  const strengths = new Set<string>();
  assessments.forEach(assessment => {
    assessment.evidence.forEach(evidence => {
      if (evidence.score && evidence.score >= 80) {
        strengths.add(evidence.title);
      }
    });
  });
  return Array.from(strengths).slice(0, 3);
};

const extractImprovementAreas = (assessments: SkillAssessment[]): string[] => {
  // Extract from recommendations
  const improvements = new Set<string>();
  assessments.forEach(assessment => {
    assessment.recommendations.forEach(rec => improvements.add(rec));
  });
  return Array.from(improvements).slice(0, 3);
};

const estimateTimeToNextLevel = (progressPercentage: number, trend: string): string => {
  const baseWeeks = 4; // Base estimate of 4 weeks
  const remaining = (100 - progressPercentage) / 100;
  
  let multiplier = 1;
  if (trend === 'improving') multiplier = 0.8;
  else if (trend === 'declining') multiplier = 1.5;
  
  const weeks = Math.ceil(baseWeeks * remaining * multiplier);
  return weeks === 1 ? '1 week' : `${weeks} weeks`;
};

const calculateGapPriority = (current: SkillLevel, target: SkillLevel): 'high' | 'medium' | 'low' => {
  const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
  const gap = levels.indexOf(target) - levels.indexOf(current);
  
  if (gap >= 3) return 'high';
  if (gap >= 2) return 'medium';
  return 'low';
};

const generateSuggestedActions = (current: SkillLevel, target: SkillLevel, skillName: string): string[] => {
  const actions = [];
  
  if (current === SkillLevel.BEGINNER) {
    actions.push(`Complete beginner ${skillName} challenges`);
    actions.push(`Find a mentor in ${skillName}`);
    actions.push(`Practice daily fundamentals`);
  }
  
  if (target === SkillLevel.INTERMEDIATE || target === SkillLevel.ADVANCED) {
    actions.push(`Work on intermediate ${skillName} projects`);
    actions.push(`Join ${skillName} community discussions`);
  }
  
  if (target === SkillLevel.EXPERT) {
    actions.push(`Lead ${skillName} projects`);
    actions.push(`Mentor others in ${skillName}`);
    actions.push(`Contribute to ${skillName} open source`);
  }
  
  return actions;
};

const estimateTimeToCloseGap = (current: SkillLevel, target: SkillLevel): string => {
  const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
  const gap = levels.indexOf(target) - levels.indexOf(current);
  
  const monthsPerLevel = 3;
  const totalMonths = gap * monthsPerLevel;
  
  if (totalMonths < 3) return '1-2 months';
  if (totalMonths < 6) return '3-5 months';
  if (totalMonths < 12) return '6-11 months';
  return '1+ years';
};
