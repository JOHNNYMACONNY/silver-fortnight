/**
 * PWA Install Prompt Component
 * 
 * Displays install prompt for TradeYa PWA with custom styling
 * and user-friendly installation flow.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, Zap } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface InstallPromptProps {
  showDelay?: number;
  className?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  showDelay = 3000,
  className = '',
  onInstall,
  onDismiss,
}) => {
  const { canInstall, isInstalling, install } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (canInstall && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, showDelay);
      return () => clearTimeout(timer);
    }
  }, [canInstall, dismissed, showDelay]);

  const handleInstall = async () => {
    try {
      await install();
      setShowPrompt(false);
      onInstall?.();
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    onDismiss?.();
  };

  const handleClose = () => {
    setShowPrompt(false);
    setDismissed(true);
    onDismiss?.();
  };

  if (!showPrompt || !canInstall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}
      >
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Install TradeYa
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get the full app experience
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Features */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Smartphone className="h-4 w-4 text-green-500" />
              <span>Access from your home screen</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Faster loading and offline access</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Monitor className="h-4 w-4 text-blue-500" />
              <span>Native app-like experience</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {isInstalling ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Install</span>
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
            >
              Not now
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
            Free to install • No app store required
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;
