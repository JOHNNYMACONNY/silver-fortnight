import React, { useMemo, useCallback, useRef, createContext, useContext } from 'react';
import { cn } from '../../utils/cn';
import { generateAsymmetricClasses, ASYMMETRIC_PATTERNS } from '../../utils/asymmetricLayouts'; 
import Box from '../layout/primitives/Box';
import Grid from '../layout/primitives/Grid';
import Stack from '../layout/primitives/Stack';

/**
 * Context to share grid properties with child items.
 */
const BentoContext = createContext<{
  layoutPattern: 'symmetric' | 'asymmetric';
  containerQueries: boolean;
  autoFit: boolean;
}>({
  layoutPattern: 'symmetric',
  containerQueries: false,
  autoFit: false,
});

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  columns?: number | { [key: string]: number };
  rows?: number;
  layoutPattern?: 'symmetric' | 'asymmetric';
  visualRhythm?: 'none' | 'alternating' | 'progressive';
  contentAwareLayout?: boolean;
  responsiveStrategy?: 'viewport-only' | 'container-query';
  
  // Phase 3.1: New advanced layout features
  autoFit?: boolean;
  masonry?: boolean;
  minItemWidth?: string; // For autoFit (default: '280px')
  containerQueries?: boolean;
}

export interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number | { [key: string]: number };
  rowSpan?: number | { [key: string]: number };
  featured?: boolean;
  layoutRole?: 'simple' | 'complex' | 'featured' | 'stats' | 'auto';
  asymmetricSize?: 'small' | 'large' | 'auto';
  contentType?: 'feature' | 'stats' | 'integration' | 'media' | 'text' | 'mixed';
  responsiveBehavior?: 'stack' | 'reflow' | 'adaptive';
  contentAwareLayout?: boolean;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className = '',
  gap = 'md',
  columns = 6,
  rows,
  layoutPattern = 'asymmetric',
  visualRhythm = 'alternating',
  contentAwareLayout = false,
  responsiveStrategy = 'viewport-only',
  autoFit = false,
  masonry = false,
  minItemWidth = '280px',
  containerQueries = false,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Define gap sizes
  const gapSizes = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  // Phase 3.1: Container query support
  const containerQueryClasses = useMemo(() => {
    if (!containerQueries) return '';
    
    return `
      container-type-inline-size
      @container
    `;
  }, [containerQueries]);

  // Phase 3.1: AutoFit grid classes
  const autoFitClasses = useMemo(() => {
    if (!autoFit) return '';
    
    return `
      grid
      auto-cols-fr
      grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]
    `;
  }, [autoFit, minItemWidth]);

  // Phase 3.1: Masonry layout classes
  const masonryClasses = useMemo(() => {
    if (!masonry) return '';
    
    return `
      columns-1
      md:columns-2
      lg:columns-3
      xl:columns-4
      space-y-4
    `;
  }, [masonry]);

  const layoutClasses = useMemo(() => {
    if (layoutPattern === 'symmetric') {
      if (autoFit) return autoFitClasses;
      if (masonry) return masonryClasses;
      
      // Traditional grid with responsive columns
      const responsiveColumns = typeof columns === 'object' 
        ? Object.entries(columns)
            .map(([breakpoint, cols]) => 
              breakpoint === 'base' 
                ? `grid-cols-${cols}` 
                : `${breakpoint}:grid-cols-${cols}`
            )
            .join(' ')
        : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${columns}`;
      
      return `grid ${responsiveColumns}`;
    }
    // For asymmetric layouts, we use a flexbox container for each row.
    return '';
  }, [layoutPattern, autoFit, masonry, autoFitClasses, masonryClasses, columns]);

  const gridRows = rows ? `grid-rows-${rows}` : '';

  // This function implements the core logic for asymmetric layouts and visual rhythm.
  const arrangeAsymmetricChildren = useCallback(() => {
    if (layoutPattern !== 'asymmetric') return children;
    
    const patternKey = {
      'alternating': 'asymmetric-standard',
      'progressive': 'asymmetric-progressive',
      'none': 'asymmetric-none',
    }[visualRhythm] || 'asymmetric-standard';
    
    const patternConfig = ASYMMETRIC_PATTERNS[patternKey];
    if (!patternConfig) {
      console.warn(`Asymmetric pattern '${patternKey}' not found, falling back to standard`);
      return children;
    }
    
    const childArray = React.Children.toArray(children);
    const rows: React.ReactNode[][] = [];
    let currentRow: React.ReactNode[] = [];
    
    childArray.forEach((child, index) => {
      if (React.isValidElement(child)) {
        currentRow.push(child);
        
        // Create a new row when we have 2 items or if this is the last item
        if (currentRow.length === 2 || index === childArray.length - 1) {
          rows.push([...currentRow]);
          currentRow = [];
        }
      }
    });
    
    return rows.map((row, rowIndex) => (
      <Box
        key={`asymmetric-row-${rowIndex}`}
        className={cn(
          generateAsymmetricClasses(patternConfig, rowIndex, gapSizes[gap]),
          'w-full mb-6 last:mb-0'
        )}
      >
        {row}
      </Box>
    ));
  }, [children, layoutPattern, visualRhythm, gap, gapSizes]);

  const content = layoutPattern === 'symmetric' 
    ? children 
    : arrangeAsymmetricChildren();

  // For Grid and Stack, only pass valid gap values (no 'none')
  const gridGap = gap === 'none' ? 'sm' : gap;

  return (
    <BentoContext.Provider value={{
      layoutPattern,
      containerQueries,
      autoFit,
    }}>
      <div
        ref={gridRef}
        className={cn(
          layoutClasses,
          gridRows,
          gapSizes[gap],
          containerQueryClasses,
          'w-full',
          className
        )}
        style={{
          // Phase 3.1: CSS custom properties for container queries
          ...(containerQueries && {
            '--min-item-width': minItemWidth,
          } as React.CSSProperties),
        }}
        data-layout-pattern={layoutPattern}
        data-auto-fit={autoFit}
        data-masonry={masonry}
        data-container-queries={containerQueries}
      >
        {content}
      </div>
    </BentoContext.Provider>
  );
};

export const BentoItem: React.FC<BentoItemProps> = ({
  children,
  className = '',
  colSpan = 1,
  rowSpan = 1,
  featured = false,
  layoutRole = 'auto',
  asymmetricSize = 'auto',
  contentType = 'mixed',
  responsiveBehavior = 'adaptive',
  contentAwareLayout = false,
}) => {
  const { layoutPattern, containerQueries, autoFit } = useContext(BentoContext);

  // Helper to generate responsive col-span classes
  function getColSpanClasses(colSpan: number | { [key: string]: number }) {
    if (typeof colSpan === 'number') {
      return `col-span-${colSpan}`;
    }
    return Object.entries(colSpan)
      .map(([breakpoint, value]) =>
        breakpoint === 'base' ? `col-span-${value}` : `${breakpoint}:col-span-${value}`
      )
      .join(' ');
  }

  // Helper to generate responsive row-span classes
  function getRowSpanClasses(rowSpan: number | { [key: string]: number }) {
    if (typeof rowSpan === 'number') {
      return `row-span-${rowSpan}`;
    }
    return Object.entries(rowSpan)
      .map(([breakpoint, value]) =>
        breakpoint === 'base' ? `row-span-${value}` : `${breakpoint}:row-span-${value}`
      )
      .join(' ');
  }

  // Phase 3.1: Container query responsive classes
  const containerQueryClasses = useMemo(() => {
    if (!containerQueries) return '';
    
    return `
      @container
      @[40rem]:flex-row
      @[60rem]:text-lg
    `;
  }, [containerQueries]);

  // Phase 3.1: AutoFit specific classes
  const autoFitClasses = useMemo(() => {
    if (!autoFit) return '';
    
    return `
      break-inside-avoid
      mb-4
    `;
  }, [autoFit]);

  // Phase 3.1: Content-aware layout classes
  const contentAwareClasses = useMemo(() => {
    if (!contentAwareLayout) return '';
    
    const roleClasses = {
      simple: 'p-4',
      complex: 'p-6',
      featured: 'p-8 ring-2 ring-primary/20',
      stats: 'p-4 text-center',
      auto: 'p-4',
    };
    
    const typeClasses = {
      feature: 'bg-gradient-to-br from-primary/5 to-secondary/5',
      stats: 'bg-gradient-to-br from-accent/5 to-primary/5',
      integration: 'bg-gradient-to-br from-secondary/5 to-accent/5',
      media: 'overflow-hidden',
      text: 'prose prose-sm max-w-none',
      mixed: '',
    };
    
    return `${roleClasses[layoutRole]} ${typeClasses[contentType]}`;
  }, [contentAwareLayout, layoutRole, contentType]);

  return (
    <Box
      className={cn(
        'min-w-0',
        layoutPattern === 'symmetric' && getColSpanClasses(colSpan),
        layoutPattern === 'symmetric' && getRowSpanClasses(rowSpan),
        featured ? 'shadow-lg ring-2 ring-primary-400' : '',
        containerQueryClasses,
        autoFitClasses,
        contentAwareClasses,
        className
      )}
      data-layout-role={layoutRole}
      data-content-type={contentType}
      data-asymmetric-size={asymmetricSize}
    >
      {children}
    </Box>
  );
};
