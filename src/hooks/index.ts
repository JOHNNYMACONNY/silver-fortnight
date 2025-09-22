// src/hooks/index.ts

// Enhanced data fetching hooks
export { useEnhancedDataFetching, useEnhancedParallelDataFetching } from './useEnhancedDataFetching';
export { useEnhancedUserProfileData } from './useEnhancedUserProfileData';
export { useEnhancedSocialStats } from './useEnhancedSocialStats';
export { useEnhancedGamificationData } from './useEnhancedGamificationData';
export { useEnhancedPortfolioItems } from './useEnhancedPortfolioItems';

// Real-time hooks
export { 
  useRealtimeSocialStats, 
  useRealtimeLeaderboard, 
  useRealtimeXP, 
  useRealtimeFollow, 
  useRealtimeManager 
} from './useRealtimeUpdates';

// System and community hooks
export { useSystemStats } from './useSystemStats';
export { useRecentActivityFeed } from './useRecentActivityFeed';

// Original data fetching hooks (for backward compatibility)
export { useDataFetching, useParallelDataFetching } from './useDataFetching';
export { useUserProfileData } from './useUserProfileData';
export { useSocialStats } from './useSocialStats';
export { useGamificationData } from './useGamificationData';
export { usePortfolioItems } from './usePortfolioItems';

// Portfolio data hook
export { usePortfolioData } from './usePortfolioData';

// Performance optimization hooks
export { useInfiniteScroll } from './useInfiniteScroll';
export { useIntersectionObserver } from './useIntersectionObserver';
