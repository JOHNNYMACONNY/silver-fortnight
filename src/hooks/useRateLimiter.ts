/**
 * Rate limiting hook for messaging operations
 * Prevents excessive API calls and improves performance
 */

import { useRef, useCallback } from "react";
import { logger } from '@utils/logging/logger';

interface RateLimiterOptions {
  maxCalls: number;
  windowMs: number;
  blockDuration?: number; // How long to block after limit exceeded
}

interface RateLimitResult {
  allowed: boolean;
  remainingCalls: number;
  resetTime: number;
  isBlocked: boolean;
}

export const useRateLimiter = (options: RateLimiterOptions) => {
  const { maxCalls, windowMs, blockDuration = windowMs } = options;

  const callTimestamps = useRef<number[]>([]);
  const blockedUntil = useRef<number>(0);

  const checkRateLimit = useCallback((): RateLimitResult => {
    const now = Date.now();

    // Check if we're currently blocked
    if (now < blockedUntil.current) {
      return {
        allowed: false,
        remainingCalls: 0,
        resetTime: blockedUntil.current,
        isBlocked: true,
      };
    }

    // Remove timestamps outside the current window
    const windowStart = now - windowMs;
    callTimestamps.current = callTimestamps.current.filter(
      (timestamp) => timestamp > windowStart
    );

    const currentCalls = callTimestamps.current.length;
    const remainingCalls = Math.max(0, maxCalls - currentCalls);

    if (currentCalls >= maxCalls) {
      // Rate limit exceeded, block for the specified duration
      blockedUntil.current = now + blockDuration;
      return {
        allowed: false,
        remainingCalls: 0,
        resetTime: blockedUntil.current,
        isBlocked: true,
      };
    }

    return {
      allowed: true,
      remainingCalls,
      resetTime: windowStart + windowMs,
      isBlocked: false,
    };
  }, [maxCalls, windowMs, blockDuration]);

  const executeWithRateLimit = useCallback(
    <T>(
      operation: () => T,
      onRateLimited?: (result: RateLimitResult) => void
    ): T | null => {
      const rateLimitResult = checkRateLimit();

      if (!rateLimitResult.allowed) {
        if (onRateLimited) {
          onRateLimited(rateLimitResult);
        }
        return null;
      }

      // Record this call
      callTimestamps.current.push(Date.now());

      return operation();
    },
    [checkRateLimit]
  );

  const executeAsyncWithRateLimit = useCallback(
    async <T>(
      operation: () => Promise<T>,
      onRateLimited?: (result: RateLimitResult) => void
    ): Promise<T | null> => {
      const rateLimitResult = checkRateLimit();

      if (!rateLimitResult.allowed) {
        if (onRateLimited) {
          onRateLimited(rateLimitResult);
        }
        return null;
      }

      // Record this call
      callTimestamps.current.push(Date.now());

      return await operation();
    },
    [checkRateLimit]
  );

  const getRemainingCalls = useCallback((): number => {
    const result = checkRateLimit();
    return result.remainingCalls;
  }, [checkRateLimit]);

  const getResetTime = useCallback((): number => {
    const result = checkRateLimit();
    return result.resetTime;
  }, [checkRateLimit]);

  const isCurrentlyBlocked = useCallback((): boolean => {
    const result = checkRateLimit();
    return result.isBlocked;
  }, [checkRateLimit]);

  const reset = useCallback(() => {
    callTimestamps.current = [];
    blockedUntil.current = 0;
  }, []);

  return {
    executeWithRateLimit,
    executeAsyncWithRateLimit,
    checkRateLimit,
    getRemainingCalls,
    getResetTime,
    isCurrentlyBlocked,
    reset,
  };
};

// Predefined rate limiters for common messaging operations
export const useMessageSendRateLimit = () => {
  return useRateLimiter({
    maxCalls: 10, // 10 messages per minute
    windowMs: 60 * 1000, // 1 minute
    blockDuration: 30 * 1000, // Block for 30 seconds
  });
};

export const useMessageReadRateLimit = () => {
  return useRateLimiter({
    maxCalls: 30, // 30 read operations per minute
    windowMs: 60 * 1000, // 1 minute
    blockDuration: 10 * 1000, // Block for 10 seconds
  });
};

export const useConversationLoadRateLimit = () => {
  return useRateLimiter({
    maxCalls: 5, // 5 conversation loads per minute
    windowMs: 60 * 1000, // 1 minute
    blockDuration: 15 * 1000, // Block for 15 seconds
  });
};

// Global rate limiter for emergency situations
const globalRateLimiter: ReturnType<typeof useRateLimiter> | null = null;

export const getGlobalRateLimiter = () => {
  if (!globalRateLimiter) {
    // This is a workaround since we can't use hooks outside components
    // In practice, this would be managed by a context provider
    logger.warn("Global rate limiter not initialized. Use within a component context.", 'APP');
  }
  return globalRateLimiter;
};

// Emergency rate limiting function
export const emergencyRateLimit = (operation: string): boolean => {
  // Simple timestamp-based rate limiting for emergency use
  const key = `emergency_${operation}`;
  const now = Date.now();
  const lastCall = parseInt(localStorage.getItem(key) || "0");

  if (now - lastCall < 1000) {
    // 1 second minimum between calls
    logger.warn(`Emergency rate limit triggered for ${operation}`, 'APP');
    return false;
  }

  localStorage.setItem(key, now.toString());
  return true;
};
