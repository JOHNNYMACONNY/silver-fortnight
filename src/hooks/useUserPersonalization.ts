import { useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { User } from '../services/firestore-exports';

export type UserType = 'new' | 'regular' | 'power';

export interface UserPersonalizationData {
  userType: UserType;
  userProfile: User | null;
  tradeCount: number;
  profileCompleteness: number;
  activityLevel: 'low' | 'medium' | 'high';
}

/**
 * Hook for determining user personalization based on behavior and profile
 * Uses existing auth context and profile data
 */
export function useUserPersonalization(): UserPersonalizationData {
  const { currentUser, userProfile } = useAuth();

  const personalizationData = useMemo(() => {
    if (!currentUser || !userProfile) {
      return {
        userType: 'new' as UserType,
        userProfile: null,
        tradeCount: 0,
        profileCompleteness: 0,
        activityLevel: 'low' as const,
      };
    }

    // Calculate trade count (from profile or estimate)
    // Note: This is a simplified calculation. In production, you might want to
    // query actual trade counts from Firestore
    const tradeCount = (userProfile as any).tradesCreated?.length || 
                      (userProfile as any).completedTrades || 
                      0;

    // Calculate profile completeness
    const profileFields = [
      userProfile.displayName,
      userProfile.bio,
      userProfile.profilePicture || userProfile.photoURL,
      (userProfile as any).skills,
      userProfile.location,
    ];
    const completedFields = profileFields.filter(field => {
      if (Array.isArray(field)) return field.length > 0;
      return !!field;
    }).length;
    const profileCompleteness = Math.round((completedFields / profileFields.length) * 100);

    // Determine user type based on behavior
    let userType: UserType = 'new';
    if (tradeCount > 10 || profileCompleteness > 80) {
      userType = 'power';
    } else if (tradeCount > 3 || profileCompleteness > 50) {
      userType = 'regular';
    }

    // Determine activity level
    let activityLevel: 'low' | 'medium' | 'high' = 'low';
    if (tradeCount > 5) {
      activityLevel = 'high';
    } else if (tradeCount > 1) {
      activityLevel = 'medium';
    }

    return {
      userType,
      userProfile,
      tradeCount,
      profileCompleteness,
      activityLevel,
    };
  }, [currentUser, userProfile]);

  return personalizationData;
}

