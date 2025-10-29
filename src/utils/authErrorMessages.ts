/**
 * Firebase Auth Error Message Mapper
 * 
 * Maps technical Firebase error codes to user-friendly messages
 * while preserving technical error logging in console for developers.
 */

export interface FriendlyAuthError {
  userMessage: string;
  technicalError: Error | string;
}

/**
 * Converts Firebase auth errors to user-friendly messages
 * @param error - The Firebase error object or error string
 * @returns Object containing both friendly message and technical error
 */
export const getFriendlyAuthError = (error: any): FriendlyAuthError => {
  // Extract error code from Firebase error
  const errorCode = error?.code || '';
  const errorMessage = error?.message || String(error);

  // Log technical error to console for developers
  console.error('🔐 Firebase Auth Error:', {
    code: errorCode,
    message: errorMessage,
    fullError: error
  });

  // Map Firebase error codes to user-friendly messages
  const friendlyMessages: Record<string, string> = {
    // Login errors
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    
    // Signup errors
    'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    
    // Rate limiting
    'auth/too-many-requests': 'Too many failed attempts. Please try again in a few minutes.',
    
    // Network errors
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    
    // Other common errors
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/requires-recent-login': 'Please log in again to complete this action.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups and try again.',
    'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
    'auth/cancelled-popup-request': 'Another sign-in is already in progress.',
  };

  // Get friendly message or use default
  const userMessage = friendlyMessages[errorCode] || 
    'An error occurred during authentication. Please try again.';

  return {
    userMessage,
    technicalError: error
  };
};

/**
 * Quick helper to get just the friendly message string
 * (Still logs to console internally)
 */
export const getFriendlyErrorMessage = (error: any): string => {
  return getFriendlyAuthError(error).userMessage;
};

