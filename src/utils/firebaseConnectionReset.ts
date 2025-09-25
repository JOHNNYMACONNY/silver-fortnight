/**
 * Firebase Connection Reset Utility
 * 
 * Handles Firebase SDK internal assertion failures by:
 * 1. Resetting all connections
 * 2. Clearing internal state
 * 3. Reinitializing with safe settings
 */

import { getSyncFirebaseDb } from '../firebase-config';
import { connectFirestoreEmulator, terminate } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';

export interface ConnectionResetResult {
  success: boolean;
  error?: string;
  timestamp: Date;
  actions: string[];
}

/**
 * Complete Firebase connection reset
 */
export const resetFirebaseConnections = async (): Promise<ConnectionResetResult> => {
  const result: ConnectionResetResult = {
    success: false,
    timestamp: new Date(),
    actions: []
  };

  try {
    console.log('🔄 Starting Firebase connection reset...');
    result.actions.push('Starting reset process');

    // Step 1: Terminate all existing connections
    try {
      const db = getSyncFirebaseDb();
      if (db) {
        await terminate(db);
        console.log('✅ Terminated Firestore connections');
        result.actions.push('Terminated Firestore connections');
      }
    } catch (terminateError) {
      console.warn('⚠️ Could not terminate Firestore:', terminateError);
      result.actions.push('Failed to terminate Firestore (non-critical)');
    }

    // Step 2: Clear any cached connections
    try {
      // Clear any global Firebase state
      if (typeof window !== 'undefined') {
        // Clear any cached Firebase instances
        (window as any).__firebase_instances__ = [];
        console.log('✅ Cleared cached Firebase instances');
        result.actions.push('Cleared cached instances');
      }
    } catch (clearError) {
      console.warn('⚠️ Could not clear cache:', clearError);
      result.actions.push('Failed to clear cache (non-critical)');
    }

    // Step 3: Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    result.actions.push('Waited for cleanup');

    // Step 4: Force page reload to completely reset
    console.log('🔄 Forcing page reload to reset Firebase state...');
    result.actions.push('Triggering page reload');
    
    // Store reset flag in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('firebase_reset_requested', 'true');
      sessionStorage.setItem('firebase_reset_timestamp', Date.now().toString());
    }

    result.success = true;
    result.actions.push('Reset process completed');
    
    // Reload the page after a short delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 500);

    return result;

  } catch (error: any) {
    console.error('❌ Firebase reset failed:', error);
    result.error = error.message;
    result.actions.push(`Reset failed: ${error.message}`);
    return result;
  }
};

/**
 * Check if a reset was recently requested
 */
export const wasResetRequested = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const resetRequested = sessionStorage.getItem('firebase_reset_requested');
  const resetTimestamp = sessionStorage.getItem('firebase_reset_timestamp');
  
  if (resetRequested && resetTimestamp) {
    const timeSinceReset = Date.now() - parseInt(resetTimestamp);
    // Consider reset valid for 30 seconds
    if (timeSinceReset < 30000) {
      return true;
    }
  }
  
  return false;
};

/**
 * Clear reset flags
 */
export const clearResetFlags = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('firebase_reset_requested');
    sessionStorage.removeItem('firebase_reset_timestamp');
  }
};

/**
 * Safe Firebase initialization with minimal settings
 */
export const initializeFirebaseSafely = async (): Promise<boolean> => {
  try {
    console.log('🔧 Initializing Firebase with safe settings...');
    
    // Clear any existing state
    clearResetFlags();
    
    // Get fresh Firebase instance
    const db = getSyncFirebaseDb();
    
    if (!db) {
      throw new Error('Firebase not properly initialized');
    }
    
    console.log('✅ Firebase initialized safely');
    return true;
    
  } catch (error: any) {
    console.error('❌ Safe Firebase initialization failed:', error);
    return false;
  }
};
