/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { getSyncFirebaseDb } from '../firebase-config';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { ServiceResponse } from '../types/services';
import { UserStreak } from '../types/gamification';

export interface PracticeSession {
  id: string;
  userId: string;
  skillName: string;
  duration: number; // in minutes
  xpEarned: number;
  timestamp: Timestamp;
  notes?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
}

export interface PracticeAnalytics {
  totalSessions: number;
  totalDuration: number; // in minutes
  totalXPEarned: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionDuration: number;
  mostPracticedSkill: string;
  weeklyGoal: number;
  weeklyProgress: number;
  lastPracticeDate: Date | null;
  practiceFrequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
  skillBreakdown: SkillPracticeStats[];
  recentSessions: PracticeSession[];
  achievements: PracticeAchievement[];
}

export interface SkillPracticeStats {
  skillName: string;
  sessionsCount: number;
  totalDuration: number;
  totalXPEarned: number;
  lastPracticed: Date | null;
  averageSessionDuration: number;
  improvementRate: number; // percentage improvement over time
}

export interface PracticeAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface WeeklyGoal {
  userId: string;
  targetSessions: number;
  targetDuration: number; // in minutes
  currentWeek: string; // YYYY-WW format
  progress: {
    sessionsCompleted: number;
    durationCompleted: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Get comprehensive practice analytics for a user
 */
export const getPracticeAnalytics = async (
  userId: string,
  timeRange: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<ServiceResponse<PracticeAnalytics>> => {
  try {
    const db = getSyncFirebaseDb();
    
    // Calculate date range
    const now = new Date();
    const startDate = getStartDateForRange(timeRange, now);
    
    // Get practice sessions
    const sessionsQuery = query(
      collection(db, 'practiceSessions'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PracticeSession[];
    
    // Get user streak data
    const streakResponse = await getUserStreak(userId, 'skill_practice');
    const streak = streakResponse.success ? streakResponse.data : null;
    
    // Get weekly goal
    const weeklyGoalResponse = await getWeeklyGoal(userId);
    const weeklyGoal = weeklyGoalResponse.success ? weeklyGoalResponse.data : null;
    
    // Calculate analytics
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalXPEarned = sessions.reduce((sum, session) => sum + session.xpEarned, 0);
    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
    
    // Find most practiced skill
    const skillStats = calculateSkillBreakdown(sessions);
    const mostPracticedSkill = skillStats.length > 0 
      ? skillStats.reduce((max, skill) => 
          skill.sessionsCount > max.sessionsCount ? skill : max
        ).skillName
      : 'None';
    
    // Calculate practice frequency
    const practiceFrequency = calculatePracticeFrequency(sessions, timeRange);
    
    // Get recent sessions (last 10)
    const recentSessions = sessions.slice(0, 10);
    
    // Get achievements
    const achievements = await getPracticeAchievements(userId);
    
    const analytics: PracticeAnalytics = {
      totalSessions,
      totalDuration,
      totalXPEarned,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      averageSessionDuration,
      mostPracticedSkill,
      weeklyGoal: weeklyGoal?.targetSessions || 5,
      weeklyProgress: weeklyGoal ? 
        Math.min(100, (weeklyGoal.progress.sessionsCompleted / weeklyGoal.targetSessions) * 100) : 0,
      lastPracticeDate: sessions.length > 0 ? sessions[0].timestamp.toDate() : null,
      practiceFrequency,
      skillBreakdown: skillStats,
      recentSessions,
      achievements: achievements.success ? achievements.data || [] : []
    };
    
    return { success: true, data: analytics };
  } catch (error: any) {
    console.error('Error getting practice analytics:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to get practice analytics' 
    };
  }
};

/**
 * Log a practice session
 */
export const logPracticeSession = async (
  userId: string,
  skillName: string,
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  notes?: string
): Promise<ServiceResponse<PracticeSession>> => {
  try {
    const db = getSyncFirebaseDb();
    const sessionRef = collection(db, 'practiceSessions');
    
    // Calculate XP earned based on duration and difficulty
    const xpEarned = calculateXPEarned(duration, difficulty);
    
    const session: Omit<PracticeSession, 'id'> = {
      userId,
      skillName,
      duration,
      xpEarned,
      timestamp: Timestamp.now(),
      notes,
      difficulty,
      completed: true
    };
    
    const docRef = await addDoc(sessionRef, session);
    
    // Update weekly goal progress
    await updateWeeklyGoalProgress(userId, duration);
    
    return { 
      success: true, 
      data: { id: docRef.id, ...session } as PracticeSession 
    };
  } catch (error: any) {
    console.error('Error logging practice session:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to log practice session' 
    };
  }
};

/**
 * Get weekly goal for a user
 */
export const getWeeklyGoal = async (userId: string): Promise<ServiceResponse<WeeklyGoal | null>> => {
  try {
    const db = getSyncFirebaseDb();
    const currentWeek = getCurrentWeek();
    
    const goalQuery = query(
      collection(db, 'weeklyGoals'),
      where('userId', '==', userId),
      where('currentWeek', '==', currentWeek),
      limit(1)
    );
    
    const snapshot = await getDocs(goalQuery);
    
    if (snapshot.empty) {
      // Create default weekly goal
      const defaultGoal = await createDefaultWeeklyGoal(userId, currentWeek);
      return { success: true, data: defaultGoal };
    }
    
    const goal = snapshot.docs[0].data() as WeeklyGoal;
    return { success: true, data: goal };
  } catch (error: any) {
    console.error('Error getting weekly goal:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to get weekly goal' 
    };
  }
};

/**
 * Update weekly goal progress
 */
export const updateWeeklyGoalProgress = async (
  userId: string, 
  sessionDuration: number
): Promise<ServiceResponse<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const currentWeek = getCurrentWeek();
    
    const goalQuery = query(
      collection(db, 'weeklyGoals'),
      where('userId', '==', userId),
      where('currentWeek', '==', currentWeek),
      limit(1)
    );
    
    const snapshot = await getDocs(goalQuery);
    
    if (!snapshot.empty) {
      const goalRef = snapshot.docs[0].ref;
      const goal = snapshot.docs[0].data() as WeeklyGoal;
      
      await updateDoc(goalRef, {
        'progress.sessionsCompleted': increment(1),
        'progress.durationCompleted': increment(sessionDuration),
        updatedAt: Timestamp.now()
      });
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating weekly goal progress:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to update weekly goal progress' 
    };
  }
};

// Helper functions

function getStartDateForRange(timeRange: string, now: Date): Date {
  const start = new Date(now);
  
  switch (timeRange) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2020); // Arbitrary old date
      break;
  }
  
  return start;
}

function calculateSkillBreakdown(sessions: PracticeSession[]): SkillPracticeStats[] {
  const skillMap = new Map<string, {
    sessions: PracticeSession[];
    totalDuration: number;
    totalXP: number;
  }>();
  
  sessions.forEach(session => {
    if (!skillMap.has(session.skillName)) {
      skillMap.set(session.skillName, {
        sessions: [],
        totalDuration: 0,
        totalXP: 0
      });
    }
    
    const skill = skillMap.get(session.skillName)!;
    skill.sessions.push(session);
    skill.totalDuration += session.duration;
    skill.totalXP += session.xpEarned;
  });
  
  return Array.from(skillMap.entries()).map(([skillName, data]) => {
    const sortedSessions = data.sessions.sort((a, b) => 
      b.timestamp.toMillis() - a.timestamp.toMillis()
    );
    
    const lastPracticed = sortedSessions.length > 0 
      ? sortedSessions[0].timestamp.toDate() 
      : null;
    
    const averageSessionDuration = data.sessions.length > 0 
      ? data.totalDuration / data.sessions.length 
      : 0;
    
    // Calculate improvement rate (simplified)
    const improvementRate = calculateImprovementRate(sortedSessions);
    
    return {
      skillName,
      sessionsCount: data.sessions.length,
      totalDuration: data.totalDuration,
      totalXPEarned: data.totalXP,
      lastPracticed,
      averageSessionDuration,
      improvementRate
    };
  });
}

function calculateImprovementRate(sessions: PracticeSession[]): number {
  if (sessions.length < 2) return 0;
  
  const recent = sessions.slice(0, Math.min(5, sessions.length));
  const older = sessions.slice(-Math.min(5, sessions.length));
  
  const recentAvg = recent.reduce((sum, s) => sum + s.duration, 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + s.duration, 0) / older.length;
  
  if (olderAvg === 0) return 0;
  
  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

function calculatePracticeFrequency(sessions: PracticeSession[], timeRange: string): 'daily' | 'weekly' | 'monthly' | 'irregular' {
  if (sessions.length === 0) return 'irregular';
  
  const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'year' ? 365 : 30;
  const sessionsPerDay = sessions.length / days;
  
  if (sessionsPerDay >= 0.8) return 'daily';
  if (sessionsPerDay >= 0.2) return 'weekly';
  if (sessionsPerDay >= 0.05) return 'monthly';
  return 'irregular';
}

function calculateXPEarned(duration: number, difficulty: string): number {
  const baseXP = Math.floor(duration / 5); // 1 XP per 5 minutes
  const difficultyMultiplier = {
    'beginner': 1,
    'intermediate': 1.5,
    'advanced': 2
  }[difficulty] || 1;
  
  return Math.floor(baseXP * difficultyMultiplier);
}

function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function createDefaultWeeklyGoal(userId: string, currentWeek: string): Promise<WeeklyGoal> {
  const db = getSyncFirebaseDb();
  const goalRef = collection(db, 'weeklyGoals');
  
  const goal: WeeklyGoal = {
    userId,
    targetSessions: 5,
    targetDuration: 120, // 2 hours
    currentWeek,
    progress: {
      sessionsCompleted: 0,
      durationCompleted: 0
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  await addDoc(goalRef, goal);
  return goal;
}

async function getPracticeAchievements(userId: string): Promise<ServiceResponse<PracticeAchievement[]>> {
  try {
    const db = getSyncFirebaseDb();
    const achievementsQuery = query(
      collection(db, 'practiceAchievements'),
      where('userId', '==', userId),
      orderBy('unlockedAt', 'desc')
    );
    
    const snapshot = await getDocs(achievementsQuery);
    const achievements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PracticeAchievement[];
    
    return { success: true, data: achievements };
  } catch (error: any) {
    console.error('Error getting practice achievements:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to get practice achievements' 
    };
  }
}

// Import required functions
import { addDoc, updateDoc, increment } from 'firebase/firestore';
import { getUserStreak } from './streaks';
