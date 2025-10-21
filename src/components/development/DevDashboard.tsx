/**
 * Development Dashboard
 * 
 * Provides a comprehensive development interface for debugging and monitoring
 * Only available in development mode
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  Activity,
  Network,
  Cpu,
  MemoryStick,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { enhancedDevConsole } from '../../utils/development/enhancedDevConsole';

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

const DevDashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');
  const [metrics, setMetrics] = useState(enhancedDevConsole.getMetrics());
  const [components, setComponents] = useState(enhancedDevConsole.getComponents());
  const [networkRequests, setNetworkRequests] = useState(enhancedDevConsole.getNetworkRequests());
  const [errors, setErrors] = useState(enhancedDevConsole.getErrors());

  // Update data every 2 seconds
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setMetrics(enhancedDevConsole.getMetrics());
      setComponents(enhancedDevConsole.getComponents());
      setNetworkRequests(enhancedDevConsole.getNetworkRequests());
      setErrors(enhancedDevConsole.getErrors());
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const MetricsTab: React.FC = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Render Time</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.renderTime.toFixed(2)}ms
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Memory Usage</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Network Requests</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {metrics.networkRequests}
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium">Errors</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {metrics.errorCount}
          </div>
        </div>
      </div>
    </div>
  );

  const ComponentsTab: React.FC = () => (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {components.map((component) => (
        <div key={component.name} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{component.name}</span>
            <span className="text-sm text-gray-500">
              Renders: {component.renderCount}
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Last render: {component.lastRenderTime.toFixed(2)}ms ago
          </div>
        </div>
      ))}
      {components.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No components tracked yet
        </div>
      )}
    </div>
  );

  const NetworkTab: React.FC = () => (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {networkRequests.slice(-10).reverse().map((request) => (
        <div key={request.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{request.method}</span>
            <div className="flex items-center gap-2">
              {request.status >= 200 && request.status < 300 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">{request.status}</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {request.url}
          </div>
          <div className="text-xs text-gray-500">
            {request.duration.toFixed(2)}ms • {(request.size / 1024).toFixed(1)}KB
          </div>
        </div>
      ))}
      {networkRequests.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No network requests tracked yet
        </div>
      )}
    </div>
  );

  const ErrorsTab: React.FC = () => (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {errors.slice(-10).reverse().map((error) => (
        <div key={error.id} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-red-600">{error.severity}</span>
            <span className="text-xs text-gray-500">
              {new Date(error.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200 mb-1">
            {error.message}
          </div>
          {error.component && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Component: {error.component}
            </div>
          )}
        </div>
      ))}
      {errors.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No errors tracked yet
        </div>
      )}
    </div>
  );

  const tabs: DashboardTab[] = [
    { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" />, component: MetricsTab },
    { id: 'components', label: 'Components', icon: <Cpu className="w-4 h-4" />, component: ComponentsTab },
    { id: 'network', label: 'Network', icon: <Network className="w-4 h-4" />, component: NetworkTab },
    { id: 'errors', label: 'Errors', icon: <Bug className="w-4 h-4" />, component: ErrorsTab }
  ];

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || MetricsTab;

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-overlay bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Dev Dashboard"
        >
          <Bug className="w-6 h-6" />
        </motion.button>
      )}

      {/* Dashboard */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'top-4 right-4'} z-overlay bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl ${
              isMinimized ? 'w-64 h-12' : 'w-96 h-96'
            } transition-all duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Dev Dashboard</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="p-4 h-80 overflow-hidden">
                  <ActiveTabComponent />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DevDashboard;
