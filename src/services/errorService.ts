/**
 * Centralized Error Handling Service
 * Provides consistent error handling, reporting, and recovery across the TradeYa application
 */

import { AppError, ErrorCode, ErrorSeverity, ErrorContext, ErrorReporter } from '../types/errors';

interface ErrorServiceConfig {
  enableReporting: boolean;
  enableConsoleLogging: boolean;
  enableUserNotifications: boolean;
  maxRetries: number;
  retryDelay: number;
}

interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  lastError?: AppError;
  sessionStartTime: number;
}

class ErrorService implements ErrorReporter {
  private config: ErrorServiceConfig;
  private metrics: ErrorMetrics;
  private userContext: { userId?: string; email?: string } = {};
  private errorQueue: AppError[] = [];
  private isOnline = navigator.onLine;

  constructor(config: Partial<ErrorServiceConfig> = {}) {
    this.config = {
      enableReporting: true,
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableUserNotifications: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.metrics = {
      totalErrors: 0,
      errorsByCode: {},
      errorsBySeverity: {},
      sessionStartTime: Date.now(),
    };

    this.setupNetworkListeners();
    this.setupGlobalErrorHandlers();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = AppError.fromError(
        new Error(event.reason?.message || 'Unhandled promise rejection'),
        ErrorCode.UNKNOWN_ERROR,
        { component: 'global', action: 'unhandled_rejection' }
      );
      this.handleError(error);
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = AppError.fromError(
        event.error || new Error(event.message),
        ErrorCode.UNKNOWN_ERROR,
        { 
          component: 'global', 
          action: 'javascript_error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          }
        }
      );
      this.handleError(error);
    });
  }

  public async handleError(error: Error | AppError, context?: ErrorContext): Promise<void> {
    const appError = error instanceof AppError ? error : AppError.fromError(error, undefined, context);
    
    // Update metrics
    this.updateMetrics(appError);

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(appError);
    }

    // Report error if enabled
    if (this.config.enableReporting) {
      await this.reportError(appError);
    }

    // Show user notification if enabled and appropriate
    if (this.config.enableUserNotifications && this.shouldNotifyUser(appError)) {
      this.notifyUser(appError);
    }
  }

  public async reportError(error: AppError): Promise<void> {
    try {
      if (!this.isOnline) {
        this.errorQueue.push(error);
        return;
      }

      // In a real application, this would send to an error tracking service
      // For now, we'll simulate the reporting
      const errorReport = {
        ...error.toJSON(),
        userContext: this.userContext,
        metrics: this.getMetricsSummary(),
        sessionId: this.generateSessionId(),
        buildVersion: process.env.REACT_APP_VERSION || 'unknown',
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Error Report:', errorReport);
      }

      // Simulate API call to error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      // Add to queue for retry
      this.errorQueue.push(error);
    }
  }

  public async reportPerformanceIssue(metric: string, value: number): Promise<void> {
    try {
      const performanceReport = {
        metric,
        value,
        timestamp: Date.now(),
        userContext: this.userContext,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ Performance Report:', performanceReport);
      }

      // Simulate API call to performance monitoring service
      // await fetch('/api/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(performanceReport),
      // });

    } catch (error) {
      console.error('Failed to report performance issue:', error);
    }
  }

  public setUserContext(context: { userId?: string; email?: string }): void {
    this.userContext = { ...this.userContext, ...context };
  }

  public getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  public clearMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByCode: {},
      errorsBySeverity: {},
      sessionStartTime: Date.now(),
    };
  }

  private updateMetrics(error: AppError): void {
    this.metrics.totalErrors++;
    this.metrics.errorsByCode[error.code] = (this.metrics.errorsByCode[error.code] || 0) + 1;
    this.metrics.errorsBySeverity[error.severity] = (this.metrics.errorsBySeverity[error.severity] || 0) + 1;
    this.metrics.lastError = error;
  }

  private logToConsole(error: AppError): void {
    const emoji = this.getSeverityEmoji(error.severity);
    const style = this.getSeverityStyle(error.severity);

    console.group(`${emoji} ${error.code} - ${error.severity.toUpperCase()}`);
    console.error('%c' + error.message, style);
    console.log('Context:', error.context);
    console.log('User Message:', error.userMessage);
    console.log('Retryable:', error.isRetryable);
    console.log('Recovery Actions:', error.recoveryActions);
    console.groupEnd();
  }

  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return '🔵';
      case ErrorSeverity.MEDIUM: return '🟡';
      case ErrorSeverity.HIGH: return '🟠';
      case ErrorSeverity.CRITICAL: return '🔴';
    }
  }

  private getSeverityStyle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return 'color: #3b82f6; font-weight: bold;';
      case ErrorSeverity.MEDIUM: return 'color: #eab308; font-weight: bold;';
      case ErrorSeverity.HIGH: return 'color: #f97316; font-weight: bold;';
      case ErrorSeverity.CRITICAL: return 'color: #ef4444; font-weight: bold; background: #fef2f2; padding: 2px 4px;';
    }
  }

  private shouldNotifyUser(error: AppError): boolean {
    // Don't notify for low severity errors or certain error types
    if (error.severity === ErrorSeverity.LOW) return false;
    if (error.code === ErrorCode.ANIMATION_ERROR) return false;
    
    // Don't spam users with the same error
    const recentSimilarErrors = this.errorQueue
      .filter(e => e.code === error.code)
      .filter(e => Date.now() - e.timestamp < 30000); // Last 30 seconds
    
    return recentSimilarErrors.length === 0;
  }

  private notifyUser(error: AppError): void {
    // This would integrate with a toast notification system
    // For now, we'll use a simple console log
    console.log('🔔 User Notification:', error.userMessage);
    
    // Example integration with toast system:
    // toast.error(error.userMessage, {
    //   duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 5000,
    //   action: error.recoveryActions.length > 0 ? {
    //     label: error.recoveryActions[0].label,
    //     onClick: error.recoveryActions[0].action,
    //   } : undefined,
    // });
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      try {
        await this.reportError(error);
      } catch (e) {
        // If reporting fails again, add back to queue
        this.errorQueue.push(error);
      }
    }
  }

  private getMetricsSummary() {
    return {
      totalErrors: this.metrics.totalErrors,
      sessionDuration: Date.now() - this.metrics.sessionStartTime,
      topErrorCodes: Object.entries(this.metrics.errorsByCode)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      severityDistribution: this.metrics.errorsBySeverity,
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
export const errorService = new ErrorService();

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    await errorService.handleError(error as Error, context);
    return fallback;
  }
};

export const withErrorBoundary = <T extends any[], R>(
  fn: (...args: T) => R,
  context?: ErrorContext
) => {
  return (...args: T): R | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      errorService.handleError(error as Error, context);
      return undefined;
    }
  };
};

export const createRetryableOperation = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: ErrorContext
) => {
  return async (): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          const appError = AppError.fromError(lastError, undefined, {
            ...context,
            additionalData: { attempts: attempt, maxRetries }
          });
          await errorService.handleError(appError);
          throw appError;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  };
};
