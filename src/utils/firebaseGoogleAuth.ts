/**
 * FIREBASE GOOGLE AUTH - Uses Firebase's built-in OAuth with proper configuration
 * This is the most reliable approach that should work
 */

import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

/**
 * FIREBASE APPROACH: Use only Firebase's built-in Google OAuth
 * This approach uses Firebase's OAuth client ID automatically
 */
export const signInWithGoogleFirebase = async (): Promise<any> => {
  try {
    console.log('FirebaseGoogleAuth: Using Firebase built-in OAuth...');
    
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
      console.log('FirebaseGoogleAuth: Attempting popup sign-in...');
      const result = await signInWithPopup(auth, provider);
      console.log('FirebaseGoogleAuth: Popup sign-in successful!');
      return result;
    } catch (popupError: any) {
      console.log('FirebaseGoogleAuth: Popup failed, trying redirect...', popupError.message);
      
      // If popup fails, try redirect
      if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
        console.log('FirebaseGoogleAuth: Initiating redirect sign-in...');
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
    console.error('FirebaseGoogleAuth: All methods failed', error);
    throw error;
  }
};

/**
 * Handle redirect result after OAuth redirect
 */
export const handleGoogleRedirectResult = async (): Promise<any> => {
  try {
    console.log('FirebaseGoogleAuth: Checking for redirect result...');
    
    const auth = getAuth();
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('FirebaseGoogleAuth: Redirect result found!');
      return result;
    }
    
    console.log('FirebaseGoogleAuth: No redirect result found');
    return null;
  } catch (error: any) {
    console.error('FirebaseGoogleAuth: Error handling redirect result:', error);
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
