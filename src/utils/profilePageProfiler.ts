/**
 * ProfilePage Performance Profiler
 * 
 * Utility for collecting and analyzing performance metrics specific to ProfilePage
 * Integrates with React DevTools Profiler and Web Vitals
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export interface ProfilePageMetrics {
  scenario: string;
  timestamp: string;
  metrics: {
    fcp?: number;
    lcp?: number;
    inp?: number;
    cls?: number;
    ttfb?: number;
    renderTime?: number;
    reRenderCount?: number;
    memoryUsage?: number;
    networkRequests?: number;
    bundleSize?: number;
  };
  components: {
    name: string;
    renderTime: number;
    reRenderCount: number;
  }[];
  observations: string[];
}

class ProfilePageProfiler {
  private metrics: ProfilePageMetrics[] = [];
  private componentMetrics: Map<string, { renderTime: number; reRenderCount: number }> = new Map();
  private startTime: number = 0;
  private reRenderCounts: Map<string, number> = new Map();

  /**
   * Start profiling a scenario
   */
  startScenario(scenarioName: string): void {
    this.startTime = performance.now();
    this.componentMetrics.clear();
    this.reRenderCounts.clear();
    console.log(`🔍 Starting profiling scenario: ${scenarioName}`);
  }

  /**
   * Record component render
   */
  recordComponentRender(componentName: string, renderTime: number): void {
    const count = (this.reRenderCounts.get(componentName) || 0) + 1;
    this.reRenderCounts.set(componentName, count);

    this.componentMetrics.set(componentName, {
      renderTime,
      reRenderCount: count
    });
  }

  /**
   * Collect Web Vitals
   */
  async collectWebVitals(): Promise<{
    fcp?: number;
    lcp?: number;
    inp?: number;
    cls?: number;
    ttfb?: number;
  }> {
    return new Promise((resolve) => {
      const vitals: any = {};

      onFCP((metric) => {
        vitals.fcp = metric.value;
      });

      onLCP((metric) => {
        vitals.lcp = metric.value;
      });

      onINP((metric) => {
        vitals.inp = metric.value;
      });

      onCLS((metric) => {
        vitals.cls = metric.value;
      });

      onTTFB((metric) => {
        vitals.ttfb = metric.value;
      });

      // Wait a bit for all metrics to be collected
      setTimeout(() => resolve(vitals), 1000);
    });
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
    }
    return 0;
  }

  /**
   * Count network requests
   */
  getNetworkRequestCount(): number {
    const resources = performance.getEntriesByType('resource');
    return resources.length;
  }

  /**
   * End scenario and collect metrics
   */
  async endScenario(scenarioName: string, observations: string[] = []): Promise<ProfilePageMetrics> {
    const endTime = performance.now();
    const renderTime = endTime - this.startTime;

    const webVitals = await this.collectWebVitals();
    const memoryUsage = this.getMemoryUsage();
    const networkRequests = this.getNetworkRequestCount();

    const components = Array.from(this.componentMetrics.entries()).map(([name, data]) => ({
      name,
      renderTime: data.renderTime,
      reRenderCount: data.reRenderCount
    }));

    const metric: ProfilePageMetrics = {
      scenario: scenarioName,
      timestamp: new Date().toISOString(),
      metrics: {
        ...webVitals,
        renderTime,
        reRenderCount: components.reduce((sum, c) => sum + c.reRenderCount, 0),
        memoryUsage,
        networkRequests
      },
      components,
      observations
    };

    this.metrics.push(metric);
    console.log(`✅ Completed profiling scenario: ${scenarioName}`);
    console.log('Metrics:', metric);

    return metric;
  }

  /**
   * Get all collected metrics
   */
  getAllMetrics(): ProfilePageMetrics[] {
    return this.metrics;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Export metrics as CSV
   */
  exportMetricsCSV(): string {
    const headers = ['Scenario', 'Timestamp', 'FCP (ms)', 'LCP (ms)', 'FID (ms)', 'CLS', 'TTFB (ms)', 'Render Time (ms)', 'Re-renders', 'Memory (MB)', 'Network Requests'];
    const rows = this.metrics.map(m => [
      m.scenario,
      m.timestamp,
      m.metrics.fcp || '',
      m.metrics.lcp || '',
      m.metrics.inp || '',
      m.metrics.cls || '',
      m.metrics.ttfb || '',
      m.metrics.renderTime || '',
      m.metrics.reRenderCount || '',
      m.metrics.memoryUsage || '',
      m.metrics.networkRequests || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.componentMetrics.clear();
    this.reRenderCounts.clear();
  }
}

// Export singleton instance
export const profilePageProfiler = new ProfilePageProfiler();

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).profilePageProfiler = profilePageProfiler;
}

