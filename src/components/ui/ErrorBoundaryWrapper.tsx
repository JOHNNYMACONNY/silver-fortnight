import React from 'react';
import ErrorBoundary from './ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

const FallbackComponent: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="max-w-md w-full p-6">
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({ children }) => {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;