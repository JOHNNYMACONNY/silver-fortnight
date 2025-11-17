/**
 * Firebase Connection Manager
 * 
 * Handles Firebase connection issues and provides fallback mechanisms
 * for the persistent Listen channel 400 error
 */

import { getSyncFirebaseDb } from '../firebase-config';
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

export interface ConnectionOptions {
  useLongPolling: boolean;
  retryAttempts: number;
  retryDelay: number;
  fallbackToOffline: boolean;
}

export class FirebaseConnectionManager {
  private static instance: FirebaseConnectionManager;
  private connectionAttempts: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;
  private isConnected: boolean = false;
  private lastError: string | null = null;

  static getInstance(): FirebaseConnectionManager {
    if (!FirebaseConnectionManager.instance) {
      FirebaseConnectionManager.instance = new FirebaseConnectionManager();
    }
    return FirebaseConnectionManager.instance;
  }

  /**
   * Test connection with multiple strategies
   */
  async testConnection(): Promise<boolean> {
    try {
      const db = getSyncFirebaseDb();
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // Test 1: Basic document read
      await this.testBasicRead(db);
      
      // Test 2: Collection query
      await this.testCollectionQuery(db);
      
      // Test 3: Real-time listener (with timeout)
      await this.testRealtimeListener(db);

      this.isConnected = true;
      this.lastError = null;
      this.connectionAttempts = 0;
      
      logger.debug('FirebaseConnectionManager: Connection test successful', 'UTILITY');
      return true;

    } catch (error: any) {
      this.isConnected = false;
      this.lastError = error.message;
      this.connectionAttempts++;
      
      logger.error('FirebaseConnectionManager: Connection test failed:', 'UTILITY', {}, error as Error);
      return false;
    }
  }

  /**
   * Test basic document read
   */
  private async testBasicRead(db: any): Promise<void> {
    try {
      const testDoc = doc(db, 'conversations', 'test');
      await getDoc(testDoc);
    } catch (error: any) {
      if (!error.message?.includes('not found')) {
        throw new Error(`Basic read test failed: ${error.message}`);
      }
    }
  }

  /**
   * Test collection query
   */
  private async testCollectionQuery(db: any): Promise<void> {
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      logger.debug('FirebaseConnectionManager: No conversations found (this is OK)', 'UTILITY');
    }
  }

  /**
   * Test real-time listener with timeout
   */
  private async testRealtimeListener(db: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
      
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsubscribe();
          reject(new Error('Realtime listener test timeout'));
        }
      }, 5000);

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            unsubscribe();
            resolve();
          }
        },
        (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            unsubscribe();
            reject(new Error(`Realtime listener test failed: ${error.message}`));
          }
        }
      );
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; lastError: string | null; attempts: number } {
    return {
      isConnected: this.isConnected,
      lastError: this.lastError,
      attempts: this.connectionAttempts
    };
  }

  /**
   * Reset connection state
   */
  resetConnection(): void {
    this.connectionAttempts = 0;
    this.isConnected = false;
    this.lastError = null;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  async attemptReconnection(): Promise<boolean> {
    if (this.connectionAttempts >= this.maxRetries) {
      logger.debug('FirebaseConnectionManager: Max retry attempts reached', 'UTILITY');
      return false;
    }

    const delay = this.retryDelay * Math.pow(2, this.connectionAttempts);
    logger.debug(`FirebaseConnectionManager: Attempting reconnection in ${delay}ms (attempt ${this.connectionAttempts + 1})`, 'UTILITY');
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return await this.testConnection();
  }

  /**
   * Create a robust onSnapshot wrapper
   */
  createRobustListener(
    query: any,
    onNext: (snapshot: any) => void,
    onError: (error: any) => void,
    options: ConnectionOptions = {
      useLongPolling: true,
      retryAttempts: 3,
      retryDelay: 2000,
      fallbackToOffline: false
    }
  ): () => void {
    let unsubscribe: (() => void) | null = null;
    let retryCount = 0;
    let isActive = true;

    const setupListener = async () => {
      if (!isActive) return;

      try {
        // Test connection first
        const isConnected = await this.testConnection();
        if (!isConnected && retryCount < options.retryAttempts) {
          retryCount++;
          logger.debug(`FirebaseConnectionManager: Retrying listener setup (attempt ${retryCount})`, 'UTILITY');
          setTimeout(setupListener, options.retryDelay);
          return;
        }

        if (!isConnected) {
          onError(new Error('Failed to establish connection after multiple attempts'));
          return;
        }

        // Set up the listener
        unsubscribe = onSnapshot(query, 
          (snapshot: any) => {
            try {
              onNext(snapshot);
            } catch (error) {
              logger.error('FirebaseConnectionManager: Error in onNext callback:', 'UTILITY', {}, error as Error);
              onError(error);
            }
          },
          (error: any) => {
            logger.error('FirebaseConnectionManager: Listener error:', 'UTILITY', {}, error as Error);
            
            // Handle specific error types
            if (error.code === 'unavailable' || error.message?.includes('400')) {
              if (retryCount < options.retryAttempts) {
                retryCount++;
                logger.debug(`FirebaseConnectionManager: Retrying after error (attempt ${retryCount})`, 'UTILITY');
                setTimeout(setupListener, options.retryDelay);
                return;
              }
            }
            
            onError(error);
          }
        );

      } catch (error) {
        logger.error('FirebaseConnectionManager: Setup error:', 'UTILITY', {}, error as Error);
        onError(error);
      }
    };

    // Start the listener
    setupListener();

    // Return cleanup function
    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}

/**
 * Utility function to create a robust listener
 */
export const createRobustListener = (
  query: any,
  onNext: (snapshot: any) => void,
  onError: (error: any) => void,
  options?: Partial<ConnectionOptions>
): (() => void) => {
  const manager = FirebaseConnectionManager.getInstance();
  return manager.createRobustListener(query, onNext, onError, {
    useLongPolling: true,
    retryAttempts: 3,
    retryDelay: 2000,
    fallbackToOffline: false,
    ...options
  });
};
