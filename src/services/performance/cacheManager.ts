/**
 * Intelligent Cache Manager for TradeYa
 * 
 * Advanced caching strategies with smart eviction policies, predictive prefetching,
 * and integration with RUM data for optimal cache performance.
 */

import { RUMMetrics, SessionInfo } from './rumService';
import { NetworkInfo } from './preloadingService';
import { logger } from '@utils/logging/logger';

/**
 * Cache entry metadata
 */
export interface CacheEntry {
  /** Unique key for the cache entry */
  key: string;
  /** Cached data */
  data: any;
  /** Timestamp when cached */
  timestamp: number;
  /** Time to live in milliseconds */
  ttl: number;
  /** Access frequency */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Entry size in bytes */
  size: number;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Tags for grouping */
  tags: string[];
  /** Expiration timestamp */
  expires: number;
  /** Validation function for freshness */
  validator?: string;
  /** Compression status */
  compressed: boolean;
  /** Dependency keys */
  dependencies: string[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total entries in cache */
  totalEntries: number;
  /** Cache hit rate */
  hitRate: number;
  /** Cache miss rate */
  missRate: number;
  /** Total memory usage in bytes */
  memoryUsage: number;
  /** Average entry size */
  averageEntrySize: number;
  /** Eviction count */
  evictionCount: number;
  /** Access patterns */
  accessPatterns: {
    [key: string]: {
      frequency: number;
      lastAccess: number;
    };
  };
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum cache size in bytes */
  maxSize: number;
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Maximum number of entries */
  maxEntries: number;
  /** Eviction strategy */
  evictionStrategy: 'lru' | 'lfu' | 'ttl' | 'intelligent';
  /** Enable compression for large entries */
  enableCompression: boolean;
  /** Compression threshold in bytes */
  compressionThreshold: number;
  /** Enable predictive prefetching */
  enablePredictivePrefetch: boolean;
  /** Cache persistence */
  persistence: {
    /** Enable persistent cache */
    enabled: boolean;
    /** Storage type */
    storage: 'localStorage' | 'indexedDB' | 'memory';
    /** Persistence key prefix */
    keyPrefix: string;
  };
  /** Cache warming strategies */
  warming: {
    /** Enable cache warming */
    enabled: boolean;
    /** Warm on app start */
    warmOnStart: boolean;
    /** Critical resources to warm */
    criticalResources: string[];
  };
}

/**
 * Eviction reason
 */
export type EvictionReason = 'expired' | 'memory-pressure' | 'dependency-invalidated' | 'manual' | 'replaced';

/**
 * Cache event
 */
export interface CacheEvent {
  /** Event type */
  type: 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'warm';
  /** Cache key */
  key: string;
  /** Entry data (if applicable) */
  entry?: CacheEntry;
  /** Eviction reason (for evict events) */
  reason?: EvictionReason;
  /** Timestamp */
  timestamp: number;
}

/**
 * Prefetch prediction
 */
export interface PrefetchPrediction {
  /** Resource key to prefetch */
  key: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Predicted access time */
  predictedAccessTime: number;
  /** Priority for prefetching */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Context that led to prediction */
  context: string;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxEntries: 1000,
  evictionStrategy: 'intelligent',
  enableCompression: true,
  compressionThreshold: 10 * 1024, // 10KB
  enablePredictivePrefetch: true,
  persistence: {
    enabled: true,
    storage: 'indexedDB',
    keyPrefix: 'tradeya_cache_'
  },
  warming: {
    enabled: true,
    warmOnStart: true,
    criticalResources: []
  }
};

/**
 * Intelligent Cache Manager
 */
export class CacheManager {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats;
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private prefetchQueue: Set<string> = new Set();
  private accessHistory: Map<string, number[]> = new Map();
  private rumData: RUMMetrics[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.stats = this.initializeStats();
    this.initialize();
  }

  /**
   * Initialize cache manager
   */
  private async initialize(): Promise<void> {
    try {
      // Load persisted cache if enabled
      if (this.config.persistence.enabled) {
        await this.loadPersistedCache();
      }

      // Start cleanup timer
      this.startCleanupTimer();

      // Warm cache if enabled
      if (this.config.warming.enabled && this.config.warming.warmOnStart) {
        await this.warmCache();
      }

      // Setup persistence listeners
      if (this.config.persistence.enabled) {
        this.setupPersistenceListeners();
      }

    } catch (error) {
      logger.error('Failed to initialize cache manager:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Initialize cache statistics
   */
  private initializeStats(): CacheStats {
    return {
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      memoryUsage: 0,
      averageEntrySize: 0,
      evictionCount: 0,
      accessPatterns: {}
    };
  }

  /**
   * Get item from cache
   */
  public get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.recordCacheEvent({ type: 'miss', key, timestamp: Date.now() });
      this.updateAccessPattern(key, false);
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key, 'expired');
      this.recordCacheEvent({ type: 'miss', key, timestamp: Date.now() });
      this.updateAccessPattern(key, false);
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.recordCacheEvent({ type: 'hit', key, entry, timestamp: Date.now() });
    this.updateAccessPattern(key, true);

    // Predictive prefetching based on access patterns
    if (this.config.enablePredictivePrefetch) {
      this.performPredictivePrefetch(key);
    }

    return entry.data;
  }

  /**
   * Set item in cache
   */
  public async set<T = any>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'critical' | 'high' | 'medium' | 'low';
      tags?: string[];
      dependencies?: string[];
      validator?: string;
    } = {}
  ): Promise<void> {
    try {
      const now = Date.now();
      const ttl = options.ttl || this.config.defaultTTL;
      const size = this.calculateDataSize(data);
      
      // Check if compression is needed
      let finalData = data;
      let compressed = false;
      
      if (this.config.enableCompression && size > this.config.compressionThreshold) {
        finalData = await this.compressData(data);
        compressed = true;
      }

      const entry: CacheEntry = {
        key,
        data: finalData,
        timestamp: now,
        ttl,
        accessCount: 0,
        lastAccessed: now,
        size: this.calculateDataSize(finalData),
        priority: options.priority || 'medium',
        tags: options.tags || [],
        expires: now + ttl,
        validator: options.validator,
        compressed,
        dependencies: options.dependencies || []
      };

      // Check if we need to evict entries
      await this.makeSpace(entry.size);

      // Set the entry
      this.cache.set(key, entry);
      this.updateStats();

      this.recordCacheEvent({ type: 'set', key, entry, timestamp: now });

      // Persist if enabled
      if (this.config.persistence.enabled) {
        await this.persistEntry(entry);
      }

    } catch (error) {
      logger.error('Failed to set cache entry:', 'SERVICE', { arg0: key }, error as Error);
    }
  }

  /**
   * Delete item from cache
   */
  public delete(key: string, reason: EvictionReason = 'manual'): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.updateStats();

    this.recordCacheEvent({ 
      type: 'delete', 
      key, 
      entry, 
      reason, 
      timestamp: Date.now() 
    });

    // Remove from persistence
    if (this.config.persistence.enabled) {
      this.removePersistedEntry(key);
    }

    return true;
  }

  /**
   * Clear cache with optional tag filtering
   */
  public clear(tags?: string[]): void {
    if (!tags) {
      this.cache.clear();
      this.updateStats();
      return;
    }

    // Clear entries with specific tags
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.delete(key, 'manual');
      }
    }
  }

  /**
   * Check if entry exists and is valid
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Invalidate dependencies
   */
  public invalidateDependencies(dependencyKey: string): void {
    const keysToInvalidate: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies.includes(dependencyKey)) {
        keysToInvalidate.push(key);
      }
    }

    keysToInvalidate.forEach(key => {
      this.delete(key, 'dependency-invalidated');
    });
  }

  /**
   * Intelligent eviction based on multiple factors
   */
  private async makeSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    const maxSize = this.config.maxSize;
    const maxEntries = this.config.maxEntries;

    // Check if we need to evict
    if (currentSize + requiredSize <= maxSize && this.cache.size < maxEntries) {
      return;
    }

    const candidates = this.getEvictionCandidates();
    let freedSpace = 0;
    let evictedCount = 0;

    for (const candidate of candidates) {
      if (freedSpace >= requiredSize && this.cache.size < maxEntries) {
        break;
      }

      const entry = this.cache.get(candidate.key);
      if (entry) {
        freedSpace += entry.size;
        evictedCount++;
        this.delete(candidate.key, candidate.reason);
      }
    }

    this.stats.evictionCount += evictedCount;
  }

  /**
   * Get eviction candidates based on strategy
   */
  private getEvictionCandidates(): Array<{ key: string; reason: EvictionReason; score: number }> {
    const candidates: Array<{ key: string; reason: EvictionReason; score: number }> = [];
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      let score = 0;
      let reason: EvictionReason = 'memory-pressure';

      // Check expiration first
      if (this.isExpired(entry)) {
        reason = 'expired';
        score = 1000; // Highest priority for expired entries
      } else {
        // Calculate eviction score based on strategy
        switch (this.config.evictionStrategy) {
          case 'lru':
            score = now - entry.lastAccessed;
            break;
          case 'lfu':
            score = 1 / (entry.accessCount + 1);
            break;
          case 'ttl':
            score = entry.expires - now;
            break;
          case 'intelligent':
            score = this.calculateIntelligentScore(entry, now);
            break;
        }

        // Adjust score based on priority
        const priorityMultiplier = {
          'critical': 0.1,
          'high': 0.3,
          'medium': 1.0,
          'low': 2.0
        };
        score *= priorityMultiplier[entry.priority];
      }

      candidates.push({ key, reason, score });
    }

    // Sort by score (higher score = more likely to be evicted)
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate intelligent eviction score
   */
  private calculateIntelligentScore(entry: CacheEntry, now: number): number {
    let score = 0;

    // Recency factor (40% weight)
    const recencyScore = (now - entry.lastAccessed) / (24 * 60 * 60 * 1000); // Normalize to days
    score += recencyScore * 0.4;

    // Frequency factor (30% weight)
    const frequencyScore = 1 / (entry.accessCount + 1);
    score += frequencyScore * 0.3;

    // Size factor (20% weight) - larger entries more likely to be evicted
    const sizeScore = entry.size / (1024 * 1024); // Normalize to MB
    score += sizeScore * 0.2;

    // TTL factor (10% weight)
    const ttlScore = (entry.expires - now) / entry.ttl;
    score += (1 - ttlScore) * 0.1;

    return score;
  }

  /**
   * Predictive prefetching based on access patterns
   */
  private async performPredictivePrefetch(accessedKey: string): Promise<void> {
    try {
      const predictions = this.generatePrefetchPredictions(accessedKey);
      
      for (const prediction of predictions) {
        if (prediction.confidence > 0.7 && !this.prefetchQueue.has(prediction.key)) {
          this.prefetchQueue.add(prediction.key);
          
          // Schedule prefetch based on predicted access time
          const delay = Math.max(0, prediction.predictedAccessTime - Date.now());
          setTimeout(() => {
            this.executePrefetch(prediction);
          }, delay);
        }
      }
    } catch (error) {
      logger.error('Failed to perform predictive prefetch:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Generate prefetch predictions based on patterns
   */
  private generatePrefetchPredictions(accessedKey: string): PrefetchPrediction[] {
    const predictions: PrefetchPrediction[] = [];
    
    // Analyze access patterns from RUM data
    const relatedKeys = this.findRelatedKeys(accessedKey);
    
    relatedKeys.forEach(relatedKey => {
      const confidence = this.calculatePrefetchConfidence(accessedKey, relatedKey);
      
      if (confidence > 0.5) {
        predictions.push({
          key: relatedKey,
          confidence,
          predictedAccessTime: Date.now() + this.estimateAccessDelay(accessedKey, relatedKey),
          priority: confidence > 0.8 ? 'high' : 'medium',
          context: `Related to ${accessedKey}`
        });
      }
    });

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find keys related to the accessed key
   */
  private findRelatedKeys(accessedKey: string): string[] {
    const relatedKeys: Set<string> = new Set();

    // Analyze RUM data for co-occurrence patterns
    this.rumData.forEach(rum => {
      if (rum.pageId === accessedKey || rum.pageMetadata.url.includes(accessedKey)) {
        // Add pages visited in the same session
        if (rum.businessMetrics) {
          Object.keys(rum.businessMetrics).forEach(key => {
            if (key !== accessedKey) {
              relatedKeys.add(key);
            }
          });
        }
      }
    });

    // Add pattern-based related keys
    const keyParts = accessedKey.split('/');
    if (keyParts.length > 1) {
      const basePath = keyParts.slice(0, -1).join('/');
      this.cache.forEach((_, key) => {
        if (key.startsWith(basePath) && key !== accessedKey) {
          relatedKeys.add(key);
        }
      });
    }

    return Array.from(relatedKeys);
  }

  /**
   * Calculate prefetch confidence
   */
  private calculatePrefetchConfidence(sourceKey: string, targetKey: string): number {
    let confidence = 0;

    // Co-occurrence analysis
    const coOccurrences = this.analyzeCoOccurrence(sourceKey, targetKey);
    confidence += Math.min(0.5, coOccurrences / 10);

    // Pattern similarity
    const similarity = this.calculateKeySimilarity(sourceKey, targetKey);
    confidence += similarity * 0.3;

    // Access frequency
    const accessPattern = this.accessHistory.get(targetKey);
    if (accessPattern && accessPattern.length > 0) {
      const avgInterval = this.calculateAverageAccessInterval(accessPattern);
      const timeSinceLastAccess = Date.now() - Math.max(...accessPattern);
      
      if (timeSinceLastAccess > avgInterval * 0.8) {
        confidence += 0.2;
      }
    }

    return Math.min(1, confidence);
  }

  /**
   * Analyze co-occurrence of two keys in RUM data
   */
  private analyzeCoOccurrence(key1: string, key2: string): number {
    let coOccurrences = 0;
    const sessionGroups = new Map<string, string[]>();

    // Group RUM data by session
    this.rumData.forEach(rum => {
      if (!sessionGroups.has(rum.sessionId)) {
        sessionGroups.set(rum.sessionId, []);
      }
      sessionGroups.get(rum.sessionId)!.push(rum.pageId);
    });

    // Count sessions where both keys appear
    sessionGroups.forEach(pages => {
      if (pages.includes(key1) && pages.includes(key2)) {
        coOccurrences++;
      }
    });

    return coOccurrences;
  }

  /**
   * Calculate similarity between two keys
   */
  private calculateKeySimilarity(key1: string, key2: string): number {
    const parts1 = key1.split('/');
    const parts2 = key2.split('/');
    const commonParts = parts1.filter(part => parts2.includes(part));
    
    return commonParts.length / Math.max(parts1.length, parts2.length);
  }

  /**
   * Calculate average access interval
   */
  private calculateAverageAccessInterval(accessTimes: number[]): number {
    if (accessTimes.length < 2) return Infinity;

    const intervals = [];
    for (let i = 1; i < accessTimes.length; i++) {
      intervals.push(accessTimes[i] - accessTimes[i - 1]);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  /**
   * Estimate access delay for prefetching
   */
  private estimateAccessDelay(sourceKey: string, targetKey: string): number {
    // Simple heuristic based on key similarity and historical patterns
    const similarity = this.calculateKeySimilarity(sourceKey, targetKey);
    const baseDelay = 5000; // 5 seconds base delay
    
    return baseDelay * (1 - similarity);
  }

  /**
   * Execute prefetch operation
   */
  private async executePrefetch(prediction: PrefetchPrediction): Promise<void> {
    try {
      // This would integrate with the actual data fetching logic
      // For now, we just emit an event
      this.recordCacheEvent({
        type: 'warm',
        key: prediction.key,
        timestamp: Date.now()
      });

      this.prefetchQueue.delete(prediction.key);
    } catch (error) {
      logger.error('Failed to execute prefetch:', 'SERVICE', { arg0: prediction.key }, error as Error);
      this.prefetchQueue.delete(prediction.key);
    }
  }

  /**
   * Warm cache with critical resources
   */
  private async warmCache(): Promise<void> {
    if (!this.config.warming.criticalResources.length) return;

    try {
      for (const resource of this.config.warming.criticalResources) {
        // This would integrate with actual resource loading
        this.recordCacheEvent({
          type: 'warm',
          key: resource,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logger.error('Failed to warm cache:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Update RUM data for analytics
   */
  public updateRUMData(rumData: RUMMetrics[]): void {
    this.rumData = rumData.slice(-1000); // Keep last 1000 entries
  }

  /**
   * Utility methods
   */
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expires;
  }

  private calculateDataSize(data: any): number {
    // Rough estimation of data size
    const str = JSON.stringify(data);
    return new Blob([str]).size;
  }

  private async compressData(data: any): Promise<any> {
    // Simple compression using JSON stringification
    // In a real implementation, this would use actual compression algorithms
    return JSON.stringify(data);
  }

  private getCurrentCacheSize(): number {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += entry.size;
    });
    return totalSize;
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.memoryUsage = this.getCurrentCacheSize();
    this.stats.averageEntrySize = this.stats.totalEntries > 0 ? 
      this.stats.memoryUsage / this.stats.totalEntries : 0;
  }

  private updateAccessPattern(key: string, hit: boolean): void {
    if (!this.stats.accessPatterns[key]) {
      this.stats.accessPatterns[key] = { frequency: 0, lastAccess: 0 };
    }

    this.stats.accessPatterns[key].frequency++;
    this.stats.accessPatterns[key].lastAccess = Date.now();

    if (!this.accessHistory.has(key)) {
      this.accessHistory.set(key, []);
    }
    this.accessHistory.get(key)!.push(Date.now());

    // Keep only recent access history
    const history = this.accessHistory.get(key)!;
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    // Update hit/miss rates
    const totalAccess = Object.values(this.stats.accessPatterns)
      .reduce((sum, pattern) => sum + pattern.frequency, 0);
    
    if (totalAccess > 0) {
      // Simplified hit rate calculation
      const hits = hit ? 1 : 0;
      this.stats.hitRate = (this.stats.hitRate + hits) / 2; // Running average
      this.stats.missRate = 1 - this.stats.hitRate;
    }
  }

  private recordCacheEvent(event: CacheEvent): void {
    // Emit event to listeners
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Cache event listener error:', 'SERVICE', {}, error as Error);
      }
    });

    // Could also store events for analytics
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 60000); // Cleanup every minute
  }

  private performCleanup(): void {
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.delete(key, 'expired');
    });
  }

  /**
   * Persistence methods (simplified implementations)
   */

  private async loadPersistedCache(): Promise<void> {
    if (this.config.persistence.storage === 'localStorage') {
      await this.loadFromLocalStorage();
    } else if (this.config.persistence.storage === 'indexedDB') {
      await this.loadFromIndexedDB();
    }
  }

  private async loadFromLocalStorage(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.config.persistence.keyPrefix)
      );

      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          const entry: CacheEntry = JSON.parse(data);
          if (!this.isExpired(entry)) {
            this.cache.set(entry.key, entry);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load from localStorage:', 'SERVICE', {}, error as Error);
    }
  }

  private async loadFromIndexedDB(): Promise<void> {
    // Simplified IndexedDB implementation
    // In a real implementation, this would use proper IndexedDB APIs
    logger.debug('IndexedDB loading not implemented in this example', 'SERVICE');
  }

  private async persistEntry(entry: CacheEntry): Promise<void> {
    if (this.config.persistence.storage === 'localStorage') {
      const key = this.config.persistence.keyPrefix + entry.key;
      localStorage.setItem(key, JSON.stringify(entry));
    }
  }

  private async removePersistedEntry(key: string): Promise<void> {
    if (this.config.persistence.storage === 'localStorage') {
      const persistKey = this.config.persistence.keyPrefix + key;
      localStorage.removeItem(persistKey);
    }
  }

  private setupPersistenceListeners(): void {
    // Setup listeners for page unload to persist critical data
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistCriticalEntries();
      });
    }
  }

  private persistCriticalEntries(): void {
    // Persist only critical and high priority entries on page unload
    this.cache.forEach(entry => {
      if (entry.priority === 'critical' || entry.priority === 'high') {
        this.persistEntry(entry);
      }
    });
  }

  /**
   * Public API methods
   */

  public addEventListener(type: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  public removeEventListener(type: string, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public getConfig(): CacheConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.persistCriticalEntries();
    this.cache.clear();
    this.eventListeners.clear();
    this.accessHistory.clear();
  }
}

// Utility functions

/**
 * Create a cache manager with RUM integration
 */
export const createIntelligentCache = (
  config?: Partial<CacheConfig>,
  rumData?: RUMMetrics[]
): CacheManager => {
  const cache = new CacheManager(config);
  
  if (rumData) {
    cache.updateRUMData(rumData);
  }
  
  return cache;
};

/**
 * Simple cache decorator for functions
 */
export const cacheFunction = <T extends (...args: any[]) => any>(
  fn: T,
  cacheManager: CacheManager,
  options?: {
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    priority?: 'critical' | 'high' | 'medium' | 'low';
  }
): T => {
  const keyGenerator = options?.keyGenerator || ((...args) => JSON.stringify(args));
  
  return ((...args: Parameters<T>) => {
    const key = `fn_${fn.name}_${keyGenerator(...args)}`;
    
    // Try to get from cache first
    const cached = cacheManager.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = fn(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then(resolvedResult => {
        cacheManager.set(key, resolvedResult, {
          ttl: options?.ttl,
          priority: options?.priority
        });
        return resolvedResult;
      });
    } else {
      cacheManager.set(key, result, {
        ttl: options?.ttl,
        priority: options?.priority
      });
      return result;
    }
  }) as T;
};

export default CacheManager;