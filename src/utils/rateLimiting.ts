import { RateLimitResult, RateLimitConfig } from '../types/security';
import { AUTH_CONSTANTS } from './constants';

interface RateLimitState {
  attempts: number[];
  blockedUntil?: number;
  backoffLevel: number;
  lastViolationTime?: number; // Track when the last violation occurred
}

interface RateLimitStore {
  [key: string]: RateLimitState;
}

export interface RateLimiterStrategy {
  checkLimit: (identifier: string) => Promise<RateLimitResult>;
  getStatus: (identifier: string) => {
    attempts: number[];
    remainingAttempts: number;
    blockedUntil?: number;
  };
  reset: (identifier: string) => void;
  resetAll: () => void;
  updateConfig: (config: Partial<RateLimitConfig>) => void;
}

export class EnhancedRateLimiter implements RateLimiterStrategy {
  private store: RateLimitStore = {};
  private config: RateLimitConfig = {
    maxAttempts: AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS,
    windowMs: AUTH_CONSTANTS.RATE_LIMIT.WINDOW_MS,
    blockDuration: AUTH_CONSTANTS.RATE_LIMIT.BLOCK_DURATION,
    backoffMultiplier: AUTH_CONSTANTS.RATE_LIMIT.BACKOFF_MULTIPLIER
  };

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const state = this.getState(identifier);

    // Check if currently blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: state.blockedUntil
      };
    }

    // Clear expired block
    if (state.blockedUntil && now >= state.blockedUntil) {
      state.blockedUntil = undefined;
      // Don't reset backoff level immediately - it should persist for repeated violations
    }

    // Clean up old attempts
    state.attempts = state.attempts.filter(
      timestamp => now - timestamp < this.config.windowMs
    );

    // Reset backoff level after a period of good behavior (no violations for longer than reset period)
    const resetPeriod = AUTH_CONSTANTS.RATE_LIMIT.RESET_PERIOD || (this.config.blockDuration * 3);
    if (state.backoffLevel > 0 && state.lastViolationTime && 
        now - state.lastViolationTime > resetPeriod) {
      state.backoffLevel = 0;
    }

    // Check if within limit
    if (state.attempts.length < this.config.maxAttempts) {
      state.attempts.push(now);
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - state.attempts.length
      };
    }

    // Block the identifier
    state.backoffLevel++;
    state.lastViolationTime = now; // Track when this violation occurred
    state.blockedUntil = now + (this.config.blockDuration * Math.pow(this.config.backoffMultiplier, state.backoffLevel - 1));

    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: state.blockedUntil,
      nextResetTime: now + this.config.windowMs
    };
  }

  getStatus(identifier: string) {
    const state = this.getState(identifier);
    const now = Date.now();

    // Clean up old attempts
    state.attempts = state.attempts.filter(
      timestamp => now - timestamp < this.config.windowMs
    );

    return {
      attempts: state.attempts,
      remainingAttempts: Math.max(0, this.config.maxAttempts - state.attempts.length),
      blockedUntil: state.blockedUntil
    };
  }

  reset(identifier: string): void {
    delete this.store[identifier];
  }

  resetAll(): void {
    this.store = {};
  }

  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  private getState(identifier: string): RateLimitState {
    if (!this.store[identifier]) {
      this.store[identifier] = {
        attempts: [],
        backoffLevel: 0
      };
    }
    return this.store[identifier];
  }
}

// Singleton instance
export const rateLimiter = new EnhancedRateLimiter();
