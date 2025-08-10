/**
 * Error Handling Example Component
 * Demonstrates comprehensive error handling patterns using the standardized error system
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Wifi, Database, User } from 'lucide-react';
import { useErrorHandling, useNetworkErrorHandling, useFormErrorHandling } from '../../hooks/useErrorHandling';
import { AppError, ErrorCode, ErrorSeverity, createNetworkError, createValidationError, createAuthError } from '../../types/errors';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import EnhancedErrorBoundary from '../ui/EnhancedErrorBoundary';

const ErrorHandlingExample: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Different error handling hooks for different scenarios
  const generalErrorHandler = useErrorHandling({ component: 'ErrorHandlingExample' });
  const networkErrorHandler = useNetworkErrorHandling();
  const formErrorHandler = useFormErrorHandling();

  // Simulate different types of errors
  const simulateNetworkError = async () => {
    await networkErrorHandler.executeAsync(async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw createNetworkError('Failed to connect to server', {
        component: 'ErrorHandlingExample',
        action: 'simulate_network_error',
      });
    });
  };

  const simulateValidationError = async () => {
    await formErrorHandler.validateAndExecute(
      () => {
        if (!formData.email) return 'Email is required';
        if (!formData.email.includes('@')) return 'Please enter a valid email address';
        if (!formData.password) return 'Password is required';
        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        return true;
      },
      async () => {
        // This would normally be a form submission
        console.log('Form would be submitted:', formData);
      }
    );
  };

  const simulateAuthError = async () => {
    await generalErrorHandler.executeAsync(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      throw createAuthError('Your session has expired', {
        component: 'ErrorHandlingExample',
        action: 'simulate_auth_error',
      });
    });
  };

  const simulateRetryableError = async () => {
    await generalErrorHandler.executeWithRetry(async () => {
      // Simulate random failure
      if (Math.random() < 0.7) {
        throw new AppError(
          'Temporary service unavailable',
          ErrorCode.SERVICE_UNAVAILABLE,
          ErrorSeverity.MEDIUM,
          { component: 'ErrorHandlingExample', action: 'simulate_retryable_error' },
          'Service is temporarily unavailable. We\'ll retry automatically.',
          [],
          true
        );
      }
      console.log('Operation succeeded after retries!');
    }, 3);
  };

  const simulateCriticalError = async () => {
    await generalErrorHandler.executeAsync(async () => {
      throw new AppError(
        'Database connection lost',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.CRITICAL,
        { component: 'ErrorHandlingExample', action: 'simulate_critical_error' },
        'Critical system error occurred. Please contact support.',
        [
          {
            label: 'Contact Support',
            action: () => window.open('/support', '_blank'),
            primary: true,
          },
          {
            label: 'Reload Page',
            action: () => window.location.reload(),
          },
        ]
      );
    });
  };

  const simulateComponentError = () => {
    // This will trigger the error boundary
    throw new Error('Simulated component crash for error boundary testing');
  };

  const getErrorStateDisplay = () => {
    const errors = [
      generalErrorHandler.error,
      networkErrorHandler.error,
      formErrorHandler.error,
    ].filter(Boolean);

    if (errors.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Errors ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {errors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {error!.code}
                    </Badge>
                    <Badge 
                      variant={error!.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {error!.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{error!.userMessage}</p>
                </div>
                <div className="flex gap-2">
                  {error!.isRetryable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (error === networkErrorHandler.error) networkErrorHandler.retry();
                        if (error === formErrorHandler.error) formErrorHandler.retry();
                        if (error === generalErrorHandler.error) generalErrorHandler.retry();
                      }}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (error === networkErrorHandler.error) networkErrorHandler.clearError();
                      if (error === formErrorHandler.error) formErrorHandler.clearError();
                      if (error === generalErrorHandler.error) generalErrorHandler.clearError();
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling System Demo</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstrates comprehensive error handling patterns with user-friendly recovery options.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {getErrorStateDisplay()}

          {/* Form Example */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Form Validation Example</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <Button
              onClick={simulateValidationError}
              disabled={formErrorHandler.isLoading}
              className="w-full"
            >
              {formErrorHandler.isLoading ? 'Validating...' : 'Submit Form (Test Validation)'}
            </Button>
          </div>

          {/* Error Simulation Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Error Simulation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={simulateNetworkError}
                disabled={networkErrorHandler.isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                {networkErrorHandler.isLoading ? 'Loading...' : 'Network Error'}
              </Button>

              <Button
                onClick={simulateAuthError}
                disabled={generalErrorHandler.isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {generalErrorHandler.isLoading ? 'Loading...' : 'Auth Error'}
              </Button>

              <Button
                onClick={simulateRetryableError}
                disabled={generalErrorHandler.isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {generalErrorHandler.isLoading ? 'Retrying...' : 'Retryable Error'}
              </Button>

              <Button
                onClick={simulateCriticalError}
                disabled={generalErrorHandler.isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                {generalErrorHandler.isLoading ? 'Loading...' : 'Critical Error'}
              </Button>

              <Button
                onClick={simulateComponentError}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Component Crash
              </Button>
            </div>
          </div>

          {/* Loading States */}
          {(generalErrorHandler.isLoading || networkErrorHandler.isLoading || formErrorHandler.isLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mr-3"></div>
              <span className="text-blue-700 dark:text-blue-300">Processing...</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Wrap the component in an error boundary for demonstration
const ErrorHandlingExampleWithBoundary: React.FC = () => {
  return (
    <EnhancedErrorBoundary>
      <ErrorHandlingExample />
    </EnhancedErrorBoundary>
  );
};

export default ErrorHandlingExampleWithBoundary;
