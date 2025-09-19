import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Save original console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  log: console.log
};

// Mock fetch
const mockFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: function() { return Object.assign({}, this); }
  })
);

(global as any).fetch = mockFetch;

// Mock console methods
console.error = jest.fn();
console.warn = jest.fn();
console.info = jest.fn();
console.log = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
class MockResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
(global as any).ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(_callback: IntersectionObserverCallback) {}
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords(): IntersectionObserverEntry[] { return []; }
}
(global as any).IntersectionObserver = MockIntersectionObserver;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Add required TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
  // @ts-expect-error - Node.js util module
  (global as any).TextEncoder = eval('require')('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  // @ts-expect-error - Node.js util module
  (global as any).TextDecoder = eval('require')('util').TextDecoder;
}

// Cleanup utilities
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear DOM
  document.body.innerHTML = '';
  
  // Reset fetch mock
  mockFetch.mockClear();
  
  // Reset localStorage mock
  (localStorage.getItem as jest.Mock).mockClear();
  (localStorage.setItem as jest.Mock).mockClear();
  (localStorage.removeItem as jest.Mock).mockClear();
  (localStorage.clear as jest.Mock).mockClear();
  
  // Reset console mocks
  (console.error as jest.Mock).mockClear();
  (console.warn as jest.Mock).mockClear();
  (console.info as jest.Mock).mockClear();
  (console.log as jest.Mock).mockClear();
});

// Restore console after all tests
afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.log = originalConsole.log;
});

// Error handlers
process.on('unhandledRejection', error => {
  console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

// Custom matchers
declare module '@jest/expect' {
  interface Matchers<R> {
    toHaveBeenCalledOnceWith(...args: any[]): R;
  }
}

expect.extend({
  toHaveBeenCalledOnceWith(received: jest.Mock, ...args: any[]) {
    const pass = received.mock.calls.length === 1 &&
                 JSON.stringify(received.mock.calls[0]) === JSON.stringify(args);
    
    return {
      message: () =>
        pass
          ? `Expected mock not to have been called once with ${args}`
          : `Expected mock to have been called once with ${args}`,
      pass
    };
  }
});