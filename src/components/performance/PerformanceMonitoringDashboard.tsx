import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Database, 
  HardDrive, 
  Network, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';
import { createMemoryManager } from '../../services/performance/memoryManager';
import { createQueryOptimizer } from '../../services/performance/queryOptimizer';

export interface PerformanceMonitoringDashboardProps {
  /** Whether to show real-time updates */
  realTime?: boolean;
  /** Update interval in milliseconds */
  updateInterval?: number;
  /** Whether to show detailed metrics */
  showDetails?: boolean;
  /** Custom CSS class */
  className?: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

/**
 * Performance Monitoring Dashboard
 * 
 * A comprehensive dashboard for monitoring application performance with:
 * - Real-time memory usage tracking
 * - Query performance metrics
 * - Memory leak detection
 * - Performance alerts
 * - Optimization suggestions
 * 
 * @example
 * <PerformanceMonitoringDashboard
 *   realTime={true}
 *   updateInterval={5000}
 *   showDetails={true}
 * />
 */
export function PerformanceMonitoringDashboard({
  realTime = true,
  updateInterval = 5000,
  showDetails = true,
  className = '',
}: PerformanceMonitoringDashboardProps) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(realTime);

  // Memory management
  const [memoryManager] = useState(() => createMemoryManager({
    maxMemoryUsage: 100,
    cleanupThreshold: 80,
    monitoringInterval: updateInterval,
    enableAutoCleanup: true,
    enableLeakDetection: true,
  }));

  // Query optimization
  const [queryOptimizer] = useState(() => createQueryOptimizer({
    enableCaching: true,
    enableBatching: true,
    enableDeduplication: true,
    enableMonitoring: true,
  }));

  const [memoryMetrics, setMemoryMetrics] = useState(memoryManager.getMetrics());
  const [queryMetrics, setQueryMetrics] = useState(queryOptimizer.getMetrics());
  const [cacheStats, setCacheStats] = useState(queryOptimizer.getCacheStats());
  const [memoryAlerts, setMemoryAlerts] = useState<any[]>([]);

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    scrollFPS: 0,
    networkRequests: 0,
    bundleSize: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
  });

  // Start monitoring on mount
  useEffect(() => {
    if (autoRefresh) {
      memoryManager.startMonitoring();
    }

    return () => {
      memoryManager.stopMonitoring();
    };
  }, [autoRefresh, memoryManager]);

  // Update performance metrics
  useEffect(() => {
    if (!autoRefresh) return;

    const updateMetrics = () => {
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage: memoryMetrics.currentUsage,
        cacheHitRate: cacheStats.hitRate,
        networkRequests: queryMetrics.totalQueries,
      }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, updateInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, updateInterval, memoryMetrics, cacheStats, queryMetrics]);

  // Handle memory alerts
  useEffect(() => {
    if (memoryAlerts.length > 0) {
      const newAlerts: PerformanceAlert[] = memoryAlerts.map(alert => ({
        id: alert.id,
        type: alert.type === 'critical' ? 'error' : alert.type === 'warning' ? 'warning' : 'info',
        title: 'Memory Alert',
        message: alert.message,
        timestamp: alert.timestamp,
        duration: 5000,
      }));

      setAlerts(prev => [...prev, ...newAlerts]);

      // Auto-remove alerts after duration
      newAlerts.forEach(alert => {
        if (alert.duration) {
          setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== alert.id));
          }, alert.duration);
        }
      });
    }
  }, [memoryAlerts]);

  // Handle memory cleanup
  const handleMemoryCleanup = useCallback(() => {
    memoryManager.cleanup();
    setAlerts(prev => [...prev, {
      id: `cleanup_${Date.now()}`,
      type: 'success',
      title: 'Memory Cleanup',
      message: 'Memory cleanup completed successfully',
      timestamp: Date.now(),
      duration: 3000,
    }]);
  }, [memoryManager]);

  // Handle cache clear
  const handleCacheClear = useCallback(() => {
    queryOptimizer.clearCache();
    setAlerts(prev => [...prev, {
      id: `cache_clear_${Date.now()}`,
      type: 'success',
      title: 'Cache Cleared',
      message: 'Query cache cleared successfully',
      timestamp: Date.now(),
      duration: 3000,
    }]);
  }, [queryOptimizer]);

  // Remove alert
  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    memoryManager.clearAlerts();
  }, [memoryManager]);

  // Get performance status
  const getPerformanceStatus = () => {
    if (memoryMetrics.leakDetected) return 'critical';
    if (memoryMetrics.usagePercentage > 80) return 'warning';
    if (memoryMetrics.usagePercentage > 60) return 'info';
    return 'success';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'success': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <XCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'info': return <Activity className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Performance Monitor
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time performance monitoring and optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Performance Status */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${getStatusColor(getPerformanceStatus())}`}>
            {getStatusIcon(getPerformanceStatus())}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              System Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getPerformanceStatus() === 'success' && 'All systems operating normally'}
              {getPerformanceStatus() === 'info' && 'Performance is good with minor optimizations available'}
              {getPerformanceStatus() === 'warning' && 'Performance degradation detected'}
              {getPerformanceStatus() === 'critical' && 'Critical performance issues detected'}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {memoryMetrics.currentUsage.toFixed(1)} MB
                </p>
                <p className="text-xs text-gray-500">
                  {memoryMetrics.usagePercentage.toFixed(1)}% of limit
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {(cacheStats.hitRate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {cacheStats.size} cached queries
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Query Performance</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {queryMetrics.averageExecutionTime.toFixed(0)}ms
                </p>
                <p className="text-xs text-gray-500">
                  {queryMetrics.totalQueries} total queries
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Stores</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {memoryMetrics.activeStores}
                </p>
                <p className="text-xs text-gray-500">
                  {memoryMetrics.cachedItems} cached items
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleMemoryCleanup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Cleanup Memory
          </button>
          <button
            onClick={handleCacheClear}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Clear Cache
          </button>
          <button
            onClick={clearAllAlerts}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Clear Alerts
          </button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Recent Alerts
            </h4>
            <AnimatePresence>
              {alerts.slice(-5).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'success' ? 'bg-green-50 border-green-500 dark:bg-green-900' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900' :
                    alert.type === 'error' ? 'bg-red-50 border-red-500 dark:bg-red-900' :
                    'bg-blue-50 border-blue-500 dark:bg-blue-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {alert.message}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformanceMonitoringDashboard;
