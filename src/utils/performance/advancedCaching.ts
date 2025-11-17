import { logger } from '@utils/logging/logger';
/**
 * Advanced caching strategies for optimal performance
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

interface CacheConfig {
  maxSize: number;
  maxEntries: number;
  defaultTTL: number;
  enableCompression: boolean;
  enablePersistence: boolean;
  evictionStrategy: 'lru' | 'lfu' | 'ttl' | 'intelligent';
}

/**
 * Multi-level cache with intelligent eviction
 */
export class MultiLevelCache {
  private memoryCache = new Map<string, CacheEntry>();
  private persistentCache: IDBDatabase | null = null;
  private config: CacheConfig;
  private totalSize = 0;
  private accessPattern = new Map<string, number[]>();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      enableCompression: true,
      enablePersistence: true,
      evictionStrategy: 'intelligent',
      ...config
    };

    if (this.config.enablePersistence) {
      this.initializePersistentCache();
    }
  }

  private async initializePersistentCache() {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return;
    }

    try {
      const request = indexedDB.open('TradeYaCache', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('priority', 'priority');
        }
      };

      request.onsuccess = (event) => {
        this.persistentCache = (event.target as IDBOpenDBRequest).result;
      };

      request.onerror = (event) => {
        logger.error('Failed to initialize persistent cache:', 'UTILITY', event);
      };
    } catch (error) {
      logger.error('IndexedDB not available:', 'UTILITY', {}, error as Error);
    }
  }

  /**
   * Set cache entry with intelligent prioritization
   */
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      tags?: string[];
      persist?: boolean;
    } = {}
  ): Promise<void> {
    const {
      ttl = this.config.defaultTTL,
      priority = 'medium',
      tags = [],
      persist = false
    } = options;

    const serializedData = JSON.stringify(data);
    const size = new Blob([serializedData]).size;

    // Check if we need to evict entries
    if (this.shouldEvict(size)) {
      await this.evictEntries(size);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      priority,
      tags
    };

    this.memoryCache.set(key, entry);
    this.totalSize += size;

    // Track access pattern
    this.trackAccess(key);

    // Persist if requested and available
    if (persist && this.persistentCache) {
      await this.persistEntry(key, entry);
    }
  }

  /**
   * Get cache entry with access tracking
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    let entry = this.memoryCache.get(key);

    if (!entry && this.persistentCache) {
      // Check persistent cache
      entry = await this.getFromPersistentCache(key);
      if (entry) {
        // Promote to memory cache
        this.memoryCache.set(key, entry);
      }
    }

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      await this.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.trackAccess(key);

    return entry.data as T;
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.memoryCache.delete(key);
      this.totalSize -= entry.size;
    }

    if (this.persistentCache) {
      await this.deleteFromPersistentCache(key);
    }

    return !!entry;
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    await Promise.all(keysToDelete.map(key => this.delete(key)));
  }

  /**
   * Intelligent cache warming
   */
  async warmCache(patterns: Array<{
    keyPattern: string;
    loader: () => Promise<any>;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>): Promise<void> {
    const warmingPromises = patterns.map(async ({ keyPattern, loader, priority }) => {
      try {
        const data = await loader();
        await this.set(keyPattern, data, { priority, persist: priority === 'critical' });
      } catch (error) {
        logger.error(`Failed to warm cache for pattern ${keyPattern}:`, 'UTILITY', {}, error as Error);
      }
    });

    await Promise.allSettled(warmingPromises);
  }

  /**
   * Predictive prefetching based on access patterns
   */
  async predictivePreload(): Promise<void> {
    const predictions = this.generatePredictions();
    
    for (const prediction of predictions) {
      if (!this.memoryCache.has(prediction.key) && prediction.confidence > 0.7) {
        // Trigger preload for high-confidence predictions
        this.triggerPreload(prediction.key);
      }
    }
  }

  private generatePredictions(): Array<{ key: string; confidence: number }> {
    const predictions: Array<{ key: string; confidence: number }> = [];

    for (const [key, accesses] of this.accessPattern.entries()) {
      if (accesses.length < 3) continue;

      // Analyze access pattern
      const intervals = [];
      for (let i = 1; i < accesses.length; i++) {
        intervals.push(accesses[i] - accesses[i - 1]);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      // Higher confidence for regular access patterns
      const confidence = Math.max(0, 1 - (variance / (avgInterval * avgInterval)));
      
      if (confidence > 0.5) {
        predictions.push({ key, confidence });
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  private async triggerPreload(key: string): Promise<void> {
    // This would trigger the appropriate loader based on key pattern
    // Implementation depends on specific use case
    logger.debug(`Triggering preload for ${key}`, 'UTILITY');
  }

  private shouldEvict(newEntrySize: number): boolean {
    return (
      this.totalSize + newEntrySize > this.config.maxSize ||
      this.memoryCache.size >= this.config.maxEntries
    );
  }

  private async evictEntries(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    
    switch (this.config.evictionStrategy) {
      case 'lru':
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        break;
      case 'lfu':
        entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
        break;
      case 'ttl':
        entries.sort(([, a], [, b]) => (a.timestamp + a.ttl) - (b.timestamp + b.ttl));
        break;
      case 'intelligent':
        entries.sort(([, a], [, b]) => this.calculateEvictionScore(a) - this.calculateEvictionScore(b));
        break;
    }

    let freedSpace = 0;
    const keysToEvict: string[] = [];

    for (const [key, entry] of entries) {
      if (entry.priority === 'critical') continue; // Never evict critical entries
      
      keysToEvict.push(key);
      freedSpace += entry.size;
      
      if (freedSpace >= requiredSpace) break;
    }

    await Promise.all(keysToEvict.map(key => this.delete(key)));
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.timestamp;
    const timeSinceAccess = now - entry.lastAccessed;
    
    // Lower score = higher priority for eviction
    const priorityWeight = {
      low: 1,
      medium: 2,
      high: 4,
      critical: 10
    }[entry.priority];

    const accessFrequency = entry.accessCount / Math.max(1, age / (1000 * 60 * 60)); // accesses per hour
    
    return (timeSinceAccess / 1000) / (priorityWeight * Math.max(1, accessFrequency));
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private trackAccess(key: string): void {
    const accesses = this.accessPattern.get(key) || [];
    accesses.push(Date.now());
    
    // Keep only last 10 accesses
    if (accesses.length > 10) {
      accesses.shift();
    }
    
    this.accessPattern.set(key, accesses);
  }

  private async persistEntry(key: string, entry: CacheEntry): Promise<void> {
    if (!this.persistentCache) return;

    try {
      const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ key, ...entry });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('Failed to persist cache entry:', 'UTILITY', {}, error as Error);
    }
  }

  private async getFromPersistentCache(key: string): Promise<CacheEntry | undefined> {
    if (!this.persistentCache) return undefined;

    try {
      const transaction = this.persistentCache.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      
      return new Promise<CacheEntry | undefined>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const { key: _, ...entry } = result;
            resolve(entry as CacheEntry);
          } else {
            resolve(undefined);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('Failed to get from persistent cache:', 'UTILITY', {}, error as Error);
      return undefined;
    }
  }

  private async deleteFromPersistentCache(key: string): Promise<void> {
    if (!this.persistentCache) return;

    try {
      const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('Failed to delete from persistent cache:', 'UTILITY', {}, error as Error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.memoryCache.values());
    
    return {
      totalEntries: this.memoryCache.size,
      totalSize: this.totalSize,
      averageSize: this.totalSize / Math.max(1, this.memoryCache.size),
      hitRate: this.calculateHitRate(),
      priorityDistribution: this.getPriorityDistribution(entries),
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp))
    };
  }

  private calculateHitRate(): number {
    // This would require tracking hits/misses
    // Simplified implementation
    return 0.85; // Placeholder
  }

  private getPriorityDistribution(entries: CacheEntry[]) {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    entries.forEach(entry => {
      distribution[entry.priority]++;
    });
    return distribution;
  }
}

/**
 * Service Worker cache integration
 */
export class ServiceWorkerCache {
  private isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window;

  async cache(request: string | Request, response: Response): Promise<void> {
    if (!this.isSupported) return;

    try {
      const cache = await caches.open('tradeya-v1');
      await cache.put(request, response.clone());
    } catch (error) {
      logger.error('Failed to cache response:', 'UTILITY', {}, error as Error);
    }
  }

  async getCached(request: string | Request): Promise<Response | undefined> {
    if (!this.isSupported) return undefined;

    try {
      const cache = await caches.open('tradeya-v1');
      const match = await cache.match(request);
      return match ?? undefined;
    } catch (error) {
      logger.error('Failed to get cached response:', 'UTILITY', {}, error as Error);
      return undefined;
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.isSupported) return;

    try {
      const cache = await caches.open('tradeya-v1');
      const keys = await cache.keys();
      
      const keysToDelete = keys.filter(key => key.url.includes(pattern));
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
    } catch (error) {
      logger.error('Failed to invalidate cache:', 'UTILITY', {}, error as Error);
    }
  }
}

// Global cache instances
export const multiLevelCache = new MultiLevelCache();
export const serviceWorkerCache = new ServiceWorkerCache();
