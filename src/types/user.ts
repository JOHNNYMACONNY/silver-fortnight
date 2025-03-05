import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName: string;
  displayNameLower: string;  // Lowercase version for searching
  username: string;  // @username format
  email: string;
  createdAt: Timestamp;
  lastSeen?: Timestamp;
  isOnline?: boolean;
  bio?: string;
  photoURL?: string;
  portfolio?: string;
  skills?: string[];
  endorsements?: {
    [skill: string]: string[]; // Array of user IDs who endorsed
  };
  skillLevels?: {
    [skill: string]: {
      level: number;
      endorsements: number;
    };
  };
  selectedBanner?: string;
  level: number;  // User's overall level
}

export type UserSearchResult = Pick<UserProfile, 'id' | 'displayName' | 'username' | 'email' | 'bio' | 'photoURL'>;
