import React from 'react';

interface ErrorFallbackProps {
  error: Error;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error }) => {
  return (
    <div>
      <h1>Something went wrong</h1>
      <p>Error: {error.message}</p>
      <button onClick={() => window.location.reload()}>Reload Page</button>
    </div>
  );
};