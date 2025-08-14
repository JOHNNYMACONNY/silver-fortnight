import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Home,
  ArrowLeft,
  Bug,
  MessageCircle
} from 'lucide-react';
import { AppError, ErrorSeverity } from '../../types/errors';
import { errorService } from '../../services/errorService';

interface ErrorRecoverySystemProps {
  error: AppError;
  onRetry?: () => void;
  onRecover?: () => void;
  onReport?: () => void;
  showDiagnostics?: boolean;
  allowOfflineMode?: boolean;
}

interface RecoveryStep {
  id: string;
  label: string;
  description: string;
  action: () => Promise<boolean>;
  icon: React.ReactNode;
  isAutomatic?: boolean;
}

export const ErrorRecoverySystem: React.FC<ErrorRecoverySystemProps> = ({
  error,
  onRetry,
  onRecover,
  onReport,
  showDiagnostics = false,
  allowOfflineMode = true
}) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySteps, setRecoverySteps] = useState<RecoveryStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [failedSteps, setFailedSteps] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    generateRecoverySteps();
    if (showDiagnostics) {
      runDiagnostics();
    }
  }, [error, isOnline]);

  const generateRecoverySteps = useCallback(() => {
    const steps: RecoveryStep[] = [];

    // Network-related recovery steps
    if (!isOnline) {
      steps.push({
        id: 'check-connection',
        label: 'Check Internet Connection',
        description: 'Verify your internet connection is working',
        action: async () => {
          try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
            return true;
          } catch {
            return false;
          }
        },
        icon: <Wifi className="w-4 h-4" />
      });
    }

    // Cache clearing for various error types
    if (error.code.includes('CACHE') || error.code.includes('STORAGE')) {
      steps.push({
        id: 'clear-cache',
        label: 'Clear Application Cache',
        description: 'Remove cached data that might be corrupted',
        action: async () => {
          try {
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            localStorage.clear();
            sessionStorage.clear();
            return true;
          } catch {
            return false;
          }
        },
        icon: <RefreshCw className="w-4 h-4" />
      });
    }

    // Service worker refresh
    if (error.code.includes('SERVICE') || error.code.includes('WORKER')) {
      steps.push({
        id: 'refresh-service-worker',
        label: 'Refresh Service Worker',
        description: 'Update the background service worker',
        action: async () => {
          try {
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              await Promise.all(registrations.map(reg => reg.unregister()));
              await navigator.serviceWorker.register('/sw.js');
            }
            return true;
          } catch {
            return false;
          }
        },
        icon: <RefreshCw className="w-4 h-4" />
      });
    }

    // Authentication refresh
    if (error.code.includes('AUTH') || error.code.includes('UNAUTHORIZED')) {
      steps.push({
        id: 'refresh-auth',
        label: 'Refresh Authentication',
        description: 'Renew your authentication token',
        action: async () => {
          try {
            // This would integrate with your auth system
            const token = localStorage.getItem('authToken');
            if (token) {
              // Attempt to refresh token
              return true;
            }
            return false;
          } catch {
            return false;
          }
        },
        icon: <CheckCircle className="w-4 h-4" />
      });
    }

    // Generic retry step
    if (error.isRetryable) {
      steps.push({
        id: 'retry-operation',
        label: 'Retry Operation',
        description: 'Attempt the failed operation again',
        action: async () => {
          if (onRetry) {
            onRetry();
            return true;
          }
          return false;
        },
        icon: <RefreshCw className="w-4 h-4" />
      });
    }

    setRecoverySteps(steps);
  }, [error, isOnline, onRetry]);

  const runDiagnostics = useCallback(async () => {
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      serviceWorker: 'serviceWorker' in navigator,
      webGL: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
          return false;
        }
      })(),
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)
      } : null
    };

    setDiagnostics(diagnosticResults);
  }, []);

  const executeRecoveryStep = async (step: RecoveryStep) => {
    setIsRecovering(true);
    
    try {
      const success = await step.action();
      
      if (success) {
        setCompletedSteps(prev => new Set([...prev, step.id]));
        setFailedSteps(prev => {
          const newSet = new Set(prev);
          newSet.delete(step.id);
          return newSet;
        });
      } else {
        setFailedSteps(prev => new Set([...prev, step.id]));
      }
    } catch (error) {
      setFailedSteps(prev => new Set([...prev, step.id]));
      console.error(`Recovery step ${step.id} failed:`, error);
    } finally {
      setIsRecovering(false);
    }
  };

  const executeAllSteps = async () => {
    setIsRecovering(true);
    
    for (const step of recoverySteps) {
      await executeRecoveryStep(step);
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRecovering(false);
    
    // If all steps completed successfully, trigger recovery
    if (completedSteps.size === recoverySteps.length && onRecover) {
      onRecover();
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'text-yellow-600 bg-yellow-50 border-warning';
      case ErrorSeverity.MEDIUM:
        return 'text-primary bg-primary/10 border-primary/30';
      case ErrorSeverity.HIGH:
        return 'text-red-600 bg-red-50 border-error';
      case ErrorSeverity.CRITICAL:
        return 'text-red-800 bg-red-100 border-error';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
      case ErrorSeverity.MEDIUM:
        return <AlertTriangle className="w-5 h-5" />;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return <XCircle className="w-5 h-5" />;
      default:
        return <Bug className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className={`p-6 border-b border-gray-200 dark:border-gray-700 ${getSeverityColor(error.severity)}`}>
            <div className="flex items-center gap-3">
              {getSeverityIcon(error.severity)}
              <div>
                <h1 className="text-xl font-semibold">Error Recovery System</h1>
                <p className="text-sm opacity-80">
                  {error.userMessage || error.message}
                </p>
              </div>
            </div>
          </div>

          {/* Network Status */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Recovery Steps */}
          {recoverySteps.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Recovery Steps
              </h2>
              
              <div className="space-y-3 mb-6">
                {recoverySteps.map((step) => (
                  <motion.div
                    key={step.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        completedSteps.has(step.id) ? 'bg-green-100 text-green-600' :
                        failedSteps.has(step.id) ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {completedSteps.has(step.id) ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : failedSteps.has(step.id) ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {step.label}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => executeRecoveryStep(step)}
                      disabled={isRecovering || completedSteps.has(step.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completedSteps.has(step.id) ? 'Done' : 
                       failedSteps.has(step.id) ? 'Retry' : 'Run'}
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={executeAllSteps}
                  disabled={isRecovering}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className={`w-4 h-4 ${isRecovering ? 'animate-spin' : ''}`} />
                  {isRecovering ? 'Recovering...' : 'Run All Steps'}
                </motion.button>
              </div>
            </div>
          )}

          {/* Diagnostics */}
          {showDiagnostics && diagnostics && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                System Diagnostics
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                  {JSON.stringify(diagnostics, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              
              {onReport && (
                <button
                  onClick={onReport}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <Bug className="w-4 h-4" />
                  Report Issue
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/support'}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4" />
                Get Help
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
