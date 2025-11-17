import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { logger } from '@utils/logging/logger';

/**
 * Enhanced lazy loading configuration
 */
interface LazyLoadConfig {
  /** Preload the component after a delay */
  preloadDelay?: number;
  /** Retry attempts for failed loads */
  retryAttempts?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable prefetching on hover/focus */
  enablePrefetch?: boolean;
  /** Custom loading component */
  loadingComponent?: ComponentType;
  /** Custom error component */
  errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
  /** Analytics tracking */
  trackLoading?: boolean;
}

/**
 * Enhanced lazy loading with retry logic and prefetching
 */
export function enhancedLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: LazyLoadConfig = {}
): LazyExoticComponent<T> {
  const {
    retryAttempts = 3,
    retryDelay = 1000,
    enablePrefetch = true,
    trackLoading = true
  } = config;

  let retryCount = 0;
  let prefetched = false;

  const enhancedImportFn = async (): Promise<{ default: T }> => {
    try {
      if (trackLoading) {
        performance.mark('lazy-load-start');
      }

      const module = await importFn();

      if (trackLoading) {
        performance.mark('lazy-load-end');
        performance.measure('lazy-load-duration', 'lazy-load-start', 'lazy-load-end');
      }

      retryCount = 0; // Reset on success
      return module;
    } catch (error) {
      logger.error('Lazy loading failed:', 'UTILITY', {}, error as Error);

      if (retryCount < retryAttempts) {
        retryCount++;
        logger.debug(`Retrying lazy load (attempt ${retryCount}/${retryAttempts})`, 'UTILITY');
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
        return enhancedImportFn();
      }

      throw error;
    }
  };

  const LazyComponent = lazy(enhancedImportFn);

  // Add prefetch capability
  if (enablePrefetch) {
    (LazyComponent as any).prefetch = () => {
      if (!prefetched) {
        prefetched = true;
        importFn().catch(console.error);
      }
    };
  }

  return LazyComponent;
}

/**
 * Preload components based on route patterns
 */
export class RouteBasedPreloader {
  private preloadedRoutes = new Set<string>();
  private preloadQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  /**
   * Register a route for preloading
   */
  registerRoute(route: string, importFn: () => Promise<any>) {
    if (!this.preloadedRoutes.has(route)) {
      this.preloadQueue.push(async () => {
        try {
          await importFn();
          this.preloadedRoutes.add(route);
        } catch (error) {
          logger.error(`Failed to preload route ${route}:`, 'UTILITY', {}, error as Error);
        }
      });
    }
  }

  /**
   * Process the preload queue
   */
  async processQueue(maxConcurrent = 2) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, maxConcurrent);
      await Promise.allSettled(batch.map(fn => fn()));
    }

    this.isProcessing = false;
  }

  /**
   * Preload routes based on user behavior
   */
  preloadBasedOnBehavior(currentRoute: string) {
    const routePatterns = {
      '/': ['/trades', '/challenges', '/collaboration'],
      '/trades': ['/trades/create', '/profile'],
      '/challenges': ['/challenges/create', '/leaderboard'],
      '/collaboration': ['/collaboration/create', '/projects']
    };

    const routes = routePatterns[currentRoute as keyof typeof routePatterns];
    if (routes) {
      routes.forEach(route => {
        // Simulate route import registration
        this.registerRoute(route, () => import(/* @vite-ignore */ `../../pages${route}`));
      });
      this.processQueue();
    }
  }
}

/**
 * Intersection Observer based lazy loading for images and components
 */
export class IntersectionLazyLoader {
  private observer: IntersectionObserver | null = null;
  private loadedElements = new WeakSet();

  constructor(
    private options: IntersectionObserverInit = {
      rootMargin: '50px',
      threshold: 0.1
    }
  ) {
    this.initializeObserver();
  }

  private initializeObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
          this.loadElement(entry.target);
          this.loadedElements.add(entry.target);
          this.observer?.unobserve(entry.target);
        }
      });
    }, this.options);
  }

  private loadElement(element: Element) {
    if (element instanceof HTMLImageElement) {
      this.loadImage(element);
    } else if (element.hasAttribute('data-lazy-component')) {
      this.loadComponent(element);
    }
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }

    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }

    img.classList.add('loaded');
  }

  private loadComponent(element: Element) {
    const componentName = element.getAttribute('data-lazy-component');
    if (componentName) {
      // Trigger component loading
      element.dispatchEvent(new CustomEvent('lazy-load', {
        detail: { componentName }
      }));
    }
  }

  /**
   * Observe an element for lazy loading
   */
  observe(element: Element) {
    if (this.observer && !this.loadedElements.has(element)) {
      this.observer.observe(element);
    }
  }

  /**
   * Unobserve an element
   */
  unobserve(element: Element) {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  /**
   * Disconnect the observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Adaptive loading based on network conditions
 */
export class AdaptiveLoader {
  private networkInfo: any = null;

  constructor() {
    this.initializeNetworkInfo();
  }

  private initializeNetworkInfo() {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      this.networkInfo = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
    }
  }

  /**
   * Get loading strategy based on network conditions
   */
  getLoadingStrategy(): 'aggressive' | 'conservative' | 'minimal' {
    if (!this.networkInfo) {
      return 'conservative'; // Default fallback
    }

    const { effectiveType, downlink, saveData } = this.networkInfo;

    if (saveData) {
      return 'minimal';
    }

    if (effectiveType === '4g' && downlink > 1.5) {
      return 'aggressive';
    }

    if (effectiveType === '3g' || downlink < 1.0) {
      return 'minimal';
    }

    return 'conservative';
  }

  /**
   * Should preload based on network conditions
   */
  shouldPreload(): boolean {
    const strategy = this.getLoadingStrategy();
    return strategy === 'aggressive';
  }

  /**
   * Get image quality based on network conditions
   */
  getImageQuality(): 'high' | 'medium' | 'low' {
    const strategy = this.getLoadingStrategy();
    
    switch (strategy) {
      case 'aggressive':
        return 'high';
      case 'conservative':
        return 'medium';
      case 'minimal':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Get chunk loading strategy
   */
  getChunkLoadingStrategy(): { maxConcurrent: number; priority: 'high' | 'low' } {
    const strategy = this.getLoadingStrategy();
    
    switch (strategy) {
      case 'aggressive':
        return { maxConcurrent: 4, priority: 'high' };
      case 'conservative':
        return { maxConcurrent: 2, priority: 'high' };
      case 'minimal':
        return { maxConcurrent: 1, priority: 'low' };
      default:
        return { maxConcurrent: 2, priority: 'high' };
    }
  }
}

/**
 * Performance-aware component loader
 */
export class PerformanceAwareLoader {
  private loadTimes = new Map<string, number>();
  private errorCounts = new Map<string, number>();

  /**
   * Load component with performance tracking
   */
  async loadComponent<T>(
    name: string,
    importFn: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const component = await importFn();
      const loadTime = performance.now() - startTime;
      
      this.loadTimes.set(name, loadTime);
      this.errorCounts.delete(name); // Reset error count on success
      
      // Track performance metrics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'component_load', {
          component_name: name,
          load_time: Math.round(loadTime),
          custom_parameter: 'lazy_load'
        });
      }

      return component;
    } catch (error) {
      const errorCount = (this.errorCounts.get(name) || 0) + 1;
      this.errorCounts.set(name, errorCount);

      logger.error(`Failed to load component ${name} (attempt ${errorCount}):`, 'UTILITY', {}, error as Error);

      // Use fallback if available and error count is high
      if (fallback && errorCount >= 3) {
        logger.warn(`Using fallback for component ${name} after ${errorCount} failures`, 'UTILITY');
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      loadTimes: Object.fromEntries(this.loadTimes),
      errorCounts: Object.fromEntries(this.errorCounts),
      averageLoadTime: Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) / this.loadTimes.size || 0
    };
  }
}

// Global instances
export const routePreloader = new RouteBasedPreloader();
export const intersectionLoader = new IntersectionLazyLoader();
export const adaptiveLoader = new AdaptiveLoader();
export const performanceLoader = new PerformanceAwareLoader();
