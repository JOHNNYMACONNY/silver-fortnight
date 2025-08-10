import { XPSource } from './gamification';

/**
 * Gamification-specific notification types for real-time user feedback
 */

export interface XPGainNotification {
  type: 'xp_gain';
  amount: number;
  source: XPSource;
  sourceId?: string;
  description: string;
  timestamp: Date;
  userId: string;
}

export interface LevelUpNotification {
  type: 'level_up';
  newLevel: number;
  previousLevel: number;
  levelTitle: string;
  benefits?: string[];
  timestamp: Date;
  userId: string;
}

export interface AchievementUnlockNotification {
  type: 'achievement_unlock';
  achievementId: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementIcon: string;
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  timestamp: Date;
  userId: string;
}

export type GamificationNotification = 
  | XPGainNotification 
  | LevelUpNotification 
  | AchievementUnlockNotification;

/**
 * Notification display preferences for gamification events
 */
export interface GamificationNotificationPreferences {
  xpGainToasts: boolean;
  levelUpModals: boolean;
  achievementUnlockModals: boolean;
  soundEffects: boolean;
  reducedMotion: boolean;
  batchNotifications: boolean; // Group multiple XP gains together
  notificationDuration: number; // Duration in milliseconds
}

/**
 * Default notification preferences
 */
export const DEFAULT_GAMIFICATION_PREFERENCES: GamificationNotificationPreferences = {
  xpGainToasts: true,
  levelUpModals: true,
  achievementUnlockModals: true,
  soundEffects: false, // Default to off for better UX
  reducedMotion: false, // Will be detected from system preferences
  batchNotifications: true,
  notificationDuration: 3000 // 3 seconds
};

/**
 * Notification queue item for managing multiple notifications
 */
export interface NotificationQueueItem {
  id: string;
  notification: GamificationNotification;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

/**
 * XP source display configuration for notifications
 */
export const XP_SOURCE_DISPLAY_CONFIG: Record<XPSource, {
  icon: string;
  color: string;
  displayName: string;
}> = {
  [XPSource.TRADE_COMPLETION]: {
    icon: '🤝',
    color: 'text-green-500',
    displayName: 'Trade Completion'
  },
  [XPSource.ROLE_COMPLETION]: {
    icon: '👥',
    color: 'text-blue-500',
    displayName: 'Role Completion'
  },
  [XPSource.COLLABORATION_COMPLETION]: {
    icon: '🎯',
    color: 'text-purple-500',
    displayName: 'Collaboration'
  },
  [XPSource.EVIDENCE_SUBMISSION]: {
    icon: '📎',
    color: 'text-orange-500',
    displayName: 'Evidence Submission'
  },
  [XPSource.ACHIEVEMENT_UNLOCK]: {
    icon: '🏆',
    color: 'text-yellow-500',
    displayName: 'Achievement'
  },
  [XPSource.PROFILE_COMPLETION]: {
    icon: '👤',
    color: 'text-indigo-500',
    displayName: 'Profile Update'
  },
  [XPSource.QUICK_RESPONSE]: {
    icon: '⚡',
    color: 'text-yellow-500',
    displayName: 'Quick Response'
  },
  [XPSource.FIRST_TIME_BONUS]: {
    icon: '🎉',
    color: 'text-pink-500',
    displayName: 'First Time Bonus'
  },
  [XPSource.STREAK_BONUS]: {
    icon: '🔥',
    color: 'text-red-500',
    displayName: 'Streak Bonus'
  },
  [XPSource.CHALLENGE_JOIN]: {
    icon: '🚀',
    color: 'text-teal-500',
    displayName: 'Challenge Joined'
  },
  [XPSource.CHALLENGE_PROGRESS]: {
    icon: '📊',
    color: 'text-cyan-500',
    displayName: 'Challenge Progress'
  },
  [XPSource.CHALLENGE_COMPLETION]: {
    icon: '🏁',
    color: 'text-green-500',
    displayName: 'Challenge Complete'
  },
  [XPSource.CHALLENGE_EARLY_COMPLETION]: {
    icon: '⏳',
    color: 'text-lime-500',
    displayName: 'Early Completion'
  },
  [XPSource.CHALLENGE_QUALITY_BONUS]: {
    icon: '💎',
    color: 'text-emerald-500',
    displayName: 'Quality Bonus'
  },
  [XPSource.CHALLENGE_FEEDBACK]: {
    icon: '✍️',
    color: 'text-sky-500',
    displayName: 'Challenge Feedback'
  },
  [XPSource.CHALLENGE_STREAK]: {
    icon: '📈',
    color: 'text-amber-500',
    displayName: 'Challenge Streak'
  }
};

/**
 * Animation configuration for different notification types
 */
export const NOTIFICATION_ANIMATIONS = {
  xpGain: {
    initial: { opacity: 0, x: 300, scale: 0.8 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 300, scale: 0.8 },
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  levelUp: {
    initial: { opacity: 0, scale: 0.5, rotateY: -90 },
    animate: { opacity: 1, scale: 1, rotateY: 0 },
    exit: { opacity: 0, scale: 0.5, rotateY: 90 },
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  },
  achievement: {
    initial: { opacity: 0, scale: 0, rotate: -180 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0, rotate: 180 },
    transition: { type: 'spring', stiffness: 260, damping: 20 }
  }
} as const;

/**
 * Sound effect configuration (URLs to be defined based on available assets)
 */
export const NOTIFICATION_SOUNDS = {
  xpGain: '/sounds/xp-gain.mp3',
  levelUp: '/sounds/level-up.mp3',
  achievementUnlock: '/sounds/achievement-unlock.mp3'
};
