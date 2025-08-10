import { EnhancedRateLimiter } from '../rateLimiting';
import { AUTH_CONSTANTS } from '../constants';

describe('EnhancedRateLimiter', () => {
  let limiter: EnhancedRateLimiter;
  const testIdentifier = 'test-id';

  beforeEach(() => {
    limiter = new EnhancedRateLimiter();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic rate limiting', () => {
    it('allows requests within limit', async () => {
      for (let i = 0; i < AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS; i++) {
        const result = await limiter.checkLimit(testIdentifier);
        expect(result.allowed).toBe(true);
        expect(result.remainingAttempts).toBe(AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS - i - 1);
      }
    });

    it('blocks requests when limit exceeded', async () => {
      // Use up all attempts
      for (let i = 0; i < AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS; i++) {
        await limiter.checkLimit(testIdentifier);
      }

      const result = await limiter.checkLimit(testIdentifier);
      expect(result.allowed).toBe(false);
      expect(result.blockedUntil).toBeDefined();
      expect(result.remainingAttempts).toBe(0);
    });

    it('resets after window expires', async () => {
      // Use up all attempts
      for (let i = 0; i < AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS; i++) {
        await limiter.checkLimit(testIdentifier);
      }

      // Advance time past window
      jest.advanceTimersByTime(AUTH_CONSTANTS.RATE_LIMIT.WINDOW_MS + 1000);

      const result = await limiter.checkLimit(testIdentifier);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS - 1);
    });
  });

  describe('exponential backoff', () => {
    it('increases block duration after multiple violations', async () => {
      const blockDurations: number[] = [];

      // Trigger multiple blocks
      for (let j = 0; j < 3; j++) {
        // Use up all attempts
        for (let i = 0; i < AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS; i++) {
          await limiter.checkLimit(testIdentifier);
        }

        const result = await limiter.checkLimit(testIdentifier);
        expect(result.allowed).toBe(false);
        expect(result.blockedUntil).toBeDefined();

        if (result.blockedUntil) {
          blockDurations.push(result.blockedUntil - Date.now());
        }

        // Move past block duration
        jest.advanceTimersByTime(AUTH_CONSTANTS.RATE_LIMIT.BLOCK_DURATION * 2);
      }

      // Verify increasing block durations
      for (let i = 1; i < blockDurations.length; i++) {
        expect(blockDurations[i]).toBeGreaterThan(blockDurations[i - 1]);
      }
    });
  });

  describe('status tracking', () => {
    it('tracks remaining attempts accurately', async () => {
      await limiter.checkLimit(testIdentifier);
      const status = limiter.getStatus(testIdentifier);

      expect(status.attempts.length).toBe(1);
      expect(status.remainingAttempts).toBe(AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS - 1);
    });

    it('tracks blocked status', async () => {
      // Use up all attempts
      for (let i = 0; i < AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS; i++) {
        await limiter.checkLimit(testIdentifier);
      }
      await limiter.checkLimit(testIdentifier);

      const status = limiter.getStatus(testIdentifier);
      expect(status.blockedUntil).toBeDefined();
      expect(status.remainingAttempts).toBe(0);
    });

    it('cleans up expired attempts', async () => {
      await limiter.checkLimit(testIdentifier);
      jest.advanceTimersByTime(AUTH_CONSTANTS.RATE_LIMIT.WINDOW_MS + 1000);

      const status = limiter.getStatus(testIdentifier);
      expect(status.attempts.length).toBe(0);
      expect(status.remainingAttempts).toBe(AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS);
    });
  });

  describe('configuration updates', () => {
    it('applies new configuration', async () => {
      const newConfig = {
        maxAttempts: 2,
        windowMs: 1000
      };

      limiter.updateConfig(newConfig);

      // Should be blocked after 2 attempts
      await limiter.checkLimit(testIdentifier);
      await limiter.checkLimit(testIdentifier);
      const result = await limiter.checkLimit(testIdentifier);

      expect(result.allowed).toBe(false);
    });

    it('maintains state when updating config', async () => {
      await limiter.checkLimit(testIdentifier);

      limiter.updateConfig({
        maxAttempts: 10
      });

      const status = limiter.getStatus(testIdentifier);
      expect(status.attempts.length).toBe(1);
    });
  });

  describe('reset functionality', () => {
    it('resets state for specific identifier', async () => {
      await limiter.checkLimit(testIdentifier);
      limiter.reset(testIdentifier);

      const status = limiter.getStatus(testIdentifier);
      expect(status.attempts.length).toBe(0);
      expect(status.remainingAttempts).toBe(AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS);
    });

    it('resets all rate limiting state', async () => {
      const ids = ['test1', 'test2'];
      for (const id of ids) {
        await limiter.checkLimit(id);
      }

      limiter.resetAll();

      for (const id of ids) {
        const status = limiter.getStatus(id);
        expect(status.attempts.length).toBe(0);
        expect(status.remainingAttempts).toBe(AUTH_CONSTANTS.RATE_LIMIT.MAX_ATTEMPTS);
      }
    });
  });
});
