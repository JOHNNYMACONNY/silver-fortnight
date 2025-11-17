/**
 * FIREBASE GOOGLE AUTH - Uses Firebase's built-in OAuth with proper configuration
 * This is the most reliable approach that should work
 */

import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { logger } from '@utils/logging/logger';

/**
 * FIREBASE APPROACH: Use only Firebase's built-in Google OAuth
 * This approach uses Firebase's OAuth client ID automatically
 */
export const signInWithGoogleFirebase = async (): Promise<any> => {
  try {
    logger.debug('FirebaseGoogleAuth: Using Firebase built-in OAuth...', 'UTILITY');
    
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    // Set custom parameters for better UX
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Add required scopes
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      // Try popup first (most user-friendly)
      logger.debug('FirebaseGoogleAuth: Attempting popup sign-in...', 'UTILITY');
      const result = await signInWithPopup(auth, provider);
      logger.debug('FirebaseGoogleAuth: Popup sign-in successful!', 'UTILITY');
      return result;
    } catch (popupError: any) {
      logger.debug('FirebaseGoogleAuth: Popup failed, trying redirect...', 'UTILITY', popupError.message);
      
      // If popup fails, try redirect
      if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
        logger.debug('FirebaseGoogleAuth: Initiating redirect sign-in...', 'UTILITY');
        await signInWithRedirect(auth, provider);
        return {
          user: null,
          error: {
            code: 'auth/redirect-initiated',
            message: 'Redirect sign-in initiated'
          }
        };
      }
      
      throw popupError;
    }
  } catch (error: any) {
    logger.error('FirebaseGoogleAuth: All methods failed', 'UTILITY', {}, error as Error);
    throw error;
  }
};

/**
 * Handle redirect result after OAuth redirect
 */
export const handleGoogleRedirectResult = async (): Promise<any> => {
  try {
    logger.debug('FirebaseGoogleAuth: Checking for redirect result...', 'UTILITY');
    
    const auth = getAuth();
    const result = await getRedirectResult(auth);
    
    if (result) {
      logger.debug('FirebaseGoogleAuth: Redirect result found!', 'UTILITY');
      return result;
    }
    
    logger.debug('FirebaseGoogleAuth: No redirect result found', 'UTILITY');
    return null;
  } catch (error: any) {
    logger.error('FirebaseGoogleAuth: Error handling redirect result:', 'UTILITY', {}, error as Error);
    throw error;
  }
};

/**
 * Check if we're returning from a redirect
 */
export const isReturningFromRedirect = (): boolean => {
  return window.location.pathname === '/auth/callback' || 
         window.location.search.includes('code=') ||
         window.location.search.includes('access_token=');
};
