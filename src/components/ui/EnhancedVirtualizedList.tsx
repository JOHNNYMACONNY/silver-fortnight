import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeList as List, VariableSizeList as VariableList } from 'react-window';
import { FixedSizeListProps, VariableSizeListProps } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export interface EnhancedVirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels (for fixed size) */
  itemHeight?: number;
  /** Function to get item height dynamically (for variable size) */
  getItemSize?: (index: number) => number;
  /** Estimated item height for initial render (variable size only) */
  estimatedItemSize?: number;
  /** Function to render each item */
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /** Container height */
  height: number;
  /** Container width */
  width?: number | string;
  /** Number of items to render outside of visible area */
  overscanCount?: number;
  /** Custom CSS class */
  className?: string;
  /** Message to show when no items */
  emptyMessage?: string;
  /** Loading component */
  loadingComponent?: React.ReactNode;
  /** Error component */
  errorComponent?: React.ReactNode;
  /** Whether to show loading state */
  isLoading?: boolean;
  /** Whether there's an error */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Whether there are more items to load */
  hasNextPage?: boolean;
  /** Whether next page is loading */
  isNextPageLoading?: boolean;
  /** Function to load next page */
  loadNextPage?: () => void;
  /** Function to retry on error */
  onRetry?: () => void;
  /** Function to refresh data */
  onRefresh?: () => Promise<void> | void;
  /** Whether to enable infinite scrolling */
  enableInfiniteScroll?: boolean;
  /** Threshold for triggering infinite scroll (in pixels from bottom) */
  infiniteScrollThreshold?: number;
  /** Whether to enable pull-to-refresh */
  enablePullToRefresh?: boolean;
  /** Custom scrollbar styling */
  scrollbarStyle?: React.CSSProperties;
  /** Performance monitoring */
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  /** Animation duration for item updates */
  animationDuration?: number;
  /** Whether to enable item animations */
  enableAnimations?: boolean;
}

export interface PerformanceMetrics {
  renderTime: number;
  scrollFPS: number;
  memoryUsage: number;
  itemCount: number;
  visibleItemCount: number;
}

/**
 * Enhanced VirtualizedList - High-performance list component for large datasets
 * 
 * Features:
 * - Fixed and variable size item support
 * - Infinite scrolling with intersection observer
 * - Pull-to-refresh functionality
 * - Performance monitoring
 * - Error handling and retry logic
 * - Smooth animations
 * - Memory optimization
 * 
 * @example
 * <EnhancedVirtualizedList
 *   items={users}
 *   itemHeight={80}
 *   height={600}
 *   renderItem={(user, index, style) => (
 *     <div style={style} className="p-4 border-b">
 *       <UserCard user={user} />
 *     </div>
 *   )}
 *   hasNextPage={hasMore}
 *   isNextPageLoading={loading}
 *   loadNextPage={loadMore}
 *   enableInfiniteScroll
 *   enablePullToRefresh
 * />
 */
export function EnhancedVirtualizedList<T>({
  items,
  itemHeight = 50,
  getItemSize,
  estimatedItemSize = 50,
  renderItem,
  height,
  width = '100%',
  overscanCount = 5,
  className = '',
  emptyMessage = 'No items to display',
  loadingComponent,
  errorComponent,
  isLoading = false,
  hasError = false,
  errorMessage = 'Failed to load items',
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  onRetry,
  onRefresh,
  enableInfiniteScroll = false,
  infiniteScrollThreshold = 100,
  enablePullToRefresh = false,
  scrollbarStyle,
  onPerformanceUpdate,
  animationDuration = 200,
  enableAnimations = true,
}: EnhancedVirtualizedListProps<T>) {
  const fixedListRef = useRef<List>(null);
  const variableListRef = useRef<VariableList>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    scrollFPS: 0,
    memoryUsage: 0,
    itemCount: items.length,
    visibleItemCount: 0,
  });

  // Performance monitoring
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());

  // Calculate if we should use fixed or variable size
  const useVariableSize = !!getItemSize;
  const ListComponent = useVariableSize ? VariableList : List;

  // Memoized item count including loading indicator
  const itemCount = useMemo(() => {
    return items.length + (hasNextPage ? 1 : 0);
  }, [items.length, hasNextPage]);

  // Check if an item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return !hasNextPage || index < items.length;
  }, [hasNextPage, items.length]);

  // Render a single item
  const ItemRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const startTime = performance.now();
      
      // If the item is not loaded, render a loading placeholder
      if (!isItemLoaded(index)) {
        return (
          <div style={style} className="flex justify-center items-center p-4">
            <div className="animate-pulse h-full w-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          </div>
        );
      }

      // Render the actual item
      const item = items[index];
      const itemElement = renderItem(item, index, style);

      // Performance tracking
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (onPerformanceUpdate) {
        setPerformanceMetrics(prev => ({
          ...prev,
          renderTime: Math.max(prev.renderTime, renderTime),
          visibleItemCount: Math.max(prev.visibleItemCount, index + 1),
        }));
      }

      return itemElement;
    },
    [items, renderItem, isItemLoaded, onPerformanceUpdate]
  );

  // Handle infinite scroll
  const handleItemsRendered = useCallback(
    ({ visibleStopIndex }: { visibleStopIndex: number }) => {
      if (enableInfiniteScroll && hasNextPage && !isNextPageLoading && loadNextPage) {
        const threshold = Math.max(0, items.length - infiniteScrollThreshold / itemHeight);
        if (visibleStopIndex >= threshold) {
          loadNextPage();
        }
      }
    },
    [enableInfiniteScroll, hasNextPage, isNextPageLoading, loadNextPage, items.length, infiniteScrollThreshold, itemHeight]
  );

  // Handle pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh || !onRefresh) return;
    
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  }, [enablePullToRefresh, onRefresh]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh || !isPulling || !onRefresh) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, 100));
    }
  }, [enablePullToRefresh, isPulling, startY, onRefresh]);

  const handleTouchEnd = useCallback(() => {
    if (!enablePullToRefresh || !onRefresh) return;
    
    if (pullDistance > 50) {
      setIsRefreshing(true);
      const refreshPromise = onRefresh();
      if (refreshPromise && typeof refreshPromise.finally === 'function') {
        refreshPromise.finally(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        });
      } else {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    setIsPulling(false);
  }, [enablePullToRefresh, onRefresh, pullDistance]);

  // Performance monitoring setup
  useEffect(() => {
    if (!onPerformanceUpdate) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          // Track custom performance measures
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    performanceObserver.current = observer;

    // FPS monitoring
    const measureFPS = () => {
      const now = performance.now();
      frameCount.current++;
      
      if (now - lastFrameTime.current >= 1000) {
        const fps = (frameCount.current * 1000) / (now - lastFrameTime.current);
        setPerformanceMetrics(prev => ({
          ...prev,
          scrollFPS: fps,
        }));
        frameCount.current = 0;
        lastFrameTime.current = now;
      }
      
      requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      observer.disconnect();
    };
  }, [onPerformanceUpdate]);

  // Update performance metrics when items change
  useEffect(() => {
    setPerformanceMetrics(prev => ({
      ...prev,
      itemCount: items.length,
    }));
  }, [items.length]);

  // Scroll to top when items change
  useEffect(() => {
    const currentRef = useVariableSize ? variableListRef.current : fixedListRef.current;
    if (currentRef) {
      currentRef.scrollTo(0);
    }
  }, [items, useVariableSize]);

  // Handle error state
  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${className}`}>
        {errorComponent || (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Items
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errorMessage}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Handle loading state
  if (isLoading && items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        {loadingComponent || (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading items...</p>
          </div>
        )}
      </div>
    );
  }

  // Handle empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${className}`}>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{emptyMessage}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          )}
        </div>
      </div>
    );
  }

  // List props for fixed size
  const fixedListProps = {
    ref: fixedListRef,
    height,
    width: typeof width === 'string' ? width : (width || '100%'),
    itemCount,
    itemSize: itemHeight,
    overscanCount,
    onItemsRendered: handleItemsRendered,
    className: 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
    style: scrollbarStyle,
  };

  // List props for variable size
  const variableListProps = {
    ref: variableListRef,
    height,
    width: typeof width === 'string' ? width : (width || '100%'),
    itemCount,
    itemSize: getItemSize!,
    estimatedItemSize,
    overscanCount,
    onItemsRendered: handleItemsRendered,
    className: 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
    style: scrollbarStyle,
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {enablePullToRefresh && (
        <AnimatePresence>
          {(isPulling || isRefreshing) && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-0 left-0 right-0 z-10 flex justify-center p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                {isRefreshing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <RefreshCw className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Virtualized list */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationDuration / 1000 }}
        >
          {useVariableSize ? (
            <VariableList {...variableListProps}>
              {ItemRenderer}
            </VariableList>
          ) : (
            <List {...fixedListProps}>
              {ItemRenderer}
            </List>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default EnhancedVirtualizedList;
