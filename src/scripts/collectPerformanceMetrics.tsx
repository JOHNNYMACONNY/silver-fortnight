/**
 * Performance Metrics Collection Script
 * 
 * This script collects performance metrics from the PerformanceMonitor components
 * and saves them to the PERFORMANCE_OPTIMIZATION_RESULTS.md file.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PerformanceMetrics } from '../utils/performanceMetrics';
import { AuthProvider } from '../AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import App from '../App';

// Store for collected metrics
const metricsStore: Record<string, Partial<PerformanceMetrics>> = {};

// Function to handle metrics collection
const handleMetricsCollected = (pageName: string, metrics: Partial<PerformanceMetrics>) => {
  console.log(`Metrics collected for ${pageName}:`, metrics);
  metricsStore[pageName] = metrics;
};

// Create a wrapper component that provides the metrics collection callback
const PerformanceMetricsCollector: React.FC = () => {
  // Expose the metrics store to the window for easy access
  (window as any).__PERFORMANCE_METRICS__ = metricsStore;
  (window as any).__COLLECT_METRICS__ = handleMetricsCollected;
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <NotificationsProvider>
              <App />
            </NotificationsProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Mount the app with the metrics collector
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PerformanceMetricsCollector />
  </React.StrictMode>
);

// Function to generate a markdown report from the collected metrics
const generateMarkdownReport = () => {
  let report = '# Performance Metrics Report\n\n';
  report += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  // Add a table for each page
  Object.entries(metricsStore).forEach(([pageName, metrics]) => {
    report += `## ${pageName}\n\n`;
    report += '| Metric | Value | Unit |\n';
    report += '|--------|-------|------|\n';
    
    if (metrics.loadTime !== undefined) {
      report += `| Load Time | ${metrics.loadTime.toFixed(2)} | ms |\n`;
    }
    
    if (metrics.timeToInteractive !== undefined) {
      report += `| Time to Interactive | ${metrics.timeToInteractive.toFixed(2)} | ms |\n`;
    }
    
    if (metrics.firstContentfulPaint !== undefined) {
      report += `| First Contentful Paint | ${metrics.firstContentfulPaint.toFixed(2)} | ms |\n`;
    }
    
    if (metrics.largestContentfulPaint !== undefined) {
      report += `| Largest Contentful Paint | ${metrics.largestContentfulPaint.toFixed(2)} | ms |\n`;
    }
    
    if (metrics.cumulativeLayoutShift !== undefined) {
      report += `| Cumulative Layout Shift | ${metrics.cumulativeLayoutShift.toFixed(4)} | - |\n`;
    }
    
    if (metrics.firstInputDelay !== undefined) {
      report += `| First Input Delay | ${metrics.firstInputDelay.toFixed(2)} | ms |\n`;
    }
    
    report += '\n';
    
    // Add component render times if available
    if (metrics.componentRenderTimes && Object.keys(metrics.componentRenderTimes).length > 0) {
      report += '### Component Render Times\n\n';
      report += '| Component | Render Time |\n';
      report += '|-----------|-------------|\n';
      
      Object.entries(metrics.componentRenderTimes).forEach(([component, time]) => {
        report += `| ${component} | ${time.toFixed(2)} ms |\n`;
      });
      
      report += '\n';
    }
  });
  
  // Add a summary section
  report += '## Summary\n\n';
  report += 'This report provides baseline performance metrics for key pages in the TradeYa application. ';
  report += 'These metrics will be used to identify performance bottlenecks and measure improvements after optimizations are implemented.\n\n';
  
  return report;
};

// Expose the report generation function to the window
(window as any).__GENERATE_METRICS_REPORT__ = generateMarkdownReport;
