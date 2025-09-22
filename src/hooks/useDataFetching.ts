// src/hooks/useDataFetching.ts

import { useState, useEffect, useCallback } from 'react';
import { ServiceResponse } from '../services/collaboration';

export interface UseDataFetchingOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface UseDataFetchingReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

/**
 * Standardized data fetching hook template
 * Provides consistent loading, error, and refresh functionality
 */
export const useDataFetching = <T>(
  fetchFn: () => Promise<any>,
  options: UseDataFetchingOptions = {}
): UseDataFetchingReturn<T> => {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setError(null);
      const result = await fetchFn();
      
      if (result.success && result.data) {
        setData(result.data);
        onSuccess?.(result.data);
      } else {
        const errorMessage = result.error || 'Failed to fetch data';
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
  }, [fetchFn, enabled, onSuccess, onError]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [fetchData, enabled, refetchOnMount]);

  // Auto-refetch interval
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
    isRefetching 
  };
};

/**
 * Hook for fetching multiple data sources in parallel
 */
export const useParallelDataFetching = <T extends Record<string, any>>(
  fetchFunctions: Record<keyof T, () => Promise<any>>,
  options: UseDataFetchingOptions = {}
): UseDataFetchingReturn<T> => {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setError(null);
      
      // Execute all fetch functions in parallel
      const results = await Promise.allSettled(
        Object.entries(fetchFunctions).map(async ([key, fetchFn]) => {
          const result = await fetchFn();
          return { key, result };
        })
      );

      // Process results
      const combinedData = {} as T;
      const errors: string[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { key, result: serviceResult } = result.value;
          if (serviceResult.success && serviceResult.data) {
            combinedData[key as keyof T] = serviceResult.data;
          } else {
            errors.push(`${key}: ${serviceResult.error || 'Failed to fetch'}`);
          }
        } else {
          errors.push(`Promise rejected: ${result.reason}`);
        }
      });

      if (errors.length > 0) {
        const errorMessage = errors.join('; ');
        setError(errorMessage);
        onError?.(errorMessage);
      } else {
        setData(combinedData);
        onSuccess?.(combinedData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [fetchFunctions, enabled, onSuccess, onError]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [fetchData, enabled, refetchOnMount]);

  // Auto-refetch interval
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
    isRefetching 
  };
};
