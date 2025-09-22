/**
 * Memory Management Service for Large Datasets
 * 
 * Provides intelligent memory management with:
 * - Real-time memory monitoring
 * - Automatic cleanup triggers
 * - Memory leak detection
 * - Performance alerts
 * - Data compression
 * - Cache optimization
 */

import { EventEmitter } from 'events';

export interface MemoryConfig {
  /** Maximum memory usage threshold (MB) */
  maxMemoryUsage: number;
  /** Memory cleanup threshold (MB) */
  cleanupThreshold: number;
  /** Memory monitoring interval (ms) */
  monitoringInterval: number;
  /** Whether to enable automatic cleanup */
  enableAutoCleanup: boolean;
  /** Whether to enable memory compression */
  enableCompression: boolean;
  /** Whether to enable memory leak detection */
  enableLeakDetection: boolean;
  /** Memory leak detection threshold (MB) */
  leakDetectionThreshold: number;
  /** Memory leak detection window (ms) */
  leakDetectionWindow: number;
}

export interface MemoryMetrics {
  /** Current memory usage (MB) */
  currentUsage: number;
  /** Peak memory usage (MB) */
  peakUsage: number;
  /** Available memory (MB) */
  availableMemory: number;
  /** Memory usage percentage */
  usagePercentage: number;
  /** Number of active data stores */
  activeStores: number;
  /** Number of cached items */
  cachedItems: number;
  /** Memory compression ratio */
  compressionRatio: number;
  /** Last cleanup time */
  lastCleanup: number;
  /** Memory leak detected */
  leakDetected: boolean;
  /** Memory leak severity */
  leakSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MemoryAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  metrics: MemoryMetrics;
  action?: () => void;
}

export interface DataStore {
  id: string;
  data: any[];
  size: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  compressible: boolean;
  ttl?: number;
}

export class MemoryManager extends EventEmitter {
  private config: MemoryConfig;
  private dataStores: Map<string, DataStore> = new Map();
  private metrics: MemoryMetrics = {
    currentUsage: 0,
    peakUsage: 0,
    availableMemory: 0,
    usagePercentage: 0,
    activeStores: 0,
    cachedItems: 0,
    compressionRatio: 1,
    lastCleanup: 0,
    leakDetected: false,
    leakSeverity: 'low',
  };
  private monitoringInterval: NodeJS.Timeout | null = null;
  private memoryHistory: number[] = [];
  private alerts: MemoryAlert[] = [];
  private isMonitoring: boolean = false;

  constructor(config: Partial<MemoryConfig> = {}) {
    super();
    this.config = {
      maxMemoryUsage: 100, // 100MB
      cleanupThreshold: 80, // 80MB
      monitoringInterval: 5000, // 5 seconds
      enableAutoCleanup: true,
      enableCompression: true,
      enableLeakDetection: true,
      leakDetectionThreshold: 50, // 50MB
      leakDetectionWindow: 60000, // 1 minute
      ...config,
    };
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkMemoryUsage();
      this.detectMemoryLeaks();
    }, this.config.monitoringInterval);

    this.emit('monitoringStarted', { config: this.config });
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoringStopped');
  }

  /**
   * Register a data store
   */
  registerStore(
    id: string,
    data: any[],
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      compressible?: boolean;
      ttl?: number;
    } = {}
  ): void {
    const size = this.calculateDataSize(data);
    const store: DataStore = {
      id,
      data,
      size,
      lastAccessed: Date.now(),
      priority: options.priority || 'medium',
      compressible: options.compressible ?? true,
      ttl: options.ttl,
    };

    this.dataStores.set(id, store);
    this.updateMetrics();
    this.emit('storeRegistered', { id, size, priority: store.priority });
  }

  /**
   * Update a data store
   */
  updateStore(id: string, data: any[]): void {
    const store = this.dataStores.get(id);
    if (!store) return;

    store.data = data;
    store.size = this.calculateDataSize(data);
    store.lastAccessed = Date.now();

    this.updateMetrics();
    this.emit('storeUpdated', { id, size: store.size });
  }

  /**
   * Remove a data store
   */
  removeStore(id: string): void {
    const store = this.dataStores.get(id);
    if (!store) return;

    this.dataStores.delete(id);
    this.updateMetrics();
    this.emit('storeRemoved', { id, size: store.size });
  }

  /**
   * Get data from a store
   */
  getStoreData(id: string): any[] | null {
    const store = this.dataStores.get(id);
    if (!store) return null;

    store.lastAccessed = Date.now();
    return store.data;
  }

  /**
   * Compress data if enabled
   */
  compressData(data: any[]): any[] {
    if (!this.config.enableCompression) return data;

    try {
      // Simple compression - in production, use a proper compression library
      const compressed = data.map(item => {
        if (typeof item === 'object' && item !== null) {
          return JSON.parse(JSON.stringify(item, (key, value) => {
            if (typeof value === 'string' && value.length > 100) {
              return value.substring(0, 100) + '...';
            }
            return value;
          }));
        }
        return item;
      });

      this.metrics.compressionRatio = this.calculateDataSize(compressed) / this.calculateDataSize(data);
      return compressed;
    } catch (error) {
      console.warn('Failed to compress data:', error);
      return data;
    }
  }

  /**
   * Decompress data
   */
  decompressData(data: any[]): any[] {
    // In a real implementation, this would reverse the compression
    return data;
  }

  /**
   * Clean up memory
   */
  cleanup(): void {
    const startTime = performance.now();
    let cleanedSize = 0;
    let cleanedStores = 0;

    // Sort stores by priority and last accessed time
    const sortedStores = Array.from(this.dataStores.entries())
      .sort(([, a], [, b]) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.lastAccessed - b.lastAccessed;
      });

    // Remove expired stores
    for (const [id, store] of sortedStores) {
      if (store.ttl && Date.now() - store.lastAccessed > store.ttl) {
        cleanedSize += store.size;
        cleanedStores++;
        this.dataStores.delete(id);
      }
    }

    // Remove low priority stores if still over threshold
    if (this.metrics.currentUsage > this.config.cleanupThreshold) {
      for (const [id, store] of sortedStores) {
        if (store.priority === 'low' && this.metrics.currentUsage > this.config.cleanupThreshold) {
          cleanedSize += store.size;
          cleanedStores++;
          this.dataStores.delete(id);
        }
      }
    }

    // Compress remaining stores
    if (this.config.enableCompression) {
      for (const [id, store] of this.dataStores.entries()) {
        if (store.compressible) {
          const compressedData = this.compressData(store.data);
          store.data = compressedData;
          store.size = this.calculateDataSize(compressedData);
        }
      }
    }

    this.metrics.lastCleanup = Date.now();
    this.updateMetrics();

    const endTime = performance.now();
    this.emit('cleanupCompleted', {
      cleanedSize,
      cleanedStores,
      duration: endTime - startTime,
      metrics: this.metrics,
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get memory alerts
   */
  getAlerts(): MemoryAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.emit('alertsCleared');
  }

  /**
   * Update memory metrics
   */
  private updateMetrics(): void {
    const totalSize = Array.from(this.dataStores.values())
      .reduce((sum, store) => sum + store.size, 0);

    this.metrics.currentUsage = totalSize / (1024 * 1024); // Convert to MB
    this.metrics.peakUsage = Math.max(this.metrics.peakUsage, this.metrics.currentUsage);
    this.metrics.availableMemory = this.getAvailableMemory();
    this.metrics.usagePercentage = (this.metrics.currentUsage / this.config.maxMemoryUsage) * 100;
    this.metrics.activeStores = this.dataStores.size;
    this.metrics.cachedItems = Array.from(this.dataStores.values())
      .reduce((sum, store) => sum + store.data.length, 0);

    // Update memory history for leak detection
    this.memoryHistory.push(this.metrics.currentUsage);
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
  }

  /**
   * Check memory usage and trigger cleanup if needed
   */
  private checkMemoryUsage(): void {
    if (this.metrics.currentUsage > this.config.maxMemoryUsage) {
      this.createAlert('critical', 'Memory usage exceeded maximum threshold');
      if (this.config.enableAutoCleanup) {
        this.cleanup();
      }
    } else if (this.metrics.currentUsage > this.config.cleanupThreshold) {
      this.createAlert('warning', 'Memory usage approaching threshold');
      if (this.config.enableAutoCleanup) {
        this.cleanup();
      }
    }
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeaks(): void {
    if (!this.config.enableLeakDetection || this.memoryHistory.length < 10) return;

    const recent = this.memoryHistory.slice(-10);
    const trend = this.calculateTrend(recent);

    if (trend > 0.1 && this.metrics.currentUsage > this.config.leakDetectionThreshold) {
      this.metrics.leakDetected = true;
      this.metrics.leakSeverity = this.getLeakSeverity(trend);
      this.createAlert('error', 'Memory leak detected');
    } else {
      this.metrics.leakDetected = false;
      this.metrics.leakSeverity = 'low';
    }
  }

  /**
   * Create a memory alert
   */
  private createAlert(type: 'warning' | 'error' | 'critical', message: string): void {
    const alert: MemoryAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      action: type === 'critical' ? () => this.cleanup() : undefined,
    };

    this.alerts.push(alert);
    this.emit('alertCreated', alert);
  }

  /**
   * Calculate data size in bytes
   */
  private calculateDataSize(data: any[]): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  /**
   * Get available memory (simplified)
   */
  private getAvailableMemory(): number {
    // In a real implementation, this would use performance.memory if available
    return this.config.maxMemoryUsage - this.metrics.currentUsage;
  }

  /**
   * Calculate trend in memory usage
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / first;
  }

  /**
   * Get leak severity based on trend
   */
  private getLeakSeverity(trend: number): 'low' | 'medium' | 'high' | 'critical' {
    if (trend > 0.5) return 'critical';
    if (trend > 0.3) return 'high';
    if (trend > 0.1) return 'medium';
    return 'low';
  }
}

/**
 * Create a new memory manager instance
 */
export function createMemoryManager(config?: Partial<MemoryConfig>): MemoryManager {
  return new MemoryManager(config);
}

/**
 * Hook for using memory manager in React components
 */
export function useMemoryManager(config?: Partial<MemoryConfig>) {
  // Note: This hook requires React imports which are not available in this service file
  // Move this to a separate hooks file if needed
  throw new Error('useMemoryManager hook should be moved to a React hooks file');
}

export default MemoryManager;
