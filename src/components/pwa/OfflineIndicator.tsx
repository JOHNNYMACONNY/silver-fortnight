/**
 * Offline Indicator Component
 * 
 * Displays offline status and provides reconnection functionality
 * for TradeYa PWA when network connectivity is lost.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showWhenOnline = false,
  position = 'top',
  className = '',
}) => {
  const { isOnline, isOffline } = usePWA();
  const [showIndicator, setShowIndicator] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowIndicator(true);
    } else if (isOnline && showWhenOnline) {
      setShowIndicator(true);
      // Hide after 3 seconds when back online
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    } else if (isOnline) {
      setShowIndicator(false);
    }
  }, [isOnline, isOffline, showWhenOnline]);

  const handleReconnect = async () => {
    setReconnecting(true);
    
    // Simulate reconnection attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if we're back online
    if (navigator.onLine) {
      setShowIndicator(false);
    }
    
    setReconnecting(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!showIndicator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed ${position === 'top' ? 'top-4' : 'bottom-4'} left-1/2 transform -translate-x-1/2 z-50 ${className}`}
      >
        <div className={`
          flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
          ${isOffline 
            ? 'bg-red-500/90 text-white border border-red-400/50' 
            : 'bg-green-500/90 text-white border border-green-400/50'
          }
        `}>
          {isOffline ? (
            <>
              <WifiOff className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">You're offline</p>
                <p className="text-xs opacity-90">Some features may be limited</p>
              </div>
              <button
                onClick={handleReconnect}
                disabled={reconnecting}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors disabled:opacity-50"
              >
                {reconnecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="text-xs">Retry</span>
              </button>
            </>
          ) : (
            <>
              <Wifi className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Back online</p>
                <p className="text-xs opacity-90">Connection restored</p>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Refresh</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;