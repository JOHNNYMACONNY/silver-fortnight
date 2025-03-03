import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { AdminProvider } from './contexts/AdminContext'
import { ToastProvider } from './contexts/ToastContext'
import { initializeCollections } from './lib/firebase'

// Setup error tracking
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Show user-friendly error message for unhandled errors
  showFatalError('An unexpected error occurred. Please refresh the page.');
});

// Validate environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
] as const;

const missingVars = requiredEnvVars.filter(key => !import.meta.env[key]);

if (missingVars.length > 0) {
  const error = `Missing required environment variables: ${missingVars.join(', ')}`;
  console.error(error);
  showFatalError('Application configuration error. Please contact support.');
  throw new Error(error);
}

// Function to show fatal errors
function showFatalError(message: string) {
  const errorHtml = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      color: #fff;
      font-family: system-ui;
    ">
      <div style="
        max-width: 500px;
        padding: 2rem;
        text-align: center;
        background: #2a2a2a;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">
        <h1 style="color: #f43f5e; margin-bottom: 1rem;">Application Error</h1>
        <p style="color: #d1d5db; margin-bottom: 1.5rem;">${message}</p>
        <button onclick="window.location.reload()" style="
          background: #3b82f6;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">
          Refresh Page
        </button>
      </div>
    </div>
  `;
  document.body.innerHTML = errorHtml;
}

async function initializeApp() {
  try {
    const container = document.getElementById('root');
    if (!container) throw new Error('Failed to find the root element');
    const root = createRoot(container);

    // Initialize Firebase collections before rendering
    await initializeCollections();

    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <AdminProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AdminProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Application initialization failed:', error);
    showFatalError('Failed to start application. Please refresh the page.');
  }
}

initializeApp();
