import { jest } from '@jest/globals';

// Configure Jest for security tests
jest.setTimeout(10000); // Increase timeout for security operations

// Mock timers globally for rate limiting and token tests
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-05-21T12:00:00Z'));
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Mock fetch for security monitoring IP lookup
const mockFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ ip: '127.0.0.1' })
  })
);

// Type assertion to make TypeScript happy with our mock
(global as any).fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
} as Storage;

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
} as Storage;

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock navigator properties for security checks
Object.defineProperty(window.navigator, 'userAgent', {
  value: 'test-user-agent',
  configurable: true
});

Object.defineProperty(window.navigator, 'language', {
  value: 'en-US',
  configurable: true
});

// Mock console methods to suppress warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Custom matchers for security tests
expect.extend({
  toBeValidSecurityEvent(received: unknown) {
    const pass = Boolean(
      received &&
      typeof (received as any).type === 'string' &&
      typeof (received as any).severity === 'string' &&
      typeof (received as any).timestamp === 'number' &&
      typeof (received as any).details === 'object'
    );

    return {
      message: () =>
        `expected ${JSON.stringify(received)} to be a valid security event`,
      pass
    };
  },

  toBeWithinRateLimit(received: unknown, { maxAttempts, windowMs }: { maxAttempts: number; windowMs: number }) {
    const payload = received as any;
    const pass = Boolean(
      payload &&
      payload.allowed === (payload.attempts < maxAttempts) &&
      (payload.nextResetTime ?? 0) > Date.now() &&
      (payload.nextResetTime ?? 0) <= Date.now() + windowMs
    );

    return {
      message: () =>
        `expected ${JSON.stringify(received)} to be a valid rate limit result within configured limits`,
      pass
    };
  },

  toHaveValidTokenClaims(received: unknown) {
    const claims = received as any;
    const now = Math.floor(Date.now() / 1000);
    const pass = Boolean(
      claims &&
      typeof claims.exp === 'number' &&
      claims.exp > now &&
      typeof claims.iat === 'number' &&
      claims.iat <= now &&
      Array.isArray(claims.aud) &&
      Array.isArray(claims.roles) &&
      Array.isArray(claims.permissions)
    );

    return {
      message: () =>
        `expected ${JSON.stringify(received)} to have valid token claims`,
      pass
    };
  }
});

// Extend type definitions for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSecurityEvent(): R;
      toBeWithinRateLimit(config: { maxAttempts: number; windowMs: number }): R;
      toHaveValidTokenClaims(): R;
    }
  }
}
