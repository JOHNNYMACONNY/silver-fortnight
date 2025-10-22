/**
 * Performance Profiler for Development
 * 
 * Advanced performance profiling tools for component rendering and bundle analysis
 */

interface ProfilerSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  measurements: ProfilerMeasurement[];
}

interface ProfilerMeasurement {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'render' | 'network' | 'computation' | 'memory';
  metadata?: any;
}

interface ComponentProfile {
  name: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  slowestRender: number;
  fastestRender: number;
  memoryUsage?: number;
}

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  duplicates: string[];
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  usageCount: number;
}

export class PerformanceProfiler {
  private sessions: Map<string, ProfilerSession> = new Map();
  private componentProfiles: Map<string, ComponentProfile> = new Map();
  private isEnabled: boolean = false;
  private observer?: PerformanceObserver;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the profiler
   */
  private initialize(): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    this.isEnabled = true;
    this.setupPerformanceObserver();
    this.exposeToWindow();
    
    console.log('⚡ Performance Profiler initialized');
  }

  /**
   * Setup performance observer
   */
  private setupPerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('component-')) {
            this.recordComponentRender(entry);
          }
        });
      });

      this.observer.observe({ entryTypes: ['measure', 'mark'] });
    }
  }

  /**
   * Start a profiling session
   */
  startSession(name: string): string {
    const sessionId = Math.random().toString(36).substr(2, 9);
    const session: ProfilerSession = {
      id: sessionId,
      name,
      startTime: performance.now(),
      measurements: []
    };

    this.sessions.set(sessionId, session);
    performance.mark(`session-${sessionId}-start`);
    
    console.log(`🚀 Started profiling session: ${name} (${sessionId})`);
    return sessionId;
  }

  /**
   * End a profiling session
   */
  endSession(sessionId: string): ProfilerSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found`);
      return null;
    }

    session.endTime = performance.now();
    session.duration = session.endTime - session.startTime;
    
    performance.mark(`session-${sessionId}-end`);
    performance.measure(
      `session-${sessionId}`,
      `session-${sessionId}-start`,
      `session-${sessionId}-end`
    );

    console.log(`✅ Ended profiling session: ${session.name} (${session.duration.toFixed(2)}ms)`);
    return session;
  }

  /**
   * Profile a function execution
   */
  profile<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    
    try {
      const result = fn();
      
      const endTime = performance.now();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const duration = endTime - startTime;
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Profile async function execution
   */
  async profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    
    try {
      const result = await fn();
      
      const endTime = performance.now();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const duration = endTime - startTime;
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Profile React component render
   */
  profileComponentRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    performance.mark(`component-${componentName}-start`);
    
    renderFn();
    
    performance.mark(`component-${componentName}-end`);
    performance.measure(
      `component-${componentName}`,
      `component-${componentName}-start`,
      `component-${componentName}-end`
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.updateComponentProfile(componentName, duration);
  }

  /**
   * Record component render from performance observer
   */
  private recordComponentRender(entry: PerformanceEntry): void {
    const componentName = entry.name.replace('component-', '');
    this.updateComponentProfile(componentName, entry.duration);
  }

  /**
   * Update component profile
   */
  public updateComponentProfile(componentName: string, duration: number): void {
    const existing = this.componentProfiles.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += duration;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.lastRenderTime = duration;
      existing.slowestRender = Math.max(existing.slowestRender, duration);
      existing.fastestRender = Math.min(existing.fastestRender, duration);
    } else {
      this.componentProfiles.set(componentName, {
        name: componentName,
        renderCount: 1,
        totalRenderTime: duration,
        averageRenderTime: duration,
        lastRenderTime: duration,
        slowestRender: duration,
        fastestRender: duration
      });
    }
  }

  /**
   * Get component profiles
   */
  getComponentProfiles(): ComponentProfile[] {
    return Array.from(this.componentProfiles.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }

  /**
   * Get slow components
   */
  getSlowComponents(threshold: number = 16): ComponentProfile[] {
    return this.getComponentProfiles()
      .filter(profile => profile.averageRenderTime > threshold);
  }

  /**
   * Analyze bundle size
   */
  async analyzeBundles(): Promise<BundleAnalysis> {
    if (typeof window === 'undefined') {
      throw new Error('Bundle analysis only available in browser');
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.includes('.js'));
    
    const chunks: ChunkInfo[] = jsResources.map(resource => ({
      name: resource.name.split('/').pop() || 'unknown',
      size: resource.transferSize || 0,
      gzippedSize: resource.encodedBodySize || 0,
      modules: [] // Would need build tool integration for detailed module info
    }));

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);

    return {
      totalSize,
      gzippedSize,
      chunks,
      dependencies: [], // Would need package.json analysis
      duplicates: [] // Would need build tool integration
    };
  }

  /**
   * Measure memory usage
   */
  measureMemoryUsage(): any {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  /**
   * Generate performance report
   */
  generateReport(): any {
    const componentProfiles = this.getComponentProfiles();
    const slowComponents = this.getSlowComponents();
    const memoryUsage = this.measureMemoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      componentProfiles,
      slowComponents,
      memoryUsage,
      sessions: Array.from(this.sessions.values()),
      recommendations: this.generateRecommendations(componentProfiles, slowComponents)
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    componentProfiles: ComponentProfile[],
    slowComponents: ComponentProfile[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (slowComponents.length > 0) {
      recommendations.push(
        `Consider optimizing ${slowComponents.length} slow components: ${slowComponents.slice(0, 3).map(c => c.name).join(', ')}`
      );
    }
    
    const highRenderCountComponents = componentProfiles.filter(c => c.renderCount > 100);
    if (highRenderCountComponents.length > 0) {
      recommendations.push(
        `Components with high render counts may benefit from memoization: ${highRenderCountComponents.slice(0, 3).map(c => c.name).join(', ')}`
      );
    }
    
    const memoryUsage = this.measureMemoryUsage();
    if (memoryUsage && memoryUsage.usedPercentage > 80) {
      recommendations.push('High memory usage detected. Consider implementing memory optimization strategies.');
    }
    
    return recommendations;
  }

  /**
   * Clear all profiling data
   */
  clear(): void {
    this.sessions.clear();
    this.componentProfiles.clear();
    performance.clearMarks();
    performance.clearMeasures();
    console.log('🧹 Performance profiler data cleared');
  }

  /**
   * Expose profiler to window object
   */
  private exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as any).__PERFORMANCE_PROFILER = this;
    }
  }
}

// React hook for component profiling
export const usePerformanceProfiler = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      performanceProfiler.updateComponentProfile(componentName, duration);
    };
  }
  
  return () => {}; // No-op in production
};

// Export singleton instance
export const performanceProfiler = new PerformanceProfiler();
