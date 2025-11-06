import { isDevelopment } from '../config/env';

/**
 * Utility for preloading resources and prefetching critical assets
 * 
 * This file provides utilities for preloading and prefetching resources
 * to improve performance and user experience.
 */

/**
 * Preload a resource with high priority
 * Use this for critical resources needed for the current page
 * 
 * @param url URL of the resource to preload
 * @param as Type of resource (e.g., 'image', 'style', 'script', 'font')
 * @param type MIME type of the resource (optional)
 * @param crossOrigin Cross-origin setting (optional)
 */
export const preloadResource = (
  url: string,
  as: 'image' | 'style' | 'script' | 'font' | 'fetch',
  type?: string,
  crossOrigin?: 'anonymous' | 'use-credentials'
): void => {
  if (typeof document === 'undefined') return; // Skip during SSR

  // Check if the link already exists
  const existingLink = document.querySelector(`link[rel="preload"][href="${url}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  
  if (type) link.type = type;
  if (crossOrigin) link.crossOrigin = crossOrigin;
  
  document.head.appendChild(link);
};

/**
 * Prefetch a resource with low priority
 * Use this for resources likely to be needed in the near future
 * 
 * @param url URL of the resource to prefetch
 * @param as Type of resource (optional)
 * @param type MIME type of the resource (optional)
 * @param crossOrigin Cross-origin setting (optional)
 */
export const prefetchResource = (
  url: string,
  as?: 'image' | 'style' | 'script' | 'font' | 'fetch',
  type?: string,
  crossOrigin?: 'anonymous' | 'use-credentials'
): void => {
  if (typeof document === 'undefined') return; // Skip during SSR

  // Check if the link already exists
  const existingLink = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  
  if (as) link.as = as;
  if (type) link.type = type;
  if (crossOrigin) link.crossOrigin = crossOrigin;
  
  document.head.appendChild(link);
};

/**
 * Preconnect to a domain to establish early connection
 * Use this for domains you'll be fetching resources from
 * 
 * @param url Domain URL to preconnect to
 * @param crossOrigin Cross-origin setting (optional)
 */
export const preconnect = (
  url: string,
  crossOrigin?: 'anonymous' | 'use-credentials'
): void => {
  if (typeof document === 'undefined') return; // Skip during SSR

  // Check if the link already exists
  const existingLink = document.querySelector(`link[rel="preconnect"][href="${url}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  
  if (crossOrigin) link.crossOrigin = crossOrigin;
  
  document.head.appendChild(link);
};

/**
 * Preload critical images for the current page
 * 
 * @param imageUrls Array of image URLs to preload
 */
export const preloadImages = (imageUrls: string[]): void => {
  imageUrls.forEach(url => preloadResource(url, 'image'));
};

/**
 * Prefetch images likely to be needed soon
 * 
 * @param imageUrls Array of image URLs to prefetch
 */
export const prefetchImages = (imageUrls: string[]): void => {
  imageUrls.forEach(url => prefetchResource(url, 'image'));
};

/**
 * Preload critical fonts for the current page
 * 
 * @param fontUrls Array of font URLs to preload
 * @param fontType MIME type of the font (e.g., 'font/woff2')
 */
export const preloadFonts = (fontUrls: string[], fontType: string = 'font/woff2'): void => {
  fontUrls.forEach(url => preloadResource(url, 'font', fontType, 'anonymous'));
};

/**
 * Preload critical CSS for the current page
 * 
 * @param cssUrls Array of CSS URLs to preload
 */
export const preloadStyles = (cssUrls: string[]): void => {
  cssUrls.forEach(url => preloadResource(url, 'style'));
};

/**
 * Preload critical JavaScript for the current page
 * 
 * @param scriptUrls Array of script URLs to preload
 */
export const preloadScripts = (scriptUrls: string[]): void => {
  scriptUrls.forEach(url => preloadResource(url, 'script'));
};

/**
 * Prefetch routes that are likely to be navigated to
 *
 * @param routes Array of route paths to prefetch
 */
export const prefetchRoutes = (routes: string[]): void => {
  // TEMPORARILY DISABLED: Prefetching JavaScript chunks for routes
  // This was causing 404 errors and infinite refresh loops
  // TODO: Implement proper route prefetching when we have code splitting

  if (isDevelopment()) {
    console.log('Route prefetching disabled to prevent infinite refresh loops:', routes);
  }

  // For now, we'll just log the routes that would be prefetched
  // routes.forEach(route => {
  //   prefetchResource(`/assets/${route.replace(/\//g, '-')}.js`, 'script');
  // });
};

/**
 * Preconnect to common third-party domains
 * Call this early in the application lifecycle
 */
export const preconnectToCommonDomains = (): void => {
  // Cloudinary for images
  preconnect('https://res.cloudinary.com', 'anonymous');
  
  // Firebase services
  preconnect('https://firestore.googleapis.com', 'anonymous');
  preconnect('https://www.googleapis.com', 'anonymous');
  preconnect('https://identitytoolkit.googleapis.com', 'anonymous');
  
  // Font providers if using external fonts
  preconnect('https://fonts.googleapis.com', 'anonymous');
  preconnect('https://fonts.gstatic.com', 'anonymous');
};

/**
 * Initialize preloading for the application
 * Call this once at application startup
 */
export const initializePreloading = (): void => {
  // Preconnect to common domains
  preconnectToCommonDomains();
  
  // Preload critical fonts
  preloadFonts([
    // Add your critical font URLs here
    // Example: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
  ]);
  
  // Preload application logo or other critical images
  preloadImages([
    // Add your critical image URLs here
    // Example: 'https://res.cloudinary.com/doqqhj2nt/image/upload/v1/tradeya/logo.png'
  ]);
};

/**
 * Validate preload usage and track effectiveness
 * @param url URL of the preloaded resource
 * @param timeout Timeout for validation check (ms)
 * @returns Promise<boolean> Whether the resource was actually used
 */
export const validatePreloadUsage = (url: string, timeout: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkUsage = () => {
      // Check if resource was actually used
      const resourceUsed = checkResourceUsage(url);
      if (resourceUsed || Date.now() - startTime > timeout) {
        resolve(resourceUsed);
      } else {
        setTimeout(checkUsage, 100);
      }
    };
    
    checkUsage();
  });
};

/**
 * Check if a resource was actually used after preloading
 * @param url URL of the resource to check
 * @returns boolean Whether the resource was used
 */
const checkResourceUsage = (url: string): boolean => {
  // Check if the resource is in the performance entries
  const entries = performance.getEntriesByType('resource');
  const resourceEntry = entries.find(entry => entry.name === url);
  
  if (resourceEntry) {
    // Check if it was loaded from cache (indicating preload was effective)
    return (resourceEntry as any).transferSize === 0 || 
           (resourceEntry as any).encodedBodySize === 0;
  }
  
  return false;
};

/**
 * Clean up unused preloads to free up resources
 */
export const cleanupUnusedPreloads = (): void => {
  const preloadLinks = document.querySelectorAll('link[rel="preload"]');
  preloadLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !isResourceUsed(href)) {
      link.remove();
    }
  });
};

/**
 * Check if a resource is currently being used
 * @param url URL of the resource
 * @returns boolean Whether the resource is used
 */
const isResourceUsed = (url: string): boolean => {
  // Check if the resource is referenced in the DOM
  const scripts = document.querySelectorAll('script[src]');
  const styles = document.querySelectorAll('link[rel="stylesheet"]');
  const images = document.querySelectorAll('img[src]');
  
  const allElements = [...scripts, ...styles, ...images];
  
  return allElements.some(element => {
    const src = element.getAttribute('src') || element.getAttribute('href');
    return src === url;
  });
};
