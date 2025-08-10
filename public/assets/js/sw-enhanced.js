/**
 * Enhanced Service Worker for TradeYa
 * Advanced caching strategies, background sync, and offline capabilities
 */

const CACHE_VERSION = 'v2.0.1';
const CACHE_NAMES = {
  static: `tradeya-static-${CACHE_VERSION}`,
  dynamic: `tradeya-dynamic-${CACHE_VERSION}`,
  api: `tradeya-api-${CACHE_VERSION}`,
  images: `tradeya-images-${CACHE_VERSION}`,
  fonts: `tradeya-fonts-${CACHE_VERSION}`
};

// Cache strategies configuration
const CACHE_STRATEGIES = {
  static: 'cache-first',
  dynamic: 'stale-while-revalidate',
  api: 'network-first',
  images: 'cache-first',
  fonts: 'cache-first'
};

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  dynamic: 24 * 60 * 60 * 1000,    // 1 day
  api: 5 * 60 * 1000,              // 5 minutes
  images: 30 * 24 * 60 * 60 * 1000, // 30 days
  fonts: 30 * 24 * 60 * 60 * 1000   // 30 days
};

// Maximum cache sizes (number of entries)
const MAX_CACHE_ENTRIES = {
  static: 100,
  dynamic: 50,
  api: 100,
  images: 200,
  fonts: 20
};

// Performance metrics
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  backgroundSyncs: 0,
  offlineRequests: 0
};

// Background sync queue
let backgroundSyncQueue = [];

/**
 * Install event - cache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('Enhanced Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      cacheStaticResources(),
      self.skipWaiting()
    ])
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Enhanced Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      cleanupOldCaches(),
      self.clients.claim()
    ])
  );
});

/**
 * Fetch event - handle all network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }
  
  // Determine cache strategy based on request type
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
  );
});

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processBackgroundSync());
  }
});

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/favicon-192x192.png',
    badge: '/icons/favicon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/favicon-48x48.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/favicon-48x48.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('TradeYa', options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

/**
 * Message event - handle messages from main thread
 */
self.addEventListener('message', (event) => {
  // Validate message structure
  if (!event.data || typeof event.data !== 'object') {
    console.warn('Service Worker: Invalid message format', event.data);
    return;
  }
  
  const { type, data } = event.data;
  // Accept both shapes: { type, data: {...} } and { type, ...payload }
  const payload = (data && typeof data === 'object') ? data : event.data;
  
  // Validate message type
  if (!type || typeof type !== 'string') {
    console.warn('Service Worker: Missing or invalid message type', { type, data });
    return;
  }
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'UPDATE_CACHE_STRATEGY':
      updateCacheStrategy(payload);
      break;
    case 'NETWORK_STATE_CHANGE':
      handleNetworkStateChange(payload);
      break;
    case 'ADD_TO_BACKGROUND_SYNC':
      addToBackgroundSync(payload);
      break;
    default:
      console.warn('Service Worker: Unknown message type:', type, { data });
  }
});

/**
 * Cache static resources during install
 */
async function cacheStaticResources() {
  const staticCache = await caches.open(CACHE_NAMES.static);
  
  const staticResources = [
    '/',
    '/manifest.json',
    '/icons/favicon-192x192.png',
    '/icons/favicon-512x512.png',
    '/assets/js/theme-initializer.js'
  ];
  
  try {
    await staticCache.addAll(staticResources);
    console.log('Static resources cached successfully');
  } catch (error) {
    console.error('Failed to cache static resources:', error);
  }
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHE_NAMES);
  
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => caches.delete(cacheName));
  
  await Promise.all(deletePromises);
  console.log('Old caches cleaned up');
}

/**
 * Determine cache strategy for a request
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API requests
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firestore')) {
    return 'api';
  }
  
  // Images
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)) {
    return 'images';
  }
  
  // Fonts
  if (request.destination === 'font' || /\.(woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    return 'fonts';
  }
  
  // Static assets
  if (/\.(js|css|html)$/i.test(url.pathname) || url.pathname.startsWith('/assets/')) {
    return 'static';
  }
  
  // Dynamic content
  return 'dynamic';
}

/**
 * Handle request with appropriate caching strategy
 */
async function handleRequest(request, strategyType) {
  const strategy = CACHE_STRATEGIES[strategyType];
  
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, strategyType);
    case 'network-first':
      return networkFirst(request, strategyType);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, strategyType);
    default:
      return fetch(request);
  }
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request, cacheType) {
  const cache = await caches.open(CACHE_NAMES[cacheType]);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, cacheType)) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  try {
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheResponse(cache, request, networkResponse.clone(), cacheType);
    }
    
    return networkResponse;
  } catch (error) {
    performanceMetrics.offlineRequests++;
    
    // Return cached response even if expired when offline
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return getOfflineFallback(request);
  }
}

/**
 * Network-first strategy
 */
async function networkFirst(request, cacheType) {
  const cache = await caches.open(CACHE_NAMES[cacheType]);
  
  try {
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheResponse(cache, request, networkResponse.clone(), cacheType);
    }
    
    return networkResponse;
  } catch (error) {
    performanceMetrics.offlineRequests++;
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      return cachedResponse;
    }
    
    return getOfflineFallback(request);
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cacheType) {
  const cache = await caches.open(CACHE_NAMES[cacheType]);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in background
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await cacheResponse(cache, request, networkResponse.clone(), cacheType);
    }
    return networkResponse;
  }).catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse && !isExpired(cachedResponse, cacheType)) {
    performanceMetrics.cacheHits++;
    networkPromise; // Don't await, let it run in background
    return cachedResponse;
  }
  
  // Wait for network response if no cache or expired
  try {
    performanceMetrics.networkRequests++;
    return await networkPromise;
  } catch (error) {
    performanceMetrics.offlineRequests++;
    return cachedResponse || getOfflineFallback(request);
  }
}

/**
 * Cache response with size management
 */
async function cacheResponse(cache, request, response, cacheType) {
  // Preserve all original headers (including Content-Type) and add timestamp
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());

  const responseWithTimestamp = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });

  await cache.put(request, responseWithTimestamp);

  // Manage cache size
  await manageCacheSize(cache, cacheType);
}

/**
 * Check if cached response is expired
 */
function isExpired(response, cacheType) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const age = Date.now() - parseInt(cachedAt);
  return age > CACHE_TTL[cacheType];
}

/**
 * Manage cache size by removing oldest entries
 */
async function manageCacheSize(cache, cacheType) {
  const maxEntries = MAX_CACHE_ENTRIES[cacheType];
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Remove oldest entries (simple FIFO approach)
    const entriesToRemove = keys.slice(0, keys.length - maxEntries);
    await Promise.all(entriesToRemove.map(key => cache.delete(key)));
  }
}

/**
 * Get offline fallback response
 */
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.destination === 'document') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TradeYa - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>You're offline</h1>
          <p>Please check your internet connection and try again.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Provide content-type-correct fallbacks to avoid MIME errors for module scripts/styles
  if (request.destination === 'script') {
    return new Response(`// Offline fallback for ${url.pathname}\nconsole.warn('Offline: script ${url.pathname} not available');`, {
      status: 503,
      headers: { 'Content-Type': 'text/javascript' }
    });
  }

  if (request.destination === 'style') {
    return new Response(`/* Offline fallback for ${url.pathname} */`, {
      status: 503,
      headers: { 'Content-Type': 'text/css' }
    });
  }

  if (request.destination === 'image') {
    // 1x1 transparent PNG
    const transparentPng =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
    const bytes = Uint8Array.from(atob(transparentPng), c => c.charCodeAt(0));
    return new Response(bytes, {
      status: 503,
      headers: { 'Content-Type': 'image/png' }
    });
  }

  if (url.pathname.endsWith('.json')) {
    return new Response(JSON.stringify({ offline: true, path: url.pathname }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}

/**
 * Process background sync queue
 */
async function processBackgroundSync() {
  console.log('Processing background sync queue...');
  
  for (const task of backgroundSyncQueue) {
    try {
      await processBackgroundSyncTask(task);
      performanceMetrics.backgroundSyncs++;
    } catch (error) {
      console.error('Background sync task failed:', error);
    }
  }
  
  backgroundSyncQueue = [];
}

/**
 * Process individual background sync task
 */
async function processBackgroundSyncTask(task) {
  const { type, data } = task;
  
  switch (type) {
    case 'api-call':
      await fetch(data.url, data.options);
      break;
    case 'data-sync':
      // Implement data synchronization
      break;
    default:
      console.log('Unknown background sync task type:', type);
  }
}

/**
 * Add task to background sync queue
 */
function addToBackgroundSync(task) {
  backgroundSyncQueue.push(task);
  
  // Register background sync
  self.registration.sync.register('background-sync');
}

/**
 * Update cache strategy
 */
function updateCacheStrategy(data) {
  if (!data || typeof data !== 'object' || !data.strategy) {
    console.warn('Service Worker: updateCacheStrategy requires a strategy field', data);
    return;
  }
  const { strategy } = data;
  // Update cache strategies dynamically
  console.log('Cache strategy updated:', strategy);
}

/**
 * Handle network state changes
 */
function handleNetworkStateChange(data) {
  const isOnline = typeof data === 'object' ? data.isOnline : undefined;
  if (typeof isOnline !== 'boolean') {
    console.warn('Service Worker: handleNetworkStateChange requires boolean isOnline', data);
    return;
  }
  console.log('Network state changed:', isOnline ? 'online' : 'offline');
  
  if (isOnline && backgroundSyncQueue.length > 0) {
    processBackgroundSync();
  }
}

console.log('Enhanced Service Worker loaded successfully');
