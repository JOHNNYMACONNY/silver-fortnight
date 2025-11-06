/**
 * Centralized Vite environment variable access
 * This is the ONLY file that should access import.meta
 * All other files should import from this module
 */

// Type for our environment variables
export interface ViteEnv {
  VITE_CLOUDINARY_CLOUD_NAME?: string;
  VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  VITE_CLOUDINARY_API_KEY?: string;
  VITE_CLOUDINARY_PROFILE_PRESET?: string;
  VITE_CLOUDINARY_BANNER_PRESET?: string;
  VITE_CLOUDINARY_PORTFOLIO_PRESET?: string;
  VITE_CLOUDINARY_PROJECT_PRESET?: string;
  VITE_PROFILE_ENRICH_ROLES?: string;
  DEV?: boolean;
  MODE?: string;
  PROD?: boolean;
  SSR?: boolean;
}

/**
 * Get Vite environment variables
 * In production/development: returns import.meta.env
 * In tests: returns empty object (will be mocked)
 */
export function getViteEnv(): ViteEnv {
  // Check if we're in test environment first
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return {};
  }
  
  // Access import.meta.env for Vite
  // This will only execute in production/development builds
  return import.meta.env as ViteEnv;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true;
  }
  const env = getViteEnv();
  return env.DEV === true || env.MODE === 'development';
}

/**
 * Get specific env variable with fallback
 */
export function getEnvVar(key: keyof ViteEnv, fallback: string = ''): string {
  const env = getViteEnv();
  return env[key] as string || fallback;
}

// Export commonly used env variables as constants
export const CLOUDINARY_CLOUD_NAME = getEnvVar('VITE_CLOUDINARY_CLOUD_NAME', 'doqqhj2nt');
export const CLOUDINARY_UPLOAD_PRESET = getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET', 'tradeya_uploads');
export const CLOUDINARY_API_KEY = getEnvVar('VITE_CLOUDINARY_API_KEY', '');
export const CLOUDINARY_PROFILE_PRESET = getEnvVar('VITE_CLOUDINARY_PROFILE_PRESET', '');
export const CLOUDINARY_BANNER_PRESET = getEnvVar('VITE_CLOUDINARY_BANNER_PRESET', '');
export const CLOUDINARY_PORTFOLIO_PRESET = getEnvVar('VITE_CLOUDINARY_PORTFOLIO_PRESET', '');
export const CLOUDINARY_PROJECT_PRESET = getEnvVar('VITE_CLOUDINARY_PROJECT_PRESET', '');
