/**
 * Enhanced Service Worker for TradeYa
 * Root scope service worker that provides comprehensive caching and performance features
 */

const CACHE_NAME = 'tradeya-enhanced-v2';
const STATIC_CACHE = 'tradeya-static-v2';
const DYNAMIC_CACHE = 'tradeya-dynamic-v2';
const IMAGE_CACHE = 'tradeya-images-v2';

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
  console.log('Enhanced SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icons/favicon-192x192.png',
        '/icons/favicon-512x512.png'
      ]).catch(error => {
        console.warn('Enhanced SW: Failed to cache some static resources:', error);
        // Don't fail the entire installation if some resources fail
        return Promise.resolve();
      });
    }).then(() => {
      console.log('Enhanced SW: Installation complete');
      self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('Enhanced SW: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('Enhanced SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Enhanced SW: Activation complete');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - handle all network requests
 */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip Vite-processed CSS files during development to prevent MIME type conflicts
  if (url.pathname.includes('/src/') && url.pathname.endsWith('.css')) {
    return;
  }

  event.respondWith(handleRequest(event.request));
});

/**
 * Handle network requests with appropriate caching strategy
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
    
    // Ensure response has correct MIME type
    response = ensureCorrectMimeType(response, url);
    
    // Track performance metrics
    const responseTime = Date.now() - startTime;
    updatePerformanceMetrics(responseTime, response.headers.get('x-cache-status') === 'hit');
    
    return response;
  } catch (error) {
    console.error('Enhanced SW: Request failed:', error);
    performanceMetrics.networkRequests++;
    
    // Return fallback response with correct MIME type
    return createFallbackResponse(url);
  }
}

/**
 * Ensure response has correct MIME type
 */
function ensureCorrectMimeType(response, url) {
  const pathname = url.pathname.toLowerCase();
  let expectedMimeType = null;
  
  if (pathname.endsWith('.js')) {
    expectedMimeType = 'application/javascript';
  } else if (pathname.endsWith('.css')) {
    expectedMimeType = 'text/css';
  } else if (pathname.endsWith('.json')) {
    expectedMimeType = 'application/json';
  } else if (pathname.endsWith('.html')) {
    expectedMimeType = 'text/html';
  }
  
  if (expectedMimeType && response.headers.get('content-type') !== expectedMimeType) {
    // Clone response with correct MIME type
    const headers = new Headers(response.headers);
    headers.set('content-type', expectedMimeType);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }
  
  return response;
}

/**
 * Create fallback response with correct MIME type
 */
function createFallbackResponse(url) {
  const pathname = url.pathname.toLowerCase();
  
  if (pathname.endsWith('.js')) {
    return new Response('// Service worker fallback for JavaScript file', {
      status: 200,
      headers: { 'content-type': 'application/javascript' }
    });
  } else if (pathname.endsWith('.css')) {
    return new Response('/* Service worker fallback for CSS file */', {
      status: 200,
      headers: { 'content-type': 'text/css' }
    });
  } else if (pathname.endsWith('.json')) {
    return new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }
  
  return new Response('Service Unavailable', { 
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'content-type': 'text/plain' }
  });
}

/**
 * Handle static assets (JS, CSS, fonts, etc.)
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    // Create new response with modified headers (headers are immutable)
    const headers = new Headers(cachedResponse.headers);
    headers.set('x-cache-status', 'hit');

    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: headers
    });
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    performanceMetrics.cacheMisses++;
    // Create new response with modified headers (headers are immutable)
    const headers = new Headers(networkResponse.headers);
    headers.set('x-cache-status', 'miss');

    return new Response(networkResponse.body, {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers: headers
    });
  } catch (error) {
    console.error('Enhanced SW: Static asset fetch failed:', error);
    throw error;
  }
}

/**
 * Handle images
 */
async function handleImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    performanceMetrics.cacheMisses++;
    return networkResponse;
  } catch (error) {
    console.error('Enhanced SW: Image fetch failed:', error);
    throw error;
  }
}

/**
 * Handle API requests
 */
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    performanceMetrics.networkRequests++;
    return networkResponse;
  } catch (error) {
    console.error('Enhanced SW: API request failed:', error);
    throw error;
  }
}

/**
 * Handle dynamic content
 */
async function handleDynamicContent(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    performanceMetrics.networkRequests++;
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Utility functions
 */
function isStaticAsset(url) {
  const pathname = url.pathname.toLowerCase();

  // Don't intercept Vite-processed CSS files during development
  if (pathname.includes('/src/') && pathname.endsWith('.css')) {
    return false;
  }

  return pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.ttf') ||
         pathname.includes('/assets/');
}

function isImage(url) {
  const pathname = url.pathname.toLowerCase();
  return pathname.endsWith('.jpg') || 
         pathname.endsWith('.jpeg') || 
         pathname.endsWith('.png') || 
         pathname.endsWith('.gif') || 
         pathname.endsWith('.svg') || 
         pathname.endsWith('.webp');
}

function isAPIRequest(url) {
  return url.hostname.includes('firebaseio.com') || 
         url.hostname.includes('googleapis.com') ||
         url.pathname.startsWith('/api/');
}

function updatePerformanceMetrics(responseTime, isCacheHit) {
  performanceMetrics.totalResponseTime += responseTime;
  performanceMetrics.averageResponseTime = 
    performanceMetrics.totalResponseTime / 
    (performanceMetrics.cacheHits + performanceMetrics.cacheMisses + performanceMetrics.networkRequests);
}
