/**
 * ProfilePage Type Definitions
 *
 * This file contains all type definitions specific to the ProfilePage
 * and its sub-components.
 */

import type { UserProfile as UserProfileType } from "../../../types/user";

// Re-export the consolidated UserProfile type from the global types
export type { UserProfile, UserRole, BannerFx } from "../../../types/user";
export {
  isUserProfile,
  getProfilePictureUrl,
  hasCustomBanner,
  isBannerFxEnabled,
} from "../../../types/user";

/**
 * Tab types for ProfilePage navigation
 */
export type TabType =
  | "about"
  | "portfolio"
  | "gamification"
  | "collaborations"
  | "trades";

/**
 * Props for the ProfilePage component
 */
export interface ProfilePageProps {
  /**
   * Optional user ID for viewing another user's profile
   * If not provided, shows the current user's profile
   */
  userId?: string;
}

/**
 * Props for ProfileHeader component
 */
export interface ProfileHeaderProps {
  profile: UserProfileType;
  isOwnProfile: boolean;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  onFollow: () => void;
  onUnfollow: () => void;
  onEditClick: () => void;
  onShareClick: () => void;
}

/**
 * Props for ProfileEditModal component
 */
export interface ProfileEditModalProps {
  isOpen: boolean;
  profile: UserProfileType;
  onClose: () => void;
  onSave: (updates: Partial<UserProfileType>) => Promise<void>;
}

/**
 * Props for ProfileShareMenu component
 */
export interface ProfileShareMenuProps {
  isOpen: boolean;
  profileUrl: string;
  onClose: () => void;
}

/**
 * Props for ProfileTabs component
 */
export interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

/**
 * Props for ProfileAboutTab component
 */
export interface ProfileAboutTabProps {
  profile: UserProfileType;
  isOwnProfile: boolean;
}

/**
 * Props for ProfileCollaborationsTab component
 */
export interface ProfileCollaborationsTabProps {
  userId: string;
  isOwnProfile: boolean;
}

/**
 * Props for ProfileTradesTab component
 */
export interface ProfileTradesTabProps {
  userId: string;
  isOwnProfile: boolean;
}

/**
 * Profile statistics data
 */
export interface ProfileStats {
  totalTrades: number;
  tradesThisWeek: number;
  currentXP: number;
  completedCollaborations: number;
  activeCollaborations: number;
  reputationScore: number;
}

/**
 * Profile review data
 */
export interface ProfileReview {
  id: string;
  rating: number;
  comment: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoURL?: string;
  createdAt: Date | string;
}
