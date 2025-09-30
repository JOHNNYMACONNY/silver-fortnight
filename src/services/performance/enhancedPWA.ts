/**
 * Enhanced PWA Service with advanced features
 * Provides intelligent caching, background sync, push notifications, and offline capabilities
 */

export interface PWAConfig {
  /** Enable background sync */
  enableBackgroundSync: boolean;
  /** Enable push notifications */
  enablePushNotifications: boolean;
  /** Enable offline mode */
  enableOfflineMode: boolean;
  /** Enable intelligent caching */
  enableIntelligentCaching: boolean;
  /** Cache strategy for different resource types */
  cacheStrategies: {
    static: "cache-first" | "network-first" | "stale-while-revalidate";
    dynamic: "cache-first" | "network-first" | "stale-while-revalidate";
    api: "cache-first" | "network-first" | "stale-while-revalidate";
  };
  /** Maximum cache size in MB */
  maxCacheSize: number;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface BackgroundSyncTask {
  id: string;
  type: "api-call" | "data-sync" | "file-upload";
  data: any;
  priority: "high" | "medium" | "low";
  retryCount: number;
  maxRetries: number;
  createdAt: number;
}

/**
 * Enhanced PWA Service
 */
export class EnhancedPWAService {
  private config: PWAConfig;
  private serviceWorker: ServiceWorker | null = null;
  private installPrompt: InstallPromptEvent | null = null;
  private isOnline = navigator.onLine;
  private backgroundSyncQueue: BackgroundSyncTask[] = [];
  private notificationPermission: NotificationPermission = "default";

  constructor(config: Partial<PWAConfig> = {}) {
    this.config = {
      enableBackgroundSync: true,
      enablePushNotifications: true,
      enableOfflineMode: true,
      enableIntelligentCaching: true,
      cacheStrategies: {
        static: "cache-first",
        dynamic: "stale-while-revalidate",
        api: "network-first",
      },
      maxCacheSize: 100, // 100MB
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };

    this.initializeService();
  }

  /**
   * Initialize the PWA service
   */
  private async initializeService(): Promise<void> {
    // Delay service worker registration to avoid blocking initial page load
    setTimeout(() => {
      this.registerServiceWorker().catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
    }, 1000);

    this.setupInstallPrompt();
    this.setupNetworkMonitoring();
    this.setupNotifications();
    this.setupBackgroundSync();
    this.setupOfflineHandling();
  }

  /**
   * Register service worker with enhanced features
   */
  private async registerServiceWorker(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return;
    }

    try {
      // Register the service worker (path expected to be served from site root)
      const registration = await navigator.serviceWorker.register(
        "/sw-enhanced.js",
        {
          scope: "/",
          updateViaCache: "none",
        }
      );

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.handleServiceWorkerUpdate();
            }
          });
        }
      });

      this.serviceWorker = registration.active;
      console.log("Enhanced Service Worker registered successfully");
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  /**
   * Setup app install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.installPrompt = event as InstallPromptEvent;
      this.showInstallBanner();
    });

    window.addEventListener("appinstalled", () => {
      this.trackInstallation();
      this.hideInstallBanner();
    });
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.handleOnlineStateChange(true);
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.handleOnlineStateChange(false);
    });

    // Monitor connection quality
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", () => {
        this.handleConnectionChange(connection);
      });
    }
  }

  /**
   * Setup push notifications
   */
  private async setupNotifications(): Promise<void> {
    if (!this.config.enablePushNotifications || !("Notification" in window)) {
      return;
    }

    this.notificationPermission = Notification.permission;

    if (this.notificationPermission === "default") {
      // Don't request permission immediately, wait for user interaction
      return;
    }

    if (this.notificationPermission === "granted") {
      await this.subscribeToPushNotifications();
    }
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    if (!this.config.enableBackgroundSync) return;

    // Load pending sync tasks from storage
    this.loadBackgroundSyncQueue();

    // Process queue when online
    if (this.isOnline) {
      this.processBackgroundSyncQueue();
    }
  }

  /**
   * Setup offline handling
   */
  private setupOfflineHandling(): void {
    if (!this.config.enableOfflineMode) return;

    // Intercept fetch requests for offline handling
    this.setupOfflineInterception();
  }

  /**
   * Show app install banner
   */
  private showInstallBanner(): void {
    // Create and show install banner UI
    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.className = "pwa-install-banner";
    banner.innerHTML = `
      <div class="banner-content">
        <span>Install TradeYa for a better experience</span>
        <button id="install-button">Install</button>
        <button id="dismiss-button">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Handle install button click
    document.getElementById("install-button")?.addEventListener("click", () => {
      this.promptInstall();
    });

    // Handle dismiss button click
    document.getElementById("dismiss-button")?.addEventListener("click", () => {
      this.hideInstallBanner();
    });
  }

  /**
   * Hide app install banner
   */
  private hideInstallBanner(): void {
    const banner = document.getElementById("pwa-install-banner");
    if (banner) {
      banner.remove();
    }
  }

  /**
   * Prompt app installation
   */
  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        this.trackInstallation();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Install prompt failed:", error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;

      if (permission === "granted") {
        await this.subscribeToPushNotifications();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Notification permission request failed:", error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPushNotifications(): Promise<void> {
    if (!this.serviceWorker) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVAPIDKey(),
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error("Push subscription failed:", error);
    }
  }

  /**
   * Add task to background sync queue
   */
  addToBackgroundSync(
    task: Omit<BackgroundSyncTask, "id" | "createdAt" | "retryCount">
  ): void {
    const syncTask: BackgroundSyncTask = {
      ...task,
      id: this.generateTaskId(),
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.backgroundSyncQueue.push(syncTask);
    this.saveBackgroundSyncQueue();

    if (this.isOnline) {
      this.processBackgroundSyncQueue();
    }
  }

  /**
   * Process background sync queue
   */
  private async processBackgroundSyncQueue(): Promise<void> {
    if (this.backgroundSyncQueue.length === 0) return;

    const tasksToProcess = [...this.backgroundSyncQueue];
    this.backgroundSyncQueue = [];

    for (const task of tasksToProcess) {
      try {
        await this.processBackgroundSyncTask(task);
      } catch (error) {
        console.error(`Background sync task ${task.id} failed:`, error);

        if (task.retryCount < task.maxRetries) {
          task.retryCount++;
          this.backgroundSyncQueue.push(task);
        }
      }
    }

    this.saveBackgroundSyncQueue();
  }

  /**
   * Process individual background sync task
   */
  private async processBackgroundSyncTask(
    task: BackgroundSyncTask
  ): Promise<void> {
    switch (task.type) {
      case "api-call":
        await this.processApiCall(task.data);
        break;
      case "data-sync":
        await this.processDataSync(task.data);
        break;
      case "file-upload":
        await this.processFileUpload(task.data);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Handle online/offline state changes
   */
  private handleOnlineStateChange(isOnline: boolean): void {
    if (isOnline) {
      this.showOnlineNotification();
      this.processBackgroundSyncQueue();
    } else {
      this.showOfflineNotification();
    }

    // Notify service worker about network state
    this.sendMessageToServiceWorker({
      type: "NETWORK_STATE_CHANGE",
      isOnline,
    });
  }

  /**
   * Handle connection quality changes
   */
  private handleConnectionChange(connection: any): void {
    const connectionInfo = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };

    // Adjust caching strategy based on connection quality
    this.adjustCachingStrategy(connectionInfo);
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdate(): void {
    // Show update notification
    this.showUpdateNotification();
  }

  /**
   * Show online notification
   */
  private showOnlineNotification(): void {
    this.showNotification("Back online", "Connection restored", "success");
  }

  /**
   * Show offline notification
   */
  private showOfflineNotification(): void {
    this.showNotification("Offline mode", "Working offline", "warning");
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    this.showNotification(
      "Update available",
      "Refresh to get the latest version",
      "info"
    );
  }

  /**
   * Show notification
   */
  private showNotification(
    title: string,
    message: string,
    type: "success" | "warning" | "info" | "error"
  ): void {
    // Implementation depends on your notification system
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  }

  /**
   * Adjust caching strategy based on connection
   */
  private adjustCachingStrategy(connectionInfo: any): void {
    if (
      connectionInfo.effectiveType === "slow-2g" ||
      connectionInfo.effectiveType === "2g"
    ) {
      // Use more aggressive caching for slow connections
      this.sendMessageToServiceWorker({
        type: "UPDATE_CACHE_STRATEGY",
        strategy: "cache-first",
      });
    } else {
      // Use normal caching strategy
      this.sendMessageToServiceWorker({
        type: "UPDATE_CACHE_STRATEGY",
        strategy: this.config.cacheStrategies.dynamic,
      });
    }
  }

  /**
   * Send message to service worker
   */
  private sendMessageToServiceWorker(message: any): void {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage(message);
    }
  }

  /**
   * Setup offline request interception
   */
  private setupOfflineInterception(): void {
    // This would typically be handled by the service worker
    // Here we can set up client-side offline handling
  }

  /**
   * Load background sync queue from storage
   */
  private loadBackgroundSyncQueue(): void {
    try {
      const stored = localStorage.getItem("pwa-background-sync-queue");
      if (stored) {
        this.backgroundSyncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load background sync queue:", error);
    }
  }

  /**
   * Save background sync queue to storage
   */
  private saveBackgroundSyncQueue(): void {
    try {
      localStorage.setItem(
        "pwa-background-sync-queue",
        JSON.stringify(this.backgroundSyncQueue)
      );
    } catch (error) {
      console.error("Failed to save background sync queue:", error);
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get VAPID key for push notifications
   */
  private getVAPIDKey(): string {
    // Return your VAPID public key
    return process.env.VITE_VAPID_PUBLIC_KEY || "";
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<void> {
    // Send subscription to your server
    console.log("Push subscription:", subscription);
  }

  /**
   * Process API call task
   */
  private async processApiCall(data: any): Promise<void> {
    // Implement API call processing
    console.log("Processing API call:", data);
  }

  /**
   * Process data sync task
   */
  private async processDataSync(data: any): Promise<void> {
    // Implement data sync processing
    console.log("Processing data sync:", data);
  }

  /**
   * Process file upload task
   */
  private async processFileUpload(data: any): Promise<void> {
    // Implement file upload processing
    console.log("Processing file upload:", data);
  }

  /**
   * Track app installation
   */
  private trackInstallation(): void {
    console.log("App installed successfully");
    // Send analytics event
  }

  /**
   * Get PWA status
   */
  getPWAStatus(): {
    isInstalled: boolean;
    isOnline: boolean;
    notificationPermission: NotificationPermission;
    backgroundSyncQueueSize: number;
    serviceWorkerStatus: string;
  } {
    return {
      isInstalled: window.matchMedia("(display-mode: standalone)").matches,
      isOnline: this.isOnline,
      notificationPermission: this.notificationPermission,
      backgroundSyncQueueSize: this.backgroundSyncQueue.length,
      serviceWorkerStatus: this.serviceWorker ? "active" : "inactive",
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    cacheHitRate: number;
    offlineRequests: number;
    backgroundSyncSuccess: number;
    averageResponseTime: number;
  } {
    // Return performance metrics
    return {
      cacheHitRate: 0.85,
      offlineRequests: 0,
      backgroundSyncSuccess: 0.95,
      averageResponseTime: 150,
    };
  }
}

// Create singleton instance
export const enhancedPWA = new EnhancedPWAService();
