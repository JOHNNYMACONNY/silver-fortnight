/**
 * CSRF Protection Utilities
 * Provides token generation and validation for form submissions
 */

export interface CSRFToken {
  token: string;
  timestamp: number;
  expires: number;
}

/**
 * Generate a CSRF token
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Create a CSRF token with expiration
 */
export const createCSRFToken = (): CSRFToken => {
  const token = generateCSRFToken();
  const timestamp = Date.now();
  const expires = timestamp + (15 * 60 * 1000); // 15 minutes
  
  return {
    token,
    timestamp,
    expires
  };
};

/**
 * Validate a CSRF token
 */
export const validateCSRFToken = (token: string, storedToken: CSRFToken | null): boolean => {
  if (!storedToken) return false;
  
  // Check if token has expired
  if (Date.now() > storedToken.expires) return false;
  
  // Check if token matches
  return token === storedToken.token;
};

/**
 * Store CSRF token in sessionStorage
 */
export const storeCSRFToken = (token: CSRFToken): void => {
  try {
    sessionStorage.setItem('csrf_token', JSON.stringify(token));
  } catch (error) {
    console.warn('Failed to store CSRF token:', error);
  }
};

/**
 * Retrieve CSRF token from sessionStorage
 */
export const getCSRFToken = (): CSRFToken | null => {
  try {
    const stored = sessionStorage.getItem('csrf_token');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to retrieve CSRF token:', error);
    return null;
  }
};

/**
 * Clear CSRF token
 */
export const clearCSRFToken = (): void => {
  try {
    sessionStorage.removeItem('csrf_token');
  } catch (error) {
    console.warn('Failed to clear CSRF token:', error);
  }
};
