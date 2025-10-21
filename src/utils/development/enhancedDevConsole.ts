/**
 * Enhanced Development Console
 * 
 * Provides comprehensive debugging and development utilities for TradeYa
 * Accessible via window.__DEV_CONSOLE in development mode
 */

interface PerformanceMetrics {
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  networkRequests: number;
  errorCount: number;
}

interface ComponentInfo {
  name: string;
  props: any;
  state: any;
  renderCount: number;
  lastRenderTime: number;
}

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
  size: number;
}

interface DevError {
  id: string;
  message: string;
  stack: string;
  timestamp: number;
  component?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class EnhancedDevConsole {
  private performanceMetrics: PerformanceMetrics = {
    renderTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    networkRequests: 0,
    errorCount: 0
  };

  private components: Map<string, ComponentInfo> = new Map();
  private networkRequests: NetworkRequest[] = [];
  private errors: DevError[] = [];
  private isEnabled: boolean = false;
  private performanceObserver?: PerformanceObserver;
  private networkInterceptor?: any;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the development console
   */
  private initialize(): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    this.isEnabled = true;
    this.setupPerformanceMonitoring();
    this.setupNetworkInterception();
    this.setupErrorTracking();
    this.exposeToWindow();
    
    console.log('🚀 Enhanced Development Console initialized');
    console.log('Access via window.__DEV_CONSOLE');
    this.showHelp();
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.performanceMetrics.renderTime = entry.duration;
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.performanceMetrics.memoryUsage = memory.usedJSHeapSize;
      }, 5000);
    }
  }

  /**
   * Setup network request interception
   */
  private setupNetworkInterception(): void {
    if (typeof window === 'undefined') return;

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      const options = args[1] || {};
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.trackNetworkRequest({
          id: Math.random().toString(36).substr(2, 9),
          url,
          method: options.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          timestamp: Date.now(),
          size: parseInt(response.headers.get('content-length') || '0')
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.trackNetworkRequest({
          id: Math.random().toString(36).substr(2, 9),
          url,
          method: options.method || 'GET',
          status: 0,
          duration: endTime - startTime,
          timestamp: Date.now(),
          size: 0
        });

        throw error;
      }
    };
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.trackError({
        id: Math.random().toString(36).substr(2, 9),
        message: event.message,
        stack: event.error?.stack || '',
        timestamp: Date.now(),
        severity: 'high'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        id: Math.random().toString(36).substr(2, 9),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack || '',
        timestamp: Date.now(),
        severity: 'critical'
      });
    });
  }

  /**
   * Track network request
   */
  private trackNetworkRequest(request: NetworkRequest): void {
    this.networkRequests.push(request);
    this.performanceMetrics.networkRequests++;
    
    // Keep only last 100 requests
    if (this.networkRequests.length > 100) {
      this.networkRequests.shift();
    }
  }

  /**
   * Track error
   */
  private trackError(error: DevError): void {
    this.errors.push(error);
    this.performanceMetrics.errorCount++;
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    console.error('🐛 Dev Console Error:', error);
  }

  /**
   * Track React component
   */
  public trackComponent(name: string, props: any, state: any): void {
    const existing = this.components.get(name);
    const renderCount = existing ? existing.renderCount + 1 : 1;
    
    this.components.set(name, {
      name,
      props,
      state,
      renderCount,
      lastRenderTime: performance.now()
    });
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get component information
   */
  public getComponents(): ComponentInfo[] {
    return Array.from(this.components.values());
  }

  /**
   * Get network requests
   */
  public getNetworkRequests(): NetworkRequest[] {
    return [...this.networkRequests];
  }

  /**
   * Get errors
   */
  public getErrors(): DevError[] {
    return [...this.errors];
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.components.clear();
    this.networkRequests.length = 0;
    this.errors.length = 0;
    this.performanceMetrics = {
      renderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
      networkRequests: 0,
      errorCount: 0
    };
    console.log('🧹 Dev Console cleared');
  }

  /**
   * Profile component render performance
   */
  public profileComponent(componentName: string, renderFn: () => void): number {
    const startTime = performance.now();
    performance.mark(`${componentName}-start`);
    
    renderFn();
    
    performance.mark(`${componentName}-end`);
    performance.measure(`${componentName}-render`, `${componentName}-start`, `${componentName}-end`);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`⚡ ${componentName} render time: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Analyze bundle size
   */
  public analyzeBundles(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const entries = performance.getEntriesByType('navigation');
      const resources = performance.getEntriesByType('resource');
      
      console.group('📦 Bundle Analysis');
      console.log('Navigation entries:', entries);
      console.log('Resource entries:', resources);
      
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const totalSize = jsResources.reduce((sum, r) => sum + (r as any).transferSize || 0, 0);
      
      console.log(`Total JS bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.groupEnd();
    }
  }

  /**
   * Show help information
   */
  public showHelp(): void {
    console.group('🛠️ Enhanced Dev Console Commands');
    console.log('getMetrics() - Get performance metrics');
    console.log('getComponents() - Get React component information');
    console.log('getNetworkRequests() - Get network request history');
    console.log('getErrors() - Get error history');
    console.log('clear() - Clear all tracked data');
    console.log('profileComponent(name, fn) - Profile component render');
    console.log('analyzeBundles() - Analyze bundle sizes');
    console.log('showHelp() - Show this help');
    console.groupEnd();
  }

  /**
   * Expose console to window object
   */
  private exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as any).__DEV_CONSOLE = this;
    }
  }
}

// Initialize the enhanced development console
export const enhancedDevConsole = new EnhancedDevConsole();

// React component tracking hook
export const useDevConsoleTracking = (componentName: string, props: any, state?: any) => {
  if (process.env.NODE_ENV === 'development') {
    enhancedDevConsole.trackComponent(componentName, props, state);
  }
};
