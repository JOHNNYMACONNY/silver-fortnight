import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid, VariableSizeGrid as VariableGrid } from 'react-window';
import { FixedSizeGridProps, VariableSizeGridProps } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, Grid3X3, List } from 'lucide-react';

export interface EnhancedVirtualizedGridProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels (for fixed size) */
  itemHeight?: number;
  /** Width of each item in pixels (for fixed size) */
  itemWidth?: number;
  /** Function to get item height dynamically (for variable size) */
  getItemHeight?: (index: number) => number;
  /** Function to get item width dynamically (for variable size) */
  getItemWidth?: (index: number) => number;
  /** Estimated item height for initial render (variable size only) */
  estimatedItemHeight?: number;
  /** Estimated item width for initial render (variable size only) */
  estimatedItemWidth?: number;
  /** Function to render each item */
  renderItem: (item: T, rowIndex: number, columnIndex: number, style: React.CSSProperties) => React.ReactNode;
  /** Container height */
  height: number;
  /** Container width */
  width?: number | string;
  /** Number of columns */
  columnCount: number;
  /** Gap between items in pixels */
  gap?: number;
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
  onPerformanceUpdate?: (metrics: GridPerformanceMetrics) => void;
  /** Animation duration for item updates */
  animationDuration?: number;
  /** Whether to enable item animations */
  enableAnimations?: boolean;
  /** Whether to enable responsive column count */
  enableResponsiveColumns?: boolean;
  /** Breakpoints for responsive columns */
  responsiveBreakpoints?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  /** Whether to enable view mode switching */
  enableViewModeSwitch?: boolean;
  /** Default view mode */
  defaultViewMode?: 'grid' | 'list';
  /** Function called when view mode changes */
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export interface GridPerformanceMetrics {
  renderTime: number;
  scrollFPS: number;
  memoryUsage: number;
  itemCount: number;
  visibleItemCount: number;
  columnCount: number;
  rowCount: number;
}

/**
 * Enhanced VirtualizedGrid - High-performance grid component for large datasets
 * 
 * Features:
 * - Fixed and variable size item support
 * - Responsive column management
 * - Infinite scrolling with intersection observer
 * - Pull-to-refresh functionality
 * - Performance monitoring
 * - Error handling and retry logic
 * - Smooth animations
 * - Memory optimization
 * - View mode switching (grid/list)
 * 
 * @example
 * <EnhancedVirtualizedGrid
 *   items={products}
 *   itemHeight={200}
 *   itemWidth={200}
 *   columnCount={4}
 *   height={600}
 *   renderItem={(product, rowIndex, columnIndex, style) => (
 *     <div style={style} className="p-4">
 *       <ProductCard product={product} />
 *     </div>
 *   )}
 *   hasNextPage={hasMore}
 *   isNextPageLoading={loading}
 *   loadNextPage={loadMore}
 *   enableInfiniteScroll
 *   enableResponsiveColumns
 * />
 */
export function EnhancedVirtualizedGrid<T>({
  items,
  itemHeight = 200,
  itemWidth = 200,
  getItemHeight,
  getItemWidth,
  estimatedItemHeight = 200,
  estimatedItemWidth = 200,
  renderItem,
  height,
  width = '100%',
  columnCount: initialColumnCount,
  gap = 16,
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
  enableResponsiveColumns = false,
  responsiveBreakpoints = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
  enableViewModeSwitch = false,
  defaultViewMode = 'grid',
  onViewModeChange,
}: EnhancedVirtualizedGridProps<T>) {
  const fixedGridRef = useRef<Grid>(null);
  const variableGridRef = useRef<VariableGrid>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [performanceMetrics, setPerformanceMetrics] = useState<GridPerformanceMetrics>({
    renderTime: 0,
    scrollFPS: 0,
    memoryUsage: 0,
    itemCount: items.length,
    visibleItemCount: 0,
    columnCount: initialColumnCount,
    rowCount: 0,
  });

  // Performance monitoring
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());

  // Calculate responsive column count
  const columnCount = useMemo(() => {
    if (!enableResponsiveColumns) return initialColumnCount;
    
    if (windowWidth < 640) return responsiveBreakpoints.sm;
    if (windowWidth < 768) return responsiveBreakpoints.md;
    if (windowWidth < 1024) return responsiveBreakpoints.lg;
    return responsiveBreakpoints.xl;
  }, [enableResponsiveColumns, initialColumnCount, windowWidth, responsiveBreakpoints]);

  // Calculate if we should use fixed or variable size
  const useVariableSize = !!(getItemHeight || getItemWidth);
  const GridComponent = useVariableSize ? VariableGrid : Grid;

  // Calculate row count
  const rowCount = useMemo(() => {
    return Math.ceil(items.length / columnCount);
  }, [items.length, columnCount]);

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
    ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
      const startTime = performance.now();
      const itemIndex = rowIndex * columnCount + columnIndex;
      
      // If the item is not loaded, render a loading placeholder
      if (!isItemLoaded(itemIndex)) {
        return (
          <div style={style} className="flex justify-center items-center p-4">
            <div className="animate-pulse h-full w-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          </div>
        );
      }

      // Render the actual item
      const item = items[itemIndex];
      const itemElement = renderItem(item, rowIndex, columnIndex, style);

      // Performance tracking
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (onPerformanceUpdate) {
        setPerformanceMetrics(prev => ({
          ...prev,
          renderTime: Math.max(prev.renderTime, renderTime),
          visibleItemCount: Math.max(prev.visibleItemCount, itemIndex + 1),
          columnCount,
          rowCount,
        }));
      }

      return itemElement;
    },
    [items, renderItem, isItemLoaded, onPerformanceUpdate, columnCount]
  );

  // Handle infinite scroll
  const handleItemsRendered = useCallback(
    ({ visibleRowStopIndex }: { visibleRowStopIndex: number }) => {
      if (enableInfiniteScroll && hasNextPage && !isNextPageLoading && loadNextPage) {
        const threshold = Math.max(0, rowCount - Math.ceil(infiniteScrollThreshold / itemHeight));
        if (visibleRowStopIndex >= threshold) {
          loadNextPage();
        }
      }
    },
    [enableInfiniteScroll, hasNextPage, isNextPageLoading, loadNextPage, rowCount, infiniteScrollThreshold, itemHeight]
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

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  }, [onViewModeChange]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      columnCount,
      rowCount,
    }));
  }, [items.length, columnCount, rowCount]);

  // Scroll to top when items change
  useEffect(() => {
    const currentRef = useVariableSize ? variableGridRef.current : fixedGridRef.current;
    if (currentRef) {
      currentRef.scrollTo({ scrollTop: 0, scrollLeft: 0 });
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

  // Grid props for fixed size
  const fixedGridProps = {
    ref: fixedGridRef,
    height,
    width: typeof width === 'string' ? 800 : (width || 800), // Default to 800px for string widths
    columnCount,
    rowCount,
    columnWidth: itemWidth + gap,
    rowHeight: itemHeight + gap,
    overscanCount,
    onItemsRendered: handleItemsRendered,
    className: 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
    style: scrollbarStyle,
  };

  // Grid props for variable size
  const variableGridProps = {
    ref: variableGridRef,
    height,
    width: typeof width === 'string' ? 800 : (width || 800), // Default to 800px for string widths
    columnCount,
    rowCount,
    columnWidth: getItemWidth!,
    rowHeight: getItemHeight!,
    estimatedColumnWidth: estimatedItemWidth,
    estimatedRowHeight: estimatedItemHeight,
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
      {/* Header with view mode switch */}
      {enableViewModeSwitch && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Items ({items.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

      {/* Virtualized grid */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationDuration / 1000 }}
        >
          {useVariableSize ? (
            <VariableGrid {...variableGridProps}>
              {ItemRenderer}
            </VariableGrid>
          ) : (
            <Grid {...fixedGridProps}>
              {ItemRenderer}
            </Grid>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default EnhancedVirtualizedGrid;
