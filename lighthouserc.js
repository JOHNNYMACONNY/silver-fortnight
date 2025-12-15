module.exports = {
  ci: {
    collect: {
      // Build and serve the app
      startServerCommand: 'npm run preview',
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/profile/test-user',
      ],
      numberOfRuns: 3, // Run 3 times and average
      settings: {
        preset: 'desktop',
        // Throttling settings for consistent results
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Core Web Vitals - Based on Phase 3B results
        'first-contentful-paint': ['error', { maxNumericValue: 220 }], // Current: 84ms, buffer: 136ms
        'largest-contentful-paint': ['error', { maxNumericValue: 500 }], // Current: 300ms, buffer: 200ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.35 }], // Current: 0.28, buffer: 0.07
        'interactive': ['error', { maxNumericValue: 3000 }], // Reasonable TTI target
        'max-potential-fid': ['warn', { maxNumericValue: 200 }], // INP/FID target
        
        // Performance score
        'categories:performance': ['error', { minScore: 0.9 }], // Maintain 90+ performance score
        
        // Bundle size - Based on build output
        'total-byte-weight': ['warn', { maxNumericValue: 2000000 }], // 2MB total (current: ~1.8MB)
        'resource-summary:script:size': ['warn', { maxNumericValue: 800000 }], // 800KB JS (current: ~620KB main)
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 400000 }], // 400KB CSS (current: 343KB)
        
        // Best practices
        'uses-responsive-images': 'off', // We use Cloudinary for responsive images
        'offscreen-images': 'off', // Lazy loading handled by browser
        'modern-image-formats': 'warn', // Nice to have, not critical
        
        // Accessibility (basic checks)
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        
        // SEO (basic checks)
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // Free temporary storage for results
    },
  },
};

