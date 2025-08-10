/**
 * Unit tests for Critical Path Analyzer
 */

import { 
  CriticalPathAnalyzer, 
  analyzeCriticalPath, 
  applyIntelligentPreloading,
  checkPerformanceBudgets
} from '../criticalPathAnalyzer';

// Mock performance APIs
const mockPerformanceObserver = jest.fn();
const mockPerformanceEntries: any[] = [];

Object.defineProperty(window, 'PerformanceObserver', {
  writable: true,
  value: jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    callback
  }))
});

Object.defineProperty(performance, 'getEntriesByType', {
  writable: true,
  value: jest.fn((type: string) => {
    return mockPerformanceEntries.filter(entry => entry.entryType === type);
  })
});

Object.defineProperty(performance, 'getEntriesByName', {
  writable: true,
  value: jest.fn((name: string) => {
    return mockPerformanceEntries.filter(entry => entry.name === name);
  })
});

// Mock DOM methods
Object.defineProperty(document, 'querySelectorAll', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(document, 'head', {
  writable: true,
  value: {
    appendChild: jest.fn()
  }
});

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: jest.fn((tagName: string) => ({
    rel: '',
    href: '',
    as: '',
    crossOrigin: ''
  }))
});

describe('CriticalPathAnalyzer', () => {
  let analyzer: CriticalPathAnalyzer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceEntries.length = 0;
    
    // Reset DOM mocks
    (document.querySelectorAll as jest.Mock).mockReturnValue([]);
    (document.head.appendChild as jest.Mock).mockClear();
    (document.createElement as jest.Mock).mockClear();
  });

  afterEach(() => {
    if (analyzer) {
      analyzer.destroy();
    }
  });

  describe('Initialization', () => {
    it('should create analyzer with default configuration', () => {
      analyzer = new CriticalPathAnalyzer();
      expect(analyzer).toBeDefined();
    });

    it('should create analyzer with custom configuration', () => {
      const customConfig = {
        performanceBudgets: {
          totalJavaScript: 200,
          totalCSS: 50,
          totalImages: 300,
          totalRequests: 30,
          firstContentfulPaint: 1500,
          largestContentfulPaint: 2000,
          cumulativeLayoutShift: 0.05
        },
        enablePreloading: false
      };

      analyzer = new CriticalPathAnalyzer(customConfig);
      expect(analyzer).toBeDefined();
    });

    it('should initialize performance observer', () => {
      analyzer = new CriticalPathAnalyzer();
      expect(window.PerformanceObserver).toHaveBeenCalled();
    });
  });

  describe('Resource Type Detection', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer();
    });

    it('should detect JavaScript resources', () => {
      const mockEntry = {
        name: 'https://example.com/app.js',
        initiatorType: 'script',
        startTime: 100,
        responseEnd: 200,
        transferSize: 50000,
        encodedBodySize: 45000
      };

      // Simulate resource entry processing
      const resourceInfo = (analyzer as any).determineResourceType(mockEntry.name, mockEntry.initiatorType);
      expect(resourceInfo).toBe('script');
    });

    it('should detect CSS resources', () => {
      const resourceType = (analyzer as any).determineResourceType('styles.css', 'link');
      expect(resourceType).toBe('stylesheet');
    });

    it('should detect image resources', () => {
      const resourceType = (analyzer as any).determineResourceType('image.jpg', 'img');
      expect(resourceType).toBe('image');
    });

    it('should detect font resources', () => {
      const resourceType = (analyzer as any).determineResourceType('font.woff2', 'other');
      expect(resourceType).toBe('font');
    });
  });

  describe('Render Blocking Detection', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer();
    });

    it('should identify render-blocking CSS', () => {
      const mockEntry = {
        name: 'https://example.com/styles.css',
        initiatorType: 'link'
      };

      const isBlocking = (analyzer as any).isRenderBlocking(mockEntry);
      expect(isBlocking).toBe(true);
    });

    it('should identify render-blocking synchronous scripts in head', () => {
      // Mock script element in head
      const mockScript = {
        src: 'https://example.com/app.js',
        async: false,
        defer: false,
        closest: jest.fn().mockReturnValue(document.head)
      };

      (document.querySelectorAll as jest.Mock).mockReturnValue([mockScript]);

      const mockEntry = {
        name: 'https://example.com/app.js',
        initiatorType: 'script'
      };

      const isBlocking = (analyzer as any).isRenderBlocking(mockEntry);
      expect(isBlocking).toBe(true);
    });

    it('should not identify async scripts as render-blocking', () => {
      const mockScript = {
        src: 'https://example.com/app.js',
        async: true,
        defer: false,
        closest: jest.fn().mockReturnValue(document.head)
      };

      (document.querySelectorAll as jest.Mock).mockReturnValue([mockScript]);

      const mockEntry = {
        name: 'https://example.com/app.js',
        initiatorType: 'script'
      };

      const isBlocking = (analyzer as any).isRenderBlocking(mockEntry);
      expect(isBlocking).toBe(false);
    });
  });

  describe('Critical Resource Identification', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer();
    });

    it('should identify critical CSS', () => {
      const mockEntry = {
        name: 'https://example.com/critical.css',
        initiatorType: 'link'
      };

      const isCritical = (analyzer as any).isCriticalResource(mockEntry);
      expect(isCritical).toBe(true);
    });

    it('should identify critical fonts loaded early', () => {
      const mockEntry = {
        name: 'https://example.com/font.woff2',
        initiatorType: 'other',
        startTime: 500
      };

      const isCritical = (analyzer as any).isCriticalResource(mockEntry);
      expect(isCritical).toBe(true);
    });

    it('should identify main JavaScript bundles as critical', () => {
      const mockEntry = {
        name: 'https://example.com/main.js',
        initiatorType: 'script',
        startTime: 100
      };

      const isCritical = (analyzer as any).isCriticalResource(mockEntry);
      expect(isCritical).toBe(true);
    });
  });

  describe('Performance Budget Checking', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer();
      
      // Mock performance entries
      mockPerformanceEntries.push(
        { name: 'first-contentful-paint', startTime: 1500 },
        { entryType: 'largest-contentful-paint', startTime: 2200 },
        { entryType: 'layout-shift', value: 0.08, hadRecentInput: false }
      );
    });

    it('should check performance budgets correctly', () => {
      // Mock resources that fit within budget
      const goodResources = [
        {
          type: 'script' as const,
          size: 100 * 1024, // 100KB
          loadTime: 500,
          isRenderBlocking: false,
          isCritical: true,
          priority: 'high' as const,
          timing: { dns: 10, tcp: 20, ssl: 0, ttfb: 100, download: 200, total: 330 },
          fromCache: false,
          crossOrigin: false,
          url: 'app.js'
        },
        {
          type: 'stylesheet' as const,
          size: 50 * 1024, // 50KB
          loadTime: 300,
          isRenderBlocking: true,
          isCritical: true,
          priority: 'high' as const,
          timing: { dns: 5, tcp: 15, ssl: 0, ttfb: 80, download: 150, total: 250 },
          fromCache: false,
          crossOrigin: false,
          url: 'styles.css'
        }
      ];

      const budgetStatus = (analyzer as any).checkPerformanceBudgets(goodResources);
      
      expect(budgetStatus.overallStatus).toBe('pass');
      expect(budgetStatus.score).toBeGreaterThan(80);
    });

    it('should fail budget check for oversized resources', () => {
      const oversizedResources = [
        {
          type: 'script' as const,
          size: 500 * 1024, // 500KB - over budget
          loadTime: 2000,
          isRenderBlocking: false,
          isCritical: true,
          priority: 'high' as const,
          timing: { dns: 10, tcp: 20, ssl: 0, ttfb: 100, download: 1800, total: 1930 },
          fromCache: false,
          crossOrigin: false,
          url: 'huge-app.js'
        }
      ];

      const budgetStatus = (analyzer as any).checkPerformanceBudgets(oversizedResources);
      
      expect(budgetStatus.budgets.totalJavaScript.status).toBe('fail');
      expect(budgetStatus.overallStatus).toBe('fail');
    });
  });

  describe('Preload Candidate Identification', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer({ enablePreloading: true });
    });

    it('should identify critical fonts as preload candidates', () => {
      const resources = [
        {
          type: 'font' as const,
          size: 30000,
          loadTime: 400,
          isRenderBlocking: false,
          isCritical: true,
          priority: 'high' as const,
          timing: { dns: 50, tcp: 30, ssl: 0, ttfb: 100, download: 200, total: 380 },
          fromCache: false,
          crossOrigin: false,
          url: 'https://fonts.example.com/font.woff2'
        }
      ];

      const candidates = (analyzer as any).identifyPreloadCandidates(resources);
      
      expect(candidates).toHaveLength(1);
      expect(candidates[0].type).toBe('font');
      expect(candidates[0].as).toBe('font');
      expect(candidates[0].reason).toContain('Critical font');
    });

    it('should identify large critical images as preload candidates', () => {
      const resources = [
        {
          type: 'image' as const,
          size: 80000, // Over 50KB threshold
          loadTime: 600,
          isRenderBlocking: false,
          isCritical: true,
          priority: 'high' as const,
          timing: { dns: 20, tcp: 25, ssl: 0, ttfb: 150, download: 400, total: 595 },
          fromCache: false,
          crossOrigin: false,
          url: 'hero-image.jpg'
        }
      ];

      const candidates = (analyzer as any).identifyPreloadCandidates(resources);
      
      expect(candidates).toHaveLength(1);
      expect(candidates[0].type).toBe('image');
      expect(candidates[0].reason).toContain('Large critical image');
    });

    it('should respect max preload resources limit', () => {
      analyzer = new CriticalPathAnalyzer({ 
        enablePreloading: true,
        maxPreloadResources: 2
      });

      const resources = Array.from({ length: 5 }, (_, i) => ({
        type: 'font' as const,
        size: 30000,
        loadTime: 400,
        isRenderBlocking: false,
        isCritical: true,
        priority: 'high' as const,
        timing: { dns: 50, tcp: 30, ssl: 0, ttfb: 100, download: 200, total: 380 },
        fromCache: false,
        crossOrigin: false,
        url: `font-${i}.woff2`
      }));

      const candidates = (analyzer as any).identifyPreloadCandidates(resources);
      
      expect(candidates.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Bottleneck Identification', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer();
    });

    it('should identify slow network resources as bottlenecks', () => {
      const slowResources = [
        {
          type: 'script' as const,
          size: 100000,
          loadTime: 2500, // Over 1s threshold
          isRenderBlocking: false,
          isCritical: true,
          priority: 'high' as const,
          timing: { dns: 100, tcp: 150, ssl: 0, ttfb: 800, download: 1450, total: 2500 },
          fromCache: false,
          crossOrigin: false,
          url: 'slow-script.js'
        }
      ];

      const bottlenecks = (analyzer as any).identifyBottlenecks(slowResources);
      
      expect(bottlenecks).toHaveLength(1);
      expect(bottlenecks[0].type).toBe('network');
      expect(bottlenecks[0].description).toContain('loading slowly');
    });

    it('should identify render-blocking bottlenecks', () => {
      const blockingResources = Array.from({ length: 5 }, (_, i) => ({
        type: 'stylesheet' as const,
        size: 50000,
        loadTime: 500,
        isRenderBlocking: true,
        isCritical: true,
        priority: 'high' as const,
        timing: { dns: 20, tcp: 30, ssl: 0, ttfb: 150, download: 300, total: 500 },
        fromCache: false,
        crossOrigin: false,
        url: `blocking-style-${i}.css`
      }));

      const bottlenecks = (analyzer as any).identifyBottlenecks(blockingResources);
      
      const renderingBottleneck = bottlenecks.find((b: any) => b.type === 'rendering');
      expect(renderingBottleneck).toBeDefined();
      expect(renderingBottleneck?.severity).toBe('critical');
    });

    it('should identify large JavaScript bundles as bottlenecks', () => {
      const largeScripts = [
        {
          type: 'script' as const,
          size: 300000, // Over 200KB threshold
          loadTime: 1000,
          isRenderBlocking: false,
          isCritical: true,
          priority: 'high' as const,
          timing: { dns: 20, tcp: 30, ssl: 0, ttfb: 100, download: 850, total: 1000 },
          fromCache: false,
          crossOrigin: false,
          url: 'large-bundle.js'
        }
      ];

      const bottlenecks = (analyzer as any).identifyBottlenecks(largeScripts);
      
      const scriptingBottleneck = bottlenecks.find((b: any) => b.type === 'scripting');
      expect(scriptingBottleneck).toBeDefined();
      expect(scriptingBottleneck?.description).toContain('Large JavaScript bundles');
    });
  });

  describe('Preloading Application', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer({ enablePreloading: true });
    });

    it('should apply preloading for candidates', () => {
      const preloadCandidates = [
        {
          url: 'https://fonts.example.com/font.woff2',
          type: 'font' as const,
          as: 'font',
          crossorigin: false,
          priority: 'high' as const,
          reason: 'Critical font',
          estimatedBenefit: 100
        }
      ];

      analyzer.applyPreloading(preloadCandidates);

      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('should not apply preloading when disabled', () => {
      analyzer = new CriticalPathAnalyzer({ enablePreloading: false });
      
      const preloadCandidates = [
        {
          url: 'font.woff2',
          type: 'font' as const,
          as: 'font',
          crossorigin: false,
          priority: 'high' as const,
          reason: 'Critical font',
          estimatedBenefit: 100
        }
      ];

      analyzer.applyPreloading(preloadCandidates);

      expect(document.createElement).not.toHaveBeenCalled();
    });
  });

  describe('Full Analysis', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer();
    });

    it('should complete full critical path analysis', async () => {
      // Mock some performance entries
      mockPerformanceEntries.push(
        { name: 'first-contentful-paint', startTime: 1200 },
        { entryType: 'largest-contentful-paint', startTime: 1800 },
        { entryType: 'layout-shift', value: 0.05, hadRecentInput: false }
      );

      const analysis = await analyzer.analyzeCriticalPath();

      expect(analysis).toBeDefined();
      expect(analysis.totalCriticalPathTime).toBeGreaterThanOrEqual(0);
      expect(analysis.renderBlockingResources).toBeDefined();
      expect(analysis.criticalResources).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.performanceBudgetStatus).toBeDefined();
      expect(analysis.preloadCandidates).toBeDefined();
      expect(analysis.bottlenecks).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should analyze critical path with utility function', async () => {
      const analysis = await analyzeCriticalPath();
      expect(analysis).toBeDefined();
    });

    it('should apply intelligent preloading with utility function', async () => {
      await applyIntelligentPreloading();
      // Should not throw
    });

    it('should check performance budgets with utility function', async () => {
      const budgetStatus = await checkPerformanceBudgets();
      expect(budgetStatus).toBeDefined();
      expect(budgetStatus.overallStatus).toMatch(/^(pass|warn|fail)$/);
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer();
    });

    it('should update configuration', () => {
      const newConfig = {
        enablePreloading: false,
        performanceBudgets: {
          totalJavaScript: 500,
          totalCSS: 150,
          totalImages: 800,
          totalRequests: 80,
          firstContentfulPaint: 2000,
          largestContentfulPaint: 3000,
          cumulativeLayoutShift: 0.15
        }
      };

      expect(() => {
        analyzer.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      analyzer = new CriticalPathAnalyzer();
    });

    it('should clean up resources on destroy', () => {
      expect(() => {
        analyzer.destroy();
      }).not.toThrow();
    });
  });
});