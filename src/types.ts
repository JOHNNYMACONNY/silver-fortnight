import { BadgeType } from './components/ChallengeBadge';

// Common Types
export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  username: string;
  role: 'user' | 'admin';
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserProfile extends User {
  bio?: string;
  portfolio?: string;
  skills?: string[];
  skillLevels?: {
    [key: string]: {
      level: number;
      experience: number;
    };
  };
  endorsements?: {
    [skill: string]: string[]; // Array of user IDs who endorsed
  };
  badges?: Badge[];
  experience: number;
  level: number;
  selectedBanner?: string;
  bannerSettings?: BannerSettings;
}

export type Badge = {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  dateEarned: Date;
};

export type BannerSettings = {
  textColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  gradientColors?: string[];
  pattern?: string;
};

// Challenge Types
export type ChallengeType = 'weekly' | 'monthly';

export type ChallengeRequirement = {
  type: string;
  count: number;
  skillCategory?: string;
};

export type ChallengeRewards = {
  xp: number;
  badge?: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  requirements: ChallengeRequirement[];
  rewards: ChallengeRewards;
  startDate: Date;
  endDate: Date;
  participants: string[]; // User IDs
  completions: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
  source?: 'ai' | 'manual';
};
