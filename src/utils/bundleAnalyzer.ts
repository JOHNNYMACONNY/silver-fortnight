import { logger } from '@utils/logging/logger';
/**
 * Bundle Analyzer Utility
 * 
 * This utility provides functions to analyze and report on bundle sizes.
 * It's meant to be used during the build process to identify large dependencies
 * and opportunities for optimization.
 * 
 * Note: This is a placeholder implementation. In a real application, you would
 * use tools like webpack-bundle-analyzer or rollup-plugin-visualizer.
 */

export interface BundleInfo {
  name: string;
  size: number; // in bytes
  gzipSize?: number; // in bytes
  dependencies?: BundleDependency[];
}

export interface BundleDependency {
  name: string;
  size: number; // in bytes
}

/**
 * Format bytes to a human-readable string
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., "1.5 KB")
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Log bundle information to the console
 * @param bundles Array of bundle information
 */
export const logBundleInfo = (bundles: BundleInfo[]): void => {
  console.group('Bundle Size Analysis');
  
  bundles.forEach(bundle => {
    console.group(`${bundle.name}: ${formatBytes(bundle.size)}`);
    
    if (bundle.gzipSize) {
      logger.debug(`Gzipped: ${formatBytes(bundle.gzipSize)}`, 'UTILITY');
    }
    
    if (bundle.dependencies && bundle.dependencies.length > 0) {
      console.group('Dependencies');
      
      // Sort dependencies by size (largest first)
      const sortedDeps = [...bundle.dependencies].sort((a, b) => b.size - a.size);
      
      sortedDeps.forEach(dep => {
        logger.debug(`${dep.name}: ${formatBytes(dep.size)}`, 'UTILITY');
      });
      
      console.groupEnd();
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
};

/**
 * Generate a report of bundle sizes
 * @param bundles Array of bundle information
 * @returns Markdown-formatted report
 */
export const generateBundleReport = (bundles: BundleInfo[]): string => {
  let report = '# Bundle Size Analysis\n\n';
  
  // Calculate total size
  const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
  report += `Total bundle size: ${formatBytes(totalSize)}\n\n`;
  
  // Table of bundles
  report += '## Bundles\n\n';
  report += '| Bundle | Size | Gzipped |\n';
  report += '|--------|------|--------|\n';
  
  bundles.forEach(bundle => {
    const gzipInfo = bundle.gzipSize ? formatBytes(bundle.gzipSize) : 'N/A';
    report += `| ${bundle.name} | ${formatBytes(bundle.size)} | ${gzipInfo} |\n`;
  });
  
  // Large dependencies
  report += '\n## Large Dependencies\n\n';
  
  // Collect all dependencies
  const allDeps: Record<string, number> = {};
  
  bundles.forEach(bundle => {
    if (bundle.dependencies) {
      bundle.dependencies.forEach(dep => {
        if (allDeps[dep.name]) {
          allDeps[dep.name] += dep.size;
        } else {
          allDeps[dep.name] = dep.size;
        }
      });
    }
  });
  
  // Sort dependencies by size
  const sortedDeps = Object.entries(allDeps)
    .sort(([, sizeA], [, sizeB]) => sizeB - sizeA)
    .slice(0, 20); // Top 20 dependencies
  
  report += '| Dependency | Size |\n';
  report += '|------------|------|\n';
  
  sortedDeps.forEach(([name, size]) => {
    report += `| ${name} | ${formatBytes(size)} |\n`;
  });
  
  report += '\n## Recommendations\n\n';
  report += '- Consider code splitting for large bundles\n';
  report += '- Lazy load non-critical components\n';
  report += '- Review large dependencies for alternatives or optimizations\n';
  
  return report;
};

/**
 * Placeholder function to analyze bundle sizes
 * In a real application, this would be integrated with the build process
 * @returns Promise resolving to bundle information
 */
export const analyzeBundles = async (): Promise<BundleInfo[]> => {
  logger.debug('Bundle analysis would be implemented here', 'UTILITY');
  logger.debug('In a real application, use webpack-bundle-analyzer or similar tools', 'UTILITY');
  
  // This is just placeholder data
  return [
    {
      name: 'main.js',
      size: 1024 * 1024, // 1 MB
      gzipSize: 256 * 1024, // 256 KB
      dependencies: [
        { name: 'react', size: 128 * 1024 },
        { name: 'firebase', size: 256 * 1024 },
        { name: 'tailwindcss', size: 64 * 1024 }
      ]
    },
    {
      name: 'vendor.js',
      size: 2 * 1024 * 1024, // 2 MB
      gzipSize: 512 * 1024, // 512 KB
      dependencies: [
        { name: 'react-dom', size: 512 * 1024 },
        { name: 'firebase/firestore', size: 384 * 1024 },
        { name: 'firebase/auth', size: 256 * 1024 }
      ]
    }
  ];
};
