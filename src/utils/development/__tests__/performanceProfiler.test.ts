/**
 * Performance Profiler Tests
 */

import { PerformanceProfiler, performanceProfiler, usePerformanceProfiler } from '../performanceProfiler';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 50, // 50MB
    jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
  }
};

// Mock window object
const mockWindow = {
  PerformanceObserver: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
  }))
};

// Mock console methods
const originalConsole = global.console;
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    // Reset environment
    process.env.NODE_ENV = 'development';
    
    // Mock globals
    global.performance = mockPerformance as any;
    global.window = mockWindow as any;
    global.console = mockConsole as any;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create new instance
    profiler = new PerformanceProfiler();
  });

  afterEach(() => {
    // Restore console
    global.console = originalConsole;
  });

  describe('initialization', () => {
    it('should initialize in development mode', () => {
      expect(mockConsole.log).toHaveBeenCalledWith('⚡ Performance Profiler initialized');
    });

    it('should not initialize in production mode', () => {
      process.env.NODE_ENV = 'production';
      jest.clearAllMocks();
      
      new PerformanceProfiler();
      
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should expose profiler to window object', () => {
      expect((global.window as any).__PERFORMANCE_PROFILER).toBe(profiler);
    });
  });

  describe('profiling sessions', () => {
    it('should start a profiling session', () => {
      const sessionId = profiler.startSession('Test Session');
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(mockPerformance.mark).toHaveBeenCalledWith(`session-${sessionId}-start`);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Started profiling session: Test Session')
      );
    });

    it('should end a profiling session', () => {
      const sessionId = profiler.startSession('Test Session');
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(200);
      
      const session = profiler.endSession(sessionId);
      
      expect(session).toBeDefined();
      expect(session?.duration).toBe(100);
      expect(mockPerformance.mark).toHaveBeenCalledWith(`session-${sessionId}-end`);
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        `session-${sessionId}`,
        `session-${sessionId}-start`,
        `session-${sessionId}-end`
      );
    });

    it('should return null for non-existent session', () => {
      const session = profiler.endSession('non-existent');
      
      expect(session).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith('Session non-existent not found');
    });
  });

  describe('function profiling', () => {
    it('should profile synchronous function execution', () => {
      const testFn = jest.fn(() => 'result');
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      const result = profiler.profile('testFunction', testFn);
      
      expect(result).toBe('result');
      expect(testFn).toHaveBeenCalled();
      expect(mockPerformance.mark).toHaveBeenCalledWith('testFunction-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('testFunction-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'testFunction',
        'testFunction-start',
        'testFunction-end'
      );
      expect(mockConsole.log).toHaveBeenCalledWith('⚡ testFunction: 50.00ms');
    });

    it('should handle function errors', () => {
      const errorFn = jest.fn(() => {
        throw new Error('Test error');
      });
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      expect(() => profiler.profile('errorFunction', errorFn)).toThrow('Test error');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ errorFunction failed after 50.00ms:'),
        expect.any(Error)
      );
    });

    it('should profile asynchronous function execution', async () => {
      const asyncFn = jest.fn().mockResolvedValue('async result');
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(200);
      
      const result = await profiler.profileAsync('asyncFunction', asyncFn);
      
      expect(result).toBe('async result');
      expect(asyncFn).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith('⚡ asyncFunction: 100.00ms');
    });

    it('should handle async function errors', async () => {
      const asyncErrorFn = jest.fn().mockRejectedValue(new Error('Async error'));
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      await expect(profiler.profileAsync('asyncErrorFunction', asyncErrorFn)).rejects.toThrow('Async error');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ asyncErrorFunction failed after 50.00ms:'),
        expect.any(Error)
      );
    });
  });

  describe('component profiling', () => {
    it('should profile component render', () => {
      const renderFn = jest.fn();
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      profiler.profileComponentRender('TestComponent', renderFn);
      
      expect(renderFn).toHaveBeenCalled();
      expect(mockPerformance.mark).toHaveBeenCalledWith('component-TestComponent-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('component-TestComponent-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'component-TestComponent',
        'component-TestComponent-start',
        'component-TestComponent-end'
      );
    });

    it('should track component profiles', () => {
      profiler['updateComponentProfile']('TestComponent', 50);
      profiler['updateComponentProfile']('TestComponent', 30);
      
      const profiles = profiler.getComponentProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0]).toMatchObject({
        name: 'TestComponent',
        renderCount: 2,
        totalRenderTime: 80,
        averageRenderTime: 40,
        slowestRender: 50,
        fastestRender: 30
      });
    });

    it('should identify slow components', () => {
      profiler['updateComponentProfile']('FastComponent', 10);
      profiler['updateComponentProfile']('SlowComponent', 50);
      
      const slowComponents = profiler.getSlowComponents(20);
      expect(slowComponents).toHaveLength(1);
      expect(slowComponents[0].name).toBe('SlowComponent');
    });
  });

  describe('memory monitoring', () => {
    it('should measure memory usage', () => {
      const memoryUsage = profiler.measureMemoryUsage();
      
      expect(memoryUsage).toEqual({
        usedJSHeapSize: 1024 * 1024 * 10,
        totalJSHeapSize: 1024 * 1024 * 50,
        jsHeapSizeLimit: 1024 * 1024 * 100,
        usedPercentage: 10
      });
    });

    it('should return null when memory API is not available', () => {
      delete (global.performance as any).memory;
      
      const memoryUsage = profiler.measureMemoryUsage();
      
      expect(memoryUsage).toBeNull();
    });
  });

  describe('bundle analysis', () => {
    it('should analyze bundle size', async () => {
      const mockResources = [
        {
          name: 'https://example.com/app.js',
          transferSize: 1024,
          encodedBodySize: 512
        },
        {
          name: 'https://example.com/vendor.js',
          transferSize: 2048,
          encodedBodySize: 1024
        }
      ];
      
      mockPerformance.getEntriesByType.mockReturnValue(mockResources);
      
      const analysis = await profiler.analyzeBundles();
      
      expect(analysis).toEqual({
        totalSize: 3072,
        gzippedSize: 1536,
        chunks: [
          {
            name: 'app.js',
            size: 1024,
            gzippedSize: 512,
            modules: []
          },
          {
            name: 'vendor.js',
            size: 2048,
            gzippedSize: 1024,
            modules: []
          }
        ],
        dependencies: [],
        duplicates: []
      });
    });

    it('should throw error when not in browser', async () => {
      delete global.window;
      
      await expect(profiler.analyzeBundles()).rejects.toThrow('Bundle analysis only available in browser');
    });
  });

  describe('reporting', () => {
    it('should generate performance report', () => {
      profiler['updateComponentProfile']('TestComponent', 50);
      
      const report = profiler.generateReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('componentProfiles');
      expect(report).toHaveProperty('slowComponents');
      expect(report).toHaveProperty('memoryUsage');
      expect(report).toHaveProperty('sessions');
      expect(report).toHaveProperty('recommendations');
    });

    it('should generate recommendations', () => {
      profiler['updateComponentProfile']('SlowComponent', 50);
      for (let i = 0; i < 101; i++) {
        profiler['updateComponentProfile']('HighRenderComponent', 10);
      }
      
      const report = profiler.generateReport();
      
      expect(report.recommendations).toContain(
        expect.stringContaining('Consider optimizing 1 slow components')
      );
      expect(report.recommendations).toContain(
        expect.stringContaining('Components with high render counts may benefit from memoization')
      );
    });
  });

  describe('data management', () => {
    it('should clear all profiling data', () => {
      profiler.startSession('Test Session');
      profiler['updateComponentProfile']('TestComponent', 50);
      
      profiler.clear();
      
      expect(profiler.getComponentProfiles()).toHaveLength(0);
      expect(mockPerformance.clearMarks).toHaveBeenCalled();
      expect(mockPerformance.clearMeasures).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith('🧹 Performance profiler data cleared');
    });
  });
});

describe('usePerformanceProfiler hook', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    jest.clearAllMocks();
  });

  it('should return profiling function in development mode', () => {
    const endProfileFn = usePerformanceProfiler('TestComponent');
    
    expect(typeof endProfileFn).toBe('function');
  });

  it('should return no-op function in production mode', () => {
    process.env.NODE_ENV = 'production';
    
    const endProfileFn = usePerformanceProfiler('TestComponent');
    
    expect(typeof endProfileFn).toBe('function');
  });
});

describe('singleton instance', () => {
  it('should export a singleton instance', () => {
    expect(performanceProfiler).toBeInstanceOf(PerformanceProfiler);
  });
});
