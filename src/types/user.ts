/**
 * Consolidated User Profile Type Definition
 *
 * This type consolidates the UserProfile interface from ProfilePage.tsx
 * and the User interface from UserService.ts into a single, comprehensive
 * type definition for use across the application.
 */

import type { BannerData } from "../utils/imageUtils";

/**
 * User role types
 */
export type UserRole = "user" | "admin" | "moderator";

/**
 * Banner FX overlay settings for 3D effects
 */
export interface BannerFx {
  enable: boolean;
  preset: "ribbons" | "aurora" | "metaballs" | "audio";
  opacity: number;
  blendMode: "screen" | "soft-light" | "overlay" | "plus-lighter";
}

/**
 * Comprehensive User Profile interface
 *
 * Combines all properties from:
 * - ProfilePage.tsx UserProfile interface (lines 93-112)
 * - UserService.ts User interface (lines 14-40)
 *
 * @property uid - Firebase Auth user ID (required)
 * @property id - Firestore document ID (required, typically same as uid)
 * @property email - User's email address
 * @property displayName - User's display name
 * @property handle - Unique username (3-20 chars, alphanumeric + underscore)
 * @property verified - Verified user badge status
 * @property handlePrivate - Hide handle from public view
 * @property tagline - One-sentence description (120 chars max)
 * @property photoURL - Firebase Auth photo URL (legacy)
 * @property profilePicture - Cloudinary publicId for profile picture
 * @property bio - User biography/about text
 * @property skills - Array of user skills
 * @property location - User's location
 * @property website - User's website URL
 * @property reputationScore - User reputation score (0-100+)
 * @property interests - User interests (comma-separated string)
 * @property role - User role (user, admin, moderator)
 * @property createdAt - Account creation timestamp
 * @property updatedAt - Last update timestamp
 * @property public - Whether profile is public
 * @property banner - Profile banner (Cloudinary data or legacy URL)
 * @property bannerFx - 3D overlay effects settings for banner
 * @property metadata - Firebase Auth metadata (creation time, last sign-in)
 */
export interface UserProfile {
  // Required fields
  uid: string;
  id: string;

  // Basic information
  email?: string;
  displayName?: string;
  handle?: string;
  verified?: boolean;
  handlePrivate?: boolean;
  tagline?: string;

  // Profile media
  photoURL?: string;
  profilePicture?: string;
  banner?: BannerData | string | null;
  bannerFx?: BannerFx;

  // Profile content
  bio?: string;
  skills?: string[];
  location?: string;
  website?: string;
  interests?: string;

  // System fields
  reputationScore?: number;
  role?: UserRole;
  createdAt?: any; // Firestore Timestamp or Date
  updatedAt?: any; // Firestore Timestamp or Date
  public?: boolean;

  // Firebase Auth metadata
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

/**
 * Type guard to check if a value is a valid UserProfile
 */
export function isUserProfile(value: any): value is UserProfile {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.uid === "string" &&
    (typeof value.id === "string" || value.id === undefined)
  );
}

/**
 * Helper to get the profile picture URL
 * Prioritizes profilePicture (Cloudinary) over photoURL (Firebase Auth)
 */
export function getProfilePictureUrl(profile: UserProfile): string | undefined {
  return profile.profilePicture || profile.photoURL;
}

/**
 * Helper to check if user has a custom banner
 */
export function hasCustomBanner(profile: UserProfile): boolean {
  return profile.banner !== null && profile.banner !== undefined;
}

/**
 * Helper to check if banner FX is enabled
 */
export function isBannerFxEnabled(profile: UserProfile): boolean {
  return profile.bannerFx?.enable === true;
}
