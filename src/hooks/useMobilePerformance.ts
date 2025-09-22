/**
 * Mobile Performance Optimization Hook
 * 
 * Comprehensive mobile performance optimization with lazy loading,
 * image optimization, and resource management for TradeYa.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMobileOptimization } from './useMobileOptimization';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  interactionDelay: number;
  imageLoadTime: number;
  bundleSize: number;
  cacheHitRate: number;
}

interface PerformanceConfig {
  // Lazy loading configuration
  lazyLoadThreshold: number; // Distance from viewport to start loading
  lazyLoadRootMargin: string; // Intersection observer root margin
  
  // Image optimization
  imageQuality: number; // 0-100
  imageFormat: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  imageSizes: number[]; // Available image sizes
  
  // Resource management
  maxConcurrentRequests: number;
  requestTimeout: number;
  cacheStrategy: 'memory' | 'disk' | 'both';
  
  // Performance monitoring
  enableMetrics: boolean;
  metricsInterval: number;
  performanceThresholds: {
    memoryWarning: number; // MB
    renderTimeWarning: number; // ms
    interactionDelayWarning: number; // ms
  };
}

const DEFAULT_CONFIG: PerformanceConfig = {
  lazyLoadThreshold: 100,
  lazyLoadRootMargin: '50px',
  imageQuality: 80,
  imageFormat: 'auto',
  imageSizes: [320, 640, 1024, 1280, 1920],
  maxConcurrentRequests: 6,
  requestTimeout: 10000,
  cacheStrategy: 'both',
  enableMetrics: true,
  metricsInterval: 5000,
  performanceThresholds: {
    memoryWarning: 100,
    renderTimeWarning: 100,
    interactionDelayWarning: 50,
  },
};

export function useMobilePerformance(config: Partial<PerformanceConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { isMobile, isTouchDevice } = useMobileOptimization();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    interactionDelay: 0,
    imageLoadTime: 0,
    bundleSize: 0,
    cacheHitRate: 0,
  });
  
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestQueueRef = useRef<Array<() => Promise<any>>>([]);
  const activeRequestsRef = useRef<number>(0);

  // Get optimal image size based on device and viewport
  const getOptimalImageSize = useCallback((availableSizes: number[], containerWidth: number) => {
    if (!isMobile) return availableSizes[availableSizes.length - 1];
    
    // For mobile, choose the smallest size that's still larger than container width
    const optimalSize = availableSizes.find(size => size >= containerWidth * 2); // 2x for retina
    return optimalSize || availableSizes[0];
  }, [isMobile]);

  // Get optimal image format based on browser support
  const getOptimalImageFormat = useCallback(() => {
    if (finalConfig.imageFormat !== 'auto') return finalConfig.imageFormat;
    
    // Check for AVIF support
    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.getImageData(0, 0, 1, 1);
          return 'avif';
        } catch (e) {
          // AVIF not supported
        }
      }
    }
    
    // Check for WebP support
    const webpSupported = typeof window !== 'undefined' && 
      document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    return webpSupported ? 'webp' : 'jpeg';
  }, [finalConfig.imageFormat]);

  // Generate optimized image URL
  const getOptimizedImageUrl = useCallback((
    baseUrl: string,
    width?: number,
    height?: number,
    quality?: number
  ) => {
    const format = getOptimalImageFormat();
    const imageQuality = quality || finalConfig.imageQuality;
    const imageWidth = width || 'auto';
    const imageHeight = height || 'auto';
    
    // This would integrate with your image optimization service
    // For now, return the base URL with query parameters
    const params = new URLSearchParams({
      format,
      quality: imageQuality.toString(),
      width: imageWidth.toString(),
      height: imageHeight.toString(),
    });
    
    return `${baseUrl}?${params.toString()}`;
  }, [getOptimalImageFormat, finalConfig.imageQuality]);

  // Lazy load component
  const useLazyLoad = useCallback((
    threshold: number = finalConfig.lazyLoadThreshold,
    rootMargin: string = finalConfig.lazyLoadRootMargin
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
            observer.disconnect();
          }
        },
        {
          threshold: threshold / 100,
          rootMargin,
        }
      );

      observer.observe(element);

      return () => observer.disconnect();
    }, [threshold, rootMargin, hasLoaded]);

    return { elementRef, isVisible, hasLoaded };
  }, [finalConfig.lazyLoadThreshold, finalConfig.lazyLoadRootMargin]);

  // Request queue management
  const queueRequest = useCallback(async <T>(requestFn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          activeRequestsRef.current++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          activeRequestsRef.current--;
          processQueue();
        }
      };

      if (activeRequestsRef.current < finalConfig.maxConcurrentRequests) {
        executeRequest();
      } else {
        requestQueueRef.current.push(executeRequest);
      }
    });
  }, [finalConfig.maxConcurrentRequests]);

  const processQueue = useCallback(() => {
    if (requestQueueRef.current.length > 0 && activeRequestsRef.current < finalConfig.maxConcurrentRequests) {
      const nextRequest = requestQueueRef.current.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }, [finalConfig.maxConcurrentRequests]);

  // Performance monitoring
  const updateMetrics = useCallback(() => {
    if (!finalConfig.enableMetrics) return;

    // Memory usage (if available)
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

    // Render time (simplified)
    const renderTime = performance.now();

    // Interaction delay (simplified)
    const interactionDelay = 0; // This would be measured during actual interactions

    // Image load time (simplified)
    const imageLoadTime = 0; // This would be measured during image loads

    // Bundle size (simplified)
    const bundleSize = 0; // This would be calculated from actual bundle

    // Cache hit rate (simplified)
    const cacheHitRate = 0; // This would be calculated from actual cache usage

    const newMetrics: PerformanceMetrics = {
      memoryUsage,
      renderTime,
      interactionDelay,
      imageLoadTime,
      bundleSize,
      cacheHitRate,
    };

    setMetrics(newMetrics);

    // Check for performance warnings
    const isLowPerf = 
      memoryUsage > finalConfig.performanceThresholds.memoryWarning ||
      renderTime > finalConfig.performanceThresholds.renderTimeWarning ||
      interactionDelay > finalConfig.performanceThresholds.interactionDelayWarning;

    setIsLowPerformance(isLowPerf);
  }, [finalConfig]);

  // Network status monitoring
  const updateNetworkStatus = useCallback(() => {
    setIsOnline(navigator.onLine);
    
    // Get connection type if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      setConnectionType(connection.effectiveType || connection.type || 'unknown');
    }
  }, []);

  // Debounced resize handler
  const handleResize = useCallback(() => {
    // Debounce resize events
    clearTimeout(metricsIntervalRef.current as any);
    metricsIntervalRef.current = setTimeout(updateMetrics, 100);
  }, [updateMetrics]);

  // Initialize performance monitoring
  useEffect(() => {
    if (!finalConfig.enableMetrics) return;

    // Initial metrics update
    updateMetrics();

    // Set up performance observer
    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        // Handle performance entries
        updateMetrics();
      });

      try {
        performanceObserverRef.current.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (e) {
        // Some entry types might not be supported
      }
    }

    // Set up metrics interval
    metricsIntervalRef.current = setInterval(updateMetrics, finalConfig.metricsInterval);

    // Set up network monitoring
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    window.addEventListener('resize', handleResize);

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      window.removeEventListener('resize', handleResize);
    };
  }, [finalConfig.enableMetrics, finalConfig.metricsInterval, updateMetrics, updateNetworkStatus, handleResize]);

  // Preload critical resources
  const preloadResource = useCallback((url: string, type: 'image' | 'script' | 'style' | 'font' = 'image') => {
    if (!isOnline) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  }, [isOnline]);

  // Optimize for mobile performance
  const mobileOptimizations = useMemo(() => ({
    // Reduce animations on low-end devices
    reduceAnimations: isLowPerformance || connectionType === 'slow-2g' || connectionType === '2g',
    
    // Use lower quality images on slow connections
    imageQuality: connectionType === 'slow-2g' || connectionType === '2g' ? 60 : finalConfig.imageQuality,
    
    // Reduce concurrent requests on slow connections
    maxConcurrentRequests: connectionType === 'slow-2g' || connectionType === '2g' ? 2 : finalConfig.maxConcurrentRequests,
    
    // Enable aggressive caching on slow connections
    aggressiveCaching: connectionType === 'slow-2g' || connectionType === '2g',
  }), [isLowPerformance, connectionType, finalConfig]);

  return {
    // Performance metrics
    metrics,
    isLowPerformance,
    isOnline,
    connectionType,
    
    // Image optimization
    getOptimalImageSize,
    getOptimalImageFormat,
    getOptimizedImageUrl,
    
    // Lazy loading
    useLazyLoad,
    
    // Request management
    queueRequest,
    
    // Resource preloading
    preloadResource,
    
    // Mobile optimizations
    mobileOptimizations,
    
    // Configuration
    config: finalConfig,
  };
}

