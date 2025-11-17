/**
 * Error Handling Hook
 * Provides consistent error handling utilities for React components
 */

import { useState, useCallback, useEffect } from 'react';
import { AppError, ErrorCode, ErrorSeverity, ErrorContext, ErrorRecoveryAction } from '../types/errors';
import { errorService, handleAsyncError, createRetryableOperation } from '../services/errorService';
import { useToast } from '../contexts/ToastContext';
import { logger } from '@utils/logging/logger';

interface UseErrorHandlingOptions {
  enableToastNotifications?: boolean;
  enableConsoleLogging?: boolean;
  defaultRetryCount?: number;
  component?: string;
}

interface ErrorState {
  error: AppError | null;
  isLoading: boolean;
  retryCount: number;
  hasError: boolean;
}

interface UseErrorHandlingReturn {
  // Error state
  error: AppError | null;
  isLoading: boolean;
  hasError: boolean;
  retryCount: number;
  
  // Error handling functions
  handleError: (error: Error | AppError, context?: ErrorContext) => Promise<void>;
  clearError: () => void;
  retry: () => void;
  
  // Async operation wrappers
  executeAsync: <T>(operation: () => Promise<T>, context?: ErrorContext) => Promise<T | undefined>;
  executeWithRetry: <T>(operation: () => Promise<T>, maxRetries?: number, context?: ErrorContext) => Promise<T>;
  
  // Validation helpers
  validateAndExecute: <T>(
    validation: () => boolean | string,
    operation: () => Promise<T>,
    context?: ErrorContext
  ) => Promise<T | undefined>;
  
  // Recovery actions
  addRecoveryAction: (action: ErrorRecoveryAction) => void;
  removeRecoveryAction: (label: string) => void;
}

export const useErrorHandling = (options: UseErrorHandlingOptions = {}): UseErrorHandlingReturn => {
  const {
    enableToastNotifications = true,
    enableConsoleLogging = process.env.NODE_ENV === 'development',
    defaultRetryCount = 3,
    component = 'Unknown',
  } = options;

  const { showToast } = useToast();
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0,
    hasError: false,
  });

  const [recoveryActions, setRecoveryActions] = useState<ErrorRecoveryAction[]>([]);

  // Handle error with comprehensive logging and user feedback
  const handleError = useCallback(async (error: Error | AppError, context?: ErrorContext) => {
    const appError = error instanceof AppError ? error : AppError.fromError(error, undefined, {
      component,
      ...context,
    });

    // Update local error state
    setErrorState(prev => ({
      ...prev,
      error: appError,
      hasError: true,
      isLoading: false,
    }));

    // Add recovery actions to the error
    if (recoveryActions.length > 0) {
      appError.recoveryActions.push(...recoveryActions);
    }

    // Log to console if enabled
    if (enableConsoleLogging) {
      console.group(`🚨 Component Error: ${component}`);
      logger.error('Error:', 'APP', {}, appError.toJSON() as Error);
      console.groupEnd();
    }

    // Show toast notification if enabled and appropriate
    if (enableToastNotifications && shouldShowToast(appError)) {
      showToast(appError.userMessage, 'error', {
        duration: appError.severity === ErrorSeverity.CRITICAL ? 0 : 5000,
        action: appError.recoveryActions.length > 0 ? {
          label: appError.recoveryActions[0].label,
          onClick: appError.recoveryActions[0].action,
        } : undefined,
      });
    }

    // Report through error service
    await errorService.handleError(appError);
  }, [component, enableConsoleLogging, enableToastNotifications, showToast, recoveryActions]);

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isLoading: false,
      retryCount: 0,
      hasError: false,
    });
  }, []);

  // Retry the last operation
  const retry = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      hasError: false,
      error: null,
    }));
  }, []);

  // Execute async operation with error handling
  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | undefined> => {
    setErrorState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await handleAsyncError(operation, {
        component,
        ...context,
      });
      
      setErrorState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      await handleError(error as Error, context);
      return undefined;
    }
  }, [component, handleError]);

  // Execute operation with automatic retry
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = defaultRetryCount,
    context?: ErrorContext
  ): Promise<T> => {
    setErrorState(prev => ({ ...prev, isLoading: true }));
    
    const retryableOperation = createRetryableOperation(
      operation,
      maxRetries,
      1000,
      {
        component,
        ...context,
      }
    );

    try {
      const result = await retryableOperation();
      setErrorState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      await handleError(error as Error, context);
      throw error;
    }
  }, [component, defaultRetryCount, handleError]);

  // Validate input and execute operation
  const validateAndExecute = useCallback(async <T>(
    validation: () => boolean | string,
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | undefined> => {
    try {
      const validationResult = validation();
      
      if (validationResult !== true) {
        const errorMessage = typeof validationResult === 'string' 
          ? validationResult 
          : 'Validation failed';
        
        const validationError = new AppError(
          errorMessage,
          ErrorCode.VALIDATION_ERROR,
          ErrorSeverity.LOW,
          { component, ...context },
          errorMessage
        );
        
        await handleError(validationError);
        return undefined;
      }

      return await executeAsync(operation, context);
    } catch (error) {
      await handleError(error as Error, context);
      return undefined;
    }
  }, [component, executeAsync, handleError]);

  // Add recovery action
  const addRecoveryAction = useCallback((action: ErrorRecoveryAction) => {
    setRecoveryActions(prev => [...prev, action]);
  }, []);

  // Remove recovery action
  const removeRecoveryAction = useCallback((label: string) => {
    setRecoveryActions(prev => prev.filter(action => action.label !== label));
  }, []);

  // Helper function to determine if toast should be shown
  const shouldShowToast = (error: AppError): boolean => {
    // Don't show toast for low severity errors
    if (error.severity === ErrorSeverity.LOW) return false;
    
    // Don't show toast for certain error types
    const silentErrorCodes = [
      ErrorCode.ANIMATION_ERROR,
      ErrorCode.COMPONENT_ERROR,
    ];
    
    return !silentErrorCodes.includes(error.code);
  };

  // Auto-clear error after successful operations
  useEffect(() => {
    if (!errorState.isLoading && !errorState.hasError && errorState.error) {
      const timer = setTimeout(clearError, 100);
      return () => clearTimeout(timer);
    }
  }, [errorState.isLoading, errorState.hasError, errorState.error, clearError]);

  return {
    // Error state
    error: errorState.error,
    isLoading: errorState.isLoading,
    hasError: errorState.hasError,
    retryCount: errorState.retryCount,
    
    // Error handling functions
    handleError,
    clearError,
    retry,
    
    // Async operation wrappers
    executeAsync,
    executeWithRetry,
    validateAndExecute,
    
    // Recovery actions
    addRecoveryAction,
    removeRecoveryAction,
  };
};

// Specialized hooks for common scenarios
export const useNetworkErrorHandling = () => {
  return useErrorHandling({
    component: 'NetworkOperation',
    enableToastNotifications: true,
    defaultRetryCount: 3,
  });
};

export const useFormErrorHandling = () => {
  return useErrorHandling({
    component: 'FormComponent',
    enableToastNotifications: true,
    defaultRetryCount: 1,
  });
};

export const useApiErrorHandling = () => {
  return useErrorHandling({
    component: 'ApiOperation',
    enableToastNotifications: true,
    defaultRetryCount: 2,
  });
};

// Error boundary hook for functional components
export const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error) => {
    setError(error);
  }, []);

  // Throw error to trigger error boundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
};
