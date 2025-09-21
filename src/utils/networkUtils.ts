/**
 * Network Utilities
 *
 * This file provides utilities for handling network-related edge cases
 * such as slow connections, offline mode, and connection changes.
 */

/**
 * Network connection types
 */
export type ConnectionType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";

/**
 * Network information interface
 */
export interface NetworkInfo {
  online: boolean;
  connectionType: ConnectionType;
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

/**
 * Get current network information
 *
 * @returns NetworkInfo object with connection details
 */
export const getNetworkInfo = (): NetworkInfo => {
  // Default values for browsers without NetworkInformation API
  const defaultInfo: NetworkInfo = {
    online: navigator.onLine,
    connectionType: "unknown",
    downlink: 10, // Assume decent connection by default
    rtt: 50, // Assume decent latency by default
    saveData: false,
  };

  // Check if the NetworkInformation API is available
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (!connection) {
    return defaultInfo;
  }

  return {
    online: navigator.onLine,
    connectionType: connection.effectiveType || "unknown",
    downlink: connection.downlink || defaultInfo.downlink,
    rtt: connection.rtt || defaultInfo.rtt,
    saveData: connection.saveData || defaultInfo.saveData,
  };
};

/**
 * Check if the current connection is slow
 *
 * @returns boolean indicating if the connection is slow
 */
export const isSlowConnection = (): boolean => {
  const { connectionType, downlink, rtt } = getNetworkInfo();

  // Consider slow-2g and 2g as slow connections
  if (connectionType === "slow-2g" || connectionType === "2g") {
    return true;
  }

  // Consider connections with low bandwidth or high latency as slow
  if (downlink < 1.5 || rtt > 500) {
    return true;
  }

  return false;
};

/**
 * Check if the user has enabled data saver mode
 *
 * @returns boolean indicating if data saver is enabled
 */
export const isDataSaverEnabled = (): boolean => {
  const { saveData } = getNetworkInfo();
  return saveData;
};

/**
 * Check if the device is offline
 *
 * @returns boolean indicating if the device is offline
 */
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

/**
 * Add a listener for online/offline events
 *
 * @param onOnline Callback for when the device goes online
 * @param onOffline Callback for when the device goes offline
 * @returns Cleanup function to remove the listeners
 */
export const addConnectionListeners = (
  onOnline: () => void,
  onOffline: () => void
): (() => void) => {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
};

/**
 * Add a listener for connection changes
 *
 * @param onChange Callback for when the connection changes
 * @returns Cleanup function to remove the listener
 */
export const addConnectionChangeListener = (
  onChange: (info: NetworkInfo) => void
): (() => void) => {
  // Check if the NetworkInformation API is available
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (!connection) {
    return () => {}; // No cleanup needed
  }

  const handleChange = () => {
    onChange(getNetworkInfo());
  };

  connection.addEventListener("change", handleChange);

  return () => {
    connection.removeEventListener("change", handleChange);
  };
};

/**
 * Retry a function with exponential backoff
 *
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 * @returns Promise that resolves with the function result or rejects after max retries
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let retries = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;

      if (retries >= maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, retries) + Math.random() * 1000;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Create an AbortController with timeout
 *
 * @param timeoutMs Timeout in milliseconds
 * @returns AbortController with timeout
 */
export const createTimeoutController = (timeoutMs: number): AbortController => {
  const controller = new AbortController();

  setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return controller;
};

/**
 * Fetch with timeout and retry
 *
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds
 * @param maxRetries Maximum number of retries
 * @returns Promise that resolves with the fetch response
 */
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000,
  maxRetries: number = 3
): Promise<Response> => {
  return retryWithBackoff(async () => {
    const controller = createTimeoutController(timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (error: any) {
      // If the error is due to timeout, throw a more descriptive error
      if (error.name === "AbortError") {
        throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
      }

      throw error;
    }
  }, maxRetries);
};

/**
 * Load an image with timeout and retry
 *
 * @param src Image source URL
 * @param timeoutMs Timeout in milliseconds
 * @param maxRetries Maximum number of retries
 * @returns Promise that resolves when the image is loaded
 */
export const loadImageWithRetry = (
  src: string,
  timeoutMs: number = 10000,
  maxRetries: number = 3
): Promise<HTMLImageElement> => {
  return retryWithBackoff(() => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      // Set up timeout
      const timeout = setTimeout(() => {
        img.src = ""; // Cancel the request
        reject(new Error(`Image load timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Set up event handlers
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image from ${src}`));
      };

      // Start loading the image
      img.src = src;
    });
  }, maxRetries);
};

/**
 * Check if the device is a low-end device
 *
 * @returns boolean indicating if the device is low-end
 */
export const isLowEndDevice = (): boolean => {
  // Check for memory constraints
  if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
    return true;
  }

  // Check for CPU constraints
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }

  return false;
};

/**
 * Adjust quality based on network and device capabilities
 *
 * @param baseUrl Base URL for the resource
 * @param options Options for quality adjustment
 * @returns Adjusted URL
 */
export const getAdaptiveQualityUrl = (
  baseUrl: string,
  options: {
    lowQualityParams?: string;
    highQualityParams?: string;
    mediumQualityParams?: string;
  } = {}
): string => {
  const {
    lowQualityParams = "q_auto:low,f_auto",
    mediumQualityParams = "q_auto:good,f_auto",
    highQualityParams = "q_auto:best,f_auto",
  } = options;

  // Check network and device conditions
  const isLowEnd = isLowEndDevice();
  const isSlow = isSlowConnection();
  const isSaveData = isDataSaverEnabled();

  // Determine quality level
  let qualityParams = mediumQualityParams;

  if (isLowEnd || isSlow || isSaveData) {
    qualityParams = lowQualityParams;
  } else if (!isLowEnd && !isSlow) {
    qualityParams = highQualityParams;
  }

  // For Cloudinary URLs
  if (baseUrl.includes("cloudinary.com")) {
    // Extract parts of the Cloudinary URL
    const uploadIndex = baseUrl.indexOf("/upload/");

    if (uploadIndex !== -1) {
      const prefix = baseUrl.substring(0, uploadIndex + 8); // Include '/upload/'
      const suffix = baseUrl.substring(uploadIndex + 8);

      return `${prefix}${qualityParams}/${suffix}`;
    }
  }

  // For other URLs, append as query parameters
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}quality=${qualityParams}`;
};
