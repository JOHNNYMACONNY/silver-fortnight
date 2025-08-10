import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { prefetchRoutes, preloadImages, prefetchImages } from '../../utils/preloadUtils';

// Define route-specific resources to preload
const routeResources: Record<string, {
  preloadImages?: string[];
  prefetchImages?: string[];
  prefetchRoutes?: string[];
}> = {
  // Home page
  '/': {
    prefetchRoutes: ['/dashboard', '/trades', '/directory'],
    prefetchImages: [
      // Add common images that might be needed soon
    ]
  },
  
  // Dashboard page
  '/dashboard': {
    preloadImages: [
      // Critical images for the dashboard
    ],
    prefetchRoutes: ['/trades', '/messages', '/profile'],
    prefetchImages: [
      // Images that might be needed soon
    ]
  },
  
  // Trades page
  '/trades': {
    preloadImages: [
      // Critical images for the trades page
    ],
    prefetchRoutes: ['/trades/create'],
    prefetchImages: [
      // Images that might be needed soon
    ]
  },
  
  // Trade details page - using a pattern
  '/trades/': {
    preloadImages: [
      // Critical images for trade details
    ],
    prefetchRoutes: ['/messages', '/profile'],
    prefetchImages: [
      // Images that might be needed soon
    ]
  },
  
  // User directory page
  '/directory': {
    preloadImages: [
      // Critical images for the directory
    ],
    prefetchRoutes: ['/profile'],
    prefetchImages: [
      // Images that might be needed soon
    ]
  },
  
  // Profile page - using a pattern
  '/profile/': {
    preloadImages: [
      // Critical images for profile
    ],
    prefetchRoutes: ['/trades', '/messages'],
    prefetchImages: [
      // Images that might be needed soon
    ]
  },
  
  // Messages page
  '/messages': {
    preloadImages: [
      // Critical images for messages
    ],
    prefetchRoutes: ['/profile'],
    prefetchImages: [
      // Images that might be needed soon
    ]
  },
  
  // Collaborations page
  '/collaborations': {
    preloadImages: [
      // Critical images for collaborations
    ],
    prefetchRoutes: ['/collaborations/create'],
    prefetchImages: [
      // Images that might be needed soon
    ]
  },
  
  // Challenges page
  '/challenges': {
    preloadImages: [
      // Critical images for challenges
    ],
    prefetchRoutes: ['/challenges/create'],
    prefetchImages: [
      // Images that might be needed soon
    ]
  }
};

/**
 * RoutePreloader Component
 * 
 * This component handles preloading and prefetching resources based on the current route.
 * It should be placed high in the component tree to ensure it runs on every route change.
 */
const RoutePreloader: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    // Find exact match first
    let resources = routeResources[pathname];

    // If no exact match, try to find a pattern match
    if (!resources) {
      const patternMatch = Object.keys(routeResources).find(pattern =>
        pattern.endsWith('/') && pathname.startsWith(pattern)
      );

      if (patternMatch) {
        resources = routeResources[patternMatch];
      }
    }

    // If resources found, preload and prefetch them
    if (resources) {
      // Preload critical images for current route
      if (resources.preloadImages && resources.preloadImages.length > 0) {
        preloadImages(resources.preloadImages);
      }

      // Prefetch images likely to be needed soon
      if (resources.prefetchImages && resources.prefetchImages.length > 0) {
        prefetchImages(resources.prefetchImages);
      }

      // Prefetch routes likely to be navigated to
      if (resources.prefetchRoutes && resources.prefetchRoutes.length > 0) {
        prefetchRoutes(resources.prefetchRoutes);
      }
    }

    // Log preloading activity in development
    if ((typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && (import.meta.env.DEV || process.env.NODE_ENV === 'development')) || process.env.NODE_ENV === 'development') {
      console.log(`[RoutePreloader] Preloading resources for route: ${pathname}`);
    }
  }, [pathname]); // Only depend on pathname, not the entire location object
  
  // This component doesn't render anything
  return null;
};

export default RoutePreloader;
