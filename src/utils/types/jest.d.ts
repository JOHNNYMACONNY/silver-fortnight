// Type definitions for custom Jest matchers
declare namespace jest {
  interface Matchers<R> {
    /**
     * Check if a value represents a secure connection or context
     */
    toBeSecure(): R;

    /**
     * Check if a value matches security event structure
     */
    toBeValidSecurityEvent(): R;

    /**
     * Check if a value is within rate limit parameters
     * @param config Rate limiting configuration
     */
    toBeWithinRateLimit(config: { maxAttempts: number; windowMs: number }): R;

    /**
     * Check if a value matches valid token claims structure
     */
    toHaveValidTokenClaims(): R;
  }
}

// Type definitions for security mocks
interface SecurityContext {
  secure: boolean;
  protocol: string;
  encrypted: boolean;
}

interface CryptoSubtle {
  digest(algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer>;
  encrypt(algorithm: any, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer>;
  decrypt(algorithm: any, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer>;
  generateKey(algorithm: any, extractable: boolean, keyUsages: string[]): Promise<CryptoKey>;
}

interface MockCrypto {
  subtle: CryptoSubtle;
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
}

interface MockWindow {
  isSecureContext: boolean;
  localStorage: Storage;
  sessionStorage: Storage;
  crypto: MockCrypto;
}

interface MockNavigator {
  permissions: {
    query(permissionDesc: { name: string }): Promise<{ state: string }>;
  };
}

interface MockPerformance {
  now(): number;
  mark(markName: string): void;
  measure(measureName: string, startMark?: string, endMark?: string): void;
  getEntriesByType(entryType: string): PerformanceEntry[];
}

declare global {
  namespace NodeJS {
    interface Global {
      window: MockWindow;
      navigator: MockNavigator;
      self: {
        crypto: MockCrypto;
        performance: MockPerformance;
      };
      localStorage: Storage;
      sessionStorage: Storage;
    }
  }

  var localStorage: Storage;
  var sessionStorage: Storage;
}

// Extend the window object
declare global {
  interface Window {
    isSecureContext: boolean;
  }
}

export {};
