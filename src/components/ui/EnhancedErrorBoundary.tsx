/**
 * Enhanced Error Boundary Component
 * Provides comprehensive error handling with user-friendly recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Wifi, WifiOff } from 'lucide-react';
import { AppError, ErrorCode, ErrorSeverity, ErrorBoundaryProps, ErrorBoundaryState } from '../../types/errors';
import { errorService } from '../../services/errorService';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Badge } from './Badge';
import { cn } from '../../utils/cn';
import { logger } from '@utils/logging/logger';

interface ErrorDisplayProps {
  error: AppError;
  onRetry: () => void;
  onReport?: () => void;
  className?: string;
  isOffline?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  onReport,
  className,
  isOffline = false
}) => {
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case ErrorSeverity.MEDIUM: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case ErrorSeverity.HIGH: return 'bg-primary/20 text-primary border-primary/30';
      case ErrorSeverity.CRITICAL: return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getIcon = () => {
    if (isOffline) {
      return <WifiOff className="w-8 h-8 text-primary" />;
    }
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertTriangle className="w-8 h-8 text-red-400" />;
      default:
        return <Bug className="w-8 h-8 text-primary" />;
    }
  };

  const getTitle = () => {
    if (isOffline) return 'No Internet Connection';
    if (error.severity === ErrorSeverity.CRITICAL) return 'Critical Error';
    return 'Something went wrong';
  };

  const getUserMessage = () => {
    if (isOffline) return 'Please check your internet connection and try again.';
    return error.userMessage;
  };

  const copyErrorDetails = () => {
    const errorDetails = {
      message: error.message,
      code: error.code,
      timestamp: new Date(error.timestamp).toISOString(),
      context: error.context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("w-full max-w-2xl mx-auto", className)}
    >
      <Card className="glassmorphic">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-white text-xl">
            {getTitle()}
          </CardTitle>
          {!isOffline && (
            <div className="flex justify-center mt-2">
              <Badge className={getSeverityColor(error.severity)}>
                {error.severity.toUpperCase()}
              </Badge>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-300 text-lg mb-2">
              {getUserMessage()}
            </p>
            
            {!isOffline && process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-black/20 rounded-lg text-xs font-mono text-gray-400">
                  <div><strong>Code:</strong> {error.code}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                  <div><strong>Component:</strong> {error.context.component || 'Unknown'}</div>
                  <div><strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString()}</div>
                  {error.context.additionalData && (
                    <div><strong>Additional:</strong> {JSON.stringify(error.context.additionalData)}</div>
                  )}
                </div>
              </details>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Network-specific actions */}
            {isOffline ? (
              <>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <Wifi className="w-4 h-4" />
                  Check Connection
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </>
            ) : (
              <>
                {/* Primary recovery actions */}
                {error.recoveryActions.length > 0 ? (
                  error.recoveryActions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.action}
                      variant={action.primary ? 'default' : 'outline'}
                      className="flex items-center gap-2"
                    >
                      {action.primary && <RefreshCw className="w-4 h-4" />}
                      {action.label}
                    </Button>
                  ))
                ) : (
                  <>
                    {error.isRetryable && (
                      <Button
                        onClick={onRetry}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                      </Button>
                    )}
                    <Button
                      onClick={() => window.location.href = '/'}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      Go Home
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Additional actions */}
          {!isOffline && (
            <div className="flex justify-center gap-2 pt-2 border-t border-border">
              <Button
                onClick={copyErrorDetails}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-300"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Details
              </Button>
              {onReport && (
                <Button
                  onClick={onReport}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-300"
                >
                  <Bug className="w-3 h-3 mr-1" />
                  Report Issue
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;
  private isOffline = !navigator.onLine;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    
    // Listen for network changes
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOffline = false;
    // Auto-retry if error was network-related
    if (this.state.hasError && this.state.error?.code === ErrorCode.NETWORK_ERROR) {
      this.handleRetry();
    }
  };

  private handleOffline = () => {
    this.isOffline = true;
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = AppError.fromError(error);
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error: appError,
      errorId 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = this.state.error || AppError.fromError(error);
    
    // Enhanced error logging
    console.group(`🚨 Error Boundary: ${appError.code}`);
    logger.error('Error:', 'COMPONENT', {}, error as Error);
    logger.error('Error Info:', 'COMPONENT', {}, errorInfo as Error);
    logger.error('App Error:', 'COMPONENT', {}, appError.toJSON() as Error);
    console.groupEnd();
    
    // Report through error service
    errorService.handleError(appError, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      }
    });
    
    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorId: undefined });
    } else {
      // Max retries reached, redirect to home
      window.location.href = '/';
    }
  };

  private handleReport = () => {
    // Open support page or feedback form
    window.open('/support', '_blank');
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        return (
          <this.props.fallback 
            error={this.state.error} 
            retry={this.handleRetry}
          />
        );
      }

      // Default error display
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <AnimatePresence mode="wait">
            <ErrorDisplay
              key={this.state.errorId}
              error={this.state.error}
              onRetry={this.handleRetry}
              onReport={this.handleReport}
              isOffline={this.isOffline}
            />
          </AnimatePresence>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;
