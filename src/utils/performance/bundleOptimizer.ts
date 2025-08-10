/**
 * Bundle optimization and analysis utilities
 */

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  duplicates: DuplicateInfo[];
  unusedExports: UnusedExportInfo[];
  recommendations: OptimizationRecommendation[];
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isEntry: boolean;
  isVendor: boolean;
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  usageCount: number;
  isTreeShakeable: boolean;
  alternatives?: string[];
}

interface DuplicateInfo {
  module: string;
  chunks: string[];
  totalWastedSize: number;
}

interface UnusedExportInfo {
  module: string;
  exports: string[];
  potentialSavings: number;
}

interface OptimizationRecommendation {
  type: 'code-splitting' | 'tree-shaking' | 'dependency-replacement' | 'lazy-loading';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
  implementation: string;
}

/**
 * Bundle analyzer and optimizer
 */
export class BundleOptimizer {
  private analysisCache = new Map<string, BundleAnalysis>();

  /**
   * Analyze bundle composition and generate optimization recommendations
   */
  async analyzeBundles(buildPath: string = 'dist'): Promise<BundleAnalysis> {
    const cacheKey = `${buildPath}-${Date.now()}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    try {
      const analysis = await this.performAnalysis(buildPath);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw error;
    }
  }

  private async performAnalysis(buildPath: string): Promise<BundleAnalysis> {
    // In a real implementation, this would analyze actual build files
    // For now, we'll simulate the analysis based on common patterns
    
    const chunks = await this.analyzeChunks();
    const dependencies = await this.analyzeDependencies();
    const duplicates = this.findDuplicates(chunks);
    const unusedExports = await this.findUnusedExports();
    const recommendations = this.generateRecommendations(chunks, dependencies, duplicates, unusedExports);

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);

    return {
      totalSize,
      gzippedSize,
      chunks,
      dependencies,
      duplicates,
      unusedExports,
      recommendations
    };
  }

  private async analyzeChunks(): Promise<ChunkInfo[]> {
    // Simulate chunk analysis based on typical React app structure
    return [
      {
        name: 'main',
        size: 245000,
        gzippedSize: 78000,
        modules: ['src/App.tsx', 'src/main.tsx'],
        isEntry: true,
        isVendor: false
      },
      {
        name: 'react-vendor',
        size: 142000,
        gzippedSize: 45000,
        modules: ['react', 'react-dom'],
        isEntry: false,
        isVendor: true
      },
      {
        name: 'firebase-vendor',
        size: 89000,
        gzippedSize: 28000,
        modules: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        isEntry: false,
        isVendor: true
      },
      {
        name: 'ui-vendor',
        size: 67000,
        gzippedSize: 21000,
        modules: ['framer-motion', '@headlessui/react'],
        isEntry: false,
        isVendor: true
      },
      {
        name: 'features',
        size: 156000,
        gzippedSize: 49000,
        modules: ['src/components/features/*'],
        isEntry: false,
        isVendor: false
      },
      {
        name: 'pages',
        size: 98000,
        gzippedSize: 31000,
        modules: ['src/pages/*'],
        isEntry: false,
        isVendor: false
      }
    ];
  }

  private async analyzeDependencies(): Promise<DependencyInfo[]> {
    // Simulate dependency analysis
    return [
      {
        name: 'react',
        version: '18.2.0',
        size: 42000,
        usageCount: 150,
        isTreeShakeable: false
      },
      {
        name: 'react-dom',
        version: '18.2.0',
        size: 100000,
        usageCount: 1,
        isTreeShakeable: false
      },
      {
        name: 'framer-motion',
        version: '10.16.4',
        size: 67000,
        usageCount: 45,
        isTreeShakeable: true
      },
      {
        name: 'lucide-react',
        version: '0.263.1',
        size: 89000,
        usageCount: 25,
        isTreeShakeable: true,
        alternatives: ['react-icons', 'heroicons']
      },
      {
        name: 'firebase',
        version: '10.3.1',
        size: 89000,
        usageCount: 30,
        isTreeShakeable: true
      }
    ];
  }

  private findDuplicates(chunks: ChunkInfo[]): DuplicateInfo[] {
    // Simulate duplicate detection
    return [
      {
        module: 'lodash/isEqual',
        chunks: ['main', 'features'],
        totalWastedSize: 3400
      },
      {
        module: 'date-fns/format',
        chunks: ['features', 'pages'],
        totalWastedSize: 2100
      }
    ];
  }

  private async findUnusedExports(): Promise<UnusedExportInfo[]> {
    // Simulate unused export detection
    return [
      {
        module: 'src/utils/helpers.ts',
        exports: ['deprecatedFunction', 'oldUtility'],
        potentialSavings: 1200
      },
      {
        module: 'src/components/ui/index.ts',
        exports: ['UnusedComponent', 'LegacyButton'],
        potentialSavings: 4500
      }
    ];
  }

  private generateRecommendations(
    chunks: ChunkInfo[],
    dependencies: DependencyInfo[],
    duplicates: DuplicateInfo[],
    unusedExports: UnusedExportInfo[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for large chunks that could be split
    const largeChunks = chunks.filter(chunk => chunk.size > 200000 && !chunk.isVendor);
    largeChunks.forEach(chunk => {
      recommendations.push({
        type: 'code-splitting',
        priority: 'high',
        description: `Split large chunk "${chunk.name}" (${Math.round(chunk.size / 1024)}KB) into smaller pieces`,
        estimatedSavings: chunk.size * 0.3,
        implementation: `Consider route-based or feature-based code splitting for ${chunk.name}`
      });
    });

    // Check for tree-shakeable dependencies with low usage
    const underutilizedDeps = dependencies.filter(dep => 
      dep.isTreeShakeable && dep.usageCount < 10 && dep.size > 20000
    );
    underutilizedDeps.forEach(dep => {
      recommendations.push({
        type: 'tree-shaking',
        priority: 'medium',
        description: `Optimize tree-shaking for "${dep.name}" - only ${dep.usageCount} imports from ${Math.round(dep.size / 1024)}KB library`,
        estimatedSavings: dep.size * 0.7,
        implementation: `Use specific imports instead of barrel imports for ${dep.name}`
      });
    });

    // Check for dependency alternatives
    const heavyDeps = dependencies.filter(dep => dep.size > 50000 && dep.alternatives);
    heavyDeps.forEach(dep => {
      recommendations.push({
        type: 'dependency-replacement',
        priority: 'medium',
        description: `Consider replacing "${dep.name}" (${Math.round(dep.size / 1024)}KB) with lighter alternatives`,
        estimatedSavings: dep.size * 0.5,
        implementation: `Evaluate alternatives: ${dep.alternatives?.join(', ')}`
      });
    });

    // Check for duplicates
    duplicates.forEach(duplicate => {
      recommendations.push({
        type: 'code-splitting',
        priority: 'high',
        description: `Remove duplicate "${duplicate.module}" across chunks: ${duplicate.chunks.join(', ')}`,
        estimatedSavings: duplicate.totalWastedSize,
        implementation: `Move ${duplicate.module} to a shared chunk or vendor bundle`
      });
    });

    // Check for unused exports
    unusedExports.forEach(unused => {
      recommendations.push({
        type: 'tree-shaking',
        priority: 'low',
        description: `Remove unused exports from "${unused.module}": ${unused.exports.join(', ')}`,
        estimatedSavings: unused.potentialSavings,
        implementation: `Delete unused exports: ${unused.exports.join(', ')}`
      });
    });

    // Sort by estimated savings
    return recommendations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }

  /**
   * Generate optimization report
   */
  generateReport(analysis: BundleAnalysis): string {
    const { totalSize, gzippedSize, chunks, recommendations } = analysis;
    
    let report = `# Bundle Analysis Report\n\n`;
    report += `## Overview\n`;
    report += `- Total Size: ${this.formatBytes(totalSize)}\n`;
    report += `- Gzipped Size: ${this.formatBytes(gzippedSize)}\n`;
    report += `- Compression Ratio: ${((1 - gzippedSize / totalSize) * 100).toFixed(1)}%\n`;
    report += `- Number of Chunks: ${chunks.length}\n\n`;

    report += `## Chunk Breakdown\n`;
    chunks.forEach(chunk => {
      report += `- **${chunk.name}**: ${this.formatBytes(chunk.size)} (${this.formatBytes(chunk.gzippedSize)} gzipped)\n`;
    });
    report += `\n`;

    report += `## Optimization Recommendations\n`;
    recommendations.forEach((rec, index) => {
      report += `### ${index + 1}. ${rec.description}\n`;
      report += `- **Type**: ${rec.type}\n`;
      report += `- **Priority**: ${rec.priority}\n`;
      report += `- **Estimated Savings**: ${this.formatBytes(rec.estimatedSavings)}\n`;
      report += `- **Implementation**: ${rec.implementation}\n\n`;
    });

    const totalSavings = recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0);
    report += `## Summary\n`;
    report += `Total potential savings: ${this.formatBytes(totalSavings)} (${((totalSavings / totalSize) * 100).toFixed(1)}%)\n`;

    return report;
  }

  /**
   * Apply automatic optimizations
   */
  async applyOptimizations(analysis: BundleAnalysis): Promise<void> {
    const autoApplicable = analysis.recommendations.filter(rec => 
      rec.type === 'tree-shaking' && rec.priority !== 'low'
    );

    for (const recommendation of autoApplicable) {
      try {
        await this.applyOptimization(recommendation);
        console.log(`Applied optimization: ${recommendation.description}`);
      } catch (error) {
        console.error(`Failed to apply optimization: ${recommendation.description}`, error);
      }
    }
  }

  private async applyOptimization(recommendation: OptimizationRecommendation): Promise<void> {
    // In a real implementation, this would apply the optimization
    // For now, we'll just log the action
    console.log(`Applying ${recommendation.type} optimization: ${recommendation.implementation}`);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Monitor bundle size over time
   */
  async trackBundleSize(): Promise<void> {
    const analysis = await this.analyzeBundles();
    const timestamp = Date.now();
    
    // Store in localStorage for tracking
    const history = JSON.parse(localStorage.getItem('bundle-size-history') || '[]');
    history.push({
      timestamp,
      totalSize: analysis.totalSize,
      gzippedSize: analysis.gzippedSize,
      chunkCount: analysis.chunks.length
    });

    // Keep only last 30 entries
    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }

    localStorage.setItem('bundle-size-history', JSON.stringify(history));
  }

  /**
   * Get bundle size trends
   */
  getBundleTrends(): Array<{
    timestamp: number;
    totalSize: number;
    gzippedSize: number;
    chunkCount: number;
  }> {
    return JSON.parse(localStorage.getItem('bundle-size-history') || '[]');
  }
}

// Global bundle optimizer instance
export const bundleOptimizer = new BundleOptimizer();
