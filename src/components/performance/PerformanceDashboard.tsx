import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Database, Globe, TrendingUp, AlertTriangle } from 'lucide-react';
import { rumService } from '../../services/performance/rumService';
import { smartOrchestrator } from '../../services/performance/smartOrchestrator';

interface PerformanceMetrics {
  loadTime: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
  bundleSize: number;
  cacheHitRate: number;
  memoryUsage: number;
  networkRequests: number;
}

interface OptimizationSuggestion {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  action?: () => void;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      // Get current performance metrics
      const currentMetrics = await rumService.getCurrentMetrics();
      const orchestratorStats = await smartOrchestrator.getOptimizationStats();
      
      setMetrics({
        loadTime: currentMetrics?.loadTime || 0,
        fcp: currentMetrics?.fcp || 0,
        lcp: currentMetrics?.lcp || 0,
        cls: currentMetrics?.cls || 0,
        fid: currentMetrics?.fid || 0,
        ttfb: currentMetrics?.ttfb || 0,
        bundleSize: orchestratorStats?.resourceStats?.bundleSize || 0,
        cacheHitRate: orchestratorStats?.improvements?.cacheHitRate || 0,
        memoryUsage: orchestratorStats?.improvements?.memorySavings || 0,
        networkRequests: currentMetrics?.networkRequests || 0
      });

      // Generate optimization suggestions
      generateOptimizationSuggestions(currentMetrics, orchestratorStats);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  };

  const generateOptimizationSuggestions = (currentMetrics: any, orchestratorStats: any) => {
    const newSuggestions: OptimizationSuggestion[] = [];

    // Check LCP (Largest Contentful Paint)
    if (currentMetrics?.lcp > 2500) {
      newSuggestions.push({
        id: 'lcp-optimization',
        type: 'critical',
        title: 'Optimize Largest Contentful Paint',
        description: 'LCP is above 2.5s. Consider optimizing images, preloading critical resources, or implementing lazy loading.',
        impact: 'high',
        effort: 'medium',
        action: () => optimizeLCP()
      });
    }

    // Check CLS (Cumulative Layout Shift)
    if (currentMetrics?.cls > 0.1) {
      newSuggestions.push({
        id: 'cls-optimization',
        type: 'warning',
        title: 'Reduce Layout Shifts',
        description: 'CLS is above 0.1. Add size attributes to images and reserve space for dynamic content.',
        impact: 'medium',
        effort: 'low',
        action: () => optimizeCLS()
      });
    }

    // Check cache hit rate
    if (orchestratorStats?.improvements?.cacheHitRate < 0.7) {
      newSuggestions.push({
        id: 'cache-optimization',
        type: 'warning',
        title: 'Improve Cache Hit Rate',
        description: 'Cache hit rate is below 70%. Implement cache warming and optimize cache strategies.',
        impact: 'high',
        effort: 'medium',
        action: () => optimizeCache()
      });
    }

    // Check bundle size
    if (orchestratorStats?.resourceStats?.bundleSize > 1000000) { // 1MB
      newSuggestions.push({
        id: 'bundle-optimization',
        type: 'warning',
        title: 'Reduce Bundle Size',
        description: 'Main bundle is over 1MB. Consider code splitting and tree shaking optimizations.',
        impact: 'high',
        effort: 'high',
        action: () => optimizeBundle()
      });
    }

    setSuggestions(newSuggestions);
  };

  const optimizeLCP = async () => {
    setIsOptimizing(true);
    try {
      // Implement LCP optimizations
      await smartOrchestrator.optimizeResourceLoading();
      await smartOrchestrator.enableImageOptimization();
      setOptimizationResults({ type: 'lcp', success: true });
    } catch (error) {
      setOptimizationResults({ type: 'lcp', success: false, error });
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizeCLS = async () => {
    setIsOptimizing(true);
    try {
      // Implement CLS optimizations
      await smartOrchestrator.optimizeLayoutStability();
      setOptimizationResults({ type: 'cls', success: true });
    } catch (error) {
      setOptimizationResults({ type: 'cls', success: false, error });
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizeCache = async () => {
    setIsOptimizing(true);
    try {
      // Implement cache optimizations
      await smartOrchestrator.optimizeCaching();
      setOptimizationResults({ type: 'cache', success: true });
    } catch (error) {
      setOptimizationResults({ type: 'cache', success: false, error });
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizeBundle = async () => {
    setIsOptimizing(true);
    try {
      // Implement bundle optimizations
      await smartOrchestrator.optimizeBundleSize();
      setOptimizationResults({ type: 'bundle', success: true });
    } catch (error) {
      setOptimizationResults({ type: 'bundle', success: false, error });
    } finally {
      setIsOptimizing(false);
    }
  };

  const runFullOptimization = async () => {
    setIsOptimizing(true);
    try {
      const results = await smartOrchestrator.runFullOptimization();
      setOptimizationResults({ type: 'full', success: true, results });
      await loadPerformanceData(); // Refresh metrics
    } catch (error) {
      setOptimizationResults({ type: 'full', success: false, error });
    } finally {
      setIsOptimizing(false);
    }
  };

  const getMetricStatus = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor and optimize application performance</p>
        </div>
        <motion.button
          onClick={runFullOptimization}
          disabled={isOptimizing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap className="w-4 h-4" />
          {isOptimizing ? 'Optimizing...' : 'Run Full Optimization'}
        </motion.button>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Largest Contentful Paint</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.lcp.toFixed(1)}s</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              getMetricStatus(metrics.lcp, { good: 2.5, poor: 4.0 }) === 'good' ? 'bg-green-500' :
              getMetricStatus(metrics.lcp, { good: 2.5, poor: 4.0 }) === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">First Input Delay</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.fid.toFixed(1)}ms</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              getMetricStatus(metrics.fid, { good: 100, poor: 300 }) === 'good' ? 'bg-green-500' :
              getMetricStatus(metrics.fid, { good: 100, poor: 300 }) === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cumulative Layout Shift</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.cls.toFixed(3)}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              getMetricStatus(metrics.cls, { good: 0.1, poor: 0.25 }) === 'good' ? 'bg-green-500' :
              getMetricStatus(metrics.cls, { good: 0.1, poor: 0.25 }) === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
        </motion.div>
      </div>

      {/* Resource Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cache Hit Rate</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{(metrics.cacheHitRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bundle Size</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatBytes(metrics.bundleSize)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatBytes(metrics.memoryUsage)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Network Requests</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.networkRequests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Optimization Suggestions
          </h3>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      suggestion.type === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      suggestion.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {suggestion.type}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      suggestion.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {suggestion.impact} impact
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.description}</p>
                </div>
                {suggestion.action && (
                  <button
                    onClick={suggestion.action}
                    disabled={isOptimizing}
                    className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Optimize
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Optimization Results */}
      {optimizationResults && (
        <motion.div
          className={`p-4 rounded-lg ${
            optimizationResults.success 
              ? 'bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700' 
              : 'bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-700'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-2">
            {optimizationResults.success ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            ) : (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✗</span>
              </div>
            )}
            <span className={`font-medium ${
              optimizationResults.success 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {optimizationResults.success 
                ? `${optimizationResults.type} optimization completed successfully!`
                : `${optimizationResults.type} optimization failed`
              }
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
