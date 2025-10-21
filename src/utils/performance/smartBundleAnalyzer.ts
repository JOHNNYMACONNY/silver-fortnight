// Smart Bundle Analyzer for advanced bundle analysis and optimization
// Part of Week 2: Smart Preloading & Resource Optimization

import { performanceLogger } from './structuredLogger';
import type { ExtendedNavigator } from '../../types/browser';

export interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  entryPoints: EntryPointInfo[];
  duplicateCode: DuplicateCodeInfo[];
  unusedCode: UnusedCodeInfo[];
  recommendations: OptimizationRecommendation[];
  timestamp?: number;
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: ModuleInfo[];
  loadTime: number;
  priority: 'high' | 'medium' | 'low';
  cacheHitRate: number;
}

export interface ModuleInfo {
  name: string;
  size: number;
  dependencies: string[];
  importedBy: string[];
  dynamicImport: boolean;
  treeShakeable: boolean;
  sideEffects: boolean;
}

export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  usagePercentage: number;
  alternatives: AlternativeInfo[];
  securityIssues: SecurityIssue[];
}

export interface AlternativeInfo {
  name: string;
  size: number;
  performance: number;
  compatibility: number;
  reason: string;
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cve?: string;
}

export interface EntryPointInfo {
  name: string;
  size: number;
  loadTime: number;
  criticalPath: string[];
  preloadCandidates: string[];
}

export interface DuplicateCodeInfo {
  pattern: string;
  occurrences: number;
  totalSize: number;
  locations: string[];
  recommendation: string;
}

export interface UnusedCodeInfo {
  file: string;
  exports: string[];
  size: number;
  lastUsed?: Date;
  confidence: number;
}

export interface OptimizationRecommendation {
  type: 'splitting' | 'preloading' | 'lazy-loading' | 'tree-shaking' | 'compression' | 'caching';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: {
    sizeReduction: number;
    performanceGain: number;
    effort: 'low' | 'medium' | 'high';
  };
  implementation: string;
}

export interface AnalysisConfig {
  enableTreeShakingAnalysis: boolean;
  enableDuplicateDetection: boolean;
  enableSecurityScan: boolean;
  enablePerformanceAnalysis: boolean;
  thresholds: {
    maxChunkSize: number;
    maxUnusedCodePercentage: number;
    minCacheHitRate: number;
  };
}

export interface RuntimeBundleInfo {
  loadedChunks: string[];
  pendingChunks: string[];
  failedChunks: string[];
  cacheHits: Record<string, number>;
  loadTimes: Record<string, number>;
  networkCondition: 'slow-2g' | '2g' | '3g' | '4g' | 'fast';
}

class SmartBundleAnalyzer {
  private config: AnalysisConfig;
  private runtimeInfo: RuntimeBundleInfo;
  private analysisCache: Map<string, BundleMetrics>;

  constructor(config: Partial<AnalysisConfig> = {}) {
    this.config = {
      enableTreeShakingAnalysis: true,
      enableDuplicateDetection: true,
      enableSecurityScan: true,
      enablePerformanceAnalysis: true,
      thresholds: {
        maxChunkSize: 244 * 1024, // 244KB
        maxUnusedCodePercentage: 10,
        minCacheHitRate: 0.8
      },
      ...config
    };

    this.runtimeInfo = {
      loadedChunks: [],
      pendingChunks: [],
      failedChunks: [],
      cacheHits: {},
      loadTimes: {},
      networkCondition: this.detectNetworkCondition()
    };

    this.analysisCache = new Map();
    this.initializeRuntimeTracking();
  }

  async analyzeBundleMetrics(): Promise<BundleMetrics> {
    const cacheKey = 'bundle-analysis';
    const cached = this.analysisCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      const metrics: BundleMetrics = {
        totalSize: 0,
        gzippedSize: 0,
        chunks: await this.analyzeChunks(),
        dependencies: await this.analyzeDependencies(),
        entryPoints: await this.analyzeEntryPoints(),
        duplicateCode: this.config.enableDuplicateDetection ? await this.findDuplicateCode() : [],
        unusedCode: this.config.enableTreeShakingAnalysis ? await this.findUnusedCode() : [],
        recommendations: [],
        timestamp: Date.now()
      };

      // Calculate totals
      metrics.totalSize = metrics.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      metrics.gzippedSize = metrics.chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);

      // Generate recommendations
      metrics.recommendations = await this.generateRecommendations(metrics);

      this.analysisCache.set(cacheKey, metrics);
      return metrics;
    } catch (error) {
      this.logError('Bundle analysis failed', error);
      return this.getFallbackMetrics();
    }
  }

  private async analyzeChunks(): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];

    try {
      // Analyze loaded chunks from runtime
      for (const chunkName of this.runtimeInfo.loadedChunks) {
        const chunkInfo = await this.getChunkInfo(chunkName);
        chunks.push(chunkInfo);
      }

      // Analyze potential chunks from dynamic imports
      const dynamicChunks = await this.findDynamicImportChunks();
      chunks.push(...dynamicChunks);

      return chunks;
    } catch (error) {
      this.logError('Chunk analysis failed', error);
      return [];
    }
  }

  private async getChunkInfo(chunkName: string): Promise<ChunkInfo> {
    const size = await this.estimateChunkSize(chunkName);
    const modules = await this.getChunkModules(chunkName);
    
    return {
      name: chunkName,
      size,
      gzippedSize: Math.floor(size * 0.3), // Rough gzip estimate
      modules,
      loadTime: this.runtimeInfo.loadTimes[chunkName] || 0,
      priority: this.calculateChunkPriority(chunkName, modules),
      cacheHitRate: this.calculateCacheHitRate(chunkName)
    };
  }

  private async getChunkModules(chunkName: string): Promise<ModuleInfo[]> {
    // In a real implementation, this would analyze the actual bundle
    // For now, we'll simulate based on common patterns
    const modules: ModuleInfo[] = [];

    try {
      // Simulate module analysis
      const moduleNames = this.getModuleNamesForChunk(chunkName);
      
      for (const moduleName of moduleNames) {
        modules.push({
          name: moduleName,
          size: Math.floor(Math.random() * 50000), // Simulated size
          dependencies: this.getModuleDependencies(moduleName),
          importedBy: this.getModuleImporters(moduleName),
          dynamicImport: moduleName.includes('lazy') || moduleName.includes('async'),
          treeShakeable: !moduleName.includes('lodash') && !moduleName.includes('polyfill'),
          sideEffects: moduleName.includes('css') || moduleName.includes('global')
        });
      }

      return modules;
    } catch (error) {
      this.logError('Module analysis failed for chunk', chunkName, error);
      return [];
    }
  }

  private getModuleNamesForChunk(chunkName: string): string[] {
    // Simulate module discovery based on chunk name
    const baseModules = ['main.tsx', 'utils.ts', 'components.tsx'];
    
    if (chunkName.includes('vendor')) {
      return ['react', 'react-dom', 'firebase', 'tailwindcss'];
    }
    
    if (chunkName.includes('collaboration')) {
      return ['CollaborationPage.tsx', 'CollaborationForm.tsx', 'CollaborationCard.tsx'];
    }
    
    return baseModules;
  }

  private async analyzeDependencies(): Promise<DependencyInfo[]> {
    try {
      // In a real implementation, this would analyze package.json and actual usage
      const dependencies: DependencyInfo[] = [
        {
          name: 'react',
          version: '18.2.0',
          size: 42000,
          usagePercentage: 95,
          alternatives: [
            { name: 'preact', size: 10000, performance: 90, compatibility: 85, reason: 'Lighter alternative' }
          ],
          securityIssues: []
        },
        {
          name: 'lodash',
          version: '4.17.21',
          size: 71000,
          usagePercentage: 20,
          alternatives: [
            { name: 'native-methods', size: 0, performance: 100, compatibility: 95, reason: 'Use native Array methods' }
          ],
          securityIssues: []
        }
      ];

      if (this.config.enableSecurityScan) {
        for (const dep of dependencies) {
          dep.securityIssues = await this.scanSecurityIssues(dep.name, dep.version);
        }
      }

      return dependencies;
    } catch (error) {
      this.logError('Dependency analysis failed', error);
      return [];
    }
  }

  private async analyzeEntryPoints(): Promise<EntryPointInfo[]> {
    try {
      const entryPoints: EntryPointInfo[] = [
        {
          name: 'main',
          size: 250000,
          loadTime: this.runtimeInfo.loadTimes['main'] || 0,
          criticalPath: ['main.tsx', 'App.tsx', 'PerformanceContext.tsx'],
          preloadCandidates: ['vendor.js', 'common.js']
        }
      ];

      return entryPoints;
    } catch (error) {
      this.logError('Entry point analysis failed', error);
      return [];
    }
  }

  private async findDuplicateCode(): Promise<DuplicateCodeInfo[]> {
    try {
      // Simulate duplicate code detection
      return [
        {
          pattern: 'utility function debounce',
          occurrences: 3,
          totalSize: 1500,
          locations: ['utils/helpers.ts', 'hooks/useDebounce.ts', 'components/SearchBox.tsx'],
          recommendation: 'Extract to shared utility module'
        }
      ];
    } catch (error) {
      this.logError('Duplicate code analysis failed', error);
      return [];
    }
  }

  private async findUnusedCode(): Promise<UnusedCodeInfo[]> {
    try {
      // Simulate unused code detection
      return [
        {
          file: 'utils/legacy.ts',
          exports: ['oldFormatDate', 'deprecatedHelper'],
          size: 2500,
          confidence: 90
        }
      ];
    } catch (error) {
      this.logError('Unused code analysis failed', error);
      return [];
    }
  }

  private async generateRecommendations(metrics: BundleMetrics): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    try {
      // Large chunk recommendations
      const largeChunks = metrics.chunks.filter(chunk => chunk.size > this.config.thresholds.maxChunkSize);
      for (const chunk of largeChunks) {
        recommendations.push({
          type: 'splitting',
          priority: 'high',
          description: `Split large chunk "${chunk.name}" (${Math.floor(chunk.size / 1024)}KB)`,
          impact: {
            sizeReduction: chunk.size * 0.3,
            performanceGain: 20,
            effort: 'medium'
          },
          implementation: 'Use dynamic imports or route-based code splitting'
        });
      }

      // Unused code recommendations
      if (metrics.unusedCode.length > 0) {
        const totalUnusedSize = metrics.unusedCode.reduce((sum, item) => sum + item.size, 0);
        recommendations.push({
          type: 'tree-shaking',
          priority: 'medium',
          description: `Remove ${metrics.unusedCode.length} unused code sections`,
          impact: {
            sizeReduction: totalUnusedSize,
            performanceGain: 15,
            effort: 'low'
          },
          implementation: 'Configure tree-shaking and remove unused exports'
        });
      }

      // Preloading recommendations
      const criticalChunks = metrics.chunks.filter(chunk => chunk.priority === 'high');
      if (criticalChunks.length > 0) {
        recommendations.push({
          type: 'preloading',
          priority: 'high',
          description: 'Implement intelligent preloading for critical chunks',
          impact: {
            sizeReduction: 0,
            performanceGain: 30,
            effort: 'medium'
          },
          implementation: 'Use link rel="preload" and intelligent prefetching'
        });
      }

      return recommendations;
    } catch (error) {
      this.logError('Recommendation generation failed', error);
      return [];
    }
  }

  private calculateChunkPriority(chunkName: string, modules: ModuleInfo[]): 'high' | 'medium' | 'low' {
    if (chunkName.includes('main') || chunkName.includes('vendor')) {
      return 'high';
    }
    
    if (modules.some(m => m.name.includes('critical') || m.name.includes('above-fold'))) {
      return 'high';
    }
    
    if (chunkName.includes('lazy') || chunkName.includes('async')) {
      return 'low';
    }
    
    return 'medium';
  }

  private calculateCacheHitRate(chunkName: string): number {
    const hits = this.runtimeInfo.cacheHits[chunkName] || 0;
    const total = hits + 1; // Assume at least one load
    return hits / total;
  }

  private async estimateChunkSize(chunkName: string): Promise<number> {
    // In a real implementation, this would get actual chunk size
    // For simulation, return reasonable estimates
    if (chunkName.includes('vendor')) return 300000;
    if (chunkName.includes('main')) return 150000;
    return 50000;
  }

  private async findDynamicImportChunks(): Promise<ChunkInfo[]> {
    // Simulate finding dynamic import chunks
    return [];
  }

  private getModuleDependencies(moduleName: string): string[] {
    // Simulate dependency analysis
    if (moduleName.includes('react')) return [];
    if (moduleName.includes('component')) return ['react', 'utils'];
    return ['utils'];
  }

  private getModuleImporters(moduleName: string): string[] {
    // Simulate reverse dependency analysis
    return ['main.tsx'];
  }

  private async scanSecurityIssues(name: string, version: string): Promise<SecurityIssue[]> {
    // In a real implementation, this would check security databases
    return [];
  }

  private detectNetworkCondition(): 'slow-2g' | '2g' | '3g' | '4g' | 'fast' {
    const extNavigator = navigator as ExtendedNavigator;
    if (extNavigator.connection) {
      const connection = extNavigator.connection;
      if (connection?.effectiveType) {
        return connection.effectiveType;
      }
    }
    return '4g'; // Default assumption
  }

  private initializeRuntimeTracking(): void {
    // Track chunk loading events
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource' && entry.name.includes('.js')) {
              const chunkName = this.extractChunkName(entry.name);
              this.runtimeInfo.loadTimes[chunkName] = entry.duration;
              
              if (!this.runtimeInfo.loadedChunks.includes(chunkName)) {
                this.runtimeInfo.loadedChunks.push(chunkName);
              }
            }
          }
        });

        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        this.logError('Failed to initialize performance tracking', error);
      }
    }
  }

  private extractChunkName(url: string): string {
    const match = url.match(/\/([^\/]+)\.js$/);
    return match ? match[1] : 'unknown';
  }

  private isCacheValid(metrics: BundleMetrics): boolean {
    // Cache analysis for 5 minutes
    return metrics.timestamp ? (Date.now() - metrics.timestamp < 5 * 60 * 1000) : false;
  }

  private getFallbackMetrics(): BundleMetrics {
    return {
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      dependencies: [],
      entryPoints: [],
      duplicateCode: [],
      unusedCode: [],
      recommendations: []
    };
  }

  private logError(message: string, ...args: any[]): void {
    // Use structured logging instead of console.error
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SmartBundleAnalyzer] ${message}`, ...args);
    }
  }

  // Public API methods for advanced analysis
  async getOptimizationPlan(): Promise<{
    splitCandidates: ChunkInfo[];
    preloadCandidates: string[];
    compressionOpportunities: { file: string; currentSize: number; estimatedSize: number }[];
    cacheOptimizations: { strategy: string; impact: number }[];
  }> {
    const metrics = await this.analyzeBundleMetrics();
    
    return {
      splitCandidates: metrics.chunks.filter(chunk => 
        chunk.size > this.config.thresholds.maxChunkSize
      ),
      preloadCandidates: metrics.entryPoints.flatMap(entry => entry.preloadCandidates),
      compressionOpportunities: metrics.chunks.map(chunk => ({
        file: chunk.name,
        currentSize: chunk.size,
        estimatedSize: Math.floor(chunk.size * 0.7) // Assume 30% compression
      })),
      cacheOptimizations: [
        { strategy: 'long-term-caching', impact: 25 },
        { strategy: 'service-worker-caching', impact: 40 }
      ]
    };
  }

  getRuntimeMetrics(): RuntimeBundleInfo {
    return { ...this.runtimeInfo };
  }

  updateRuntimeInfo(updates: Partial<RuntimeBundleInfo>): void {
    this.runtimeInfo = { ...this.runtimeInfo, ...updates };
  }

  clearAnalysisCache(): void {
    this.analysisCache.clear();
  }
}

// Export singleton instance
export const smartBundleAnalyzer = new SmartBundleAnalyzer();

// Export for custom configurations
export { SmartBundleAnalyzer };
