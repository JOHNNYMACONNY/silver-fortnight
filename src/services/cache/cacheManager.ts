// src/services/cache/cacheManager.ts

import { multiLevelCache } from '../../utils/performance/advancedCaching';
import { globalCache } from '../../utils/cache';

export interface CacheManagerConfig {
  enableWarming: boolean;
  enablePreloading: boolean;
  enableAnalytics: boolean;
  warmingInterval: number; // milliseconds
  preloadThreshold: number; // confidence threshold for preloading
}

export class CacheManager {
  private config: CacheManagerConfig;
  private warmingInterval: NodeJS.Timeout | null = null;
  private analytics: Map<string, { hits: number; misses: number; lastAccess: number }> = new Map();

  constructor(config: Partial<CacheManagerConfig> = {}) {
    this.config = {
      enableWarming: true,
      enablePreloading: true,
      enableAnalytics: true,
      warmingInterval: 5 * 60 * 1000, // 5 minutes
      preloadThreshold: 0.7,
      ...config
    };

    if (this.config.enableWarming) {
      this.startWarming();
    }
  }

  /**
   * Start cache warming process
   */
  private startWarming(): void {
    this.warmingInterval = setInterval(() => {
      this.performWarming();
    }, this.config.warmingInterval);
  }

  /**
   * Stop cache warming process
   */
  public stopWarming(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }
  }

  /**
   * Perform cache warming based on access patterns
   */
  private async performWarming(): Promise<void> {
    try {
      const stats = multiLevelCache.getStats();
      console.log('Cache warming - Current stats:', stats);

      // Get frequently accessed patterns
      const frequentPatterns = this.getFrequentPatterns();
      
      // Warm cache for frequent patterns
      for (const pattern of frequentPatterns) {
        await this.warmPattern(pattern);
      }

      // Clean up old analytics data
      this.cleanupAnalytics();
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  /**
   * Get frequently accessed cache patterns
   */
  private getFrequentPatterns(): string[] {
    const patterns: { pattern: string; frequency: number }[] = [];
    
    for (const [key, stats] of this.analytics.entries()) {
      const totalAccess = stats.hits + stats.misses;
      const hitRate = stats.hits / totalAccess;
      
      // Consider patterns with high access frequency and good hit rate
      if (totalAccess > 5 && hitRate > 0.5) {
        patterns.push({
          pattern: this.extractPattern(key),
          frequency: totalAccess
        });
      }
    }

    return patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10) // Top 10 patterns
      .map(p => p.pattern);
  }

  /**
   * Extract pattern from cache key
   */
  private extractPattern(key: string): string {
    // Extract base pattern from keys like "user_profile_123_stats" -> "user_profile_*_stats"
    return key.replace(/\d+/g, '*');
  }

  /**
   * Warm cache for a specific pattern
   */
  private async warmPattern(pattern: string): Promise<void> {
    // This would implement pattern-specific warming logic
    // For now, we'll just log the pattern
    console.log(`Warming cache for pattern: ${pattern}`);
  }

  /**
   * Track cache access for analytics
   */
  public trackAccess(key: string, hit: boolean): void {
    if (!this.config.enableAnalytics) return;

    const stats = this.analytics.get(key) || { hits: 0, misses: 0, lastAccess: 0 };
    
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    
    stats.lastAccess = Date.now();
    this.analytics.set(key, stats);
  }

  /**
   * Get cache analytics
   */
  public getAnalytics(): Map<string, { hits: number; misses: number; lastAccess: number }> {
    return new Map(this.analytics);
  }

  /**
   * Clean up old analytics data
   */
  private cleanupAnalytics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [key, stats] of this.analytics.entries()) {
      if (stats.lastAccess < cutoff) {
        this.analytics.delete(key);
      }
    }
  }

  /**
   * Invalidate cache by pattern
   */
  public async invalidatePattern(pattern: string): Promise<void> {
    try {
      // This would implement pattern-based invalidation
      // For now, we'll clear all caches
      globalCache.clear();
      console.log(`Invalidated cache pattern: ${pattern}`);
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  public async invalidateByTags(tags: string[]): Promise<void> {
    try {
      await multiLevelCache.clearByTags(tags);
      console.log(`Invalidated cache by tags: ${tags.join(', ')}`);
    } catch (error) {
      console.error('Cache invalidation by tags failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public getStats() {
    return {
      multiLevel: multiLevelCache.getStats(),
      simple: globalCache.getStats(),
      analytics: {
        totalKeys: this.analytics.size,
        averageHitRate: this.calculateAverageHitRate()
      }
    };
  }

  /**
   * Calculate average hit rate across all keys
   */
  private calculateAverageHitRate(): number {
    if (this.analytics.size === 0) return 0;

    let totalHits = 0;
    let totalAccess = 0;

    for (const stats of this.analytics.values()) {
      totalHits += stats.hits;
      totalAccess += stats.hits + stats.misses;
    }

    return totalAccess > 0 ? totalHits / totalAccess : 0;
  }

  /**
   * Preload data based on user behavior
   */
  public async preloadUserData(userId: string): Promise<void> {
    if (!this.config.enablePreloading) return;

    try {
      // Preload common user data patterns
      const preloadPatterns = [
        `user_profile_${userId}_stats`,
        `user_profile_${userId}_social`,
        `user_profile_${userId}_reviews`,
        `social_stats_${userId}`,
        `gamification_${userId}_userXP`,
        `portfolio_items_${userId}`
      ];

      // This would trigger actual preloading
      console.log(`Preloading data for user ${userId}:`, preloadPatterns);
    } catch (error) {
      console.error('Preloading failed:', error);
    }
  }

  /**
   * Optimize cache based on current usage
   */
  public async optimizeCache(): Promise<void> {
    try {
      const stats = this.getStats();
      
      // Clean up expired entries
      const cleaned = globalCache.cleanup();
      console.log(`Cleaned up ${cleaned} expired entries`);

      // Log optimization recommendations
      if (stats.analytics.averageHitRate < 0.7) {
        console.warn('Low cache hit rate detected. Consider adjusting TTL values.');
      }

      if (stats.multiLevel.totalSize > 40 * 1024 * 1024) { // 40MB
        console.warn('Cache size is large. Consider more aggressive eviction.');
      }
    } catch (error) {
      console.error('Cache optimization failed:', error);
    }
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();
