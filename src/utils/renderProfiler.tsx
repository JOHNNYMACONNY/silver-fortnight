import React, { Profiler, ProfilerOnRenderCallback } from 'react';
import { logger } from '@utils/logging/logger';

interface RenderInfo {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

/**
 * Store for render information
 */
const renderInfoStore: RenderInfo[] = [];

/**
 * Threshold for considering a render as "slow" (in milliseconds)
 */
const SLOW_RENDER_THRESHOLD = 16; // ~1 frame at 60fps

// @ts-expect-error React Profiler callback signature mismatch between types and runtime
const handleRender: ProfilerOnRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
  interactions: any,
  ...rest: any[]
) => {
  // Store render information
  renderInfoStore.push({
    id,
    phase: phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  });
  
  // Log slow renders
  if (actualDuration > SLOW_RENDER_THRESHOLD) {
    logger.warn(`Slow render detected: ${id} took ${actualDuration.toFixed(2)}ms to render (${phase})`, 'UTILITY');
  }
};

/**
 * Get render information for a specific component
 * @param componentId ID of the component
 * @returns Array of render information for the component
 */
export const getComponentRenderInfo = (componentId: string): RenderInfo[] => {
  return renderInfoStore.filter(info => info.id === componentId);
};

/**
 * Get components with the most renders
 * @param limit Maximum number of components to return
 * @returns Array of component IDs and their render counts
 */
export const getMostRenderedComponents = (limit = 10): { id: string; count: number }[] => {
  const counts: Record<string, number> = {};
  
  renderInfoStore.forEach(info => {
    counts[info.id] = (counts[info.id] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Get components with the slowest renders
 * @param limit Maximum number of components to return
 * @returns Array of component IDs and their average render durations
 */
export const getSlowestComponents = (limit = 10): { id: string; avgDuration: number }[] => {
  const durations: Record<string, number[]> = {};
  
  renderInfoStore.forEach(info => {
    if (!durations[info.id]) {
      durations[info.id] = [];
    }
    durations[info.id].push(info.actualDuration);
  });
  
  return Object.entries(durations)
    .map(([id, durationArray]) => ({
      id,
      avgDuration: durationArray.reduce((sum, duration) => sum + duration, 0) / durationArray.length
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, limit);
};

/**
 * Clear all stored render information
 */
export const clearRenderInfo = (): void => {
  renderInfoStore.length = 0;
};

/**
 * Generate a report of render performance
 * @returns Markdown-formatted report
 */
export const generateRenderReport = (): string => {
  let report = '# Component Render Performance Report\n\n';
  
  // Most rendered components
  report += '## Most Frequently Rendered Components\n\n';
  report += '| Component | Render Count |\n';
  report += '|-----------|-------------|\n';
  
  getMostRenderedComponents(20).forEach(({ id, count }) => {
    report += `| ${id} | ${count} |\n`;
  });
  
  // Slowest components
  report += '\n## Slowest Components (Average Render Duration)\n\n';
  report += '| Component | Average Duration (ms) |\n';
  report += '|-----------|----------------------|\n';
  
  getSlowestComponents(20).forEach(({ id, avgDuration }) => {
    report += `| ${id} | ${avgDuration.toFixed(2)} |\n`;
  });
  
  // Recommendations
  report += '\n## Recommendations\n\n';
  report += '- Components with high render counts may benefit from memoization (React.memo)\n';
  report += '- Slow components should be optimized or split into smaller components\n';
  report += '- Check for unnecessary re-renders caused by prop changes\n';
  report += '- Ensure proper dependency arrays in useEffect, useMemo, and useCallback hooks\n';
  
  return report;
};

/**
 * RenderProfiler component
 * 
 * Wraps a component with React's Profiler to track render performance
 * 
 * @param id Unique identifier for the profiled component
 * @param children Component to profile
 */
export const RenderProfiler: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children
}) => {
  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
};
