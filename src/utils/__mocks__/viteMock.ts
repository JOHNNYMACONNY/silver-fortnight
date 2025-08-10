import { jest } from '@jest/globals';

// Types
export interface ViteEnv {
  [key: string]: string | boolean | undefined;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
}

export interface ImportMetaEnv extends ViteEnv {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  VITE_FIREBASE_MEASUREMENT_ID: string;
  VITE_CLOUDINARY_CLOUD_NAME: string;
  VITE_CLOUDINARY_UPLOAD_PRESET: string;
  VITE_CLOUDINARY_API_KEY: string;
}

// Test environment configuration
export const mockEnv: ImportMetaEnv = {
  MODE: 'test',
  DEV: true,
  PROD: false,
  SSR: false,
  VITE_FIREBASE_API_KEY: 'mock-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'mock-auth-domain',
  VITE_FIREBASE_PROJECT_ID: 'mock-project-id',
  VITE_FIREBASE_STORAGE_BUCKET: 'mock-storage-bucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender-id',
  VITE_FIREBASE_APP_ID: 'mock-app-id',
  VITE_FIREBASE_MEASUREMENT_ID: 'mock-measurement-id',
  VITE_CLOUDINARY_CLOUD_NAME: 'mock-cloud-name',
  VITE_CLOUDINARY_UPLOAD_PRESET: 'mock-upload-preset',
  VITE_CLOUDINARY_API_KEY: 'mock-key'
};

// Mock functions with proper types
export const loadEnv = jest.fn((): ImportMetaEnv => mockEnv);
export const defineConfig = jest.fn(<T extends Record<string, any>>(config?: T): T => config || {} as T);
export const createServer = jest.fn(() => ({
  listen: jest.fn(),
  close: jest.fn()
}));
export const transformWithEsbuild = jest.fn();
export const createFilter = jest.fn(() => jest.fn());
export const normalizePath = jest.fn((path: string): string => path);
export const build = jest.fn();
export const preview = jest.fn();
export const mergeConfig = jest.fn(<T extends Record<string, any>>(defaults: T, overrides: Partial<T>): T => ({
  ...defaults,
  ...overrides
}));

// Export meta object and test env
export const meta = { env: mockEnv };
export { mockEnv as TEST_ENV };

// Type augmentation for global values
declare global {
  var importMeta: { env: ImportMetaEnv };
  var __vite_env__: ImportMetaEnv;
  
  interface Window {
    __vite_env__?: ImportMetaEnv;
  }
}

// Initialize globals
if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'importMeta', {
    value: { env: mockEnv },
    writable: true,
    configurable: true
  });

  Object.defineProperty(global, '__vite_env__', {
    value: mockEnv,
    writable: true,
    configurable: true
  });
}

// Initialize window if in browser environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__vite_env__', {
    value: mockEnv,
    writable: true,
    configurable: true
  });
}

// Default export
export default {
  TEST_ENV: mockEnv,
  meta,
  loadEnv,
  defineConfig,
  createServer,
  transformWithEsbuild,
  createFilter,
  normalizePath,
  build,
  preview,
  mergeConfig
};