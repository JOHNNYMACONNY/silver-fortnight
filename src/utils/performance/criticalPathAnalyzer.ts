/**
 * Enhanced Critical Path Analyzer for TradeYa
 * 
 * Analyzes the critical rendering path, identifies render-blocking resources,
 * implements intelligent preloading strategies, and enforces performance budgets.
 */

import type { LayoutShiftEntry } from '../../types/browser';
import { logger } from '@utils/logging/logger';

/**
 * Resource information for analysis
 */
export interface ResourceInfo {
  url: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'other';
  size: number;
  loadTime: number;
  isRenderBlocking: boolean;
  isCritical: boolean;
  priority: 'high' | 'medium' | 'low';
  timing: {
    dns: number;
    tcp: number;
    ssl: number;
    ttfb: number;
    download: number;
    total: number;
  };
  fromCache: boolean;
  crossOrigin: boolean;
}

/**
 * Critical path analysis result
 */
export interface CriticalPathAnalysis {
  totalCriticalPathTime: number;
  renderBlockingResources: ResourceInfo[];
  criticalResources: ResourceInfo[];
  recommendations: Recommendation[];
  performanceBudgetStatus: PerformanceBudgetStatus;
  preloadCandidates: PreloadCandidate[];
  bottlenecks: Bottleneck[];
}

/**
 * Performance recommendation
 */
export interface Recommendation {
  type: 'preload' | 'defer' | 'async' | 'inline' | 'compress' | 'optimize' | 'remove';
  resource: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedImprovement: number; // milliseconds
  priority: number; // 1-10, higher is more important
}

/**
 * Performance budget configuration and status
 */
export interface PerformanceBudgetStatus {
  budgets: {
    totalJavaScript: { budget: number; actual: number; status: 'pass' | 'warn' | 'fail' };
    totalCSS: { budget: number; actual: number; status: 'pass' | 'warn' | 'fail' };
    totalImages: { budget: number; actual: number; status: 'pass' | 'warn' | 'fail' };
    totalRequests: { budget: number; actual: number; status: 'pass' | 'warn' | 'fail' };
    firstContentfulPaint: { budget: number; actual: number; status: 'pass' | 'warn' | 'fail' };
    largestContentfulPaint: { budget: number; actual: number; status: 'pass' | 'warn' | 'fail' };
    cumulativeLayoutShift: { budget: number; actual: number; status: 'pass' | 'warn' | 'fail' };
  };
  overallStatus: 'pass' | 'warn' | 'fail';
  score: number; // 0-100
}

/**
 * Preload candidate resource
 */
export interface PreloadCandidate {
  url: string;
  type: 'script' | 'style' | 'font' | 'image';
  as: string;
  crossorigin?: boolean;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedBenefit: number;
}

/**
 * Performance bottleneck
 */
export interface Bottleneck {
  type: 'network' | 'parsing' | 'rendering' | 'scripting';
  description: string;
  severity: 'critical' | 'major' | 'minor';
  impact: number; // milliseconds
  suggestions: string[];
}

/**
 * Configuration for critical path analysis
 */
export interface CriticalPathConfig {
  performanceBudgets: {
    totalJavaScript: number; // KB
    totalCSS: number; // KB
    totalImages: number; // KB
    totalRequests: number;
    firstContentfulPaint: number; // ms
    largestContentfulPaint: number; // ms
    cumulativeLayoutShift: number; // score
  };
  criticalViewport: {
    width: number;
    height: number;
  };
  enablePreloading: boolean;
  enableResourceHints: boolean;
  maxPreloadResources: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CriticalPathConfig = {
  performanceBudgets: {
    totalJavaScript: 350, // 350KB
    totalCSS: 100, // 100KB
    totalImages: 500, // 500KB
    totalRequests: 50,
    firstContentfulPaint: 1800, // 1.8s
    largestContentfulPaint: 2500, // 2.5s
    cumulativeLayoutShift: 0.1 // 0.1 score
  },
  criticalViewport: {
    width: 1200,
    height: 800
  },
  enablePreloading: true,
  enableResourceHints: true,
  maxPreloadResources: 10
};

/**
 * Enhanced Critical Path Analyzer class
 */
export class CriticalPathAnalyzer {
  private config: CriticalPathConfig;
  private resourceObserver: PerformanceObserver | null = null;
  private resources: Map<string, ResourceInfo> = new Map();
  private analysis: CriticalPathAnalysis | null = null;
  private navigationTiming: PerformanceNavigationTiming | null = null;

  constructor(config: Partial<CriticalPathConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeObserver();
  }

  /**
   * Initialize performance observer to collect resource data
   */
  private initializeObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      logger.warn('PerformanceObserver not supported', 'UTILITY');
      return;
    }

    try {
      this.resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry as PerformanceResourceTiming);
          } else if (entry.entryType === 'navigation') {
            this.processNavigationEntry(entry as PerformanceNavigationTiming);
          }
        });
      });

      this.resourceObserver.observe({ 
        entryTypes: ['resource', 'navigation'] 
      });
    } catch (error) {
      logger.error('Failed to initialize resource observer:', 'UTILITY', {}, error as Error);
    }
  }

  /**
   * Process resource timing entry
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resourceInfo: ResourceInfo = {
      url: entry.name,
      type: this.determineResourceType(entry.name, entry.initiatorType),
      size: entry.transferSize || entry.encodedBodySize || 0,
      loadTime: entry.responseEnd - entry.startTime,
      isRenderBlocking: this.isRenderBlocking(entry),
      isCritical: this.isCriticalResource(entry),
      priority: this.calculatePriority(entry),
      timing: {
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        tcp: entry.connectEnd - entry.connectStart,
        ssl: entry.secureConnectionStart ? entry.connectEnd - entry.secureConnectionStart : 0,
        ttfb: entry.responseStart - entry.requestStart,
        download: entry.responseEnd - entry.responseStart,
        total: entry.responseEnd - entry.startTime
      },
      fromCache: entry.transferSize === 0 && entry.encodedBodySize > 0,
      crossOrigin: this.isCrossOrigin(entry.name)
    };

    this.resources.set(entry.name, resourceInfo);
  }

  /**
   * Process navigation timing entry
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    // Store navigation timing for analysis
    this.navigationTiming = entry;
  }

  /**
   * Determine resource type from URL and initiator
   */
  private determineResourceType(
    url: string,
    initiatorType: string
  ): ResourceInfo['type'] {
    if (initiatorType === 'script' || url.includes('.js')) return 'script';
    if (initiatorType === 'link' || url.includes('.css')) return 'stylesheet';
    if (initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|otf|eot)$/i.test(url)) return 'font';
    return 'other';
  }

  /**
   * Check if resource is render-blocking
   */
  private isRenderBlocking(entry: PerformanceResourceTiming): boolean {
    const url = entry.name;
    const initiatorType = entry.initiatorType;

    // CSS is render-blocking by default
    if (initiatorType === 'link' && url.includes('.css')) {
      return true;
    }

    // Synchronous scripts in head are render-blocking
    if (initiatorType === 'script' && url.includes('.js')) {
      // Check if script is in head and not async/defer
      const scriptElements = document.querySelectorAll('script[src]');
      for (const script of scriptElements) {
        if ((script as HTMLScriptElement).src === url) {
          const isInHead = script.closest('head') !== null;
          const isAsync = (script as HTMLScriptElement).async;
          const isDefer = (script as HTMLScriptElement).defer;
          return isInHead && !isAsync && !isDefer;
        }
      }
    }

    return false;
  }

  /**
   * Check if resource is critical for above-the-fold rendering
   */
  private isCriticalResource(entry: PerformanceResourceTiming): boolean {
    const url = entry.name;
    const type = this.determineResourceType(url, entry.initiatorType);

    // CSS is generally critical
    if (type === 'stylesheet') return true;

    // Critical fonts (typically loaded early)
    if (type === 'font' && entry.startTime < 1000) return true;

    // Images above the fold
    if (type === 'image') {
      return this.isAboveTheFold(url);
    }

    // Critical JavaScript (main bundle, framework)
    if (type === 'script') {
      return url.includes('main') || 
             url.includes('vendor') || 
             url.includes('react') || 
             url.includes('vue') || 
             entry.startTime < 500;
    }

    return false;
  }

  /**
   * Check if image is above the fold
   */
  private isAboveTheFold(imageUrl: string): boolean {
    try {
      const images = document.querySelectorAll('img');
      for (const img of images) {
        if (img.src === imageUrl || img.currentSrc === imageUrl) {
          const rect = img.getBoundingClientRect();
          return rect.top < this.config.criticalViewport.height;
        }
      }
    } catch (error) {
      logger.warn('Error checking if image is above the fold:', 'UTILITY', error);
    }
    return false;
  }

  /**
   * Calculate resource priority
   */
  private calculatePriority(entry: PerformanceResourceTiming): 'high' | 'medium' | 'low' {
    const isCritical = this.isCriticalResource(entry);
    const isRenderBlocking = this.isRenderBlocking(entry);
    const loadTime = entry.responseEnd - entry.startTime;

    if (isCritical || isRenderBlocking) return 'high';
    if (loadTime > 1000) return 'low';
    return 'medium';
  }

  /**
   * Check if resource is cross-origin
   */
  private isCrossOrigin(url: string): boolean {
    try {
      const resourceOrigin = new URL(url).origin;
      return resourceOrigin !== window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Analyze the critical rendering path
   */
  public async analyzeCriticalPath(): Promise<CriticalPathAnalysis> {
    // Wait a bit for resources to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const resources = Array.from(this.resources.values());
    const renderBlockingResources = resources.filter(r => r.isRenderBlocking);
    const criticalResources = resources.filter(r => r.isCritical);

    // Calculate total critical path time
    const totalCriticalPathTime = this.calculateCriticalPathTime(renderBlockingResources);

    // Generate recommendations
    const recommendations = this.generateRecommendations(resources);

    // Check performance budgets
    const performanceBudgetStatus = this.checkPerformanceBudgets(resources);

    // Identify preload candidates
    const preloadCandidates = this.identifyPreloadCandidates(resources);

    // Find bottlenecks
    const bottlenecks = this.identifyBottlenecks(resources);

    this.analysis = {
      totalCriticalPathTime,
      renderBlockingResources,
      criticalResources,
      recommendations: recommendations.sort((a, b) => b.priority - a.priority),
      performanceBudgetStatus,
      preloadCandidates,
      bottlenecks
    };

    return this.analysis;
  }

  /**
   * Calculate critical path time
   */
  private calculateCriticalPathTime(renderBlockingResources: ResourceInfo[]): number {
    if (renderBlockingResources.length === 0) return 0;

    // Find the longest blocking chain
    return Math.max(...renderBlockingResources.map(r => r.loadTime));
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(resources: ResourceInfo[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    resources.forEach(resource => {
      // Large JavaScript files
      if (resource.type === 'script' && resource.size > 100000) { // > 100KB
        recommendations.push({
          type: 'defer',
          resource: resource.url,
          description: `Large JavaScript file (${Math.round(resource.size / 1024)}KB) should be deferred or code-split`,
          impact: 'high',
          estimatedImprovement: resource.loadTime * 0.3,
          priority: 9
        });
      }

      // Render-blocking CSS
      if (resource.type === 'stylesheet' && resource.isRenderBlocking && resource.loadTime > 100) {
        recommendations.push({
          type: 'inline',
          resource: resource.url,
          description: 'Critical CSS should be inlined to reduce render blocking',
          impact: 'high',
          estimatedImprovement: resource.timing.ttfb + resource.timing.download,
          priority: 8
        });
      }

      // Large images
      if (resource.type === 'image' && resource.size > 200000) { // > 200KB
        recommendations.push({
          type: 'optimize',
          resource: resource.url,
          description: `Large image (${Math.round(resource.size / 1024)}KB) should be optimized or lazy-loaded`,
          impact: 'medium',
          estimatedImprovement: resource.loadTime * 0.5,
          priority: 6
        });
      }

      // Slow third-party resources
      if (resource.crossOrigin && resource.loadTime > 1000) {
        recommendations.push({
          type: 'preload',
          resource: resource.url,
          description: 'Slow third-party resource should be preloaded or replaced',
          impact: 'medium',
          estimatedImprovement: resource.loadTime * 0.2,
          priority: 7
        });
      }

      // Critical fonts
      if (resource.type === 'font' && resource.isCritical && !resource.fromCache) {
        recommendations.push({
          type: 'preload',
          resource: resource.url,
          description: 'Critical font should be preloaded to prevent FOIT/FOUT',
          impact: 'medium',
          estimatedImprovement: resource.timing.dns + resource.timing.tcp,
          priority: 7
        });
      }
    });

    return recommendations;
  }

  /**
   * Check performance budgets
   */
  private checkPerformanceBudgets(resources: ResourceInfo[]): PerformanceBudgetStatus {
    const budgets = this.config.performanceBudgets;
    
    // Calculate actual values
    const totalJS = resources
      .filter(r => r.type === 'script')
      .reduce((sum, r) => sum + r.size, 0) / 1024; // Convert to KB

    const totalCSS = resources
      .filter(r => r.type === 'stylesheet')
      .reduce((sum, r) => sum + r.size, 0) / 1024;

    const totalImages = resources
      .filter(r => r.type === 'image')
      .reduce((sum, r) => sum + r.size, 0) / 1024;

    const totalRequests = resources.length;

    // Get Web Vitals
    const fcp = this.getFirstContentfulPaint();
    const lcp = this.getLargestContentfulPaint();
    const cls = this.getCumulativeLayoutShift();

    const checkBudget = (actual: number, budget: number): 'pass' | 'warn' | 'fail' => {
      if (actual <= budget) return 'pass';
      if (actual <= budget * 1.2) return 'warn';
      return 'fail';
    };

    const budgetStatus = {
      totalJavaScript: { budget: budgets.totalJavaScript, actual: totalJS, status: checkBudget(totalJS, budgets.totalJavaScript) },
      totalCSS: { budget: budgets.totalCSS, actual: totalCSS, status: checkBudget(totalCSS, budgets.totalCSS) },
      totalImages: { budget: budgets.totalImages, actual: totalImages, status: checkBudget(totalImages, budgets.totalImages) },
      totalRequests: { budget: budgets.totalRequests, actual: totalRequests, status: checkBudget(totalRequests, budgets.totalRequests) },
      firstContentfulPaint: { budget: budgets.firstContentfulPaint, actual: fcp, status: checkBudget(fcp, budgets.firstContentfulPaint) },
      largestContentfulPaint: { budget: budgets.largestContentfulPaint, actual: lcp, status: checkBudget(lcp, budgets.largestContentfulPaint) },
      cumulativeLayoutShift: { budget: budgets.cumulativeLayoutShift, actual: cls, status: checkBudget(cls, budgets.cumulativeLayoutShift) }
    };

    // Calculate overall status and score
    const statuses = Object.values(budgetStatus).map(b => b.status);
    const failCount = statuses.filter(s => s === 'fail').length;
    const warnCount = statuses.filter(s => s === 'warn').length;

    let overallStatus: 'pass' | 'warn' | 'fail';
    if (failCount > 0) overallStatus = 'fail';
    else if (warnCount > 0) overallStatus = 'warn';
    else overallStatus = 'pass';

    const score = Math.max(0, 100 - (failCount * 20) - (warnCount * 10));

    return {
      budgets: budgetStatus,
      overallStatus,
      score
    };
  }

  /**
   * Identify preload candidates
   */
  private identifyPreloadCandidates(resources: ResourceInfo[]): PreloadCandidate[] {
    if (!this.config.enablePreloading) return [];

    const candidates: PreloadCandidate[] = [];

    resources.forEach(resource => {
      let shouldPreload = false;
      let reason = '';
      let estimatedBenefit = 0;

      // Critical fonts
      if (resource.type === 'font' && resource.isCritical) {
        shouldPreload = true;
        reason = 'Critical font to prevent FOIT/FOUT';
        estimatedBenefit = resource.timing.dns + resource.timing.tcp;
      }

      // Key third-party resources
      if (resource.crossOrigin && resource.isCritical && resource.loadTime > 200) {
        shouldPreload = true;
        reason = 'Critical cross-origin resource';
        estimatedBenefit = resource.timing.dns + resource.timing.tcp;
      }

      // Large critical images
      if (resource.type === 'image' && resource.isCritical && resource.size > 50000) {
        shouldPreload = true;
        reason = 'Large critical image above the fold';
        estimatedBenefit = resource.timing.ttfb;
      }

      if (shouldPreload && candidates.length < this.config.maxPreloadResources) {
        candidates.push({
          url: resource.url,
          type: resource.type === 'stylesheet' ? 'style' :
                resource.type === 'other' ? 'script' :
                resource.type as 'script' | 'style' | 'font' | 'image',
          as: this.getPreloadAs(resource.type),
          crossorigin: resource.crossOrigin,
          priority: resource.priority,
          reason,
          estimatedBenefit
        });
      }
    });

    return candidates.sort((a, b) => b.estimatedBenefit - a.estimatedBenefit);
  }

  /**
   * Get preload 'as' attribute value
   */
  private getPreloadAs(type: ResourceInfo['type']): string {
    switch (type) {
      case 'script': return 'script';
      case 'stylesheet': return 'style';
      case 'image': return 'image';
      case 'font': return 'font';
      default: return 'fetch';
    }
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(resources: ResourceInfo[]): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Network bottlenecks
    const slowResources = resources.filter(r => r.loadTime > 1000);
    if (slowResources.length > 0) {
      bottlenecks.push({
        type: 'network',
        description: `${slowResources.length} resources are loading slowly (>1s)`,
        severity: slowResources.length > 5 ? 'critical' : 'major',
        impact: slowResources.reduce((sum, r) => sum + r.loadTime, 0) / slowResources.length,
        suggestions: [
          'Enable compression (gzip/brotli)',
          'Use a CDN',
          'Optimize resource sizes',
          'Enable HTTP/2'
        ]
      });
    }

    // Render-blocking bottlenecks
    const blockingResources = resources.filter(r => r.isRenderBlocking);
    if (blockingResources.length > 3) {
      bottlenecks.push({
        type: 'rendering',
        description: `${blockingResources.length} render-blocking resources delay first paint`,
        severity: 'critical',
        impact: this.calculateCriticalPathTime(blockingResources),
        suggestions: [
          'Inline critical CSS',
          'Defer non-critical JavaScript',
          'Use async/defer for scripts',
          'Split large bundles'
        ]
      });
    }

    // Large JavaScript bundles
    const largeScripts = resources.filter(r => r.type === 'script' && r.size > 200000);
    if (largeScripts.length > 0) {
      bottlenecks.push({
        type: 'scripting',
        description: 'Large JavaScript bundles impact parse/execution time',
        severity: 'major',
        impact: largeScripts.reduce((sum, r) => sum + r.loadTime, 0),
        suggestions: [
          'Code splitting',
          'Tree shaking',
          'Dynamic imports',
          'Remove unused dependencies'
        ]
      });
    }

    return bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Get First Contentful Paint
   */
  private getFirstContentfulPaint(): number {
    try {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      return fcpEntry ? fcpEntry.startTime : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get Largest Contentful Paint
   */
  private getLargestContentfulPaint(): number {
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get Cumulative Layout Shift
   */
  private getCumulativeLayoutShift(): number {
    try {
      const clsEntries = performance.getEntriesByType('layout-shift') as LayoutShiftEntry[];
      return clsEntries.reduce((cls, entry) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
        return cls;
      }, 0);
    } catch {
      return 0;
    }
  }

  /**
   * Apply intelligent preloading
   */
  public applyPreloading(candidates?: PreloadCandidate[]): void {
    if (!this.config.enablePreloading) return;

    const preloadCandidates = candidates || (this.analysis?.preloadCandidates ?? []);
    
    preloadCandidates.forEach(candidate => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = candidate.url;
      link.as = candidate.as;
      
      if (candidate.crossorigin) {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * Apply resource hints
   */
  public applyResourceHints(): void {
    if (!this.config.enableResourceHints || !this.analysis) return;

    const { criticalResources } = this.analysis;
    
    // Add dns-prefetch for cross-origin resources
    const crossOriginDomains = new Set<string>();
    
    criticalResources.forEach(resource => {
      if (resource.crossOrigin) {
        try {
          const domain = new URL(resource.url).origin;
          crossOriginDomains.add(domain);
        } catch {
          // Invalid URL
        }
      }
    });

    crossOriginDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  /**
   * Get current analysis
   */
  public getAnalysis(): CriticalPathAnalysis | null {
    return this.analysis;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CriticalPathConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Destroy the analyzer
   */
  public destroy(): void {
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
      this.resourceObserver = null;
    }
    this.resources.clear();
    this.analysis = null;
  }
}

// Utility functions for easy usage

/**
 * Create and run critical path analysis
 */
export const analyzeCriticalPath = async (config?: Partial<CriticalPathConfig>): Promise<CriticalPathAnalysis> => {
  const analyzer = new CriticalPathAnalyzer(config);
  const analysis = await analyzer.analyzeCriticalPath();
  analyzer.destroy();
  return analysis;
};

/**
 * Apply intelligent preloading based on analysis
 */
export const applyIntelligentPreloading = async (config?: Partial<CriticalPathConfig>): Promise<void> => {
  const analyzer = new CriticalPathAnalyzer(config);
  const analysis = await analyzer.analyzeCriticalPath();
  analyzer.applyPreloading(analysis.preloadCandidates);
  analyzer.applyResourceHints();
  analyzer.destroy();
};

/**
 * Get performance budget status
 */
export const checkPerformanceBudgets = async (config?: Partial<CriticalPathConfig>): Promise<PerformanceBudgetStatus> => {
  const analysis = await analyzeCriticalPath(config);
  return analysis.performanceBudgetStatus;
};

export default CriticalPathAnalyzer;