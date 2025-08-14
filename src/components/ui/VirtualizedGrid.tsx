import React, { useState, useEffect } from 'react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';
import Box from '../layout/primitives/Box';
import Stack from '../layout/primitives/Stack';

interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  columnCount: number;
  renderItem: (item: T, rowIndex: number, columnIndex: number, style: React.CSSProperties) => React.ReactNode;
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
  loadNextPage?: () => void;
  overscanCount?: number;
  className?: string;
  emptyMessage?: string;
  loadingComponent?: React.ReactNode;
  gap?: number;
}

/**
 * VirtualizedGrid - A component for efficiently rendering large grids of items
 *
 * This component uses react-window to virtualize grids, only rendering
 * the items that are visible in the viewport. It also supports infinite
 * loading with react-window-infinite-loader.
 *
 * @example
 * // Basic usage
 * <VirtualizedGrid
 *   items={items}
 *   itemHeight={200}
 *   columnCount={3}
 *   renderItem={(item, rowIndex, columnIndex, style) => (
 *     <div style={style}>
 *       <div className="p-4 m-2">{item.title}</div>
 *     </div>
 *   )}
 * />
 *
 * @example
 * // With infinite loading
 * <VirtualizedGrid
 *   items={items}
 *   itemHeight={200}
 *   columnCount={3}
 *   renderItem={(item, rowIndex, columnIndex, style) => (
 *     <div style={style}>
 *       <div className="p-4 m-2">{item.title}</div>
 *     </div>
 *   )}
 *   hasNextPage={hasNextPage}
 *   isNextPageLoading={isLoading}
 *   loadNextPage={loadNextPage}
 * />
 */
function VirtualizedGrid<T>({
  items,
  itemHeight,
  columnCount,
  renderItem,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage = () => {},
  overscanCount = 5,
  className = '',
  emptyMessage = 'No items to display',
  loadingComponent,
  gap = 16, // Default gap between items (in pixels)
}: VirtualizedGridProps<T>) {
  // We don't need to track height here as AutoSizer handles it
  const [, setHeight] = useState(window.innerHeight);

  // Update height on window resize
  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // If there are no items and we're not loading more, show empty message
  if (items.length === 0 && !isNextPageLoading) {
    return (
      <Box className={`bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border text-center transition-colors ${className}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Box>
    );
  }

  // If we're loading and there are no items, show loading component
  if (items.length === 0 && isNextPageLoading) {
      return loadingComponent || (
      <Stack align="center" distribute="center" className="py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500"></div>
      </Stack>
    );
  }

  // Calculate row count
  const rowCount = Math.ceil(items.length / columnCount) + (hasNextPage ? 1 : 0);

  // Check if an item at a specific row and column is loaded
  const isItemLoaded = (rowIndex: number, columnIndex: number) => {
    const itemIndex = rowIndex * columnCount + columnIndex;
    return !hasNextPage || itemIndex < items.length;
  };

  // Render a cell
  const Cell = ({ rowIndex, columnIndex, style }: GridChildComponentProps) => {
    const itemIndex = rowIndex * columnCount + columnIndex;

    // Apply gap to the style
    const styleWithGap = {
      ...style,
      left: Number(style.left) + gap / 2,
      top: Number(style.top) + gap / 2,
      width: Number(style.width) - gap,
      height: Number(style.height) - gap,
    };

    // If the item index is out of bounds, don't render anything
    if (itemIndex >= items.length) {
      return null;
    }

    // If the item is not loaded, render a loading placeholder
    if (!isItemLoaded(rowIndex, columnIndex)) {
      return (
        <div style={styleWithGap} className="flex justify-center items-center">
          <div className="animate-pulse h-full w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      );
    }

    // Otherwise, render the item
    return renderItem(items[itemIndex], rowIndex, columnIndex, styleWithGap);
  };

  return (
    <Box className={className} style={{ height: '100%', width: '100%' }}>
      <AutoSizer>
        {({ width, height }) => {
          // Calculate column width based on available width and column count
          const columnWidth = width / columnCount;

          return (
            <InfiniteLoader
              isItemLoaded={(index: number) => {
                const rowIndex = Math.floor(index / columnCount);
                const columnIndex = index % columnCount;
                return isItemLoaded(rowIndex, columnIndex);
              }}
              itemCount={items.length + (hasNextPage ? 1 : 0)}
              loadMoreItems={isNextPageLoading ? () => {} : loadNextPage}
            >
              {({ onItemsRendered, ref }: { onItemsRendered: any, ref: any }) => {
                // Convert from grid to list onItemsRendered
                const onGridItemsRendered = ({
                  visibleRowStartIndex,
                  visibleRowStopIndex,
                  visibleColumnStartIndex,
                  visibleColumnStopIndex,
                }: {
                  visibleRowStartIndex: number;
                  visibleRowStopIndex: number;
                  visibleColumnStartIndex: number;
                  visibleColumnStopIndex: number;
                }) => {
                  const visibleStartIndex = visibleRowStartIndex * columnCount + visibleColumnStartIndex;
                  const visibleStopIndex = visibleRowStopIndex * columnCount + visibleColumnStopIndex;

                  onItemsRendered({
                    visibleStartIndex,
                    visibleStopIndex,
                    overscanStartIndex: Math.max(0, visibleStartIndex - overscanCount),
                    overscanStopIndex: Math.min(items.length - 1, visibleStopIndex + overscanCount),
                  });
                };

                return (
                  <Grid
                    ref={(grid: any) => {
                      ref(grid);
                    }}
                    columnCount={columnCount}
                    columnWidth={columnWidth}
                    height={height}
                    rowCount={rowCount}
                    rowHeight={itemHeight + gap}
                    width={width}
                    onItemsRendered={onGridItemsRendered}
                    overscanRowCount={overscanCount}
                  >
                    {Cell}
                  </Grid>
                );
              }}
            </InfiniteLoader>
          );
        }}
      </AutoSizer>
    </Box>
  );
}

export default VirtualizedGrid;
