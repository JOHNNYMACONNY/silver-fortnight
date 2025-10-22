// Enhanced Skeleton Components - Phase 2
// Centralized exports for all loading state components

// Base skeleton components
export { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton } from './Skeleton';

// Enhanced card-specific skeletons
export { CardSkeleton } from './CardSkeleton';
export { TradeCardSkeleton, TradeListSkeleton } from './TradeCardSkeleton';
export { default as UserCardSkeleton } from '../UserCardSkeleton';
export { CollaborationCardSkeleton } from './CollaborationCardSkeleton';
export { ConnectionCardSkeleton } from './ConnectionCardSkeleton';
export { SearchResultPreviewSkeleton } from './SearchResultPreviewSkeleton';

// Re-export for compatibility
export { default as TradeCardSkeletonDefault } from './TradeCardSkeleton';
export { default as CollaborationCardSkeletonDefault } from './CollaborationCardSkeleton';
export { default as ConnectionCardSkeletonDefault } from './ConnectionCardSkeleton';
export { default as SearchResultPreviewSkeletonDefault } from './SearchResultPreviewSkeleton'; 