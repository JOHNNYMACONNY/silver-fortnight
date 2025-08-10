/**
 * Firebase Error Handler with Exponential Backoff
 *
 * Provides utilities for handling Firebase quota exhaustion and connection issues
 * with automatic retry logic and exponential backoff.
 */

import { logger } from './logging/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000,    // 30 seconds
  backoffMultiplier: 2
};

/**
 * Exponential backoff utility
 */
export const exponentialBackoff = async (attempt: number, options: RetryOptions = {}): Promise<void> => {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const delay = Math.min(opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt), opts.maxDelay);
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  const finalDelay = delay + jitter;
  
  console.warn(`🔄 Firebase operation failed, retrying in ${Math.round(finalDelay)}ms (attempt ${attempt + 1})`);
  
  return new Promise(resolve => setTimeout(resolve, finalDelay));
};

/**
 * Check if error is a quota or connection error
 */
export const isRetriableFirebaseError = (error: any): boolean => {
  if (!error) return false;
  
  const errorCode = error.code || '';
  const errorMessage = error.message || '';
  
  // Quota exhaustion errors
  if (errorCode.includes('quota-exceeded') || 
      errorCode.includes('resource-exhausted') ||
      errorMessage.includes('quota')) {
    return true;
  }
  
  // Connection errors
  if (errorCode.includes('unavailable') ||
      errorCode.includes('deadline-exceeded') ||
      errorCode.includes('network-request-failed') ||
      errorMessage.includes('Write stream exhausted') ||
      errorMessage.includes('400 Bad Request')) {
    return true;
  }
  
  return false;
};

/**
 * Retry wrapper for Firebase operations with exponential backoff
 */
export const withFirebaseRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // If this isn't a retriable error, throw immediately
      if (!isRetriableFirebaseError(error)) {
        console.error('🚨 Non-retriable Firebase error:', error);
        throw error;
      }
      
      // If we've exhausted retries, throw the last error
      if (attempt === opts.maxRetries) {
        console.error('🚨 Firebase operation failed after all retries:', error);
        throw error;
      }
      
      // Wait before retrying
      await exponentialBackoff(attempt, options);
    }
  }
  
  throw lastError;
};

/**
 * Firestore listener cleanup utility
 */
export const createFirestoreListenerManager = () => {
  const listeners = new Set<() => void>();
  
  return {
    addListener: (unsubscribe: () => void) => {
      listeners.add(unsubscribe);
      return unsubscribe;
    },
    
    cleanup: () => {
      logger.info(`Cleaning up ${listeners.size} Firestore listeners`, 'FIREBASE_CLEANUP');
      listeners.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          logger.warn('Failed to unsubscribe listener', 'FIREBASE_CLEANUP', { error });
        }
      });
      listeners.clear();
    },
    
    size: () => listeners.size
  };
};

/**
 * Firebase quota monitoring
 */
export const createQuotaMonitor = () => {
  let quotaExceededCount = 0;
  let lastQuotaError: Date | null = null;
  
  return {
    recordQuotaError: () => {
      quotaExceededCount++;
      lastQuotaError = new Date();
      
      if (quotaExceededCount > 5) {
        console.error('🚨 Multiple quota errors detected. Consider implementing rate limiting.');
      }
    },
    
    getQuotaStatus: () => ({
      quotaExceededCount,
      lastQuotaError,
      isInCooldown: lastQuotaError && (Date.now() - lastQuotaError.getTime()) < 60000 // 1 minute cooldown
    }),
    
    reset: () => {
      quotaExceededCount = 0;
      lastQuotaError = null;
    }
  };
};