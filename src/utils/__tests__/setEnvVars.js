// Jest environment setup for Vite environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
  VITE_FIREBASE_MEASUREMENT_ID: 'G-TEST123456',
  VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud',
  VITE_CLOUDINARY_UPLOAD_PRESET: 'test-preset',
  VITE_CLOUDINARY_API_KEY: 'test-cloudinary-key',
  VITE_API_BASE_URL: 'http://localhost:5000',
  VITE_WEBSOCKET_URL: 'ws://localhost:5001',
  VITE_APP_VERSION: '1.0.0-test'
};

// NOTE: import.meta.env is now handled by src/config/env.ts
// The env config is mocked in jest.setup.ts
// This avoids the "Cannot assign to read only property" error

// Setup test-specific values
global.__TEST__ = true;
global.__DEV__ = true;
global.__PROD__ = false;

// Mock window.matchMedia if not available (for Jest DOM)
if (!window.matchMedia) {
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
}

// Mock window.scrollTo
if (!window.scrollTo) {
  window.scrollTo = jest.fn();
}

// Mock storage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock performance API if needed
if (!window.performance) {
  window.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    getEntries: jest.fn(() => []),
  };
}

// Mock crypto API if needed
if (!window.crypto) {
  window.crypto = {
    getRandomValues: arr => {
      return arr.map(() => Math.floor(Math.random() * 256));
    },
    subtle: {
      digest: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  };
}

// Export setup and teardown functions for Jest
module.exports = {
  // Reset all mocks before each test
  setupFiles() {
    // This will be run by Jest setup
  },
  
  // This will be properly recognized by Jest
  beforeEach() {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  }
};