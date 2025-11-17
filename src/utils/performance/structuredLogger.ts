import { logger } from '@utils/logging/logger';
// Structured Performance Logging System
// Replaces console usage with structured, environment-aware logging

import type {
  ExtendedPerformance,
  ExtendedNavigator,
} from "../../types/browser";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogCategory =
  | "performance"
  | "optimization"
  | "cache"
  | "preloading"
  | "analysis"
  | "monitoring";

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  performanceData?: PerformanceLogData;
}

export interface PerformanceLogData {
  operation: string;
  duration?: number;
  memoryUsage?: number;
  resourceUrl?: string;
  bundleSize?: number;
  cacheHit?: boolean;
  networkCondition?: string;
  optimizationApplied?: string[];
}

export interface LoggingConfig {
  enableConsole: boolean;
  enableRemoteLogging: boolean;
  enableLocalStorage: boolean;
  maxLocalEntries: number;
  logLevel: LogLevel;
  categories: LogCategory[];
  productionLogLevel: LogLevel;
}

class StructuredPerformanceLogger {
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      enableConsole: process.env.NODE_ENV === "development",
      enableRemoteLogging: process.env.NODE_ENV === "production",
      enableLocalStorage: true,
      maxLocalEntries: 1000,
      logLevel: process.env.NODE_ENV === "development" ? "debug" : "warn",
      categories: [
        "performance",
        "optimization",
        "cache",
        "preloading",
        "analysis",
        "monitoring",
      ],
      productionLogLevel: "error",
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.setupPerformanceLogging();
  }

  debug(
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    performanceData?: PerformanceLogData
  ): void {
    this.log("debug", category, message, context, undefined, performanceData);
  }

  info(
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    performanceData?: PerformanceLogData
  ): void {
    this.log("info", category, message, context, undefined, performanceData);
  }

  warn(
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    performanceData?: PerformanceLogData
  ): void {
    this.log("warn", category, message, context, undefined, performanceData);
  }

  error(
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    performanceData?: PerformanceLogData
  ): void {
    this.log("error", category, message, context, error, performanceData);
  }

  // Specialized performance logging methods
  logPerformanceMetric(
    operation: string,
    duration: number,
    context?: Record<string, any>
  ): void {
    this.info("performance", `Performance metric: ${operation}`, context, {
      operation,
      duration,
      memoryUsage: this.getMemoryUsage(),
      networkCondition: this.getNetworkCondition(),
    });
  }

  logOptimization(
    type: string,
    impact: number,
    context?: Record<string, any>
  ): void {
    this.info("optimization", `Optimization applied: ${type}`, context, {
      operation: type,
      optimizationApplied: [type],
      memoryUsage: this.getMemoryUsage(),
    });
  }

  logCacheOperation(
    operation: string,
    hit: boolean,
    url?: string,
    context?: Record<string, any>
  ): void {
    this.debug(
      "cache",
      `Cache ${operation}: ${hit ? "HIT" : "MISS"}`,
      context,
      {
        operation,
        cacheHit: hit,
        resourceUrl: url,
      }
    );
  }

  logPreloadOperation(
    url: string,
    success: boolean,
    context?: Record<string, any>
  ): void {
    this.debug(
      "preloading",
      `Preload ${success ? "succeeded" : "failed"}: ${url}`,
      context,
      {
        operation: "preload",
        resourceUrl: url,
      }
    );
  }

  logBundleAnalysis(
    bundleName: string,
    size: number,
    context?: Record<string, any>
  ): void {
    this.info("analysis", `Bundle analyzed: ${bundleName}`, context, {
      operation: "bundle-analysis",
      bundleSize: size,
    });
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    performanceData?: PerformanceLogData
  ): void {
    // Check if this log level should be processed
    if (!this.shouldLog(level, category)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      context,
      error,
      sessionId: this.sessionId,
      performanceData,
    };

    // Add to buffer
    this.logBuffer.push(entry);
    this.trimBuffer();

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Store locally if enabled
    if (this.config.enableLocalStorage) {
      this.storeLocally(entry);
    }

    // Send to remote if enabled and appropriate level
    if (this.config.enableRemoteLogging && this.shouldLogRemotely(level)) {
      this.sendToRemote(entry);
    }
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    // Check if category is enabled
    if (!this.config.categories.includes(category)) {
      return false;
    }

    // Check log level
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const entryLevelIndex = levels.indexOf(level);

    return entryLevelIndex >= currentLevelIndex;
  }

  private shouldLogRemotely(level: LogLevel): boolean {
    // Only send warnings and errors to remote in production
    if (process.env.NODE_ENV === "production") {
      return level === "warn" || level === "error";
    }
    return false;
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.category.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    const contextData = entry.context || {};
    const performanceData = entry.performanceData || {};
    const additionalData = { ...contextData, ...performanceData };

    switch (entry.level) {
      case "debug":
        logger.debug(message, 'UTILITY', additionalData);
        break;
      case "info":
        logger.info(message, 'UTILITY', additionalData);
        break;
      case "warn":
        logger.warn(message, 'UTILITY', additionalData);
        break;
      case "error":
        if (entry.error) {
          logger.error(message, 'UTILITY', additionalData, entry.error);
        } else {
          logger.error(message, 'UTILITY', additionalData);
        }
        break;
    }
  }

  private storeLocally(entry: LogEntry): void {
    try {
      const stored = localStorage.getItem("performance-logs");
      const logs: LogEntry[] = stored ? JSON.parse(stored) : [];

      logs.push(entry);

      // Keep only recent entries
      if (logs.length > this.config.maxLocalEntries) {
        logs.splice(0, logs.length - this.config.maxLocalEntries);
      }

      localStorage.setItem("performance-logs", JSON.stringify(logs));
    } catch (_error) {
      // Failed to store locally, ignore silently
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, this would send to a logging service
      // For now, we'll just simulate the call
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (_error) {
      // Failed to send remotely, store for retry
      this.storeForRetry(entry);
    }
  }

  private storeForRetry(entry: LogEntry): void {
    try {
      const stored = localStorage.getItem("performance-logs-retry");
      const retryLogs: LogEntry[] = stored ? JSON.parse(stored) : [];
      retryLogs.push(entry);

      // Keep only recent retry entries (max 100)
      if (retryLogs.length > 100) {
        retryLogs.splice(0, retryLogs.length - 100);
      }

      localStorage.setItem("performance-logs-retry", JSON.stringify(retryLogs));
    } catch (_error) {
      // Unable to store for retry, ignore
    }
  }

  private trimBuffer(): void {
    if (this.logBuffer.length > this.config.maxLocalEntries) {
      this.logBuffer.splice(
        0,
        this.logBuffer.length - this.config.maxLocalEntries
      );
    }
  }

  private generateSessionId(): string {
    return `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPerformanceLogging(): void {
    // Log initialization
    this.info("monitoring", "Performance logging initialized", {
      sessionId: this.sessionId,
      config: this.config,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Set up periodic retry for failed remote logs
    if (this.config.enableRemoteLogging) {
      setInterval(() => {
        this.retryFailedRemoteLogs();
      }, 60000); // Retry every minute
    }
  }

  private async retryFailedRemoteLogs(): Promise<void> {
    try {
      const stored = localStorage.getItem("performance-logs-retry");
      if (!stored) return;

      const retryLogs: LogEntry[] = JSON.parse(stored);
      if (retryLogs.length === 0) return;

      // Try to send all retry logs
      const promises = retryLogs.map((entry) => this.sendToRemote(entry));
      await Promise.all(promises);

      // Clear retry logs on success
      localStorage.removeItem("performance-logs-retry");
    } catch (_error) {
      // Some logs still failed, they'll remain in retry storage
    }
  }

  private getMemoryUsage(): number {
    try {
      const extPerformance = performance as ExtendedPerformance;
      if (extPerformance.memory) {
        return extPerformance.memory.usedJSHeapSize;
      }
    } catch (_error) {
      // Memory API not available
    }
    return 0;
  }

  private getNetworkCondition(): string {
    try {
      const extNavigator = navigator as ExtendedNavigator;
      if (extNavigator.connection) {
        const connection = extNavigator.connection;
        return connection?.effectiveType || "unknown";
      }
    } catch (_error) {
      // Network API not available
    }
    return "unknown";
  }

  // Public methods for log management
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logBuffer.filter((entry) => entry.category === category);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logBuffer.filter((entry) => entry.level === level);
  }

  clearLogs(): void {
    this.logBuffer = [];
    try {
      localStorage.removeItem("performance-logs");
      localStorage.removeItem("performance-logs-retry");
    } catch (_error) {
      // Ignore cleanup errors
    }
  }

  updateConfig(updates: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...updates };
    this.info("monitoring", "Logging configuration updated", {
      newConfig: updates,
    });
  }

  generateReport(): {
    summary: Record<LogLevel, number>;
    categories: Record<LogCategory, number>;
    recentErrors: LogEntry[];
    performanceIssues: LogEntry[];
  } {
    const summary: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    const categories: Record<LogCategory, number> = {
      performance: 0,
      optimization: 0,
      cache: 0,
      preloading: 0,
      analysis: 0,
      monitoring: 0,
    };

    for (const entry of this.logBuffer) {
      summary[entry.level]++;
      categories[entry.category]++;
    }

    const recentErrors = this.logBuffer
      .filter((entry) => entry.level === "error")
      .slice(-10);

    const performanceIssues = this.logBuffer
      .filter(
        (entry) =>
          entry.performanceData?.duration &&
          entry.performanceData.duration > 1000
      )
      .slice(-10);

    return {
      summary,
      categories,
      recentErrors,
      performanceIssues,
    };
  }
}

// Export singleton instance
export const performanceLogger = new StructuredPerformanceLogger();

// Export class for custom configurations
export { StructuredPerformanceLogger };
