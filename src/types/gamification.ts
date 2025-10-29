import { Timestamp } from 'firebase/firestore';

/**
 * User XP and Level System Types
 */
export interface UserXP {
  id?: string;
  userId: string;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  lastUpdated: Timestamp;
  createdAt: Timestamp;
}

export interface XPTransaction {
  id?: string;
  userId: string;
  amount: number;
  source: XPSource;
  sourceId?: string; // ID of the trade, role, etc. that triggered the XP
  description: string;
  multiplier?: number; // For bonus XP events
  createdAt: Timestamp;
}

export enum XPSource {
  TRADE_COMPLETION = 'trade_completion',
  ROLE_COMPLETION = 'role_completion',
  COLLABORATION_COMPLETION = 'collaboration_completion',
  PROFILE_COMPLETION = 'profile_completion',
  EVIDENCE_SUBMISSION = 'evidence_submission',
  QUICK_RESPONSE = 'quick_response',
  FIRST_TIME_BONUS = 'first_time_bonus',
  STREAK_BONUS = 'streak_bonus',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  CHALLENGE_JOIN = 'challenge_join',
  CHALLENGE_PROGRESS = 'challenge_progress',
  CHALLENGE_COMPLETION = 'challenge_completion',
  CHALLENGE_EARLY_COMPLETION = 'challenge_early_completion',
  CHALLENGE_QUALITY_BONUS = 'challenge_quality_bonus',
  CHALLENGE_FEEDBACK = 'challenge_feedback',
  CHALLENGE_STREAK = 'challenge_streak'
}

/**
 * Level System Configuration
 */
export interface LevelTier {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
  icon: string;
  benefits: string[];
}

export const LEVEL_TIERS: LevelTier[] = [
  {
    level: 1,
    title: 'Newcomer',
    minXP: 0,
    maxXP: 100,
    color: '#94a3b8',
    icon: '🌱',
    benefits: ['Basic platform access', 'Profile creation']
  },
  {
    level: 2,
    title: 'Explorer',
    minXP: 101,
    maxXP: 250,
    color: '#60a5fa',
    icon: '🔍',
    benefits: ['Trade creation', 'Basic collaboration access']
  },
  {
    level: 3,
    title: 'Contributor',
    minXP: 251,
    maxXP: 500,
    color: '#34d399',
    icon: '🤝',
    benefits: ['Enhanced profile features', 'Priority support']
  },
  {
    level: 4,
    title: 'Specialist',
    minXP: 501,
    maxXP: 1000,
    color: '#fbbf24',
    icon: '⭐',
    benefits: ['Advanced collaboration tools', 'Featured listings']
  },
  {
    level: 5,
    title: 'Expert',
    minXP: 1001,
    maxXP: 2000,
    color: '#f97316',
    icon: '🏆',
    benefits: ['Premium features', 'Mentorship opportunities']
  },
  {
    level: 6,
    title: 'Master',
    minXP: 2001,
    maxXP: 5000,
    color: '#8b5cf6',
    icon: '👑',
    benefits: ['Elite status', 'Custom features', 'Beta access']
  },
  {
    level: 7,
    title: 'Legend',
    minXP: 5001,
    maxXP: 10000,
    color: '#ef4444',
    icon: '🔥',
    benefits: ['Legendary status', 'All features unlocked', 'Platform influence']
  },
  {
    level: 8,
    title: 'Champion',
    minXP: 10001,
    maxXP: 20000,
    color: '#ec4899',
    icon: '💪',
    benefits: ['Champion status', 'Exclusive events', 'Priority matching']
  },
  {
    level: 9,
    title: 'Virtuoso',
    minXP: 20001,
    maxXP: 35000,
    color: '#06b6d4',
    icon: '🎯',
    benefits: ['Virtuoso recognition', 'Premium networking', 'Special badges']
  },
  {
    level: 10,
    title: 'Elite',
    minXP: 35001,
    maxXP: 50000,
    color: '#10b981',
    icon: '💎',
    benefits: ['Elite tier access', 'VIP support', 'Revenue share opportunities']
  },
  {
    level: 11,
    title: 'Mythic',
    minXP: 50001,
    maxXP: 75000,
    color: '#a855f7',
    icon: '🌟',
    benefits: ['Mythic status', 'Platform governance', 'Special projects access']
  },
  {
    level: 12,
    title: 'Immortal',
    minXP: 75001,
    maxXP: Infinity,
    color: '#f59e0b',
    icon: '👑',
    benefits: ['Immortal legacy', 'Hall of fame', 'Lifetime benefits', 'Platform partnership']
  }
];

/**
 * Achievement System Types
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  unlockConditions: AchievementCondition[];
  isHidden?: boolean; // Hidden until unlocked
  createdAt: Timestamp;
}

export interface UserAchievement {
  id?: string;
  userId: string;
  achievementId: string;
  unlockedAt: Timestamp;
  progress?: number; // For progressive achievements
  isNotified?: boolean; // Whether user has been notified
}

export enum AchievementCategory {
  TRADING = 'trading',
  COLLABORATION = 'collaboration',
  COMMUNITY = 'community',
  SKILL = 'skill',
  MILESTONE = 'milestone',
  SPECIAL = 'special'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface AchievementCondition {
  type: ConditionType;
  target: number;
  current?: number;
  metadata?: Record<string, any>;
}

export enum ConditionType {
  TRADE_COUNT = 'trade_count',
  ROLE_COUNT = 'role_count',
  XP_TOTAL = 'xp_total',
  STREAK_DAYS = 'streak_days',
  SKILL_LEVEL = 'skill_level',
  EVIDENCE_COUNT = 'evidence_count',
  QUICK_RESPONSES = 'quick_responses',
  COLLABORATION_RATING = 'collaboration_rating'
}

/**
 * Skill Development System Types
 */
export interface UserSkill {
  id?: string;
  userId: string;
  skillName: string;
  level: SkillLevel;
  xp: number;
  endorsements: number;
  lastUsed: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface SkillEndorsement {
  id?: string;
  skillId: string;
  endorserId: string;
  endorserName: string;
  endorseeId: string;
  skillName: string;
  message?: string;
  createdAt: Timestamp;
}

/**
 * Phase 2B.2 - Skill-specific XP tracking
 */
export interface UserSkillXP {
  userId: string;
  skillName: string;
  totalXP: number;
  level: number; // Derived from totalXP thresholds
  masteryLevel: 'novice' | 'intermediate' | 'advanced' | 'expert' | 'master';
  lastUpdated: Timestamp;
  createdAt: Timestamp;
}

export interface SkillXPTransaction {
  id?: string;
  userId: string;
  skillName: string;
  amount: number;
  source: string; // e.g., 'challenge_completion', 'practice_session'
  sourceId?: string;
  description?: string;
  createdAt: Timestamp;
}

/**
 * Gamification Service Response Types
 */
export interface XPAwardResult {
  success: boolean;
  xpAwarded: number;
  newLevel?: number;
  leveledUp: boolean;
  newAchievements?: Achievement[];
  error?: string;
}

export interface LevelCalculationResult {
  currentLevel: number;
  currentLevelTier: LevelTier;
  xpToNextLevel: number;
  progressPercentage: number;
}

/**
 * UI Component Props Types
 */
export interface XPDisplayProps {
  userId: string;
  showProgress?: boolean;
  showLevel?: boolean;
  compact?: boolean;
}

export interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export interface LevelBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
}

/**
 * Gamification Configuration
 */
export const XP_VALUES = {
  TRADE_COMPLETION: 100,
  ROLE_COMPLETION_BASE: 75,
  ROLE_COMPLETION_COMPLEX: 150,
  COLLABORATION_COMPLETION: 200,
  EVIDENCE_SUBMISSION: 25,
  QUICK_RESPONSE_BONUS: 50,
  FIRST_TRADE_BONUS: 100,
  FIRST_COLLABORATION_BONUS: 150,
  PROFILE_COMPLETION: 50,
  ACHIEVEMENT_UNLOCK: 25,
  // Challenge XP Values
  CHALLENGE_JOIN: 10,
  CHALLENGE_PROGRESS_25: 25,
  CHALLENGE_PROGRESS_50: 50,
  CHALLENGE_PROGRESS_75: 75,
  CHALLENGE_COMPLETION_BEGINNER: 100,
  CHALLENGE_COMPLETION_INTERMEDIATE: 200,
  CHALLENGE_COMPLETION_ADVANCED: 350,
  CHALLENGE_COMPLETION_EXPERT: 500,
  CHALLENGE_EARLY_COMPLETION_BONUS: 50,
  CHALLENGE_QUALITY_BONUS: 100,
  CHALLENGE_FEEDBACK_GIVEN: 15,
  CHALLENGE_STREAK_BONUS: 25
} as const;

export const QUICK_RESPONSE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Phase 2B - Leaderboard System Types
 */
export interface LeaderboardEntry {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rank: number;
  value: number; // XP, trade count, etc.
  rankChange: number; // Rank change from previous period
  isCurrentUser?: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
  totalParticipants: number;
  lastUpdated: Timestamp;
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
}

export enum LeaderboardCategory {
  TOTAL_XP = 'total_xp',
  WEEKLY_XP = 'weekly_xp',
  MONTHLY_XP = 'monthly_xp',
  TRADE_COUNT = 'trade_count',
  COLLABORATION_RATING = 'collaboration_rating',
  SKILL_ENDORSEMENTS = 'skill_endorsements',
  QUICK_RESPONSES = 'quick_responses',
  ACHIEVEMENT_COUNT = 'achievement_count'
}

export enum LeaderboardPeriod {
  ALL_TIME = 'all_time',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily'
}

export interface LeaderboardConfig {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  title: string;
  description: string;
  icon: string;
  color: string;
  refreshInterval: number; // minutes
  minParticipants: number;
}

export const LEADERBOARD_CONFIGS: LeaderboardConfig[] = [
  {
    category: LeaderboardCategory.TOTAL_XP,
    period: LeaderboardPeriod.ALL_TIME,
    title: 'XP Champions',
    description: 'Top earners of all time',
    icon: '🏆',
    color: '#fbbf24',
    refreshInterval: 60,
    minParticipants: 5
  },
  {
    category: LeaderboardCategory.WEEKLY_XP,
    period: LeaderboardPeriod.WEEKLY,
    title: 'Weekly Warriors',
    description: 'Top XP earners this week',
    icon: '⚡',
    color: '#8b5cf6',
    refreshInterval: 30,
    minParticipants: 3
  },
  {
    category: LeaderboardCategory.MONTHLY_XP,
    period: LeaderboardPeriod.MONTHLY,
    title: 'Monthly Masters',
    description: 'Top XP earners this month',
    icon: '🌟',
    color: '#34d399',
    refreshInterval: 120,
    minParticipants: 5
  },
  {
    category: LeaderboardCategory.TRADE_COUNT,
    period: LeaderboardPeriod.ALL_TIME,
    title: 'Trade Leaders',
    description: 'Most active traders',
    icon: '🤝',
    color: '#60a5fa',
    refreshInterval: 60,
    minParticipants: 3
  },
  {
    category: LeaderboardCategory.COLLABORATION_RATING,
    period: LeaderboardPeriod.ALL_TIME,
    title: 'Collaboration Experts',
    description: 'Highest rated collaborators',
    icon: '⭐',
    color: '#f97316',
    refreshInterval: 120,
    minParticipants: 5
  }
];

/**
 * Social Features Types
 */
export interface UserFollow {
  id?: string;
  followerId: string;
  followingId: string;
  followingUserName: string;
  followingUserAvatar?: string;
  createdAt: Timestamp;
}

export interface SocialStats {
  userId: string;
  followersCount: number;
  followingCount: number;
  leaderboardAppearances: number;
  topRanks: Record<LeaderboardCategory, number>; // Best rank achieved in each category
  lastUpdated: Timestamp;
  // Optional composite reputation for caching/analytics (0–100)
  reputationScore?: number;
  reputationLastComputedAt?: Timestamp;
}

export interface LeaderboardNotification {
  userId: string;
  type: 'rank_up' | 'rank_down' | 'new_leaderboard' | 'weekly_summary';
  category: LeaderboardCategory;
  newRank?: number;
  previousRank?: number;
  rankChange?: number;
  period: LeaderboardPeriod;
  createdAt: Timestamp;
}

/**
 * Streaks (Phase 2B.2)
 */
export type StreakType = 'login' | 'challenge' | 'skill_practice';

export interface UserStreak {
  userId: string;
  type: StreakType;
  currentStreak: number;
  longestStreak: number;
  lastActivity: Timestamp;
  freezesUsed: number;
  maxFreezes: number;
  lastFreezeAt?: Timestamp;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

export const STREAK_MILESTONE_THRESHOLDS: number[] = [3, 7, 14, 30];

/**
 * Phase 2B UI Component Props
 */
export interface LeaderboardProps {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  limit?: number;
  showCurrentUser?: boolean;
  compact?: boolean;
  refreshInterval?: number;
}

export interface SocialFeaturesProps {
  userId: string;
  showFollowButton?: boolean;
  showStats?: boolean;
  compact?: boolean;
}

/**
 * Phase 2B.2 - Challenge System Types
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward;
  startDate: Timestamp;
  endDate: Timestamp;
  status: ChallengeStatus;
  participantCount: number;
  completionCount: number;
  maxParticipants?: number;
  instructions: string[];
  objectives: string[];
  timeEstimate?: string;
  tags?: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserChallenge {
  id?: string;
  userId: string;
  challengeId: string;
  status: UserChallengeStatus;
  progress: number;
  maxProgress: number;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  lastActivityAt: Timestamp;
  submissions?: ChallengeSubmission[];
  notes?: string;
  abandonedAt?: Timestamp;
  completionTimeMinutes?: number;
}

export interface ChallengeSubmission {
  id?: string;
  userId: string;
  challengeId: string;
  title: string;
  description: string;
  // Legacy URL-based evidence (kept for backward compatibility)
  evidenceUrls: string[];
  evidenceTypes: EvidenceType[];
  // New embedded evidence objects (link-based embed previews)
  embeddedEvidence?: import('../types/evidence').EmbeddedEvidence[];
  reflectionNotes?: string;
  submittedAt: Timestamp;
  isPublic: boolean;
  rating?: number;
  feedback?: ChallengeFeedback[];
}

export interface ChallengeRequirement {
  id: string;
  type: RequirementType;
  description: string;
  target?: number;
  metadata?: Record<string, any>;
}

export interface ChallengeReward {
  xp: number;
  badges?: string[];
  specialRecognition?: string;
  unlockableFeatures?: string[];
}

export interface ChallengeFeedback {
  id?: string;
  fromUserId: string;
  fromUserName: string;
  message: string;
  rating: number;
  isPublic: boolean;
  createdAt: Timestamp;
}

export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SKILL = 'skill',
  COMMUNITY = 'community',
  SPECIAL_EVENT = 'special_event',
  PERSONAL = 'personal',
  // Three-tier progression system
  SOLO = 'solo',
  TRADE = 'trade',
  COLLABORATION = 'collaboration'
}

export enum ChallengeCategory {
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  AUDIO = 'audio',
  VIDEO = 'video',
  WRITING = 'writing',
  PHOTOGRAPHY = 'photography',
  THREE_D = '3d',
  MIXED_MEDIA = 'mixed_media',
  TRADING = 'trading',
  COLLABORATION = 'collaboration',
  COMMUNITY = 'community'
}

export enum ChallengeDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum ChallengeStatus {
  DRAFT = 'draft',
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled'
}

export enum UserChallengeStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  SUBMITTED = 'submitted'
}

export enum RequirementType {
  SUBMISSION_COUNT = 'submission_count',
  TIME_LIMIT = 'time_limit',
  SKILL_LEVEL = 'skill_level',
  COLLABORATION = 'collaboration',
  EVIDENCE_TYPE = 'evidence_type',
  CUSTOM = 'custom'
}

export enum EvidenceType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  URL = 'url',
  TEXT = 'text'
}

/**
 * Challenge Service Response Types
 */
export interface ChallengeResponse {
  success: boolean;
  data?: any;
  error?: string;
  challengeId?: string;
}

export interface ChallengeListResponse {
  success: boolean;
  challenges: Challenge[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export interface ChallengeProgressResponse {
  success: boolean;
  userChallenge?: UserChallenge;
  progressPercentage: number;
  nextMilestone?: string;
  error?: string;
}

/**
 * Challenge Filters and Sorting
 */
export interface ChallengeFilters {
  type?: ChallengeType[];
  category?: ChallengeCategory[];
  difficulty?: ChallengeDifficulty[];
  status?: ChallengeStatus[];
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: ChallengeSortBy;
  sortOrder?: 'asc' | 'desc';
}

export enum ChallengeSortBy {
  CREATED_AT = 'createdAt',
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  DIFFICULTY = 'difficulty',
  PARTICIPANT_COUNT = 'participantCount',
  XP_REWARD = 'rewards.xp',
  TITLE = 'title'
}

/**
 * Challenge Notification Types
 */
export interface ChallengeNotification {
  userId: string;
  type: ChallengeNotificationType;
  challengeId: string;
  challengeTitle: string;
  progress?: number;
  maxProgress?: number;
  rewards?: ChallengeReward;
  timeRemaining?: string;
  createdAt: Timestamp;
}

export enum ChallengeNotificationType {
  CHALLENGE_STARTED = 'challenge_started',
  CHALLENGE_PROGRESS = 'challenge_progress',
  CHALLENGE_COMPLETED = 'challenge_completed',
  CHALLENGE_ENDING_SOON = 'challenge_ending_soon',
  NEW_CHALLENGE_AVAILABLE = 'new_challenge_available',
  CHALLENGE_REMINDER = 'challenge_reminder'
}

/**
 * Challenge UI Component Props
 */
export interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  showProgress?: boolean;
  compact?: boolean;
  onClick?: (challenge: Challenge) => void;
}

export interface ChallengeListProps {
  filters?: ChallengeFilters;
  showFilters?: boolean;
  showSearch?: boolean;
  itemsPerPage?: number;
  onChallengeClick?: (challenge: Challenge) => void;
}

export interface ChallengeProgressProps {
  userChallenge: UserChallenge;
  challenge: Challenge;
  showDetails?: boolean;
  allowActions?: boolean;
}

export interface ChallengeDashboardProps {
  userId: string;
  showStats?: boolean;
  showRecentActivity?: boolean;
  maxItems?: number;
}

/**
 * Challenge XP Values
 */
export const CHALLENGE_XP_VALUES = {
  CHALLENGE_JOIN: 10,
  CHALLENGE_PROGRESS_25: 25,
  CHALLENGE_PROGRESS_50: 50,
  CHALLENGE_PROGRESS_75: 75,
  CHALLENGE_COMPLETION_BEGINNER: 100,
  CHALLENGE_COMPLETION_INTERMEDIATE: 200,
  CHALLENGE_COMPLETION_ADVANCED: 350,
  CHALLENGE_COMPLETION_EXPERT: 500,
  CHALLENGE_EARLY_COMPLETION_BONUS: 50,
  CHALLENGE_QUALITY_BONUS: 100,
  // Three-tier progression XP values
  SOLO_CHALLENGE_COMPLETION: 150,
  TRADE_CHALLENGE_COMPLETION: 300,
  COLLABORATION_CHALLENGE_COMPLETION: 500,
  TIER_UNLOCK_BONUS: 200,
  CHALLENGE_FEEDBACK_GIVEN: 15,
  CHALLENGE_STREAK_BONUS: 25
} as const;

/**
 * Three-Tier Challenge Progression System
 */
export interface ThreeTierProgress {
  userId: string;
  soloCompletions: number;
  tradeCompletions: number;
  collaborationCompletions: number;
  unlockedTiers: ('SOLO' | 'TRADE' | 'COLLABORATION')[];
  currentTier: 'SOLO' | 'TRADE' | 'COLLABORATION';
  nextTierRequirements?: TierRequirement;
  totalChallengesCompleted: number;
  skillProgression: SkillProgressionData[];
  lastUpdated: Timestamp;
}

export interface TierRequirement {
  tier: 'TRADE' | 'COLLABORATION';
  requiredCompletions: number;
  requiredSkillLevel?: number;
  description: string;
}

export interface SkillProgressionData {
  skillName: string;
  beforeLevel: number;
  currentLevel: number;
  targetLevel: number;
  progressPercentage: number;
}

export interface SoloChallengeConfig {
  deliverables: string[];
  timeEstimate: string;
  skillsToImprove: string[];
  aiMentor: {
    enabled: boolean;
    personalityType: 'encouraging' | 'challenging' | 'analytical';
    checkInFrequency: 'daily' | 'weekly' | 'milestone';
  };
  autoValidation: boolean;
  portfolioIntegration: boolean;
}

export interface TradeChallengeConfig {
  maxParticipants: 2;
  tradeStructure: {
    participant1: {
      teaches: string;
      learns: string;
      timeCommitment: string;
    };
    participant2: {
      teaches: string;
      learns: string;
      timeCommitment: string;
    };
  };
  exchangeFormat: 'mentor-sessions' | 'project-swap' | 'skill-pairing';
  mutualValidation: boolean;
}

export interface CollaborationChallengeConfig {
  maxParticipants: number;
  teamRoles: SimpleTeamRole[];
  projectPhases: ProjectPhase[];
  collaborationTools: string[];
  leadershipRotation: boolean;
}

export interface SimpleTeamRole {
  name: string;
  description: string;
  skillsRequired: string[];
  responsibilities: string[];
  maxAssignees: number;
}

export interface ProjectPhase {
  name: string;
  description: string;
  deliverables: string[];
  estimatedDuration: string;
  dependencies: string[];
}
