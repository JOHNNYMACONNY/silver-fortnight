// src/hooks/useEnhancedDataFetching.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { multiLevelCache } from '../utils/performance/advancedCaching';
import { globalCache } from '../utils/cache';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  persist: boolean;
  staleWhileRevalidate: boolean; // Serve stale data while revalidating
  backgroundRefresh: boolean; // Refresh in background before expiry
}

export interface UseEnhancedDataFetchingOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  cache?: Partial<CacheConfig>;
  keyGenerator?: (...args: any[]) => string;
}

export interface UseEnhancedDataFetchingReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  isStale: boolean;
  cacheHit: boolean;
  lastFetched: number | null;
}

/**
 * Enhanced data fetching hook with intelligent caching
 * Provides multi-level caching, stale-while-revalidate, and background refresh
 */
export const useEnhancedDataFetching = <T>(
  fetchFn: () => Promise<any>,
  options: UseEnhancedDataFetchingOptions = {}
): UseEnhancedDataFetchingReturn<T> => {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    onSuccess,
    onError,
    cache: cacheOptions = {},
    keyGenerator
  } = options;

  const defaultCacheConfig: CacheConfig = {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    priority: 'medium',
    tags: [],
    persist: false,
    staleWhileRevalidate: true,
    backgroundRefresh: false,
    ...cacheOptions
  };

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const cacheKeyRef = useRef<string | null>(null);
  const backgroundRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate cache key
  const generateCacheKey = useCallback(() => {
    if (keyGenerator) {
      return keyGenerator();
    }
    return `enhanced_fetch_${fetchFn.name}_${Date.now()}`;
  }, [fetchFn, keyGenerator]);

  // Check if data is stale
  const isDataStale = useCallback((timestamp: number, ttl: number): boolean => {
    return Date.now() - timestamp > ttl;
  }, []);

  // Fetch data from source
  const fetchFromSource = useCallback(async (): Promise<T | null> => {
    try {
      setError(null);
      const result = await fetchFn();
      
      if (result.success && result.data) {
        onSuccess?.(result.data);
        return result.data;
      } else {
        const errorMessage = result.error || 'Failed to fetch data';
        setError(errorMessage);
        onError?.(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    }
  }, [fetchFn, onSuccess, onError]);

  // Load data from cache or source
  const loadData = useCallback(async (forceRefresh = false): Promise<void> => {
    if (!enabled) return;

    const cacheKey = generateCacheKey();
    cacheKeyRef.current = cacheKey;

    // Try cache first if not forcing refresh
    if (!forceRefresh && defaultCacheConfig.enabled) {
      try {
        const cachedData = await multiLevelCache.get<T>(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setCacheHit(true);
          setLastFetched(Date.now());
          setLoading(false);
          setIsRefetching(false);

          // Check if data is stale and needs background refresh
          if (defaultCacheConfig.staleWhileRevalidate && isDataStale(lastFetched || 0, defaultCacheConfig.ttl)) {
            setIsStale(true);
            // Trigger background refresh
            if (defaultCacheConfig.backgroundRefresh) {
              loadData(true);
            }
          }
          return;
        }
      } catch (cacheError) {
        console.warn('Cache read failed, falling back to source:', cacheError);
      }
    }

    // Fetch from source
    setLoading(true);
    setCacheHit(false);
    
    const freshData = await fetchFromSource();
    
    if (freshData !== null) {
      setData(freshData);
      setLastFetched(Date.now());
      setIsStale(false);

      // Cache the fresh data
      if (defaultCacheConfig.enabled) {
        try {
          await multiLevelCache.set(cacheKey, freshData, {
            ttl: defaultCacheConfig.ttl,
            priority: defaultCacheConfig.priority,
            tags: defaultCacheConfig.tags,
            persist: defaultCacheConfig.persist
          });
        } catch (cacheError) {
          console.warn('Cache write failed:', cacheError);
        }
      }
    }

    setLoading(false);
    setIsRefetching(false);
  }, [
    enabled,
    generateCacheKey,
    defaultCacheConfig,
    fetchFromSource,
    isDataStale,
    lastFetched
  ]);

  // Refetch function
  const refetch = useCallback(async () => {
    setIsRefetching(true);
    await loadData(true);
  }, [loadData]);

  // Initial load
  useEffect(() => {
    if (enabled && refetchOnMount) {
      loadData();
    }
  }, [loadData, enabled, refetchOnMount]);

  // Auto-refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      refetch();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetch, refetchInterval, enabled]);

  // Background refresh setup
  useEffect(() => {
    if (!defaultCacheConfig.backgroundRefresh || !lastFetched) return;

    const refreshTime = lastFetched + (defaultCacheConfig.ttl * 0.8); // Refresh at 80% of TTL
    const timeUntilRefresh = refreshTime - Date.now();

    if (timeUntilRefresh > 0) {
      backgroundRefreshTimeoutRef.current = setTimeout(() => {
        loadData(true);
      }, timeUntilRefresh);
    }

    return () => {
      if (backgroundRefreshTimeoutRef.current) {
        clearTimeout(backgroundRefreshTimeoutRef.current);
      }
    };
  }, [lastFetched, defaultCacheConfig, loadData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (backgroundRefreshTimeoutRef.current) {
        clearTimeout(backgroundRefreshTimeoutRef.current);
      }
    };
  }, []);

  return { 
    data, 
    loading, 
    error, 
    refetch, 
    isRefetching,
    isStale,
    cacheHit,
    lastFetched
  };
};

/**
 * Enhanced parallel data fetching with intelligent caching
 */
export const useEnhancedParallelDataFetching = <T extends Record<string, any>>(
  fetchFunctions: Record<keyof T, () => Promise<any>>,
  options: UseEnhancedDataFetchingOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [results, setResults] = useState<Partial<T>>({});
  const [cacheStats, setCacheStats] = useState<Record<string, { hit: boolean; stale: boolean }>>({});

  const {
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    onSuccess,
    onError,
    cache: cacheOptions = {},
    keyGenerator
  } = options;

  const defaultCacheConfig: CacheConfig = {
    enabled: true,
    ttl: 5 * 60 * 1000,
    priority: 'medium',
    tags: [],
    persist: false,
    staleWhileRevalidate: true,
    backgroundRefresh: false,
    ...cacheOptions
  };

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    const promises = Object.entries(fetchFunctions).map(async ([key, fetchFn]) => {
      const cacheKey = keyGenerator 
        ? keyGenerator(key)
        : `parallel_${key}_${Date.now()}`;

      // Try cache first
      if (!forceRefresh && defaultCacheConfig.enabled) {
        try {
          const cachedData = await multiLevelCache.get(cacheKey);
          if (cachedData) {
            setCacheStats(prev => ({ ...prev, [key]: { hit: true, stale: false } }));
            return { key, data: cachedData, fromCache: true };
          }
        } catch (cacheError) {
          console.warn(`Cache read failed for ${key}:`, cacheError);
        }
      }

      // Fetch from source
      setCacheStats(prev => ({ ...prev, [key]: { hit: false, stale: false } }));
      const result = await fetchFn();
      
      if (result.success && result.data) {
        // Cache the result
        if (defaultCacheConfig.enabled) {
          try {
            await multiLevelCache.set(cacheKey, result.data, {
              ttl: defaultCacheConfig.ttl,
              priority: defaultCacheConfig.priority,
              tags: defaultCacheConfig.tags,
              persist: defaultCacheConfig.persist
            });
          } catch (cacheError) {
            console.warn(`Cache write failed for ${key}:`, cacheError);
          }
        }
        return { key, data: result.data, fromCache: false };
      } else {
        throw new Error(result.error || `Failed to fetch ${key}`);
      }
    });

    try {
      const results = await Promise.allSettled(promises);
      const successfulResults: Record<string, any> = {};
      const errors: string[] = [];

      results.forEach((result, index) => {
        const key = Object.keys(fetchFunctions)[index];
        if (result.status === 'fulfilled') {
          successfulResults[result.value.key] = result.value.data;
        } else {
          errors.push(`${key}: ${result.reason.message}`);
        }
      });

      if (Object.keys(successfulResults).length > 0) {
        setData(successfulResults as T);
        setResults(successfulResults as Partial<T>);
        onSuccess?.(successfulResults);
      }

      if (errors.length > 0) {
        const errorMessage = errors.join('; ');
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [fetchFunctions, enabled, defaultCacheConfig, keyGenerator, onSuccess, onError]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [fetchData, enabled, refetchOnMount]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      refetch();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetch, refetchInterval, enabled]);

  return {
    data,
    loading,
    error,
    refetch,
    isRefetching,
    results,
    cacheStats
  };
};
