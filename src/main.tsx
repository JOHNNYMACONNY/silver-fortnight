import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './AuthContext';
import { PerformanceProvider } from './contexts/PerformanceContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { initializeTheme } from './utils/themeInitializer';
import { advancedPerformanceOrchestrator } from './services/performance/advancedPerformanceOrchestrator';
import { initializeServices } from './services/core/ServiceRegistry';
import { logger } from './utils/logging/logger';
// CRITICAL: This line imports the master stylesheet and enables Tailwind CSS.
import './index.css';

// Initialize advanced performance features
async function initializeAdvancedFeatures() {
  try {
    // Initialize theme system
    initializeTheme();

    // Initialize service registry
    await initializeServices();

    // Initialize advanced performance orchestrator
    await advancedPerformanceOrchestrator.initialize();

    logger.info('Advanced features initialized successfully', 'INITIALIZATION');
  } catch (error) {
    logger.error('Failed to initialize advanced features', 'INITIALIZATION', undefined, error as Error);
  }
}

// Start initialization
initializeAdvancedFeatures();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <PerformanceProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </PerformanceProvider>
    </ErrorBoundary>
  </React.StrictMode>
);