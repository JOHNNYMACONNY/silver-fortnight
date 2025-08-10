// Gamification Components Export
export { default as XPDisplay } from './XPDisplay';
export { default as LevelBadge, CompactLevelBadge, DetailedLevelBadge } from './LevelBadge';
export { default as AchievementBadge, CompactAchievementBadge, DetailedAchievementBadge } from './AchievementBadge';
export { default as GamificationDashboard } from './GamificationDashboard';
export { default as GamificationIntegration } from './GamificationIntegration';

// Notification Components
export {
  XPGainToast,
  LevelUpModal,
  AchievementUnlockModal,
  NotificationContainer,
  AnimatedXPBar
} from './notifications';
export { default as NotificationPreferences } from './notifications/NotificationPreferences';

// Re-export types for convenience
export type {
  UserXP,
  XPTransaction,
  Achievement,
  UserAchievement,
  XPSource,
  LevelTier
} from '../../types/gamification';

export type {
  GamificationNotification,
  XPGainNotification,
  LevelUpNotification,
  AchievementUnlockNotification,
  GamificationNotificationPreferences
} from '../../types/gamificationNotifications';
