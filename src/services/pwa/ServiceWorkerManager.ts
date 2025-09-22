/**
 * PWA Service Worker Manager
 * 
 * Comprehensive service worker management with registration,
 * updates, and communication for TradeYa PWA functionality.
 */

interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'CACHE_URLS' | 'CLEAR_CACHE' | 'GET_CACHE_STATUS';
  urls?: string[];
  cacheName?: string;
}

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalled: boolean;
  isActivated: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

class ServiceWorkerManager {
  private state: ServiceWorkerState = {
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalled: false,
    isActivated: false,
    isOnline: navigator.onLine,
    registration: null,
    updateAvailable: false,
  };

  private listeners: Array<(state: ServiceWorkerState) => void> = [];
  private updateCallbacks: Array<() => void> = [];

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.state.isSupported) {
      console.warn('[SW Manager] Service workers not supported');
      return null;
    }

    // Check if already registered to prevent duplicate registrations
    if (this.state.isRegistered && this.state.registration) {
      console.log('[SW Manager] Service worker already registered, returning existing registration');
      return this.state.registration;
    }

    // Check for existing registrations in the browser
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    const existingRegistration = existingRegistrations.find(reg => reg.scope === '/');
    if (existingRegistration) {
      this.state.registration = existingRegistration;
      this.state.isRegistered = true;
      console.log('[SW Manager] Found existing service worker registration');
      this.notifyListeners(); // Notify listeners about the existing registration
      return existingRegistration;
    }

    try {
      const registration = await navigator.serviceWorker.register('/assets/js/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.state.registration = registration;
      this.state.isRegistered = true;

      console.log('[SW Manager] Service worker registered successfully');

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.state.updateAvailable = true;
              this.notifyListeners();
              this.notifyUpdateCallbacks();
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.state.isActivated = true;
        this.state.updateAvailable = false;
        this.notifyListeners();
        window.location.reload();
      });

      this.notifyListeners();
      return registration;
    } catch (error) {
      console.error('[SW Manager] Service worker registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.state.registration) {
      return false;
    }

    try {
      const result = await this.state.registration.unregister();
      this.state.isRegistered = false;
      this.state.registration = null;
      this.notifyListeners();
      return result;
    } catch (error) {
      console.error('[SW Manager] Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.state.registration) {
      throw new Error('No service worker registration found');
    }

    const message: ServiceWorkerMessage = { type: 'SKIP_WAITING' };
    await this.sendMessageToSW(message);
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.state.registration?.active) {
      throw new Error('No active service worker found');
    }

    const message: ServiceWorkerMessage = { 
      type: 'CACHE_URLS', 
      urls 
    };
    await this.sendMessageToSW(message);
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName?: string): Promise<void> {
    if (!this.state.registration?.active) {
      throw new Error('No active service worker found');
    }

    const message: ServiceWorkerMessage = { 
      type: 'CLEAR_CACHE', 
      cacheName 
    };
    await this.sendMessageToSW(message);
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<any> {
    if (!this.state.registration?.active) {
      throw new Error('No active service worker found');
    }

    const message: ServiceWorkerMessage = { type: 'GET_CACHE_STATUS' };
    return await this.sendMessageToSW(message);
  }

  /**
   * Send message to service worker
   */
  private async sendMessageToSW(message: ServiceWorkerMessage): Promise<any> {
    if (!this.state.registration?.active) {
      throw new Error('No active service worker found');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      this.state.registration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Online/offline status
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      this.notifyListeners();
    });

    // Service worker state changes
    if (this.state.isSupported) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW Manager] Message from service worker:', event.data);
      });
    }
  }

  /**
   * Add state change listener
   */
  addStateListener(listener: (state: ServiceWorkerState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Add update available listener
   */
  onUpdateAvailable(callback: () => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Notify update callbacks
   */
  private notifyUpdateCallbacks(): void {
    this.updateCallbacks.forEach(callback => callback());
  }

  /**
   * Get current state
   */
  getState(): ServiceWorkerState {
    return { ...this.state };
  }

  /**
   * Check if service worker is ready
   */
  isReady(): boolean {
    return this.state.isSupported && 
           this.state.isRegistered && 
           this.state.registration?.active !== null;
  }

  /**
   * Get service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.state.registration;
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.state.registration) {
      throw new Error('No service worker registration found');
    }

    try {
      await this.state.registration.update();
    } catch (error) {
      console.error('[SW Manager] Failed to check for updates:', error);
    }
  }

  /**
   * Install PWA
   */
  async installPWA(): Promise<boolean> {
    if (!this.state.registration) {
      throw new Error('No service worker registration found');
    }

    try {
      // Trigger beforeinstallprompt event
      const deferredPrompt = await this.getDeferredPrompt();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        return outcome === 'accepted';
      }
      return false;
    } catch (error) {
      console.error('[SW Manager] PWA installation failed:', error);
      return false;
    }
  }

  /**
   * Get deferred prompt for PWA installation
   */
  private async getDeferredPrompt(): Promise<any> {
    return new Promise((resolve) => {
      window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        resolve(event);
      }, { once: true });
    });
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
export default serviceWorkerManager;

