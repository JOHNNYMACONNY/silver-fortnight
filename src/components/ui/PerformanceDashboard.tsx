/**
 * Real-time Performance Dashboard
 * Safe to develop during migration - monitors UI performance only
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  interactionToNextPaint: number;
  cumulativeLayoutShift: number;
  largestContentfulPaint: number;
  migrationCompatibilityMode: boolean;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
      collectPerformanceMetrics();
    }
  }, []);

  const collectPerformanceMetrics = () => {
    // Collect Core Web Vitals
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      setMetrics({
        pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        interactionToNextPaint: 0, // Would be collected via PerformanceObserver
        cumulativeLayoutShift: 0, // Would be collected via PerformanceObserver
        largestContentfulPaint: 0, // Would be collected via PerformanceObserver
        migrationCompatibilityMode: true // Check migration registry status
      });
    }
  };

  if (!isVisible || !metrics) return null;

  const getPerformanceScore = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'excellent';
    if (value <= thresholds[1]) return 'good';
    return 'needs-improvement';
  };

  const formatTime = (ms: number) => `${Math.round(ms)}ms`;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card variant="glass" className="backdrop-blur-md">
        <CardHeader>
          <h3 className="text-sm font-semibold text-foreground">
            Performance Monitor
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Page Load:</span>
              <span className={
                getPerformanceScore(metrics.pageLoadTime, [1000, 2500]) === 'excellent' 
                  ? 'text-green-600' 
                  : getPerformanceScore(metrics.pageLoadTime, [1000, 2500]) === 'good'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }>
                {formatTime(metrics.pageLoadTime)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Render Time:</span>
              <span className={
                getPerformanceScore(metrics.renderTime, [100, 300]) === 'excellent' 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }>
                {formatTime(metrics.renderTime)}
              </span>
            </div>

            {metrics.migrationCompatibilityMode && (
              <div className="flex items-center space-x-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Migration Mode</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Hide
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
