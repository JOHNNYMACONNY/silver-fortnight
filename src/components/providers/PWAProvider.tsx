/**
 * PWA Provider Component
 * 
 * Provides PWA functionality throughout the TradeYa application
 * including service worker management, offline support, and performance optimization.
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';
import OfflineIndicator from '../pwa/OfflineIndicator';
import InstallPrompt from '../pwa/InstallPrompt';

interface PWAContextType {
  // PWA state
  isOnline: boolean;
  isOffline: boolean;
  canInstall: boolean;
  isInstalling: boolean;
  updateAvailable: boolean;
  
  // PWA actions
  install: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  cacheUrls: (urls: string[]) => Promise<void>;
  clearCache: (cacheName?: string) => Promise<void>;
  checkForUpdates: () => Promise<void>;
  sendNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  
  // Performance
  isOptimized: boolean;
  performanceScore: number;
  optimizeImage: (src: string, options?: any) => string;
  preloadResource: (href: string, as: string, type?: string) => void;
  prefetchResource: (href: string) => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
  enableOfflineIndicator?: boolean;
  enableInstallPrompt?: boolean;
  enablePerformanceOptimization?: boolean;
  installPromptDelay?: number;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({
  children,
  enableOfflineIndicator = true,
  enableInstallPrompt = true,
  enablePerformanceOptimization = true,
  installPromptDelay = 3000,
}) => {
  const pwa = usePWA();
  const performance = usePerformanceOptimization({
    enableLazyLoading: enablePerformanceOptimization,
    enableImageOptimization: enablePerformanceOptimization,
    enablePreloading: enablePerformanceOptimization,
    enableCaching: enablePerformanceOptimization,
  });

  // Service worker registration is handled by usePWA hook with autoRegister: true
  // No need to register here to avoid duplicate registrations

  // Preload critical resources
  useEffect(() => {
    if (enablePerformanceOptimization) {
      // Preload critical CSS
      performance.preloadResource('/src/index.css', 'style', 'text/css');
      
      // Preload critical fonts
      performance.preloadResource('/fonts/inter-var.woff2', 'font', 'font/woff2');
      
      // Prefetch likely next pages
      performance.prefetchResource('/dashboard');
      performance.prefetchResource('/trades');
      performance.prefetchResource('/messages');
    }
  }, [enablePerformanceOptimization, performance]);

  // Request notification permission on first visit
  useEffect(() => {
    const hasRequestedPermission = localStorage.getItem('notification-permission-requested');
    if (!hasRequestedPermission && pwa.isReady) {
      pwa.requestNotificationPermission().then((granted) => {
        if (granted) {
          localStorage.setItem('notification-permission-requested', 'true');
        }
      });
    }
  }, [pwa.isReady, pwa.requestNotificationPermission]);

  const contextValue: PWAContextType = {
    // PWA state
    isOnline: pwa.isOnline,
    isOffline: pwa.isOffline,
    canInstall: pwa.canInstall,
    isInstalling: pwa.isInstalling,
    updateAvailable: pwa.canUpdate,
    
    // PWA actions
    install: pwa.install,
    skipWaiting: pwa.skipWaiting,
    cacheUrls: pwa.cacheUrls,
    clearCache: pwa.clearCache,
    checkForUpdates: pwa.checkForUpdates,
    sendNotification: pwa.sendNotification,
    
    // Performance
    isOptimized: performance.isOptimized,
    performanceScore: performance.getPerformanceScore(),
    optimizeImage: performance.optimizeImage,
    preloadResource: performance.preloadResource,
    prefetchResource: performance.prefetchResource,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* Offline Indicator */}
      {enableOfflineIndicator && (
        <OfflineIndicator />
      )}
      
      {/* Install Prompt */}
      {enableInstallPrompt && (
        <InstallPrompt showDelay={installPromptDelay} />
      )}
    </PWAContext.Provider>
  );
};

// Hook to use PWA context
export const usePWAContext = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
};

export default PWAProvider;
