/**
 * Centralized Logging System
 * 
 * Replaces console.log statements with proper logging infrastructure
 * Provides different log levels and environment-aware logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
  enableRemoteLogging: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableStorage: process.env.NODE_ENV === 'development',
      maxStoredLogs: 1000,
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    return `${timestamp} ${levelName} ${context} ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      data,
      error
    };

    // Store log entry
    if (this.config.enableStorage) {
      this.logs.push(entry);
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs.shift();
      }
    }

    // Console output
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data, error);
          break;
      }
    }

    // Remote logging (production)
    if (this.config.enableRemoteLogging && level >= LogLevel.WARN) {
      this.sendToRemoteLogger(entry);
    }
  }

  private async sendToRemoteLogger(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, this would send to a logging service
      // For now, we'll just store it locally
      if (typeof window !== 'undefined' && window.localStorage) {
        const remoteLogKey = 'tradeya_remote_logs';
        const existingLogs = JSON.parse(localStorage.getItem(remoteLogKey) || '[]');
        existingLogs.push(entry);
        
        // Keep only last 100 remote logs
        if (existingLogs.length > 100) {
          existingLogs.splice(0, existingLogs.length - 100);
        }
        
        localStorage.setItem(remoteLogKey, JSON.stringify(existingLogs));
      }
    } catch (error) {
      console.error('Failed to send log to remote logger:', error);
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  // Performance logging
  time(label: string, context?: string): void {
    this.debug(`Timer started: ${label}`, context);
  }

  timeEnd(label: string, context?: string): void {
    this.debug(`Timer ended: ${label}`, context);
  }

  // User action logging
  userAction(action: string, data?: any): void {
    this.info(`User action: ${action}`, 'USER_ACTION', data);
  }

  // Service operation logging
  serviceOperation(operation: string, service: string, data?: any): void {
    this.debug(`Service operation: ${operation}`, service, data);
  }

  // Error boundary logging
  componentError(componentName: string, error: Error, errorInfo?: any): void {
    this.error(
      `Component error in ${componentName}`,
      'COMPONENT_ERROR',
      errorInfo,
      error
    );
  }

  // Get stored logs
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  // Clear stored logs
  clearLogs(): void {
    this.logs = [];
  }

  // Update configuration
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Convenience functions for common logging patterns
export const logUserAction = (action: string, data?: any) => logger.userAction(action, data);
export const logServiceOperation = (operation: string, service: string, data?: any) => 
  logger.serviceOperation(operation, service, data);
export const logComponentError = (componentName: string, error: Error, errorInfo?: any) => 
  logger.componentError(componentName, error, errorInfo);

// Development helpers
export const devLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, 'DEV', data);
  }
};

export const perfLog = (label: string, fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    logger.time(label, 'PERFORMANCE');
    fn();
    const end = performance.now();
    logger.timeEnd(label, 'PERFORMANCE');
    logger.debug(`Performance: ${label} took ${(end - start).toFixed(2)}ms`, 'PERFORMANCE');
  } else {
    fn();
  }
};

// React hook for component logging
export const useLogger = (componentName: string) => {
  return {
    debug: (message: string, data?: any) => logger.debug(message, componentName, data),
    info: (message: string, data?: any) => logger.info(message, componentName, data),
    warn: (message: string, data?: any) => logger.warn(message, componentName, data),
    error: (message: string, data?: any, error?: Error) => logger.error(message, componentName, data, error),
    userAction: (action: string, data?: any) => logger.userAction(`${componentName}: ${action}`, data)
  };
};

export default logger;
