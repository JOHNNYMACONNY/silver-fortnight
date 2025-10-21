/**
 * Type-safe theme configuration
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Theme utilities for consistent theme management
 */
export const themes = {
  light: 'light',
  dark: 'dark',
  system: 'system',
} as const;
