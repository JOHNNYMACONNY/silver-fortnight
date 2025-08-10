export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SecurityEventType = 'auth' | 'token' | 'rate_limit' | 'suspicious' | 'admin' | 'system';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: ErrorSeverity;
  ip?: string;
  userAgent?: string;
  userId?: string;
  timestamp: number;
  details: Record<string, any>;
}

export interface TokenClaims {
  iss: string;
  sub: string;
  aud: string[];
  exp: number;
  iat: number;
  roles: string[];
  permissions: string[];
}

export interface TokenValidationResult {
  isValid: boolean;
  claims?: TokenClaims;
  error?: string;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDuration: number;
  backoffMultiplier: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  nextResetTime?: number;
  blockedUntil?: number;
}

export interface EnhancedError extends Error {
  category?: string;
  severity?: ErrorSeverity;
  metadata?: Record<string, any>;
}
