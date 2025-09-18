import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { RouteObject } from 'react-router-dom';

/**
 * Advanced code splitting configuration
 */
export interface CodeSplittingConfig {
  /** Enable intelligent prefetching based on user behavior */
  enableIntelligentPrefetch: boolean;
  /** Enable component-level splitting */
  enableComponentSplitting: boolean;
  /** Enable feature-based splitting */
  enableFeatureSplitting: boolean;
  /** Prefetch delay in milliseconds */
  prefetchDelay: number;
  /** Maximum concurrent prefetches */
  maxConcurrentPrefetches: number;
  /** Enable analytics-based splitting */
  enableAnalyticsSplitting: boolean;
}

/**
 * Component loading metadata
 */
export interface ComponentMetadata {
  name: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  estimatedSize: number;
  usageFrequency: number;
  loadTime: number;
}

/**
 * Route metadata for intelligent splitting
 */
export interface RouteMetadata {
  path: string;
  component: string;
  priority: 'critical' | 'important' | 'normal' | 'low';
  preloadConditions: string[];
  dependencies: string[];
  estimatedSize: number;
  userSegments: string[];
}

/**
 * Advanced Code Splitting Service
 */
export class AdvancedCodeSplittingService {
  private config: CodeSplittingConfig;
  private componentCache = new Map<string, LazyExoticComponent<ComponentType<any>>>();
  private prefetchQueue = new Set<string>();
  private loadingComponents = new Set<string>();
  private componentMetadata = new Map<string, ComponentMetadata>();
  private routeMetadata = new Map<string, RouteMetadata>();
  private userBehaviorData = new Map<string, number>();

  constructor(config: Partial<CodeSplittingConfig> = {}) {
    this.config = {
      enableIntelligentPrefetch: true,
      enableComponentSplitting: true,
      enableFeatureSplitting: true,
      prefetchDelay: 100,
      maxConcurrentPrefetches: 3,
      enableAnalyticsSplitting: true,
      ...config
    };

    this.initializeService();
  }

  /**
   * Initialize the code splitting service
   */
  private initializeService(): void {
    this.setupIntelligentPrefetching();
    this.setupUserBehaviorTracking();
    this.setupPerformanceMonitoring();
  }

  /**
   * Create a lazy component with intelligent prefetching
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    metadata: Partial<ComponentMetadata> = {}
  ): LazyExoticComponent<T> {
    const componentName = metadata.name || 'UnknownComponent';
    
    // Check if component is already cached
    if (this.componentCache.has(componentName)) {
      return this.componentCache.get(componentName) as LazyExoticComponent<T>;
    }

    // Store component metadata
    this.componentMetadata.set(componentName, {
      name: componentName,
      priority: 'medium',
      dependencies: [],
      estimatedSize: 0,
      usageFrequency: 0,
      loadTime: 0,
      ...metadata
    });

    // Create enhanced import function with analytics
    const enhancedImportFn = async () => {
      const startTime = performance.now();
      this.loadingComponents.add(componentName);

      try {
        const module = await importFn();
        const loadTime = performance.now() - startTime;

        // Update metadata
        const meta = this.componentMetadata.get(componentName);
        if (meta) {
          meta.loadTime = loadTime;
          meta.usageFrequency += 1;
        }

        this.loadingComponents.delete(componentName);
        this.trackComponentLoad(componentName, loadTime);

        return module;
      } catch (error) {
        this.loadingComponents.delete(componentName);
        this.trackComponentError(componentName, error);
        throw error;
      }
    };

    const lazyComponent = lazy(enhancedImportFn);
    this.componentCache.set(componentName, lazyComponent);

    return lazyComponent;
  }

  /**
   * Create intelligent route splitting
   */
  createIntelligentRoutes(routes: RouteObject[]): RouteObject[] {
    return routes.map(route => this.enhanceRoute(route));
  }

  /**
   * Enhance a route with intelligent splitting
   */
  private enhanceRoute(route: RouteObject): RouteObject {
    if (!route.lazy && route.element) {
      return route;
    }

    const routePath = route.path || 'unknown';
    
    // Create enhanced lazy loader
    const enhancedLazy = async () => {
      const startTime = performance.now();
      
      try {
        const result = await route.lazy!();
        const loadTime = performance.now() - startTime;
        
        this.trackRouteLoad(routePath, loadTime);
        this.updateUserBehavior(routePath);
        
        return result;
      } catch (error) {
        this.trackRouteError(routePath, error);
        throw error;
      }
    };

    return {
      ...route,
      lazy: enhancedLazy
    };
  }

  /**
   * Prefetch component based on user behavior
   */
  async prefetchComponent(componentName: string): Promise<void> {
    if (this.prefetchQueue.has(componentName) || this.loadingComponents.has(componentName)) {
      return;
    }

    if (this.prefetchQueue.size >= this.config.maxConcurrentPrefetches) {
      return;
    }

    this.prefetchQueue.add(componentName);

    try {
      // Simulate prefetch delay
      await new Promise(resolve => setTimeout(resolve, this.config.prefetchDelay));
      
      const component = this.componentCache.get(componentName);
      if (component) {
        // Trigger component loading by accessing it safely
        try {
          // Use a type assertion to access the internal payload
          const lazyComponent = component as any;
          if (lazyComponent._payload && lazyComponent._payload._result) {
            await lazyComponent._payload._result;
          }
        } catch (error) {
          console.warn(`Failed to prefetch component ${componentName}:`, error);
        }
      }
    } catch (error) {
      console.warn(`Failed to prefetch component ${componentName}:`, error);
    } finally {
      this.prefetchQueue.delete(componentName);
    }
  }

  /**
   * Prefetch route based on navigation patterns
   */
  async prefetchRoute(routePath: string): Promise<void> {
    const metadata = this.routeMetadata.get(routePath);
    if (!metadata) return;

    // Check prefetch conditions
    const shouldPrefetch = this.shouldPrefetchRoute(metadata);
    if (!shouldPrefetch) return;

    try {
      // Prefetch route dependencies
      await Promise.all(
        metadata.dependencies.map(dep => this.prefetchComponent(dep))
      );
    } catch (error) {
      console.warn(`Failed to prefetch route ${routePath}:`, error);
    }
  }

  /**
   * Setup intelligent prefetching based on user behavior
   */
  private setupIntelligentPrefetching(): void {
    if (!this.config.enableIntelligentPrefetch) return;

    // Track mouse movements for hover-based prefetching
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const path = new URL(link.href).pathname;
        this.scheduleRoutePrefetch(path);
      }
    });

    // Track scroll patterns for predictive prefetching
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.analyzeScrollBehavior();
      }, 150);
    });
  }

  /**
   * Setup user behavior tracking
   */
  private setupUserBehaviorTracking(): void {
    // Track page visits
    window.addEventListener('popstate', () => {
      this.updateUserBehavior(window.location.pathname);
    });

    // Track time spent on pages
    const pageStartTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Date.now() - pageStartTime;
      this.trackTimeSpent(window.location.pathname, timeSpent);
    });
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor bundle sizes
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackNavigationPerformance(entry as PerformanceNavigationTiming);
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  /**
   * Determine if a route should be prefetched
   */
  private shouldPrefetchRoute(metadata: RouteMetadata): boolean {
    // Check priority
    if (metadata.priority === 'low') return false;

    // Check user segments
    const userSegment = this.getCurrentUserSegment();
    if (metadata.userSegments.length > 0 && !metadata.userSegments.includes(userSegment)) {
      return false;
    }

    // Check network conditions
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return metadata.priority === 'critical';
      }
    }

    return true;
  }

  /**
   * Schedule route prefetch with debouncing
   */
  private scheduleRoutePrefetch(path: string): void {
    setTimeout(() => {
      this.prefetchRoute(path);
    }, this.config.prefetchDelay);
  }

  /**
   * Analyze scroll behavior for predictive prefetching
   */
  private analyzeScrollBehavior(): void {
    const scrollPosition = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollPercentage = scrollPosition / (documentHeight - windowHeight);

    // If user is near bottom, prefetch next likely routes
    if (scrollPercentage > 0.8) {
      this.prefetchLikelyNextRoutes();
    }
  }

  /**
   * Prefetch likely next routes based on user behavior
   */
  private prefetchLikelyNextRoutes(): void {
    const currentPath = window.location.pathname;
    const likelyRoutes = this.predictNextRoutes(currentPath);
    
    likelyRoutes.forEach(route => {
      this.prefetchRoute(route);
    });
  }

  /**
   * Predict next routes based on user behavior patterns
   */
  private predictNextRoutes(currentPath: string): string[] {
    // Simple prediction based on common navigation patterns
    const predictions: string[] = [];
    
    if (currentPath === '/') {
      predictions.push('/trades', '/collaborations', '/profile');
    } else if (currentPath === '/trades') {
      predictions.push('/trades/create', '/profile');
    } else if (currentPath.startsWith('/trades/')) {
      predictions.push('/trades', '/messages');
    }
    
    return predictions;
  }

  /**
   * Get current user segment for personalized splitting
   */
  private getCurrentUserSegment(): string {
    // Implement user segmentation logic
    return 'default';
  }

  /**
   * Update user behavior data
   */
  private updateUserBehavior(path: string): void {
    const currentCount = this.userBehaviorData.get(path) || 0;
    this.userBehaviorData.set(path, currentCount + 1);
  }

  /**
   * Track component loading performance
   */
  private trackComponentLoad(componentName: string, loadTime: number): void {
    console.debug(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
  }

  /**
   * Track component loading errors
   */
  private trackComponentError(componentName: string, error: any): void {
    console.error(`Failed to load component ${componentName}:`, error);
  }

  /**
   * Track route loading performance
   */
  private trackRouteLoad(routePath: string, loadTime: number): void {
    console.debug(`Route ${routePath} loaded in ${loadTime.toFixed(2)}ms`);
  }

  /**
   * Track route loading errors
   */
  private trackRouteError(routePath: string, error: any): void {
    console.error(`Failed to load route ${routePath}:`, error);
  }

  /**
   * Track time spent on pages
   */
  private trackTimeSpent(path: string, timeSpent: number): void {
    console.debug(`Time spent on ${path}: ${timeSpent}ms`);
  }

  /**
   * Track navigation performance
   */
  private trackNavigationPerformance(entry: PerformanceNavigationTiming): void {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      firstPaint: entry.responseEnd - entry.requestStart
    };
    
    console.debug('Navigation performance:', metrics);
  }

  /**
   * Get component metadata
   */
  getComponentMetadata(componentName: string): ComponentMetadata | undefined {
    return this.componentMetadata.get(componentName);
  }

  /**
   * Get user behavior analytics
   */
  getUserBehaviorAnalytics(): Map<string, number> {
    return new Map(this.userBehaviorData);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    totalComponents: number;
    loadedComponents: number;
    averageLoadTime: number;
    prefetchHitRate: number;
  } {
    const totalComponents = this.componentMetadata.size;
    const loadedComponents = Array.from(this.componentMetadata.values())
      .filter(meta => meta.usageFrequency > 0).length;
    
    const loadTimes = Array.from(this.componentMetadata.values())
      .filter(meta => meta.loadTime > 0)
      .map(meta => meta.loadTime);
    
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    return {
      totalComponents,
      loadedComponents,
      averageLoadTime,
      prefetchHitRate: 0 // TODO: Implement prefetch hit rate calculation
    };
  }
}

/**
 * Intelligent Resource Preloader
 */
export class IntelligentResourcePreloader {
  private preloadedResources = new Set<string>();
  private preloadQueue = new Map<string, Promise<void>>();
  private resourcePriorities = new Map<string, number>();
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Preload critical resources with Vite awareness
   */
  async preloadCriticalResources(): Promise<void> {
    const criticalResources = this.getCriticalResources();

    // Use Promise.allSettled to handle individual failures gracefully
    const results = await Promise.allSettled(
      criticalResources.map(resource => this.preloadResource(resource, 'high'))
    );

    // Log any failures for debugging but don't throw
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`Failed to preload critical resource ${criticalResources[index]}:`, result.reason);
      }
    });
  }

  /**
   * Get critical resources based on environment
   */
  private getCriticalResources(): string[] {
    const baseResources = [
      '/assets/css/critical.css',
      '/assets/fonts/inter-var.woff2'
    ];

    // Only include vendor.js in production or if it exists
    if (!this.isDevelopment) {
      baseResources.push('/assets/js/vendor.js');
    }

    return baseResources;
  }

  /**
   * Preload resource with priority and enhanced error handling
   */
  async preloadResource(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (this.preloadedResources.has(url) || this.preloadQueue.has(url)) {
      return this.preloadQueue.get(url) || Promise.resolve();
    }

    const preloadPromise = this.performPreload(url, priority);
    this.preloadQueue.set(url, preloadPromise);

    try {
      await preloadPromise;
      this.preloadedResources.add(url);
    } catch (error) {
      // Log warning but don't throw - make it resilient
      console.warn(`Failed to preload resource ${url}:`, error);
    } finally {
      this.preloadQueue.delete(url);
    }
  }

  /**
   * Perform actual preload with resource existence check
   */
  private async performPreload(url: string, priority: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if resource exists first (for development)
      if (this.isDevelopment && url.includes('/assets/')) {
        this.checkResourceExists(url).then(exists => {
          if (!exists) {
            console.warn(`Resource ${url} not found, skipping preload`);
            resolve(); // Resolve instead of reject to be resilient
            return;
          }
          this.createPreloadLink(url, resolve, reject);
        }).catch(() => {
          // If existence check fails, still try to preload
          this.createPreloadLink(url, resolve, reject);
        });
      } else {
        this.createPreloadLink(url, resolve, reject);
      }
    });
  }

  /**
   * Check if resource exists (development only)
   */
  private async checkResourceExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create preload link element
   */
  private createPreloadLink(url: string, resolve: () => void, reject: (error: Error) => void): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;

    // Determine resource type
    if (url.includes('.css')) {
      link.as = 'style';
    } else if (url.includes('.js')) {
      link.as = 'script';
    } else if (url.includes('.woff') || url.includes('.woff2')) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (url.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
      link.as = 'image';
    }

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload ${url}`));

    document.head.appendChild(link);
  }

  /**
   * Get preload status
   */
  getPreloadStatus(): {
    preloadedCount: number;
    queueSize: number;
    preloadedResources: string[];
  } {
    return {
      preloadedCount: this.preloadedResources.size,
      queueSize: this.preloadQueue.size,
      preloadedResources: Array.from(this.preloadedResources)
    };
  }
}

// Create singleton instances
export const advancedCodeSplitting = new AdvancedCodeSplittingService();
export const intelligentResourcePreloader = new IntelligentResourcePreloader();
