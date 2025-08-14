import React, { useState, useEffect } from 'react';
import { ErrorRecoverySystem } from '../components/errors/ErrorRecoverySystem';
import { 
  LoadingFallback, 
  NetworkErrorFallback, 
  DataErrorFallback,
  FeatureUnavailableFallback,
  FallbackProvider,
  withFallback
} from '../components/fallbacks/FallbackUISystem';
import { networkResilience, useNetworkStatus } from '../services/networkResilience';
import { gracefulDegradation, useServiceStatus } from '../services/gracefulDegradation';
import { AppError, ErrorCode, ErrorSeverity } from '../types/errors';
import { errorService } from '../services/errorService';

// Example component that demonstrates error recovery integration
const ErrorRecoveryDemo: React.FC = () => {
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [demoStep, setDemoStep] = useState<'normal' | 'network-error' | 'service-error' | 'recovery'>('normal');
  const networkStatus = useNetworkStatus();
  const serviceStatus = useServiceStatus();

  useEffect(() => {
    // Register demo services
    gracefulDegradation.registerService('user-service', '/api/health/users', {
      serviceName: 'user-service',
      fallbackData: { users: [], message: 'Using cached user data' },
      cacheKey: 'users-fallback',
      cacheDuration: 300000 // 5 minutes
    });

    gracefulDegradation.registerService('trade-service', '/api/health/trades', {
      serviceName: 'trade-service',
      fallbackFunction: () => ({ trades: [], message: 'Trade service temporarily unavailable' }),
      cacheKey: 'trades-fallback'
    });

    gracefulDegradation.registerService('notification-service', '/api/health/notifications', {
      serviceName: 'notification-service',
      fallbackData: { notifications: [], enabled: false }
    });
  }, []);

  const simulateNetworkError = () => {
    const error = new AppError(
      'Failed to fetch data from server',
      ErrorCode.NETWORK_ERROR,
      ErrorSeverity.MEDIUM,
      { component: 'ErrorRecoveryDemo', action: 'simulateNetworkError' },
      'Unable to connect to the server. Please check your internet connection.',
      [
        {
          label: 'Retry Connection',
          action: () => setDemoStep('recovery'),
          primary: true
        },
        {
          label: 'Work Offline',
          action: () => setDemoStep('normal')
        }
      ],
      true
    );

    setCurrentError(error);
    setDemoStep('network-error');
  };

  const simulateServiceError = () => {
    const error = new AppError(
      'User service is temporarily unavailable',
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorSeverity.HIGH,
      { component: 'ErrorRecoveryDemo', action: 'user-service' },
      'The user service is currently experiencing issues. Some features may be limited.',
      [
        {
          label: 'Try Again',
          action: () => setDemoStep('recovery'),
          primary: true
        },
        {
          label: 'Use Cached Data',
          action: () => setDemoStep('normal')
        }
      ],
      true
    );

    setCurrentError(error);
    setDemoStep('service-error');
  };

  const simulateAuthError = () => {
    const error = new AppError(
      'Authentication token has expired',
      ErrorCode.UNAUTHORIZED,
      ErrorSeverity.MEDIUM,
      { component: 'ErrorRecoveryDemo', action: 'checkAuth' },
      'Your session has expired. Please sign in again.',
      [
        {
          label: 'Sign In',
          action: () => { window.location.href = '/login'; },
          primary: true
        },
        {
          label: 'Continue as Guest',
          action: () => setDemoStep('normal')
        }
      ],
      false
    );

    setCurrentError(error);
    setDemoStep('network-error');
  };

  const handleRecovery = () => {
    setCurrentError(null);
    setDemoStep('normal');
  };

  const handleRetry = () => {
    console.log('Retrying operation...');
    // Simulate successful retry after a delay
    setTimeout(() => {
      setCurrentError(null);
      setDemoStep('recovery');
    }, 1000);
  };

  const handleReport = () => {
    if (currentError) {
      errorService.handleError(currentError);
      alert('Error reported successfully!');
    }
  };

  // Example of resilient data fetching
  const fetchUserData = async () => {
    try {
      const response = await networkResilience.resilientFetch('/api/users', {}, 'high');
      return await response.json();
    } catch (error) {
      return gracefulDegradation.executeWithFallback(
        'user-service',
        async () => {
          throw error; // This will trigger the fallback
        },
        () => ({ users: [], message: 'Using offline data' })
      );
    }
  };

  // Example of service-aware component
  const UserListComponent = withFallback(() => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchUserData()
        .then(data => {
          setUsers(data.users || []);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load users:', error);
          setLoading(false);
        });
    }, []);

    if (loading) {
      return <LoadingFallback message="Loading users..." />;
    }

    if (!gracefulDegradation.isServiceAvailable('user-service')) {
      return (
        <FeatureUnavailableFallback
          featureName="User Directory"
          reason="temporarily unavailable"
          estimatedReturn="in a few minutes"
          alternativeAction={{
            label: 'View Cached Users',
            action: () => console.log('Showing cached users')
          }}
        />
      );
    }

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Users</h3>
        {users.length === 0 ? (
          <DataErrorFallback
            message="No users found"
            onRetry={() => window.location.reload()}
            showCachedData={true}
          />
        ) : (
          <ul className="space-y-1">
            {users.map((user: any, index: number) => (
              <li key={index} className="p-2 bg-gray-100 rounded">
                {user.name || `User ${index + 1}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }, LoadingFallback);

  if (currentError && (demoStep === 'network-error' || demoStep === 'service-error')) {
    return (
      <ErrorRecoverySystem
        error={currentError}
        onRetry={handleRetry}
        onRecover={handleRecovery}
        onReport={handleReport}
        showDiagnostics={true}
        allowOfflineMode={true}
      />
    );
  }

  return (
    <FallbackProvider>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Error Recovery System Demo</h1>
          
          {/* Network Status */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Network Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 ${networkStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {networkStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div>
                <span className="font-medium">Requests:</span>
                <span className="ml-2">{networkStatus.metrics.totalRequests}</span>
              </div>
              <div>
                <span className="font-medium">Success Rate:</span>
                <span className="ml-2">
                  {networkStatus.metrics.totalRequests > 0 
                    ? Math.round((networkStatus.metrics.successfulRequests / networkStatus.metrics.totalRequests) * 100)
                    : 0}%
                </span>
              </div>
              <div>
                <span className="font-medium">Queue:</span>
                <span className="ml-2">{networkStatus.queueStatus.count}</span>
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Service Health</h2>
            <div className="text-sm">
              <div className="mb-2">
                <span className="font-medium">Overall Health:</span>
                <span className={`ml-2 capitalize ${
                  serviceStatus.systemHealth.overallHealth === 'healthy' ? 'text-green-600' :
                  serviceStatus.systemHealth.overallHealth === 'degraded' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {serviceStatus.systemHealth.overallHealth}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>Available: {serviceStatus.systemHealth.availableServices}</div>
                <div>Degraded: {serviceStatus.systemHealth.degradedServices}</div>
                <div>Unavailable: {serviceStatus.systemHealth.unavailableServices}</div>
              </div>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Error Simulation</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={simulateNetworkError}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Simulate Network Error
              </button>
              <button
                onClick={simulateServiceError}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Simulate Service Error
              </button>
              <button
                onClick={simulateAuthError}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Simulate Auth Error
              </button>
              <button
                onClick={() => networkStatus.testConnectivity()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test Connectivity
              </button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Resilient Components</h2>
              
              {demoStep === 'recovery' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    ✅ Recovery Successful!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    All systems are now operational.
                  </p>
                  <button
                    onClick={() => setDemoStep('normal')}
                    className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Continue
                  </button>
                </div>
              )}

              <UserListComponent />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Fallback Examples</h2>
              
              {!networkStatus.isOnline && (
                <NetworkErrorFallback
                  isOffline={true}
                  onRetry={() => window.location.reload()}
                />
              )}

              {!gracefulDegradation.isServiceAvailable('notification-service') && (
                <FeatureUnavailableFallback
                  featureName="Notifications"
                  reason="under maintenance"
                  estimatedReturn="30 minutes"
                  alternativeAction={{
                    label: 'Check Email',
                    action: () => window.open('mailto:', '_blank')
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </FallbackProvider>
  );
};

export default ErrorRecoveryDemo;
