/**
 * PWA Hook
 * 
 * React hook for PWA functionality including service worker management,
 * offline status, and installation prompts for TradeYa.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { serviceWorkerManager, type ServiceWorkerState } from '../services/pwa/ServiceWorkerManager';

interface PWAState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalled: boolean;
  isActivated: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  canInstall: boolean;
  isInstalling: boolean;
  installPrompt: any;
}

interface PWAConfig {
  autoRegister: boolean;
  checkForUpdates: boolean;
  updateInterval: number;
  enableNotifications: boolean;
}

const DEFAULT_CONFIG: PWAConfig = {
  autoRegister: true,
  checkForUpdates: true,
  updateInterval: 300000, // 5 minutes
  enableNotifications: true,
};

export function usePWA(config: Partial<PWAConfig> = {}) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  const [state, setState] = useState<PWAState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalled: false,
    isActivated: false,
    isOnline: navigator.onLine,
    registration: null,
    updateAvailable: false,
    canInstall: false,
    isInstalling: false,
    installPrompt: null,
  });

  // Register service worker
  const register = useCallback(async () => {
    try {
      const registration = await serviceWorkerManager.register();
      if (registration) {
        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }));
      }
    } catch (error) {
      console.error('[PWA Hook] Registration failed:', error);
    }
  }, []);

  // Unregister service worker
  const unregister = useCallback(async () => {
    try {
      const success = await serviceWorkerManager.unregister();
      if (success) {
        setState(prev => ({
          ...prev,
          isRegistered: false,
          registration: null,
        }));
      }
    } catch (error) {
      console.error('[PWA Hook] Unregistration failed:', error);
    }
  }, []);

  // Skip waiting and activate new service worker
  const skipWaiting = useCallback(async () => {
    try {
      await serviceWorkerManager.skipWaiting();
    } catch (error) {
      console.error('[PWA Hook] Skip waiting failed:', error);
    }
  }, []);

  // Install PWA
  const install = useCallback(async () => {
    setState(prev => ({ ...prev, isInstalling: true }));
    
    try {
      const success = await serviceWorkerManager.installPWA();
      if (success) {
        setState(prev => ({
          ...prev,
          canInstall: false,
          installPrompt: null,
        }));
      }
    } catch (error) {
      console.error('[PWA Hook] Installation failed:', error);
    } finally {
      setState(prev => ({ ...prev, isInstalling: false }));
    }
  }, []);

  // Cache URLs
  const cacheUrls = useCallback(async (urls: string[]) => {
    try {
      await serviceWorkerManager.cacheUrls(urls);
    } catch (error) {
      console.error('[PWA Hook] Cache URLs failed:', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async (cacheName?: string) => {
    try {
      await serviceWorkerManager.clearCache(cacheName);
    } catch (error) {
      console.error('[PWA Hook] Clear cache failed:', error);
    }
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    try {
      await serviceWorkerManager.checkForUpdates();
    } catch (error) {
      console.error('[PWA Hook] Check for updates failed:', error);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!finalConfig.enableNotifications) return false;
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('[PWA Hook] Notification permission failed:', error);
      return false;
    }
  }, [finalConfig.enableNotifications]);

  // Send notification
  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!finalConfig.enableNotifications) return;
    
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options,
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } catch (error) {
      console.error('[PWA Hook] Send notification failed:', error);
    }
  }, [finalConfig.enableNotifications]);

  // Setup PWA functionality
  useEffect(() => {
    if (!state.isSupported) return;

    // Auto-register if enabled
    if (finalConfig.autoRegister) {
      register();
    }

    // Setup state listener
    const unsubscribe = serviceWorkerManager.addStateListener((swState) => {
      setState(prev => ({
        ...prev,
        ...swState,
      }));
    });

    // Setup update listener
    const unsubscribeUpdate = serviceWorkerManager.onUpdateAvailable(() => {
      setState(prev => ({
        ...prev,
        updateAvailable: true,
      }));
    });

    // Setup beforeinstallprompt listener
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setState(prev => ({
        ...prev,
        canInstall: true,
        installPrompt: event,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Setup appinstalled listener
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        canInstall: false,
        installPrompt: null,
        isInstalled: true,
      }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Setup online/offline listeners
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup update checking interval
    let updateInterval: NodeJS.Timeout | null = null;
    if (finalConfig.checkForUpdates) {
      updateInterval = setInterval(checkForUpdates, finalConfig.updateInterval);
    }

    // Cleanup
    return () => {
      unsubscribe();
      unsubscribeUpdate();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [finalConfig.autoRegister, finalConfig.checkForUpdates, finalConfig.updateInterval, finalConfig.enableNotifications]);

  // State listener is already set up in the main useEffect above
  // No need for duplicate state listeners

  return {
    // State
    ...state,
    
    // Actions
    register,
    unregister,
    skipWaiting,
    install,
    cacheUrls,
    clearCache,
    checkForUpdates,
    requestNotificationPermission,
    sendNotification,
    
    // Computed properties
    isReady: state.isSupported && state.isRegistered && state.registration?.active !== null,
    canUpdate: state.updateAvailable,
    isOffline: !state.isOnline,
  };
}

export default usePWA;

