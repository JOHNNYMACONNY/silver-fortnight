import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import { PerformanceProvider } from "./contexts/PerformanceContext";
import { ToastProvider } from "./contexts/ToastContext";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { initializeTheme } from "./utils/themeInitializer";
import { advancedPerformanceOrchestrator } from "./services/performance/advancedPerformanceOrchestrator";
import { initializeServices } from "./services/core/ServiceRegistry";
import { logger } from "./utils/logging/logger";
// CRITICAL: This line imports the master stylesheet and enables Tailwind CSS.
import "./index.css";

// Initialize advanced performance features
async function initializeAdvancedFeatures() {
  try {
    // Initialize theme system (synchronous)
    initializeTheme();

    // Initialize service registry (async but non-blocking)
    initializeServices().catch((error) => {
      logger.error(
        "Service registry initialization failed",
        "INITIALIZATION",
        undefined,
        error as Error
      );
    });

    // Initialize advanced performance orchestrator (async but non-blocking)
    advancedPerformanceOrchestrator.initialize().catch((error) => {
      logger.error(
        "Performance orchestrator initialization failed",
        "INITIALIZATION",
        undefined,
        error as Error
      );
    });

    logger.info("Advanced features initialization started", "INITIALIZATION");
  } catch (error) {
    logger.error(
      "Failed to start advanced features initialization",
      "INITIALIZATION",
      undefined,
      error as Error
    );
  }
}

// Start initialization (non-blocking)
initializeAdvancedFeatures();

// Ensure DOM is ready before rendering
function renderApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <PerformanceProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
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
}

// Render when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
  renderApp();
}
