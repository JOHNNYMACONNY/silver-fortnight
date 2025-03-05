import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { EnhancedHeader } from './components/EnhancedHeader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Discover } from './pages/Discover';
import { Profile } from './pages/Profile';
import { CreateTrade } from './pages/CreateTrade';
import { TradeDetails } from './pages/TradeDetails';
import { EditTrade } from './pages/EditTrade';
import { EditProject } from './pages/EditProject';
import { Messages } from './pages/Messages';
import { Conversation } from './pages/Conversation';
import { Projects } from './pages/Projects';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';
import { UserDirectory } from './pages/UserDirectory';
import { Challenges } from './pages/Challenges';
import { Connections } from './pages/Connections';
import { PublicProfile } from './pages/PublicProfile';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Error classifications for common error scenarios
type ErrorType = 'network' | 'auth' | 'rate-limit' | 'unknown';

interface ErrorClassification {
  type: ErrorType;
  title: string;
  description: string;
  action: string;
  recoverable: boolean;
}

function classifyError(error: Error): ErrorClassification {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('network') || 
      message.includes('fetch') || 
      message.includes('offline')) {
    return {
      type: 'network',
      title: 'Connection Error',
      description: 'Unable to connect to our servers. Please check your internet connection.',
      action: 'Retry',
      recoverable: true
    };
  }

  // Authentication errors
  if (message.includes('auth/') || 
      message.includes('unauthorized') || 
      message.includes('permission-denied') ||
      message.includes('unauthenticated')) {
    return {
      type: 'auth',
      title: 'Authentication Error',
      description: 'Your session may have expired. Please sign in again.',
      action: 'Sign In',
      recoverable: true
    };
  }

  // Rate limiting errors
  if (message.includes('too-many-requests') || 
      message.includes('rate-limit') ||
      message.includes('try again later')) {
    return {
      type: 'rate-limit',
      title: 'Too Many Attempts',
      description: 'Please wait a few minutes before trying again.',
      action: 'Got It',
      recoverable: false
    };
  }

  // Default unknown error
  return {
    type: 'unknown',
    title: 'Unexpected Error',
    description: 'Something went wrong. Our team has been notified.',
    action: 'Retry',
    recoverable: true
  };
}

function ErrorFallback({ error, resetErrorBoundary }) {
  const errorInfo = classifyError(error);
  
  const handleAction = () => {
    // Clear any error-related state
    localStorage.removeItem('errorState');
    sessionStorage.clear();
    
    switch (errorInfo.type) {
      case 'auth':
        // Redirect to login for auth errors
        window.location.href = '/login';
        break;
      case 'network':
        // For network errors, try to reconnect
        window.location.reload();
        break;
      case 'rate-limit':
        // For rate limiting, just close the error
        resetErrorBoundary();
        break;
      default:
        // For unknown errors, try resetting the error boundary
        resetErrorBoundary();
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 bg-cyber-gray-900 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold text-red-500 mb-4">{errorInfo.title}</h2>
        <p className="text-cyber-gray-300 mb-4">{errorInfo.description}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-sm bg-cyber-gray-800 p-4 rounded mb-4 overflow-auto max-h-40">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}
        <div className="space-y-3">
          <button
            onClick={handleAction}
            className={`w-full px-4 py-2 rounded-lg transition-colors ${
              errorInfo.recoverable
                ? 'bg-neon-blue hover:bg-neon-purple text-white'
                : 'bg-gray-600 text-gray-200'
            }`}
            disabled={!errorInfo.recoverable}
          >
            {errorInfo.action}
          </button>
          {!errorInfo.recoverable && (
            <p className="text-sm text-cyber-gray-400 text-center">
              This error cannot be automatically resolved.
              Please try again later or contact support.
            </p>
          )}
          {errorInfo.type === 'network' && (
            <div className="text-sm text-cyber-gray-400 mt-4">
              <p>Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Check your internet connection</li>
                <li>Try disabling VPN or proxy if in use</li>
                <li>Clear your browser cache</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="bg-neo-earth font-body">
        {/* Dynamic background */}
        <div className="fixed inset-0 bg-mesh opacity-30"></div>
        <div className="fixed inset-0 bg-noise opacity-50"></div>

        <EnhancedHeader />

        {/* Main content */}
        <main className="relative z-10">
          <div className="relative">
            <Routes>
              {/* Add catch-all 404 route last */}
              <Route path="/" element={<Discover />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/users/:id" element={<PublicProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trades/new"
                element={
                  <ProtectedRoute>
                    <CreateTrade />
                  </ProtectedRoute>
                }
              />
              <Route path="/trades/:id" element={<TradeDetails />} />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:id"
                element={
                  <ProtectedRoute>
                    <Conversation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/new"
                element={
                  <ProtectedRoute>
                    <CreateProject />
                  </ProtectedRoute>
                }
              />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route
                path="/trades/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditTrade />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditProject />
                  </ProtectedRoute>
                }
              />
              <Route path="/directory" element={<UserDirectory />} />
              <Route
                path="/connections"
                element={
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/challenges"
                element={
                  <ProtectedRoute>
                    <Challenges />
                  </ProtectedRoute>
                }
              />
              {/* 404 route */}
              <Route 
                path="*" 
                element={
                  <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                    <h1 className="text-4xl font-bold text-neon-blue mb-4">404: Page Not Found</h1>
                    <p className="text-lg text-text-secondary mb-6">The page you're looking for doesn't exist.</p>
                    <Link to="/" className="btn-primary">
                      Return Home
                    </Link>
                  </div>
                } 
              />
            </Routes>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Root component of the application.
 * @component
 * @returns The main application component
 */
export default App;
