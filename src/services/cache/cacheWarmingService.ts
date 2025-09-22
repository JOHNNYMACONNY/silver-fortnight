// src/services/cache/cacheWarmingService.ts

import { multiLevelCache } from '../../utils/performance/advancedCaching';
import { getDashboardStats } from '../dashboard';
import { getUserSocialStats } from '../leaderboards';
import { getUserReviews } from '../firestore-exports';
import { getUserXP, getUserXPHistory } from '../gamification';
import { getUserAchievements } from '../achievements';
import { getUserPortfolioItems } from '../portfolio';

export interface WarmingPattern {
  key: string;
  loader: () => Promise<any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  ttl: number;
  tags: string[];
}

export interface WarmingConfig {
  enableUserWarming: boolean;
  enableGlobalWarming: boolean;
  warmingDelay: number; // milliseconds
  maxConcurrentWarming: number;
}

export class CacheWarmingService {
  private config: WarmingConfig;
  private warmingQueue: WarmingPattern[] = [];
  private isWarming = false;
  private warmingPromises: Map<string, Promise<any>> = new Map();

  constructor(config: Partial<WarmingConfig> = {}) {
    this.config = {
      enableUserWarming: true,
      enableGlobalWarming: true,
      warmingDelay: 1000, // 1 second delay between warming operations
      maxConcurrentWarming: 3,
      ...config
    };
  }

  /**
   * Warm cache for a specific user
   */
  public async warmUserData(userId: string): Promise<void> {
    if (!this.config.enableUserWarming) return;

    const userPatterns: WarmingPattern[] = [
      {
        key: `user_profile_${userId}_stats`,
        loader: () => getDashboardStats(userId),
        priority: 'high',
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: [`user:${userId}`, 'profile-data', 'stats']
      },
      {
        key: `user_profile_${userId}_social`,
        loader: () => getUserSocialStats(userId),
        priority: 'high',
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: [`user:${userId}`, 'profile-data', 'social']
      },
      {
        key: `user_profile_${userId}_reviews`,
        loader: () => getUserReviews(userId),
        priority: 'medium',
        ttl: 15 * 60 * 1000, // 15 minutes
        tags: [`user:${userId}`, 'profile-data', 'reviews']
      },
      {
        key: `social_stats_${userId}`,
        loader: () => getUserSocialStats(userId),
        priority: 'medium',
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: [`user:${userId}`, 'social-stats']
      },
      {
        key: `gamification_${userId}_userXP`,
        loader: () => getUserXP(userId),
        priority: 'low',
        ttl: 2 * 60 * 1000, // 2 minutes
        tags: [`user:${userId}`, 'gamification', 'xp']
      },
      {
        key: `gamification_${userId}_xpHistory`,
        loader: () => getUserXPHistory(userId),
        priority: 'low',
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: [`user:${userId}`, 'gamification', 'history']
      },
      {
        key: `gamification_${userId}_userAchievements`,
        loader: () => getUserAchievements(userId),
        priority: 'low',
        ttl: 30 * 60 * 1000, // 30 minutes
        tags: [`user:${userId}`, 'gamification', 'achievements']
      },
      {
        key: `portfolio_items_${userId}`,
        loader: () => getUserPortfolioItems(userId),
        priority: 'medium',
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: [`user:${userId}`, 'portfolio']
      }
    ];

    await this.warmPatterns(userPatterns);
  }

  /**
   * Warm global data that's commonly accessed
   */
  public async warmGlobalData(): Promise<void> {
    if (!this.config.enableGlobalWarming) return;

    const globalPatterns: WarmingPattern[] = [
      // Add global patterns here as needed
      // For example: leaderboards, system stats, etc.
    ];

    await this.warmPatterns(globalPatterns);
  }

  /**
   * Warm cache based on user navigation patterns
   */
  public async warmBasedOnNavigation(currentPath: string, userId?: string): Promise<void> {
    const patterns: WarmingPattern[] = [];

    // Predict what data might be needed based on current path
    if (currentPath.includes('/profile') && userId) {
      // User is viewing a profile, warm profile-related data
      patterns.push(
        {
          key: `user_profile_${userId}_stats`,
          loader: () => getDashboardStats(userId),
          priority: 'high',
          ttl: 10 * 60 * 1000,
          tags: [`user:${userId}`, 'profile-data', 'stats']
        },
        {
          key: `user_profile_${userId}_social`,
          loader: () => getUserSocialStats(userId),
          priority: 'high',
          ttl: 5 * 60 * 1000,
          tags: [`user:${userId}`, 'profile-data', 'social']
        }
      );
    }

    if (currentPath.includes('/portfolio') && userId) {
      // User is viewing portfolio, warm portfolio data
      patterns.push({
        key: `portfolio_items_${userId}`,
        loader: () => getUserPortfolioItems(userId),
        priority: 'high',
        ttl: 10 * 60 * 1000,
        tags: [`user:${userId}`, 'portfolio']
      });
    }

    if (currentPath.includes('/gamification') && userId) {
      // User is viewing gamification, warm gamification data
      patterns.push(
        {
          key: `gamification_${userId}_userXP`,
          loader: () => getUserXP(userId),
          priority: 'high',
          ttl: 2 * 60 * 1000,
          tags: [`user:${userId}`, 'gamification', 'xp']
        },
        {
          key: `gamification_${userId}_userAchievements`,
          loader: () => getUserAchievements(userId),
          priority: 'medium',
          ttl: 30 * 60 * 1000,
          tags: [`user:${userId}`, 'gamification', 'achievements']
        }
      );
    }

    if (patterns.length > 0) {
      await this.warmPatterns(patterns);
    }
  }

  /**
   * Warm cache patterns with rate limiting
   */
  private async warmPatterns(patterns: WarmingPattern[]): Promise<void> {
    if (this.isWarming) {
      // Add to queue if already warming
      this.warmingQueue.push(...patterns);
      return;
    }

    this.isWarming = true;

    try {
      // Process patterns in batches
      const batches = this.chunkArray(patterns, this.config.maxConcurrentWarming);
      
      for (const batch of batches) {
        await this.warmBatch(batch);
        
        // Add delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(this.config.warmingDelay);
        }
      }

      // Process queued patterns
      if (this.warmingQueue.length > 0) {
        const queuedPatterns = [...this.warmingQueue];
        this.warmingQueue = [];
        await this.warmPatterns(queuedPatterns);
      }
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm a batch of patterns concurrently
   */
  private async warmBatch(patterns: WarmingPattern[]): Promise<void> {
    const promises = patterns.map(pattern => this.warmPattern(pattern));
    await Promise.allSettled(promises);
  }

  /**
   * Warm a single pattern
   */
  private async warmPattern(pattern: WarmingPattern): Promise<void> {
    // Check if already warming this pattern
    if (this.warmingPromises.has(pattern.key)) {
      return this.warmingPromises.get(pattern.key);
    }

    const warmingPromise = this.performWarming(pattern);
    this.warmingPromises.set(pattern.key, warmingPromise);

    try {
      await warmingPromise;
    } finally {
      this.warmingPromises.delete(pattern.key);
    }
  }

  /**
   * Perform the actual warming operation
   */
  private async performWarming(pattern: WarmingPattern): Promise<void> {
    try {
      // Check if data is already cached and fresh
      const cached = await multiLevelCache.get(pattern.key);
      if (cached) {
        console.log(`Cache hit for ${pattern.key}, skipping warming`);
        return;
      }

      console.log(`Warming cache for ${pattern.key}`);
      
      // Load data
      const result = await pattern.loader();
      
      if (result.success && result.data) {
        // Cache the data
        await multiLevelCache.set(pattern.key, result.data, {
          ttl: pattern.ttl,
          priority: pattern.priority,
          tags: pattern.tags,
          persist: pattern.priority === 'critical'
        });
        
        console.log(`Successfully warmed ${pattern.key}`);
      } else {
        console.warn(`Failed to warm ${pattern.key}:`, result.error);
      }
    } catch (error) {
      console.error(`Error warming ${pattern.key}:`, error);
    }
  }

  /**
   * Utility to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get warming statistics
   */
  public getStats() {
    return {
      isWarming: this.isWarming,
      queueLength: this.warmingQueue.length,
      activeWarming: this.warmingPromises.size
    };
  }

  /**
   * Clear warming queue
   */
  public clearQueue(): void {
    this.warmingQueue = [];
  }

  /**
   * Stop all warming operations
   */
  public stopWarming(): void {
    this.clearQueue();
    this.warmingPromises.clear();
    this.isWarming = false;
  }
}

// Global cache warming service instance
export const cacheWarmingService = new CacheWarmingService();
