interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

class AuthRateLimiter {
  private attempts: Map<string, AttemptRecord>;

  constructor() {
    this.attempts = new Map();
  }

  /**
   * Check if an IP address should be rate limited
   * @param identifier - IP address or other unique identifier
   * @returns Object containing whether the request is allowed and time remaining if limited
   */
  checkRateLimit(identifier: string): { allowed: boolean; timeRemaining?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    // Clean up old records
    this.cleanup();

    if (!record) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
      });
      return { allowed: true };
    }

    // Check if the window has expired
    if (now - record.firstAttempt >= RATE_LIMIT_WINDOW) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
      });
      return { allowed: true };
    }

    // Check if under the limit
    if (record.count < MAX_ATTEMPTS) {
      this.attempts.set(identifier, {
        ...record,
        count: record.count + 1,
      });
      return { allowed: true };
    }

    // Rate limited
    const timeRemaining = RATE_LIMIT_WINDOW - (now - record.firstAttempt);
    return {
      allowed: false,
      timeRemaining,
    };
  }

  /**
   * Reset rate limit for an identifier
   * @param identifier - IP address or other unique identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clean up expired rate limit records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [identifier, record] of this.attempts.entries()) {
      if (now - record.firstAttempt >= RATE_LIMIT_WINDOW) {
        this.attempts.delete(identifier);
      }
    }
  }

  /**
   * Format remaining time into a human-readable string
   * @param ms - Time in milliseconds 
   */
  static formatTimeRemaining(ms: number): string {
    const minutes = Math.ceil(ms / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

// Export singleton instance
export const authRateLimiter = new AuthRateLimiter();
