import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemSize: (index: number) => number;
  estimatedItemSize: number;
  width: number;
  height?: number;
  className?: string;
  onItemsRendered?: (props: { overscanStartIndex: number; overscanStopIndex: number; visibleStartIndex: number; visibleStopIndex: number; }) => any;
  overscanCount?: number;
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
  emptyMessage?: string;
  loadingComponent?: React.ReactNode;
  scrollToIndex?: number;
}

/**
 * VirtualizedList - A component for efficiently rendering large lists
 * 
 * This component uses react-window to virtualize lists, only rendering
 * the items that are visible in the viewport. It also supports infinite
 * loading with react-window-infinite-loader.
 * 
 * @example
 * // Basic usage
 * <VirtualizedList
 *   items={items}
 *   itemHeight={100}
 *   renderItem={(item, index, style) => (
 *     <div style={style}>
 *       <div className="p-4">{item.title}</div>
 *     </div>
 *   )}
 * />
 * 
 * @example
 * // With infinite loading
 * // NOTE: Infinite loading functionality and props (hasNextPage, isNextPageLoading, loadNextPage)
 * // are currently unused in this component as implemented, and require react-window-infinite-loader.
 * <VirtualizedList
 *   items={items}
 *   itemHeight={100}
 *   renderItem={(item, index, style) => (
 *     <div style={style}>
 *       <div className="p-4">{item.title}</div>
 *     </div>
 *   )}
 * />
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  getItemSize,
  estimatedItemSize,
  width,
  height: propHeight,
  className = '',
  onItemsRendered,
  overscanCount = 3,
  hasNextPage = false,
  isNextPageLoading = false,
  emptyMessage = 'No items to display',
  loadingComponent,
  scrollToIndex,
}: VirtualizedListProps<T>) {
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(propHeight || 0);

  // Update height on window resize
  useEffect(() => {
    if (!propHeight && containerRef.current) {
      const observer = new ResizeObserver(() => {
        if (containerRef.current) {
          setListHeight(containerRef.current.clientHeight);
        }
      });
      observer.observe(containerRef.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [propHeight]);

  // Scroll to index when scrollToIndex changes
  useEffect(() => {
    if (scrollToIndex !== undefined && listRef.current) {
      listRef.current.scrollToItem(scrollToIndex, 'start');
    }
  }, [scrollToIndex]);

  // If there are no items and we're not loading more, show empty message
  if (items.length === 0 && !isNextPageLoading) {
    return (
      <div className={`bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border text-center transition-colors ${className}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // If we're loading and there are no items, show loading component
  if (items.length === 0 && isNextPageLoading) {
    return loadingComponent || (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500"></div>
      </div>
    );
  }

  // Calculate item count (including loading item if needed)
  const itemCount = hasNextPage ? items.length + 1 : items.length;

  // Check if an item is loaded
  const isItemLoaded = (index: number) => !hasNextPage || index < items.length;

  // Render a row
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      // If the item is not loaded, render a loading placeholder
      if (!isItemLoaded(index)) {
        return (
          <div style={style} className="flex justify-center items-center">
            <div className="animate-pulse h-full w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        );
      }

      // Otherwise, render the item
      const item = items[index];
      return renderItem(item, index, style);
    },
    [items, renderItem, isItemLoaded]
  );

  return (
    <div ref={containerRef} className={className} style={{ flex: propHeight === undefined ? 1 : undefined }}>
      {listHeight > 0 && (
        <List
          ref={listRef}
          height={listHeight}
          itemCount={itemCount}
          itemSize={getItemSize}
          width={width}
          estimatedItemSize={estimatedItemSize}
          onItemsRendered={onItemsRendered}
          overscanCount={overscanCount}
        >
          {Row}
        </List>
      )}
    </div>
  );
}
