// src/services/realtime/realtimeService.ts

import { getSyncFirebaseDb } from '../../firebase-config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  Unsubscribe,
  doc,
  getDoc
} from 'firebase/firestore';
import { SocialStats, LeaderboardEntry, UserXP } from '../../types/gamification';

export interface RealtimeUpdate<T = any> {
  type: 'social_stats' | 'leaderboard' | 'xp_update' | 'achievement' | 'follow';
  userId?: string;
  data: T;
  timestamp: number;
}

export interface RealtimeSubscriber<T = any> {
  id: string;
  callback: (update: RealtimeUpdate<T>) => void;
  filters?: {
    userIds?: string[];
    types?: string[];
  };
}

export interface RealtimeStats {
  activeSubscriptions: number;
  totalUpdates: number;
  lastUpdate: number | null;
  errorCount: number;
}

/**
 * Centralized real-time service for managing live updates
 * Handles subscriptions, filtering, and broadcasting of real-time data
 */
export class RealtimeService {
  private subscribers: Map<string, RealtimeSubscriber> = new Map();
  private activeListeners: Map<string, Unsubscribe> = new Map();
  private stats: RealtimeStats = {
    activeSubscriptions: 0,
    totalUpdates: 0,
    lastUpdate: null,
    errorCount: 0
  };

  /**
   * Subscribe to real-time updates
   */
  subscribe<T = any>(
    subscriberId: string,
    callback: (update: RealtimeUpdate<T>) => void,
    filters?: { userIds?: string[]; types?: string[] }
  ): void {
    this.subscribers.set(subscriberId, {
      id: subscriberId,
      callback: callback as any,
      filters
    });
    this.stats.activeSubscriptions = this.subscribers.size;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
    this.stats.activeSubscriptions = this.subscribers.size;
  }

  /**
   * Start listening to social stats changes
   */
  startSocialStatsListener(userId: string): void {
    const listenerId = `social_stats_${userId}`;
    
    if (this.activeListeners.has(listenerId)) {
      return; // Already listening
    }

    const db = getSyncFirebaseDb();
    const socialStatsRef = doc(db, 'socialStats', userId);
    
    const unsubscribe = onSnapshot(
      socialStatsRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as SocialStats;
          this.broadcastUpdate({
            type: 'social_stats',
            userId,
            data,
            timestamp: Date.now()
          });
        }
      },
      (error) => {
        console.error('Social stats listener error:', error);
        this.stats.errorCount++;
      }
    );

    this.activeListeners.set(listenerId, unsubscribe);
  }

  /**
   * Start listening to leaderboard changes
   */
  startLeaderboardListener(
    category: string, 
    period: string, 
    limitCount: number = 50
  ): void {
    const listenerId = `leaderboard_${category}_${period}`;
    
    if (this.activeListeners.has(listenerId)) {
      return; // Already listening
    }

    const db = getSyncFirebaseDb();
    const leaderboardRef = collection(db, 'leaderboards');
    
    // Build query based on category and period
    let q = query(leaderboardRef, limit(limitCount));
    
    if (category !== 'all') {
      q = query(q, where('category', '==', category));
    }
    
    if (period !== 'all') {
      q = query(q, where('period', '==', period));
    }
    
    q = query(q, orderBy('rank', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data
          } as LeaderboardEntry;
        });

        this.broadcastUpdate({
          type: 'leaderboard',
          data: {
            category,
            period,
            entries
          },
          timestamp: Date.now()
        });
      },
      (error) => {
        console.error('Leaderboard listener error:', error);
        this.stats.errorCount++;
      }
    );

    this.activeListeners.set(listenerId, unsubscribe);
  }

  /**
   * Start listening to XP updates for a user
   */
  startXPListener(userId: string): void {
    const listenerId = `xp_${userId}`;
    
    if (this.activeListeners.has(listenerId)) {
      return; // Already listening
    }

    const db = getSyncFirebaseDb();
    const xpRef = doc(db, 'userXP', userId);
    
    const unsubscribe = onSnapshot(
      xpRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserXP;
          this.broadcastUpdate({
            type: 'xp_update',
            userId,
            data,
            timestamp: Date.now()
          });
        }
      },
      (error) => {
        console.error('XP listener error:', error);
        this.stats.errorCount++;
      }
    );

    this.activeListeners.set(listenerId, unsubscribe);
  }

  /**
   * Start listening to follow/unfollow events
   */
  startFollowListener(userId: string): void {
    const listenerId = `follow_${userId}`;
    
    if (this.activeListeners.has(listenerId)) {
      return; // Already listening
    }

    const db = getSyncFirebaseDb();
    const followsRef = collection(db, 'userFollows');
    const q = query(
      followsRef,
      where('targetUserId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const followers = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data
          };
        });

        this.broadcastUpdate({
          type: 'follow',
          userId,
          data: {
            followersCount: followers.length,
            followers: followers
          },
          timestamp: Date.now()
        });
      },
      (error) => {
        console.error('Follow listener error:', error);
        this.stats.errorCount++;
      }
    );

    this.activeListeners.set(listenerId, unsubscribe);
  }

  /**
   * Broadcast update to all relevant subscribers
   */
  private broadcastUpdate(update: RealtimeUpdate): void {
    this.stats.totalUpdates++;
    this.stats.lastUpdate = update.timestamp;

    this.subscribers.forEach((subscriber) => {
      // Apply filters
      if (subscriber.filters) {
        if (subscriber.filters.userIds && update.userId) {
          if (!subscriber.filters.userIds.includes(update.userId)) {
            return; // Skip this subscriber
          }
        }
        
        if (subscriber.filters.types) {
          if (!subscriber.filters.types.includes(update.type)) {
            return; // Skip this subscriber
          }
        }
      }

      try {
        subscriber.callback(update);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
        this.stats.errorCount++;
      }
    });
  }

  /**
   * Stop all listeners and clear subscriptions
   */
  cleanup(): void {
    // Stop all active listeners
    this.activeListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeListeners.clear();

    // Clear all subscribers
    this.subscribers.clear();
    this.stats.activeSubscriptions = 0;
  }

  /**
   * Stop specific listener
   */
  stopListener(listenerId: string): void {
    const unsubscribe = this.activeListeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(listenerId);
    }
  }

  /**
   * Get current service statistics
   */
  getStats(): RealtimeStats {
    return { ...this.stats };
  }

  /**
   * Get active listener IDs
   */
  getActiveListeners(): string[] {
    return Array.from(this.activeListeners.keys());
  }

  /**
   * Check if a specific listener is active
   */
  isListenerActive(listenerId: string): boolean {
    return this.activeListeners.has(listenerId);
  }
}

// Global real-time service instance
export const realtimeService = new RealtimeService();
