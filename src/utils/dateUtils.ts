import { logger } from '@utils/logging/logger';
/**
 * Universal date formatting utilities for Firebase Timestamps and Date objects
 * Handles the inconsistent date formats throughout the codebase
 */

export type FirebaseDate = Date | any | undefined | null;

/**
 * Safely converts Firebase Timestamp or Date to JavaScript Date
 * Handles all the different formats we've encountered
 */
export const toSafeDate = (date: FirebaseDate): Date | null => {
  if (!date) return null;
  
  try {
    // Handle Firebase Timestamp with .toDate() method
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate();
    }
    
    // Handle Firebase Timestamp with .seconds property
    if (date.seconds && typeof date.seconds === 'number') {
      return new Date(date.seconds * 1000);
    }
    
    // Handle regular Date object
    if (date instanceof Date) {
      return date;
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // Handle number timestamps
    if (typeof date === 'number') {
      return new Date(date);
    }
    
    return null;
  } catch (error) {
    logger.warn('Error converting date:', 'UTILITY', error);
    return null;
  }
};

/**
 * Formats date with fallback handling
 */
export const formatDate = (
  date: FirebaseDate, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  },
  fallback: string = 'Date not available'
): string => {
  const safeDate = toSafeDate(date);
  if (!safeDate) return fallback;
  
  try {
    return safeDate.toLocaleDateString('en-US', options);
  } catch (error) {
    logger.warn('Error formatting date:', 'UTILITY', error);
    return fallback;
  }
};

/**
 * Formats date for short display (e.g., "Jan 24, 2025")
 */
export const formatShortDate = (date: FirebaseDate): string => {
  return formatDate(date, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

/**
 * Formats relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: FirebaseDate): string => {
  const safeDate = toSafeDate(date);
  if (!safeDate) return 'Date not available';
  
  const now = new Date();
  const diffMs = now.getTime() - safeDate.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  
  return formatShortDate(date);
};

/**
 * @deprecated Use formatRelativeTime instead
 * Backward compatibility alias for getRelativeTimeString
 */
export const getRelativeTimeString = formatRelativeTime;

/**
 * Gets time difference in milliseconds
 */
export const getTimeDiff = (date1: FirebaseDate, date2: FirebaseDate): number => {
  const safeDate1 = toSafeDate(date1);
  const safeDate2 = toSafeDate(date2);
  
  if (!safeDate1 || !safeDate2) return 0;
  
  return Math.abs(safeDate1.getTime() - safeDate2.getTime());
};
