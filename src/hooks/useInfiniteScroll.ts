import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface InfiniteScrollOptions {
  /** Whether infinite scroll is enabled */
  enabled?: boolean;
  /** Threshold for triggering load more (in pixels from bottom) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Whether to load more on mount if content doesn't fill viewport */
  loadOnMount?: boolean;
  /** Delay between load more requests (ms) */
  throttleDelay?: number;
  /** Maximum number of retries on error */
  maxRetries?: number;
  /** Delay between retries (ms) */
  retryDelay?: number;
  /** Whether to reset data when dependencies change */
  resetOnDependencyChange?: boolean;
}

export interface InfiniteScrollState<T> {
  /** All loaded data */
  data: T[];
  /** Whether currently loading */
  loading: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether there's an error */
  error: Error | null;
  /** Current page number */
  page: number;
  /** Total number of items loaded */
  totalCount: number;
  /** Whether initial load is complete */
  isInitialLoad: boolean;
  /** Whether loading more items */
  isLoadingMore: boolean;
  /** Retry count for current error */
  retryCount: number;
}

export interface InfiniteScrollActions {
  /** Load more items */
  loadMore: () => Promise<void>;
  /** Reset to initial state */
  reset: () => void;
  /** Retry last failed request */
  retry: () => Promise<void>;
  /** Manually set data */
  setData: (data: any[]) => void;
  /** Append data to existing data */
  appendData: (newData: any[]) => void;
  /** Prepend data to existing data */
  prependData: (newData: any[]) => void;
  /** Remove item by index */
  removeItem: (index: number) => void;
  /** Update item by index */
  updateItem: (index: number, item: any) => void;
}

export interface InfiniteScrollReturn<T> extends InfiniteScrollState<T>, InfiniteScrollActions {
  /** Ref to attach to the trigger element */
  triggerRef: React.RefObject<HTMLElement>;
  /** Whether the trigger element is visible */
  isTriggerVisible: boolean;
}

/**
 * Hook for infinite scrolling with large datasets
 * 
 * Features:
 * - Intersection observer-based triggering
 * - Automatic retry on error
 * - Throttling to prevent excessive requests
 * - Memory management
 * - Flexible data manipulation
 * 
 * @param fetchFn Function to fetch data for a specific page
 * @param options Configuration options
 * @returns Infinite scroll state and actions
 * 
 * @example
 * const {
 *   data,
 *   loading,
 *   hasMore,
 *   loadMore,
 *   triggerRef
 * } = useInfiniteScroll(
 *   async (page) => {
 *     const response = await fetch(`/api/items?page=${page}`);
 *     return response.json();
 *   },
 *   {
 *     threshold: 100,
 *     throttleDelay: 500,
 *     maxRetries: 3
 *   }
 * );
 */
export function useInfiniteScroll<T>(
  fetchFn: (page: number, signal?: AbortSignal) => Promise<{ data: T[]; hasMore: boolean; totalCount?: number }>,
  options: InfiniteScrollOptions = {}
): InfiniteScrollReturn<T> {
  const {
    enabled = true,
    threshold = 100,
    rootMargin = '0px',
    loadOnMount = true,
    throttleDelay = 300,
    maxRetries = 3,
    retryDelay = 1000,
    resetOnDependencyChange = true,
  } = options;

  // State
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const triggerRef = useRef<HTMLElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Intersection observer state
  const [isTriggerVisible, setIsTriggerVisible] = useState(false);

  // Memoized state
  const state: InfiniteScrollState<T> = useMemo(() => ({
    data,
    loading,
    hasMore,
    error,
    page,
    totalCount,
    isInitialLoad,
    isLoadingMore,
    retryCount,
  }), [data, loading, hasMore, error, page, totalCount, isInitialLoad, isLoadingMore, retryCount]);

  // Fetch data function
  const fetchData = useCallback(async (pageNum: number, isRetry = false): Promise<void> => {
    if (loading || (!hasMore && !isRetry)) return;

    // Throttle requests
    const now = Date.now();
    if (now - lastFetchTimeRef.current < throttleDelay) {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      throttleTimeoutRef.current = setTimeout(() => {
        fetchData(pageNum, isRetry);
      }, throttleDelay - (now - lastFetchTimeRef.current));
      return;
    }

    lastFetchTimeRef.current = now;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      if (isRetry) {
        setIsLoadingMore(true);
      } else if (pageNum === 1) {
        setIsInitialLoad(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await fetchFn(pageNum, abortControllerRef.current.signal);
      
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      setData(prevData => {
        if (pageNum === 1) {
          return result.data;
        } else {
          return [...prevData, ...result.data];
        }
      });

      setHasMore(result.hasMore);
      setTotalCount(result.totalCount || data.length + result.data.length);
      setPage(pageNum);
      setRetryCount(0);

      if (pageNum === 1) {
        setIsInitialLoad(false);
      } else {
        setIsLoadingMore(false);
      }

    } catch (err) {
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      const error = err as Error;
      setError(error);
      setRetryCount(prev => prev + 1);

      if (retryCount < maxRetries) {
        setTimeout(() => {
          fetchData(pageNum, true);
        }, retryDelay * Math.pow(2, retryCount));
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchFn, loading, hasMore, throttleDelay, retryCount, maxRetries, retryDelay]);

  // Load more function
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return;
    await fetchData(page + 1);
  }, [fetchData, hasMore, loading, page]);

  // Reset function
  const reset = useCallback(() => {
    setData([]);
    setLoading(false);
    setHasMore(true);
    setError(null);
    setPage(1);
    setTotalCount(0);
    setIsInitialLoad(false);
    setIsLoadingMore(false);
    setRetryCount(0);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
  }, []);

  // Retry function
  const retry = useCallback(async (): Promise<void> => {
    if (error && retryCount < maxRetries) {
      await fetchData(page, true);
    }
  }, [fetchData, error, retryCount, maxRetries, page]);

  // Set data function
  const setDataManually = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  // Append data function
  const appendData = useCallback((newData: T[]) => {
    setData(prevData => [...prevData, ...newData]);
  }, []);

  // Prepend data function
  const prependData = useCallback((newData: T[]) => {
    setData(prevData => [...newData, ...prevData]);
  }, []);

  // Remove item function
  const removeItem = useCallback((index: number) => {
    setData(prevData => prevData.filter((_, i) => i !== index));
  }, []);

  // Update item function
  const updateItem = useCallback((index: number, item: T) => {
    setData(prevData => prevData.map((existingItem, i) => i === index ? item : existingItem));
  }, []);

  // Actions object
  const actions: InfiniteScrollActions = useMemo(() => ({
    loadMore,
    reset,
    retry,
    setData: setDataManually,
    appendData,
    prependData,
    removeItem,
    updateItem,
  }), [loadMore, reset, retry, setDataManually, appendData, prependData, removeItem, updateItem]);

  // Intersection observer effect
  useEffect(() => {
    if (!enabled || !triggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsTriggerVisible(entry.isIntersecting);
        }
      },
      {
        threshold: 0,
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(triggerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [enabled, threshold]);

  // Load more when trigger becomes visible
  useEffect(() => {
    if (enabled && isTriggerVisible && hasMore && !loading) {
      loadMore();
    }
  }, [enabled, isTriggerVisible, hasMore, loading, loadMore]);

  // Initial load on mount
  useEffect(() => {
    if (enabled && loadOnMount && data.length === 0 && !loading) {
      fetchData(1);
    }
  }, [enabled, loadOnMount, data.length, loading, fetchData]);

  // Reset on dependency change
  useEffect(() => {
    if (resetOnDependencyChange) {
      reset();
    }
  }, [fetchFn, resetOnDependencyChange, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    ...actions,
    triggerRef,
    isTriggerVisible,
  };
}

export default useInfiniteScroll;
