import { onCLS, onFCP, onLCP, onINP, onTTFB, type Metric } from 'web-vitals';
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/config/firebase';

interface WebVitalsMetric extends Metric {
  page?: string;
  deviceType?: string;
  connectionType?: string;
}

/**
 * Report Web Vitals metrics to Firebase Analytics
 * 
 * Captures:
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - INP (Interaction to Next Paint)
 * - TTFB (Time to First Byte)
 * 
 * Each metric includes:
 * - value: The metric value (rounded)
 * - metric_id: Unique identifier for this metric instance
 * - metric_delta: Change from previous value
 * - page: Current page pathname
 * - device_type: 'mobile' or 'desktop'
 * - connection_type: Network connection type (4g, 3g, wifi, etc.)
 */
const reportWebVitals = (metric: WebVitalsMetric) => {
  // Add context to the metric
  metric.page = window.location.pathname;
  metric.deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) 
    ? 'mobile' 
    : 'desktop';
  
  // Get connection type if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  metric.connectionType = connection?.effectiveType || 'unknown';

  // Log to Firebase Analytics
  if (analytics) {
    try {
      logEvent(analytics, `web_vitals_${metric.name.toLowerCase()}`, {
        // Round value for cleaner data
        // CLS is already a small number (0-1), so multiply by 1000 for better precision
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_delta: Math.round(metric.delta),
        page: metric.page,
        device_type: metric.deviceType,
        connection_type: metric.connectionType,
        // Add rating (good, needs-improvement, poor)
        rating: metric.rating,
      });
    } catch (error) {
      // Silently fail - don't break the app if analytics fails
      console.warn('[Web Vitals] Failed to log metric:', error);
    }
  }

  // Log to console in development for debugging
  if (import.meta.env.DEV) {
    console.log(
      `[Web Vitals] ${metric.name}:`,
      metric.value,
      metric.rating,
      metric
    );
  }
};

/**
 * Initialize Web Vitals reporting
 * 
 * Call this once when the app loads to start capturing metrics.
 * Only runs in production to avoid polluting analytics with dev data.
 */
export const initWebVitals = () => {
  // Only run in production
  if (import.meta.env.PROD) {
    try {
      onCLS(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onINP(reportWebVitals);
      onTTFB(reportWebVitals);
      
      console.log('[Web Vitals] Reporting initialized');
    } catch (error) {
      console.warn('[Web Vitals] Failed to initialize:', error);
    }
  } else {
    // In development, still capture metrics but only log to console
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onINP(reportWebVitals);
    onTTFB(reportWebVitals);
    
    console.log('[Web Vitals] Development mode - logging to console only');
  }
};

