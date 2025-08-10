export const AUTH_CONSTANTS = {
  TOKEN: {
    VALIDATION_TIMEOUT: 5000, // 5 seconds
    EXPIRY_BUFFER: 300, // 5 minutes in seconds
    MIN_LENGTH: 100,
    REFRESH_THRESHOLD: 3600 // 1 hour in seconds
  },
  
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 300000, // 5 minutes
    BLOCK_DURATION: 900000, // 15 minutes
    BACKOFF_MULTIPLIER: 2,
    WHITELIST: ['localhost', '127.0.0.1'],
    STRICT_ROUTES: ['/admin', '/api'],
    RESET_PERIOD: 3600000 // 1 hour
  },

  MONITORING: {
    MAX_STORED_EVENTS: 1000,
    SUSPICIOUS_THRESHOLD: 10,
    ANALYSIS_WINDOW: 3600000, // 1 hour
    ALERT_THRESHOLD: {
      low: 10,
      medium: 5,
      high: 3,
      critical: 1
    },
    LOG_RETENTION_DAYS: 30,
    BATCH_SIZE: 100
  },

  SECURITY: {
    PASSWORD: {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBER: true,
      REQUIRE_SPECIAL: true,
      MAX_AGE_DAYS: 90,
      HISTORY_SIZE: 5
    },
    SESSION: {
      MAX_DURATION: 86400000, // 24 hours
      IDLE_TIMEOUT: 1800000, // 30 minutes
      EXTEND_ON_ACTIVITY: true
    },
    ACCESS_CONTROL: {
      DEFAULT_ROLE: 'user',
      ADMIN_ROLES: ['admin', 'super_admin'],
      GUEST_ROUTES: ['/login', '/signup', '/reset-password', '/help'],
      PROTECTED_ROUTES: ['/dashboard', '/profile', '/settings'],
      ADMIN_ROUTES: ['/admin', '/admin/*']
    }
  }
};

export const ERROR_MESSAGES = {
  TOKEN: {
    EXPIRED: 'Your session has expired. Please log in again.',
    INVALID: 'Invalid authentication token.',
    MISSING: 'Authentication token is required.',
    MALFORMED: 'Authentication token is malformed.'
  },
  RATE_LIMIT: {
    EXCEEDED: 'Too many attempts. Please try again later.',
    BLOCKED: 'Access temporarily blocked due to suspicious activity.',
    REMAINING: (attempts: number) => `${attempts} attempts remaining.`
  },
  AUTH: {
    UNAUTHORIZED: 'Please log in to access this resource.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    WEAK_PASSWORD: 'Password does not meet security requirements.'
  },
  SECURITY: {
    SUSPICIOUS_ACTIVITY: 'Suspicious activity detected.',
    BLOCKED_IP: 'Your IP address has been temporarily blocked.',
    VALIDATION_FAILED: 'Security validation failed.',
    CSRF_MISMATCH: 'Security token mismatch.',
    CORS_ERROR: 'Cross-origin request blocked.'
  }
};

export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    LOGOUT: '/logout',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email'
  },
  DASHBOARD: {
    HOME: '/dashboard',
    PROFILE: '/profile',
    SETTINGS: '/settings'
  },
  ADMIN: {
    HOME: '/admin',
    USERS: '/admin/users',
    SETTINGS: '/admin/settings',
    SECURITY: '/admin/security',
    LOGS: '/admin/logs'
  },
  ERROR: {
    NOT_FOUND: '/404',
    FORBIDDEN: '/403',
    UNAUTHORIZED: '/401',
    SERVER_ERROR: '/500'
  }
};
