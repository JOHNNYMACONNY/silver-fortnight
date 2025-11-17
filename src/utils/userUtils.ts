import { getSyncFirebaseDb } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

// Cache for user data with timestamps to enable expiration
interface CachedUser {
  data: any;
  timestamp: number;
}

const userCache: Record<string, CachedUser> = {};
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

/**
 * Fetch user data by user ID with improved caching and reduced logging
 * @param userId The user ID to fetch data for
 * @returns User data including displayName, photoURL, etc.
 */
function isDevEnv() {
  return process.env.NODE_ENV === 'development';
}

export const fetchUserData = async (userId: string) => {
  const isDev = isDevEnv();
  const now = Date.now();

  // Return from cache if available and not expired
  if (userCache[userId] && (now - userCache[userId].timestamp) < CACHE_EXPIRY_MS) {
    // Only log in development and only once per session per user
    if (isDev && !userCache[userId].data._loggedCacheHit) {
      logger.debug(`Using cached data for user: ${userId}`, 'UTILITY');
      // Mark that we've logged this cache hit
      userCache[userId].data._loggedCacheHit = true;
    }
    return userCache[userId].data;
  }

  try {
    const db = getSyncFirebaseDb();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as any; // <-- type assertion added

      // Only log in development
      if (isDev) {
        logger.debug(`User data found for ${userId}`, 'UTILITY');
      }

      // Process profile picture URL
      const profilePicture = userData.profilePicture || null;

      // Cache the result with timestamp
      const processedData = {
        id: userId,
        displayName: userData?.displayName || userData?.email || 'Unknown User',
        email: userData?.email || null,
        profilePicture,
        ...userData
      };

      userCache[userId] = {
        data: processedData,
        timestamp: now
      };

      return processedData;
    } else {
      // Only log in development
      if (isDev) {
        logger.debug(`No user found with ID: ${userId}`, 'UTILITY');
      }

      // Cache a default value to avoid repeated failed lookups
      const defaultData = {
        id: userId,
        displayName: `User ${userId.substring(0, 5)}`,
        profilePicture: null
      };

      userCache[userId] = {
        data: defaultData,
        timestamp: now
      };

      return defaultData;
    }
  } catch (error) {
    if (isDev) {
      logger.error('Error fetching user data:', 'UTILITY', {}, error as Error);
    }

    return {
      id: userId,
      displayName: `User ${userId.substring(0, 5)}`,
      profilePicture: null
    };
  }
};

/**
 * Fetch multiple users' data by their IDs
 * @param userIds Array of user IDs to fetch data for
 * @returns Object mapping user IDs to their data
 */
export const fetchMultipleUsers = async (userIds: string[]) => {
  const uniqueIds = [...new Set(userIds)]; // Remove duplicates
  const result: Record<string, any> = {};

  await Promise.all(
    uniqueIds.map(async (userId) => {
      result[userId] = await fetchUserData(userId);
    })
  );

  return result;
};
