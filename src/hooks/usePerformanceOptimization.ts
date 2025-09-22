/**
 * Performance Optimization Hook
 * 
 * Advanced performance monitoring and optimization for TradeYa PWA
 * including lazy loading, image optimization, and performance metrics.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  fmp: number | null; // First Meaningful Paint
  tti: number | null; // Time to Interactive
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enablePreloading: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
  maxImageSize: number;
  quality: number;
  format: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
}

const DEFAULT_CONFIG: OptimizationConfig = {
  enableLazyLoading: true,
  enableImageOptimization: true,
  enablePreloading: true,
  enableCaching: true,
  enableCompression: true,
  maxImageSize: 1920,
  quality: 85,
  format: 'auto',
};

export function usePerformanceOptimization(config: Partial<OptimizationConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fmp: null,
    tti: null,
  });
  const [isOptimized, setIsOptimized] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Initialize performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    const observePerformance = () => {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Time to First Byte
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        setMetrics(prev => ({ ...prev, ttfb: navigationEntry.responseStart - navigationEntry.requestStart }));
      }

      // Store observers for cleanup
      performanceObserverRef.current = fcpObserver;
    };

    // Initialize intersection observer for lazy loading
    if (finalConfig.enableLazyLoading) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              const src = target.getAttribute('data-src');
              if (src) {
                target.setAttribute('src', src);
                target.removeAttribute('data-src');
                observerRef.current?.unobserve(target);
              }
            }
          });
        },
        { rootMargin: '50px' }
      );
    }

    observePerformance();

    // Cleanup
    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [finalConfig.enableLazyLoading]);

  // Optimize image
  const optimizeImage = useCallback((src: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): string => {
    if (!finalConfig.enableImageOptimization) return src;

    const { width, height, quality, format } = {
      width: finalConfig.maxImageSize,
      height: undefined,
      quality: finalConfig.quality,
      format: finalConfig.format,
      ...options,
    };

    // For Cloudinary or similar CDN
    if (src.includes('cloudinary.com') || src.includes('res.cloudinary.com')) {
      const params = new URLSearchParams();
      if (width) params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      if (quality) params.append('q', quality.toString());
      if (format && format !== 'auto') params.append('f', format);
      params.append('c_fill', 'c_fill');
      params.append('g_auto', 'g_auto');

      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}${params.toString()}`;
    }

    // For local images, return as-is
    return src;
  }, [finalConfig]);

  // Lazy load element
  const lazyLoadElement = useCallback((element: HTMLElement) => {
    if (finalConfig.enableLazyLoading && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, [finalConfig.enableLazyLoading]);

  // Preload resource
  const preloadResource = useCallback((href: string, as: string, type?: string) => {
    if (!finalConfig.enablePreloading) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  }, [finalConfig.enablePreloading]);

  // Prefetch resource
  const prefetchResource = useCallback((href: string) => {
    if (!finalConfig.enablePreloading) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }, [finalConfig.enablePreloading]);

  // Cache resource
  const cacheResource = useCallback(async (url: string, options?: RequestInit) => {
    if (!finalConfig.enableCaching) return;

    try {
      const cache = await caches.open('tradeya-resources');
      const response = await fetch(url, options);
      if (response.ok) {
        await cache.put(url, response.clone());
      }
      return response;
    } catch (error) {
      console.error('Caching failed:', error);
      return fetch(url, options);
    }
  }, [finalConfig.enableCaching]);

  // Get cached resource
  const getCachedResource = useCallback(async (url: string) => {
    if (!finalConfig.enableCaching) return null;

    try {
      const cache = await caches.open('tradeya-resources');
      return await cache.match(url);
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return null;
    }
  }, [finalConfig.enableCaching]);

  // Optimize bundle
  const optimizeBundle = useCallback(() => {
    // Dynamic imports for code splitting
    const loadComponent = (componentPath: string) => {
      return import(/* webpackChunkName: "component" */ `../components/${componentPath}.tsx`);
    };

    // Preload critical components
    const preloadCriticalComponents = () => {
      const criticalComponents = [
        'auth/LoginPage',
        'layout/Header',
        'ui/Button',
        'ui/Input',
      ];

      criticalComponents.forEach(component => {
        preloadResource(`/src/components/${component}.tsx`, 'script');
      });
    };

    preloadCriticalComponents();

    return { loadComponent };
  }, [preloadResource]);

  // Performance score calculation
  const getPerformanceScore = useCallback((): number => {
    const { fcp, lcp, fid, cls } = metrics;
    
    if (!fcp || !lcp || !fid || !cls) return 0;

    // Calculate scores based on Core Web Vitals thresholds
    const fcpScore = fcp <= 1800 ? 100 : Math.max(0, 100 - ((fcp - 1800) / 100));
    const lcpScore = lcp <= 2500 ? 100 : Math.max(0, 100 - ((lcp - 2500) / 100));
    const fidScore = fid <= 100 ? 100 : Math.max(0, 100 - ((fid - 100) / 10));
    const clsScore = cls <= 0.1 ? 100 : Math.max(0, 100 - (cls * 1000));

    return Math.round((fcpScore + lcpScore + fidScore + clsScore) / 4);
  }, [metrics]);

  // Check if performance is optimized
  useEffect(() => {
    const score = getPerformanceScore();
    setIsOptimized(score >= 90);
  }, [metrics, getPerformanceScore]);

  // Generate performance report
  const getPerformanceReport = useCallback(() => {
    const score = getPerformanceScore();
    const report = {
      score,
      metrics,
      isOptimized,
      recommendations: [] as string[],
    };

    // Generate recommendations
    if (metrics.fcp && metrics.fcp > 1800) {
      report.recommendations.push('Optimize First Contentful Paint - consider reducing render-blocking resources');
    }
    if (metrics.lcp && metrics.lcp > 2500) {
      report.recommendations.push('Optimize Largest Contentful Paint - consider optimizing images and fonts');
    }
    if (metrics.fid && metrics.fid > 100) {
      report.recommendations.push('Optimize First Input Delay - consider reducing JavaScript execution time');
    }
    if (metrics.cls && metrics.cls > 0.1) {
      report.recommendations.push('Optimize Cumulative Layout Shift - ensure images and ads have dimensions');
    }

    return report;
  }, [metrics, isOptimized, getPerformanceScore]);

  return {
    // State
    metrics,
    isOptimized,
    
    // Actions
    optimizeImage,
    lazyLoadElement,
    preloadResource,
    prefetchResource,
    cacheResource,
    getCachedResource,
    optimizeBundle,
    
    // Utilities
    getPerformanceScore,
    getPerformanceReport,
  };
}

export default usePerformanceOptimization;
