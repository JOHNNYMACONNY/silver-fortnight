/**
 * Standardized Error Types and Handling
 * Provides consistent error handling across the TradeYa application
 */

export enum ErrorCode {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Business Logic Errors
  TRADE_FAILED = 'TRADE_FAILED',
  SKILL_NOT_FOUND = 'SKILL_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // System Errors
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  // Cache / Storage Errors
  CACHE_ERROR = 'CACHE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_WORKER_ERROR = 'SERVICE_WORKER_ERROR',
  
  // UI/UX Errors
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  ANIMATION_ERROR = 'ANIMATION_ERROR',
  
  // Unknown/Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: number;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
  [key: string]: any;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly recoveryActions: ErrorRecoveryAction[];
  public readonly userMessage: string;
  public readonly isRetryable: boolean;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    userMessage?: string,
    recoveryActions: ErrorRecoveryAction[] = [],
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = {
      ...context,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
    this.userMessage = userMessage || this.getDefaultUserMessage(code);
    this.recoveryActions = recoveryActions;
    this.isRetryable = isRetryable;
    this.timestamp = Date.now();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private getDefaultUserMessage(code: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection.',
      [ErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [ErrorCode.CONNECTION_ERROR]: 'Unable to connect to the server. Please try again later.',
      [ErrorCode.UNAUTHORIZED]: 'You need to sign in to access this feature.',
      [ErrorCode.FORBIDDEN]: 'You don\'t have permission to perform this action.',
      [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCode.INVALID_INPUT]: 'Invalid input provided. Please correct and try again.',
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
      [ErrorCode.TRADE_FAILED]: 'Trade could not be completed. Please try again.',
      [ErrorCode.SKILL_NOT_FOUND]: 'The requested skill could not be found.',
      [ErrorCode.USER_NOT_FOUND]: 'User not found.',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don\'t have sufficient permissions for this action.',
      [ErrorCode.SERVER_ERROR]: 'Server error occurred. Please try again later.',
      [ErrorCode.DATABASE_ERROR]: 'Database error occurred. Please try again later.',
  [ErrorCode.CACHE_ERROR]: 'Cached data appears to be corrupted. Clearing cache may help.',
  [ErrorCode.STORAGE_ERROR]: 'Storage access error. Please clear storage or try again.',
  [ErrorCode.SERVICE_WORKER_ERROR]: 'Service worker encountered an error. Try refreshing the service worker.',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
      [ErrorCode.COMPONENT_ERROR]: 'Component error occurred. Please refresh the page.',
      [ErrorCode.RENDER_ERROR]: 'Rendering error occurred. Please refresh the page.',
      [ErrorCode.ANIMATION_ERROR]: 'Animation error occurred. Continuing without animation.',
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    };

    return messages[code] || 'An unexpected error occurred. Please try again.';
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      userMessage: this.userMessage,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  public static fromError(error: Error, code?: ErrorCode, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Try to infer error code from error message or type
    const inferredCode = code || AppError.inferErrorCode(error);
    
    return new AppError(
      error.message,
      inferredCode,
      AppError.inferSeverity(inferredCode),
      context,
      undefined,
      [],
      AppError.isRetryable(inferredCode)
    );
  }

  private static inferErrorCode(error: Error): ErrorCode {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCode.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return ErrorCode.TIMEOUT_ERROR;
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return ErrorCode.UNAUTHORIZED;
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return ErrorCode.FORBIDDEN;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCode.VALIDATION_ERROR;
    }
    if (message.includes('server') || message.includes('500')) {
      return ErrorCode.SERVER_ERROR;
    }
    
    return ErrorCode.UNKNOWN_ERROR;
  }

  private static inferSeverity(code: ErrorCode): ErrorSeverity {
    const criticalCodes = [
      ErrorCode.SERVER_ERROR,
      ErrorCode.DATABASE_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE
    ];
    
    const highCodes = [
      ErrorCode.UNAUTHORIZED,
      ErrorCode.FORBIDDEN,
      ErrorCode.TRADE_FAILED
    ];
    
    const mediumCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.VALIDATION_ERROR
    ];

    if (criticalCodes.includes(code)) return ErrorSeverity.CRITICAL;
    if (highCodes.includes(code)) return ErrorSeverity.HIGH;
    if (mediumCodes.includes(code)) return ErrorSeverity.MEDIUM;
    
    return ErrorSeverity.LOW;
  }

  private static isRetryable(code: ErrorCode): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.CONNECTION_ERROR,
      ErrorCode.SERVER_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE
    ];
    
    return retryableCodes.includes(code);
  }
}

// Utility functions for creating specific error types
export const createNetworkError = (message: string, context?: ErrorContext): AppError => {
  return new AppError(
    message,
    ErrorCode.NETWORK_ERROR,
    ErrorSeverity.MEDIUM,
    context,
    undefined,
    [
      {
        label: 'Retry',
        action: () => window.location.reload(),
        primary: true
      },
      {
        label: 'Check Connection',
        action: () => { window.open('https://www.google.com', '_blank'); }
      }
    ],
    true
  );
};

export const createValidationError = (message: string, context?: ErrorContext): AppError => {
  return new AppError(
    message,
    ErrorCode.VALIDATION_ERROR,
    ErrorSeverity.LOW,
    context,
    undefined,
    [],
    false
  );
};

export const createAuthError = (message: string, context?: ErrorContext): AppError => {
  return new AppError(
    message,
    ErrorCode.UNAUTHORIZED,
    ErrorSeverity.HIGH,
    context,
    undefined,
    [
      {
        label: 'Sign In',
        action: () => { window.location.href = '/login'; },
        primary: true
      }
    ],
    false
  );
};

export const createTradeError = (message: string, context?: ErrorContext): AppError => {
  return new AppError(
    message,
    ErrorCode.TRADE_FAILED,
    ErrorSeverity.HIGH,
    context,
    undefined,
    [
      {
        label: 'Try Again',
        action: () => window.location.reload(),
        primary: true
      },
      {
        label: 'Contact Support',
        action: () => { window.location.href = '/support'; }
      }
    ],
    true
  );
};

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorId?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean; // Whether to isolate this boundary from parent boundaries
}

// Error reporting interface
export interface ErrorReporter {
  reportError(error: AppError): Promise<void>;
  reportPerformanceIssue(metric: string, value: number): Promise<void>;
  setUserContext(context: { userId?: string; email?: string }): void;
}
