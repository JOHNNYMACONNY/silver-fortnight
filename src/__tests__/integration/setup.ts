/**
 * Integration Test Setup
 * 
 * Global setup and configuration for integration tests.
 * This file is loaded before all integration tests run.
 */

import '@testing-library/jest-dom';
import { TextEncoder } from 'util';

// Add missing global APIs for test environment
(global as any).TextEncoder = TextEncoder;

// Skip TextDecoder setup to avoid type conflicts
// (global as any).TextDecoder = TextDecoder as any;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  root: Element | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset storage mocks
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
});

afterEach(() => {
  // Clean up any remaining timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress specific console errors that are expected in tests
console.error = (...args: any[]) => {
  const message = args[0];
  
  // Suppress React warnings that are expected in integration tests
  if (
    typeof message === 'string' &&
    (
      message.includes('Warning: ReactDOM.render is deprecated') ||
      message.includes('Warning: componentWillReceiveProps has been renamed') ||
      message.includes('Warning: componentWillMount has been renamed') ||
      message.includes('Warning: componentWillUpdate has been renamed') ||
      message.includes('Warning: Failed prop type') ||
      message.includes('Warning: React.createFactory() is deprecated') ||
      message.includes('Warning: Using UNSAFE_') ||
      message.includes('Firebase: No Firebase App') ||
      message.includes('auth/configuration-not-found')
    )
  ) {
    return;
  }
  
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = args[0];
  
  // Suppress specific warnings that are expected in integration tests
  if (
    typeof message === 'string' &&
    (
      message.includes('Warning: componentWillReceiveProps has been renamed') ||
      message.includes('Warning: componentWillMount has been renamed') ||
      message.includes('Warning: componentWillUpdate has been renamed') ||
      message.includes('Warning: Using UNSAFE_') ||
      message.includes('Firebase: No Firebase App')
    )
  ) {
    return;
  }
  
  originalConsoleWarn.apply(console, args);
};

// Mock Firebase Timestamp for consistent testing
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  Timestamp: {
    now: jest.fn(() => ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
      toDate: jest.fn(() => new Date()),
      toMillis: jest.fn(() => Date.now()),
    })),
    fromDate: jest.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: jest.fn(() => date),
      toMillis: jest.fn(() => date.getTime()),
    })),
  },
}));

// Integration test utilities
export const integrationTestUtils = {
  // Wait for async operations to complete
  waitForAsyncOperations: async (timeout = 1000) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  },
  
  // Mock user for authentication tests
  createMockUser: (overrides = {}) => ({
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    ...overrides,
  }),
  
  // Mock Firestore document
  createMockDoc: (data: any, id = 'test-doc-id') => ({
    id,
    data: () => data,
    exists: true,
    ref: {
      id,
      path: `test-collection/${id}`,
    },
  }),
  
  // Mock Firestore collection
  createMockCollection: (docs: any[] = []) => ({
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: any) => void) => docs.forEach(callback),
  }),
  
  // Mock service response
  createMockServiceResponse: (data: any = null, success = true, error: string | null = null) => ({
    success,
    data,
    error,
  }),
  
  // Mock Firebase error
  createMockFirebaseError: (code: string, message: string) => ({
    code,
    message,
    name: 'FirebaseError',
  }),
  
  // Mock React Router location
  createMockLocation: (pathname = '/', search = '', hash = '') => ({
    pathname,
    search,
    hash,
    state: null,
    key: 'test-key',
  }),
  
  // Mock React Router history
  createMockHistory: () => ({
    length: 1,
    action: 'POP',
    location: integrationTestUtils.createMockLocation(),
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    block: jest.fn(),
    listen: jest.fn(),
    createHref: jest.fn(),
  }),
  
  // Mock form event
  createMockFormEvent: (preventDefault = jest.fn()) => ({
    preventDefault,
    stopPropagation: jest.fn(),
    target: {},
    currentTarget: {},
  }),
  
  // Mock file for upload tests
  createMockFile: (name = 'test.txt', type = 'text/plain', size = 1024) => {
    const file = new File(['test content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  },
  
  // Mock drag event
  createMockDragEvent: (files: File[] = []) => ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    dataTransfer: {
      files,
      items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
      types: ['Files'],
    },
  }),
  
  // Mock clipboard event
  createMockClipboardEvent: (text = 'test text') => ({
    preventDefault: jest.fn(),
    clipboardData: {
      getData: jest.fn(() => text),
      setData: jest.fn(),
    },
  }),
  
  // Mock keyboard event
  createMockKeyboardEvent: (key = 'Enter', code = 'Enter', ctrlKey = false, shiftKey = false) => ({
    key,
    code,
    ctrlKey,
    shiftKey,
    altKey: false,
    metaKey: false,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }),
  
  // Mock mouse event
  createMockMouseEvent: (clientX = 0, clientY = 0, button = 0) => ({
    clientX,
    clientY,
    button,
    buttons: 1,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }),
};

// Export for use in tests
export default integrationTestUtils;
