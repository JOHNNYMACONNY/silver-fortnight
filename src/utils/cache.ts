/**
 * Simple caching utility for performance optimization
 * Provides in-memory caching with TTL (Time To Live) support
 */

export class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a value in the cache with optional TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, { data, timestamp: Date.now() + ttl });
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached data or null if expired/not found
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Check if a key exists and is not expired
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a specific key from cache
   * @param key - Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns Object with cache size and memory usage info
   */
  getStats(): { size: number; memoryUsage?: number } {
    const stats = { size: this.cache.size };
    
    // Add memory usage if available
    if (typeof performance !== 'undefined' && performance.memory) {
      stats.memoryUsage = performance.memory.usedJSHeapSize;
    }
    
    return stats;
  }

  /**
   * Clean up expired entries
   * @returns Number of entries cleaned up
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Global cache instance for use across the application
export const globalCache = new SimpleCache();

// Auto-cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Cache decorator for functions
 * @param ttl - Time to live in milliseconds
 * @param keyGenerator - Function to generate cache key from function arguments
 */
export function cached(ttl: number = 5 * 60 * 1000, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : `${target.constructor.name}_${propertyName}_${JSON.stringify(args)}`;
      
      const cached = globalCache.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = method.apply(this, args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.then(data => {
          globalCache.set(key, data, ttl);
          return data;
        });
      } else {
        globalCache.set(key, result, ttl);
        return result;
      }
    };
  };
}

/**
 * Cache wrapper for async functions
 * @param fn - Function to cache
 * @param ttl - Time to live in milliseconds
 * @param keyGenerator - Function to generate cache key
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number = 5 * 60 * 1000,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator 
      ? keyGenerator(...args)
      : `${fn.name}_${JSON.stringify(args)}`;
    
    const cached = globalCache.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    globalCache.set(key, result, ttl);
    return result;
  }) as T;
} 