import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isOffline, addConnectionListeners } from '../../utils/networkUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  FallbackComponent?: React.FC<{ error: Error }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * RouteErrorBoundary wrapper component specifically for routes
 */
export { RouteErrorBoundary };
export { ErrorBoundaryComponent as ErrorBoundary };
const RouteErrorBoundary: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  const [offline, setOffline] = useState(isOffline());

  useEffect(() => {
    // Set initial offline state
    setOffline(isOffline());

    // Add listeners for online/offline events
    const cleanup = addConnectionListeners(
      // Online callback
      () => setOffline(false),
      // Offline callback
      () => setOffline(true)
    );

    return cleanup;
  }, []);

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log error to console
    console.error('Route error:', error);
    console.error('Error details:', errorInfo);
  };

  const fallback = (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {offline ? 'No Internet Connection' : 'Something went wrong'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {offline
            ? 'Please check your internet connection and try again'
            : 'We encountered an error while loading this page'}
        </p>
        <div className="space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
        className="px-4 py-2 text-sm text-primary-foreground bg-primary rounded hover:bg-primary/80"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return <ErrorBoundaryComponent {...props} fallback={fallback} onError={handleError} />;
};

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Base ErrorBoundary component to handle errors gracefully
 *
 * Wraps components to catch and handle errors, preventing the entire app from crashing
 * and providing a fallback UI when errors occur.
 */
class ErrorBoundaryComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console with detailed information
    console.error('ErrorBoundary caught an error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack
    });

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Use FallbackComponent if provided
      if (this.props.FallbackComponent) {
        return <this.props.FallbackComponent error={this.state.error || new Error('Unknown error')} />;
      }

      // Use fallback prop or default error message
      return this.props.fallback || (
        <div className="flex items-center justify-center p-4 text-red-600 bg-red-50 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-semibold">Oops! Something went wrong.</p>
            <button
              className="mt-2 px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryComponent;