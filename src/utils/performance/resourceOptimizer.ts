/**
 * Resource Optimization Engine for TradeYa
 * 
 * Dynamic resource optimization based on real-time performance data and RUM analytics.
 * Provides intelligent optimization strategies for images, fonts, bundles, and third-party resources.
 */

import { RUMMetrics } from '../../services/performance/rumService';
import { CriticalPathAnalysis, ResourceInfo } from './criticalPathAnalyzer';

/**
 * Image optimization configuration
 */
export interface ImageOptimizationConfig {
  /** Enable WebP format conversion */
  enableWebP: boolean;
  /** Enable AVIF format conversion */
  enableAVIF: boolean;
  /** Quality settings for different formats */
  quality: {
    webp: number;
    avif: number;
    jpeg: number;
  };
  /** Responsive image breakpoints */
  breakpoints: number[];
  /** Lazy loading configuration */
  lazyLoading: {
    enabled: boolean;
    rootMargin: string;
    threshold: number;
  };
}

/**
 * Font optimization configuration
 */
export interface FontOptimizationConfig {
  /** Enable font preloading */
  enablePreloading: boolean;
  /** Font display strategy */
  fontDisplay: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  /** Enable font subsetting */
  enableSubsetting: boolean;
  /** Critical fonts to preload */
  criticalFonts: string[];
  /** Font loading strategy */
  loadingStrategy: 'progressive' | 'critical-first' | 'lazy';
}

/**
 * Bundle optimization configuration
 */
export interface BundleOptimizationConfig {
  /** Enable code splitting */
  enableCodeSplitting: boolean;
  /** Enable tree shaking */
  enableTreeShaking: boolean;
  /** Chunk size thresholds */
  chunkSizeThreshold: {
    warning: number;
    error: number;
  };
  /** Dynamic import strategy */
  dynamicImportStrategy: 'route-based' | 'component-based' | 'usage-based';
  /** Dead code detection */
  deadCodeDetection: boolean;
}

/**
 * Third-party resource optimization
 */
export interface ThirdPartyOptimizationConfig {
  /** Enable resource hints */
  enableResourceHints: boolean;
  /** Timeout for third-party resources */
  timeout: number;
  /** Fallback strategies */
  fallbackStrategies: boolean;
  /** Critical third-party resources */
  criticalResources: string[];
}

/**
 * Dynamic import usage data
 */
export interface ImportUsageData {
  /** Import path */
  path: string;
  /** Usage frequency */
  frequency: number;
  /** Load time statistics */
  loadTimes: number[];
  /** Routes where it's used */
  routes: string[];
  /** Bundle size */
  size: number;
}

/**
 * Image metrics for optimization
 */
export interface ImageMetrics {
  /** Image URL */
  url: string;
  /** Original size */
  size: number;
  /** Dimensions */
  dimensions: { width: number; height: number };
  /** Format */
  format: string;
  /** Load time */
  loadTime: number;
  /** Above the fold */
  aboveTheFold: boolean;
  /** Usage frequency */
  frequency: number;
}

/**
 * Font metrics for optimization
 */
export interface FontMetrics {
  /** Font family */
  family: string;
  /** Font URL */
  url: string;
  /** File size */
  size: number;
  /** Load time */
  loadTime: number;
  /** Critical for initial render */
  critical: boolean;
  /** Usage frequency */
  frequency: number;
  /** FOIT/FOUT duration */
  flashDuration: number;
}

/**
 * Bundle analysis data
 */
export interface BundleAnalysis {
  /** Bundle name */
  name: string;
  /** Size in bytes */
  size: number;
  /** Dependencies */
  dependencies: string[];
  /** Usage patterns */
  usagePatterns: ImportUsageData[];
  /** Dead code percentage */
  deadCodePercentage: number;
  /** Load priority */
  priority: 'high' | 'medium' | 'low';
}

/**
 * Optimization plan for different resource types
 */
export interface OptimizationPlan {
  /** Image optimizations */
  images: ImageOptimizationPlan;
  /** Font optimizations */
  fonts: FontOptimizationPlan;
  /** Bundle optimizations */
  bundles: BundleOptimizationPlan;
  /** Third-party optimizations */
  thirdParty: ThirdPartyOptimizationPlan;
  /** Overall priority score */
  priority: number;
  /** Estimated performance improvement */
  estimatedImprovement: number;
}

/**
 * Image optimization plan
 */
export interface ImageOptimizationPlan {
  /** Images to convert to WebP */
  webpCandidates: string[];
  /** Images to convert to AVIF */
  avifCandidates: string[];
  /** Images to lazy load */
  lazyLoadCandidates: string[];
  /** Images to resize */
  resizeCandidates: Array<{
    url: string;
    targetSizes: number[];
  }>;
  /** Estimated savings */
  estimatedSavings: number;
}

/**
 * Font optimization plan
 */
export interface FontOptimizationPlan {
  /** Fonts to preload */
  preloadCandidates: string[];
  /** Font display strategy changes */
  displayStrategies: Map<string, string>;
  /** Fonts to subset */
  subsetCandidates: string[];
  /** Loading strategy changes */
  loadingStrategies: Map<string, string>;
  /** Estimated improvement */
  estimatedImprovement: number;
}

/**
 * Bundle optimization plan
 */
export interface BundleOptimizationPlan {
  /** Bundles to split */
  splitCandidates: string[];
  /** Dead code to remove */
  deadCodeTargets: string[];
  /** Dynamic import opportunities */
  dynamicImportOpportunities: Array<{
    path: string;
    strategy: string;
    estimatedSavings: number;
  }>;
  /** Tree shaking opportunities */
  treeShakingOpportunities: string[];
  /** Estimated size reduction */
  estimatedSizeReduction: number;
}

/**
 * Third-party optimization plan
 */
export interface ThirdPartyOptimizationPlan {
  /** Resources to add hints for */
  resourceHints: Array<{
    url: string;
    hint: 'dns-prefetch' | 'preconnect' | 'preload';
  }>;
  /** Resources to defer */
  deferCandidates: string[];
  /** Resources to add fallbacks for */
  fallbackCandidates: string[];
  /** Estimated improvement */
  estimatedImprovement: number;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Success status */
  success: boolean;
  /** Applied optimizations */
  appliedOptimizations: string[];
  /** Performance improvements */
  improvements: {
    sizeReduction: number;
    loadTimeImprovement: number;
    performanceScore: number;
  };
  /** Errors encountered */
  errors: string[];
}

/**
 * Resource Optimizer configuration
 */
export interface ResourceOptimizerConfig {
  /** Image optimization settings */
  images: ImageOptimizationConfig;
  /** Font optimization settings */
  fonts: FontOptimizationConfig;
  /** Bundle optimization settings */
  bundles: BundleOptimizationConfig;
  /** Third-party optimization settings */
  thirdParty: ThirdPartyOptimizationConfig;
  /** Enable aggressive optimizations */
  aggressiveMode: boolean;
  /** Respect performance budgets */
  respectBudgets: boolean;
}

/**
 * Default resource optimizer configuration
 */
const DEFAULT_OPTIMIZER_CONFIG: ResourceOptimizerConfig = {
  images: {
    enableWebP: true,
    enableAVIF: false, // Conservative default
    quality: {
      webp: 85,
      avif: 80,
      jpeg: 85
    },
    breakpoints: [320, 640, 768, 1024, 1280, 1536],
    lazyLoading: {
      enabled: true,
      rootMargin: '50px',
      threshold: 0.1
    }
  },
  fonts: {
    enablePreloading: true,
    fontDisplay: 'swap',
    enableSubsetting: false, // Requires server-side processing
    criticalFonts: [],
    loadingStrategy: 'critical-first'
  },
  bundles: {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    chunkSizeThreshold: {
      warning: 250000, // 250KB
      error: 500000    // 500KB
    },
    dynamicImportStrategy: 'route-based',
    deadCodeDetection: true
  },
  thirdParty: {
    enableResourceHints: true,
    timeout: 5000, // 5 seconds
    fallbackStrategies: true,
    criticalResources: []
  },
  aggressiveMode: false,
  respectBudgets: true
};

/**
 * Resource Optimization Engine
 */
export class ResourceOptimizer {
  private config: ResourceOptimizerConfig;
  private optimizationCache: Map<string, OptimizationPlan> = new Map();
  private performanceBaseline: number = 0;

  constructor(config: Partial<ResourceOptimizerConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_OPTIMIZER_CONFIG, config);
  }

  /**
   * Deep merge configuration objects
   */
  private mergeConfig(
    defaultConfig: ResourceOptimizerConfig,
    userConfig: Partial<ResourceOptimizerConfig>
  ): ResourceOptimizerConfig {
    const merged = { ...defaultConfig };
    
    if (userConfig.images) {
      merged.images = { ...defaultConfig.images, ...userConfig.images };
    }
    if (userConfig.fonts) {
      merged.fonts = { ...defaultConfig.fonts, ...userConfig.fonts };
    }
    if (userConfig.bundles) {
      merged.bundles = { ...defaultConfig.bundles, ...userConfig.bundles };
    }
    if (userConfig.thirdParty) {
      merged.thirdParty = { ...defaultConfig.thirdParty, ...userConfig.thirdParty };
    }
    
    return { ...merged, ...userConfig };
  }

  /**
   * Optimize dynamic imports based on usage patterns
   */
  public async optimizeDynamicImports(usageData: ImportUsageData[]): Promise<OptimizationPlan> {
    const cacheKey = `dynamic_imports_${Date.now()}`;
    
    // Check cache
    if (this.optimizationCache.has(cacheKey)) {
      return this.optimizationCache.get(cacheKey)!;
    }

    try {
      // Analyze usage patterns
      const highUsageImports = usageData.filter(data => 
        data.frequency > 5 && data.loadTimes.length > 0
      );

      const lowUsageImports = usageData.filter(data =>
        data.frequency <= 2 && data.size > 50000 // > 50KB but low usage
      );

      // Generate optimization plan
      const plan: OptimizationPlan = {
        images: this.createEmptyImagePlan(),
        fonts: this.createEmptyFontPlan(),
        bundles: {
          splitCandidates: this.identifySplitCandidates(usageData),
          deadCodeTargets: this.identifyDeadCode(usageData),
          dynamicImportOpportunities: this.identifyDynamicImportOpportunities(lowUsageImports),
          treeShakingOpportunities: this.identifyTreeShakingOpportunities(usageData),
          estimatedSizeReduction: this.calculateBundleSizeReduction(usageData)
        },
        thirdParty: this.createEmptyThirdPartyPlan(),
        priority: this.calculateOptimizationPriority(usageData),
        estimatedImprovement: this.calculateEstimatedImprovement(usageData)
      };

      // Cache the plan
      this.optimizationCache.set(cacheKey, plan);
      
      return plan;
    } catch (error) {
      console.error('Failed to optimize dynamic imports:', error);
      return this.createEmptyOptimizationPlan();
    }
  }

  /**
   * Optimize image loading strategies
   */
  public optimizeImageLoading(imageMetrics: ImageMetrics[]): ImageOptimizationPlan {
    try {
      const plan: ImageOptimizationPlan = {
        webpCandidates: [],
        avifCandidates: [],
        lazyLoadCandidates: [],
        resizeCandidates: [],
        estimatedSavings: 0
      };

      imageMetrics.forEach(metric => {
        // WebP candidates (large images that aren't already WebP)
        if (this.config.images.enableWebP && 
            metric.size > 50000 && 
            !metric.format.includes('webp')) {
          plan.webpCandidates.push(metric.url);
        }

        // AVIF candidates (very large images on modern browsers)
        if (this.config.images.enableAVIF &&
            metric.size > 100000 &&
            !metric.format.includes('avif') &&
            this.supportsAVIF()) {
          plan.avifCandidates.push(metric.url);
        }

        // Lazy loading candidates (below the fold images)
        if (this.config.images.lazyLoading.enabled && 
            !metric.aboveTheFold) {
          plan.lazyLoadCandidates.push(metric.url);
        }

        // Resize candidates (oversized images)
        if (metric.dimensions.width > 1920 || metric.dimensions.height > 1080) {
          plan.resizeCandidates.push({
            url: metric.url,
            targetSizes: this.config.images.breakpoints
          });
        }
      });

      // Calculate estimated savings
      plan.estimatedSavings = this.calculateImageSavings(imageMetrics, plan);

      return plan;
    } catch (error) {
      console.error('Failed to optimize image loading:', error);
      return this.createEmptyImagePlan();
    }
  }

  /**
   * Optimize font loading based on critical path analysis
   */
  public optimizeFontLoading(fontMetrics: FontMetrics[]): FontOptimizationPlan {
    try {
      const plan: FontOptimizationPlan = {
        preloadCandidates: [],
        displayStrategies: new Map(),
        subsetCandidates: [],
        loadingStrategies: new Map(),
        estimatedImprovement: 0
      };

      fontMetrics.forEach(metric => {
        // Preload critical fonts
        if (this.config.fonts.enablePreloading && 
            (metric.critical || this.config.fonts.criticalFonts.includes(metric.family))) {
          plan.preloadCandidates.push(metric.url);
        }

        // Font display strategies for fonts with FOIT/FOUT issues
        if (metric.flashDuration > 100) { // > 100ms flash
          plan.displayStrategies.set(metric.family, this.config.fonts.fontDisplay);
        }

        // Subsetting candidates (large fonts with low usage)
        if (this.config.fonts.enableSubsetting &&
            metric.size > 100000 && // > 100KB
            metric.frequency < 10) {
          plan.subsetCandidates.push(metric.family);
        }

        // Loading strategy optimization
        const strategy = this.determineFontLoadingStrategy(metric);
        if (strategy !== 'default') {
          plan.loadingStrategies.set(metric.family, strategy);
        }
      });

      // Calculate estimated improvement
      plan.estimatedImprovement = this.calculateFontImprovement(fontMetrics, plan);

      return plan;
    } catch (error) {
      console.error('Failed to optimize font loading:', error);
      return this.createEmptyFontPlan();
    }
  }

  /**
   * Generate bundle optimization recommendations
   */
  public generateBundleOptimizations(bundleAnalysis: BundleAnalysis): BundleOptimizationPlan {
    try {
      const plan: BundleOptimizationPlan = {
        splitCandidates: [],
        deadCodeTargets: [],
        dynamicImportOpportunities: [],
        treeShakingOpportunities: [],
        estimatedSizeReduction: 0
      };

      // Large bundle splitting
      if (bundleAnalysis.size > this.config.bundles.chunkSizeThreshold.warning) {
        plan.splitCandidates.push(bundleAnalysis.name);
      }

      // Dead code removal
      if (bundleAnalysis.deadCodePercentage > 10) { // > 10% dead code
        plan.deadCodeTargets.push(bundleAnalysis.name);
      }

      // Dynamic import opportunities
      bundleAnalysis.usagePatterns.forEach(pattern => {
        if (pattern.frequency < 3 && pattern.size > 25000) { // Low usage, decent size
          plan.dynamicImportOpportunities.push({
            path: pattern.path,
            strategy: this.config.bundles.dynamicImportStrategy,
            estimatedSavings: pattern.size * 0.7 // Assume 70% of size can be deferred
          });
        }
      });

      // Tree shaking opportunities
      bundleAnalysis.dependencies.forEach(dep => {
        if (this.isTreeShakingCandidate(dep, bundleAnalysis)) {
          plan.treeShakingOpportunities.push(dep);
        }
      });

      // Calculate estimated size reduction
      plan.estimatedSizeReduction = this.calculateBundleOptimizationSavings(bundleAnalysis, plan);

      return plan;
    } catch (error) {
      console.error('Failed to generate bundle optimizations:', error);
      return {
        splitCandidates: [],
        deadCodeTargets: [],
        dynamicImportOpportunities: [],
        treeShakingOpportunities: [],
        estimatedSizeReduction: 0
      };
    }
  }

  /**
   * Apply optimization strategies
   */
  public async applyOptimizations(plan: OptimizationPlan): Promise<OptimizationResult> {
    const result: OptimizationResult = {
      success: true,
      appliedOptimizations: [],
      improvements: {
        sizeReduction: 0,
        loadTimeImprovement: 0,
        performanceScore: 0
      },
      errors: []
    };

    try {
      // Apply image optimizations
      if (plan.images.webpCandidates.length > 0) {
        await this.applyImageOptimizations(plan.images);
        result.appliedOptimizations.push('image-webp-conversion');
      }

      // Apply font optimizations
      if (plan.fonts.preloadCandidates.length > 0) {
        await this.applyFontOptimizations(plan.fonts);
        result.appliedOptimizations.push('font-preloading');
      }

      // Apply bundle optimizations (recommendations only - requires build process)
      if (plan.bundles.splitCandidates.length > 0) {
        this.reportBundleOptimizations(plan.bundles);
        result.appliedOptimizations.push('bundle-optimization-recommendations');
      }

      // Apply third-party optimizations
      if (plan.thirdParty.resourceHints.length > 0) {
        await this.applyThirdPartyOptimizations(plan.thirdParty);
        result.appliedOptimizations.push('third-party-hints');
      }

      // Calculate improvements
      result.improvements = this.calculateActualImprovements(plan);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Apply image optimizations
   */
  private async applyImageOptimizations(plan: ImageOptimizationPlan): Promise<void> {
    // Implement lazy loading for candidates
    plan.lazyLoadCandidates.forEach(url => {
      this.implementLazyLoading(url);
    });

    // Add WebP support detection and picture elements
    if (plan.webpCandidates.length > 0 && this.supportsWebP()) {
      plan.webpCandidates.forEach(url => {
        this.addWebPSupport(url);
      });
    }
  }

  /**
   * Apply font optimizations
   */
  private async applyFontOptimizations(plan: FontOptimizationPlan): Promise<void> {
    // Add font preloading
    plan.preloadCandidates.forEach(url => {
      this.addFontPreload(url);
    });

    // Apply font display strategies
    plan.displayStrategies.forEach((strategy, family) => {
      this.applyFontDisplayStrategy(family, strategy);
    });
  }

  /**
   * Apply third-party optimizations
   */
  private async applyThirdPartyOptimizations(plan: ThirdPartyOptimizationPlan): Promise<void> {
    // Add resource hints
    plan.resourceHints.forEach(hint => {
      this.addResourceHint(hint.url, hint.hint);
    });

    // Defer non-critical third-party resources
    plan.deferCandidates.forEach(url => {
      this.deferResource(url);
    });
  }

  /**
   * Implement lazy loading for an image
   */
  private implementLazyLoading(imageUrl: string): void {
    const images = document.querySelectorAll(`img[src="${imageUrl}"]`);
    
    images.forEach(img => {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              if (target.dataset.src) {
                target.src = target.dataset.src;
                target.removeAttribute('data-src');
              }
              observer.unobserve(target);
            }
          });
        }, {
          rootMargin: this.config.images.lazyLoading.rootMargin,
          threshold: this.config.images.lazyLoading.threshold
        });

        // Move src to data-src and observe
        const imgElement = img as HTMLImageElement;
        imgElement.dataset.src = imgElement.src;
        imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        observer.observe(imgElement);
      }
    });
  }

  /**
   * Add WebP support for an image
   */
  private addWebPSupport(imageUrl: string): void {
    const images = document.querySelectorAll(`img[src="${imageUrl}"]`);
    
    images.forEach(img => {
      const picture = document.createElement('picture');
      const webpSource = document.createElement('source');
      const webpUrl = imageUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      webpSource.srcset = webpUrl;
      webpSource.type = 'image/webp';
      
      picture.appendChild(webpSource);
      picture.appendChild(img.cloneNode(true));
      
      img.parentNode?.replaceChild(picture, img);
    });
  }

  /**
   * Add font preloading
   */
  private addFontPreload(fontUrl: string): void {
    const existingPreload = document.querySelector(`link[href="${fontUrl}"][rel="preload"]`);
    if (existingPreload) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = fontUrl;
    link.as = 'font';
    link.type = this.getFontMimeType(fontUrl);
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  }

  /**
   * Apply font display strategy
   */
  private applyFontDisplayStrategy(fontFamily: string, strategy: string): void {
    // Add CSS font-display property
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${fontFamily}';
        font-display: ${strategy};
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add resource hint
   */
  private addResourceHint(url: string, hint: 'dns-prefetch' | 'preconnect' | 'preload'): void {
    const existingHint = document.querySelector(`link[href="${url}"][rel="${hint}"]`);
    if (existingHint) return;

    const link = document.createElement('link');
    link.rel = hint;
    link.href = hint === 'dns-prefetch' ? new URL(url).origin : url;
    
    if (hint === 'preconnect') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  }

  /**
   * Defer a resource
   */
  private deferResource(url: string): void {
    const scripts = document.querySelectorAll(`script[src="${url}"]`);
    
    scripts.forEach(script => {
      (script as HTMLScriptElement).defer = true;
    });
  }

  /**
   * Check WebP support
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Check AVIF support
   */
  private supportsAVIF(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  /**
   * Get font MIME type from URL
   */
  private getFontMimeType(url: string): string {
    if (url.includes('.woff2')) return 'font/woff2';
    if (url.includes('.woff')) return 'font/woff';
    if (url.includes('.ttf')) return 'font/truetype';
    if (url.includes('.otf')) return 'font/opentype';
    if (url.includes('.eot')) return 'application/vnd.ms-fontobject';
    return 'font/woff2'; // Default
  }

  /**
   * Helper methods for creating empty plans
   */
  private createEmptyImagePlan(): ImageOptimizationPlan {
    return {
      webpCandidates: [],
      avifCandidates: [],
      lazyLoadCandidates: [],
      resizeCandidates: [],
      estimatedSavings: 0
    };
  }

  private createEmptyFontPlan(): FontOptimizationPlan {
    return {
      preloadCandidates: [],
      displayStrategies: new Map(),
      subsetCandidates: [],
      loadingStrategies: new Map(),
      estimatedImprovement: 0
    };
  }

  private createEmptyThirdPartyPlan(): ThirdPartyOptimizationPlan {
    return {
      resourceHints: [],
      deferCandidates: [],
      fallbackCandidates: [],
      estimatedImprovement: 0
    };
  }

  private createEmptyOptimizationPlan(): OptimizationPlan {
    return {
      images: this.createEmptyImagePlan(),
      fonts: this.createEmptyFontPlan(),
      bundles: {
        splitCandidates: [],
        deadCodeTargets: [],
        dynamicImportOpportunities: [],
        treeShakingOpportunities: [],
        estimatedSizeReduction: 0
      },
      thirdParty: this.createEmptyThirdPartyPlan(),
      priority: 0,
      estimatedImprovement: 0
    };
  }

  /**
   * Helper methods for calculations and analysis
   */
  private identifySplitCandidates(usageData: ImportUsageData[]): string[] {
    return usageData
      .filter(data => data.size > this.config.bundles.chunkSizeThreshold.warning)
      .map(data => data.path);
  }

  private identifyDeadCode(usageData: ImportUsageData[]): string[] {
    return usageData
      .filter(data => data.frequency === 0)
      .map(data => data.path);
  }

  private identifyDynamicImportOpportunities(lowUsageImports: ImportUsageData[]): Array<{
    path: string;
    strategy: string;
    estimatedSavings: number;
  }> {
    return lowUsageImports.map(data => ({
      path: data.path,
      strategy: this.config.bundles.dynamicImportStrategy,
      estimatedSavings: data.size * 0.6
    }));
  }

  private identifyTreeShakingOpportunities(usageData: ImportUsageData[]): string[] {
    // Simplified tree shaking detection
    return usageData
      .filter(data => data.size > 100000 && data.frequency < 5)
      .map(data => data.path);
  }

  private isTreeShakingCandidate(dependency: string, analysis: BundleAnalysis): boolean {
    // Simplified logic - in practice, this would analyze actual usage
    return dependency.includes('lodash') || 
           dependency.includes('moment') ||
           analysis.deadCodePercentage > 20;
  }

  private calculateBundleSizeReduction(usageData: ImportUsageData[]): number {
    return usageData
      .filter(data => data.frequency < 3)
      .reduce((total, data) => total + (data.size * 0.5), 0);
  }

  private calculateOptimizationPriority(usageData: ImportUsageData[]): number {
    const totalSize = usageData.reduce((sum, data) => sum + data.size, 0);
    const unusedSize = usageData
      .filter(data => data.frequency < 2)
      .reduce((sum, data) => sum + data.size, 0);
    
    return Math.min(10, (unusedSize / totalSize) * 10);
  }

  private calculateEstimatedImprovement(usageData: ImportUsageData[]): number {
    const potentialSavings = this.calculateBundleSizeReduction(usageData);
    // Estimate load time improvement based on size reduction
    return potentialSavings / 1000; // Rough estimate: 1KB = 1ms improvement
  }

  private calculateImageSavings(metrics: ImageMetrics[], plan: ImageOptimizationPlan): number {
    let savings = 0;
    
    // WebP conversion savings (approximately 25-35% smaller)
    plan.webpCandidates.forEach(url => {
      const metric = metrics.find(m => m.url === url);
      if (metric) savings += metric.size * 0.3;
    });
    
    // AVIF conversion savings (approximately 50% smaller than JPEG)
    plan.avifCandidates.forEach(url => {
      const metric = metrics.find(m => m.url === url);
      if (metric) savings += metric.size * 0.5;
    });
    
    return savings;
  }

  private calculateFontImprovement(metrics: FontMetrics[], plan: FontOptimizationPlan): number {
    // Estimate improvement in render time
    let improvement = 0;
    
    plan.preloadCandidates.forEach(url => {
      const metric = metrics.find(m => m.url === url);
      if (metric) improvement += metric.loadTime * 0.4; // 40% improvement from preloading
    });
    
    return improvement;
  }

  private calculateBundleOptimizationSavings(analysis: BundleAnalysis, plan: BundleOptimizationPlan): number {
    let savings = 0;
    
    // Dead code removal
    if (plan.deadCodeTargets.includes(analysis.name)) {
      savings += analysis.size * (analysis.deadCodePercentage / 100);
    }
    
    // Dynamic import savings
    savings += plan.dynamicImportOpportunities.reduce((sum, opp) => sum + opp.estimatedSavings, 0);
    
    return savings;
  }

  private determineFontLoadingStrategy(metric: FontMetrics): string {
    if (metric.critical) return 'preload';
    if (metric.loadTime > 1000) return 'lazy';
    if (metric.flashDuration > 200) return 'swap';
    return 'default';
  }

  private reportBundleOptimizations(plan: BundleOptimizationPlan): void {
    // In a real implementation, this would integrate with build tools
    console.group('Bundle Optimization Recommendations');
    
    if (plan.splitCandidates.length > 0) {
      console.log('Split candidates:', plan.splitCandidates);
    }
    
    if (plan.dynamicImportOpportunities.length > 0) {
      console.log('Dynamic import opportunities:', plan.dynamicImportOpportunities);
    }
    
    if (plan.treeShakingOpportunities.length > 0) {
      console.log('Tree shaking opportunities:', plan.treeShakingOpportunities);
    }
    
    console.log('Estimated size reduction:', plan.estimatedSizeReduction, 'bytes');
    console.groupEnd();
  }

  private calculateActualImprovements(plan: OptimizationPlan): {
    sizeReduction: number;
    loadTimeImprovement: number;
    performanceScore: number;
  } {
    return {
      sizeReduction: plan.images.estimatedSavings + plan.bundles.estimatedSizeReduction,
      loadTimeImprovement: plan.fonts.estimatedImprovement + plan.thirdParty.estimatedImprovement,
      performanceScore: plan.estimatedImprovement
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ResourceOptimizerConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig);
  }

  /**
   * Clear optimization cache
   */
  public clearCache(): void {
    this.optimizationCache.clear();
  }

  /**
   * Get optimization statistics
   */
  public getStatistics(): {
    cacheSize: number;
    config: ResourceOptimizerConfig;
  } {
    return {
      cacheSize: this.optimizationCache.size,
      config: { ...this.config }
    };
  }
}

// Utility functions

/**
 * Quick image optimization
 */
export const optimizeImages = async (imageMetrics: ImageMetrics[]): Promise<ImageOptimizationPlan> => {
  const optimizer = new ResourceOptimizer();
  return optimizer.optimizeImageLoading(imageMetrics);
};

/**
 * Quick font optimization
 */
export const optimizeFonts = async (fontMetrics: FontMetrics[]): Promise<FontOptimizationPlan> => {
  const optimizer = new ResourceOptimizer();
  return optimizer.optimizeFontLoading(fontMetrics);
};

/**
 * Quick bundle analysis
 */
export const analyzeBundles = async (bundleAnalysis: BundleAnalysis): Promise<BundleOptimizationPlan> => {
  const optimizer = new ResourceOptimizer();
  return optimizer.generateBundleOptimizations(bundleAnalysis);
};

export default ResourceOptimizer;