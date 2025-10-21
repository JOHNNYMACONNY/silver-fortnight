/**
 * Performance-focused Service Worker for TradeYa
 * Handles caching strategies, resource optimization, and performance monitoring
 */

const CACHE_NAME = 'tradeya-performance-v1';
const STATIC_CACHE = 'tradeya-static-v1';
const DYNAMIC_CACHE = 'tradeya-dynamic-v1';
const IMAGE_CACHE = 'tradeya-images-v1';

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  static: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 100
  },
  dynamic: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 50
  },
  images: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 200
  }
};

// Performance metrics collection
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  totalResponseTime: 0,
  averageResponseTime: 0
};

/**
 * Install event - cache critical resources
 */
self.addEventListener('install', event => {
  console.log('Performance SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/assets/icons/icon-192x192.png',
        '/assets/icons/icon-512x512.png'
      ]).catch(error => {
        console.warn('Performance SW: Failed to cache some static resources:', error);
      });
    })
  );
  
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('Performance SW: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('Performance SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

/**
 * Fetch event - implement intelligent caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

/**
 * Handle different types of requests with appropriate caching strategies
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const startTime = Date.now();
  
  try {
    let response;
    
    // Determine caching strategy based on request type
    if (isStaticAsset(url)) {
      response = await handleStaticAsset(request);
    } else if (isImage(url)) {
      response = await handleImage(request);
    } else if (isAPIRequest(url)) {
      response = await handleAPIRequest(request);
    } else {
      response = await handleDynamicContent(request);
    }
    
    // Track performance metrics
    const responseTime = Date.now() - startTime;
    updatePerformanceMetrics(responseTime, response.headers.get('x-cache-status') === 'hit');
    
    return response;
  } catch (error) {
    console.error('Performance SW: Request failed:', error);
    performanceMetrics.networkRequests++;
    
    // Return fallback response
    return new Response('Service Unavailable', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Handle static assets (JS, CSS, fonts)
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still valid
    const cacheDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const age = now.getTime() - cacheDate.getTime();
    
    if (age < CACHE_STRATEGIES.static.maxAge) {
      return addCacheHeaders(cachedResponse, 'hit');
    }
  }
  
  // Fetch from network and cache
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const responseClone = networkResponse.clone();
    await cache.put(request, responseClone);
    await cleanupCache(cache, CACHE_STRATEGIES.static.maxEntries);
  }
  
  return addCacheHeaders(networkResponse, 'miss');
}

/**
 * Handle images with WebP conversion and compression
 */
async function handleImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return addCacheHeaders(cachedResponse, 'hit');
  }
  
  // Try to fetch optimized version first
  const optimizedRequest = createOptimizedImageRequest(request);
  let networkResponse;
  
  try {
    networkResponse = await fetch(optimizedRequest);
  } catch (error) {
    // Fallback to original request
    networkResponse = await fetch(request);
  }
  
  if (networkResponse.ok) {
    const responseClone = networkResponse.clone();
    await cache.put(request, responseClone);
    await cleanupCache(cache, CACHE_STRATEGIES.images.maxEntries);
  }
  
  return addCacheHeaders(networkResponse, 'miss');
}

/**
 * Handle API requests with network-first strategy
 */
async function handleAPIRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(cache, CACHE_STRATEGIES.dynamic.maxEntries);
    }
    
    return addCacheHeaders(networkResponse, 'miss');
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return addCacheHeaders(cachedResponse, 'hit-fallback');
    }
    throw error;
  }
}

/**
 * Handle dynamic content (HTML pages)
 */
async function handleDynamicContent(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Network first for dynamic content
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return addCacheHeaders(networkResponse, 'miss');
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return addCacheHeaders(cachedResponse, 'hit-fallback');
    }
    throw error;
  }
}

/**
 * Create optimized image request with WebP support
 */
function createOptimizedImageRequest(request) {
  const url = new URL(request.url);
  
  // Add WebP format parameter if supported
  if (supportsWebP()) {
    url.searchParams.set('f', 'webp');
    url.searchParams.set('q', '85'); // Quality setting
  }
  
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer
  });
}

/**
 * Check if browser supports WebP
 */
function supportsWebP() {
  // Simple check - in a real implementation, this would be more sophisticated
  return self.navigator && self.navigator.userAgent && 
         !self.navigator.userAgent.includes('Safari') || 
         self.navigator.userAgent.includes('Chrome');
}

/**
 * Add cache status headers to response
 */
function addCacheHeaders(response, status) {
  const headers = new Headers(response.headers);
  headers.set('x-cache-status', status);
  headers.set('x-cache-date', new Date().toISOString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * Clean up cache to maintain size limits
 */
async function cleanupCache(cache, maxEntries) {
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Remove oldest entries
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
  }
}

/**
 * Update performance metrics
 */
function updatePerformanceMetrics(responseTime, isHit) {
  if (isHit) {
    performanceMetrics.cacheHits++;
  } else {
    performanceMetrics.cacheMisses++;
  }
  
  performanceMetrics.networkRequests++;
  performanceMetrics.totalResponseTime += responseTime;
  performanceMetrics.averageResponseTime = 
    performanceMetrics.totalResponseTime / performanceMetrics.networkRequests;
}

/**
 * Utility functions to identify request types
 */
function isStaticAsset(url) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('firestore') || 
         url.hostname.includes('firebase');
}

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'GET_PERFORMANCE_METRICS':
      event.ports[0].postMessage(performanceMetrics);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'PRELOAD_RESOURCES':
      preloadResources(data.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    default:
      console.warn('Performance SW: Unknown message type:', type);
  }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  
  // Reset metrics
  performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    totalResponseTime: 0,
    averageResponseTime: 0
  };
}

/**
 * Preload resources into cache
 */
async function preloadResources(urls) {
  const cache = await caches.open(STATIC_CACHE);
  
  const preloadPromises = urls.map(async url => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('Performance SW: Failed to preload:', url, error);
    }
  });
  
  await Promise.all(preloadPromises);
}
