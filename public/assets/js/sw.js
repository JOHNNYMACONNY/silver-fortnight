/**
 * TradeYa Advanced Service Worker
 * 
 * Comprehensive service worker with intelligent caching strategies,
 * offline support, and performance optimizations for PWA functionality.
 */

const CACHE_NAME = 'tradeya-v1.0.0';
const STATIC_CACHE = 'tradeya-static-v1.0.0';
const DYNAMIC_CACHE = 'tradeya-dynamic-v1.0.0';
const API_CACHE = 'tradeya-api-v1.0.0';
const IMAGE_CACHE = 'tradeya-images-v1.0.0';

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  DYNAMIC: 'network-first',
  API: 'network-first',
  IMAGES: 'cache-first',
  FONTS: 'cache-first',
  MANIFEST: 'cache-first'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll([
          '/',
          '/dashboard',
          '/trades',
          '/messages',
          '/profile',
          '/offline.html',
          '/manifest.json',
          '/favicon.ico'
        ]);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine cache strategy based on request type
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[SW] Request failed:', error);
        return handleOfflineFallback(request);
      })
  );
});

// Determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Static assets
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    return CACHE_STRATEGIES.STATIC;
  }
  
  // Images
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) {
    return CACHE_STRATEGIES.IMAGES;
  }
  
  // API calls
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firebase')) {
    return CACHE_STRATEGIES.API;
  }
  
  // HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    return CACHE_STRATEGIES.DYNAMIC;
  }
  
  return CACHE_STRATEGIES.DYNAMIC;
}

// Handle request with appropriate strategy
async function handleRequest(request, strategy) {
  const url = new URL(request.url);
  
  switch (strategy) {
    case CACHE_STRATEGIES.STATIC:
      return cacheFirst(request, STATIC_CACHE);
    
    case CACHE_STRATEGIES.IMAGES:
      return cacheFirst(request, IMAGE_CACHE);
    
    case CACHE_STRATEGIES.API:
      return networkFirst(request, API_CACHE);
    
    case CACHE_STRATEGIES.DYNAMIC:
      return networkFirst(request, DYNAMIC_CACHE);
    
    default:
      return networkFirst(request, DYNAMIC_CACHE);
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached new resource:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('[SW] Network response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle offline fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(STATIC_CACHE);
    const offlineResponse = await cache.match('/offline.html');
    
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // Return generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. Please check your connection.',
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

console.log('[SW] Service worker script loaded');
