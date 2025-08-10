// Correct the import statement
import { jest, beforeEach } from '@jest/globals';
// Configure test environment variables
process.env = {
  ...process.env,
  // Firebase config
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
  VITE_FIREBASE_MEASUREMENT_ID: 'G-TEST123456',
  
  // Cloudinary config
  VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud',
  VITE_CLOUDINARY_UPLOAD_PRESET: 'test-preset',
  VITE_CLOUDINARY_API_KEY: 'test-api-key',

  // App config
  VITE_APP_ENV: 'test',
  VITE_API_URL: 'http://localhost:5000',
  VITE_APP_URL: 'http://localhost:3000',
  
  // Test mode flags
  NODE_ENV: 'test',
  MODE: 'test',
  
  // Clear any real credentials
  FIREBASE_TOKEN: undefined,
  GOOGLE_APPLICATION_CREDENTIALS: undefined
};

// Configure global test settings
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.console = {
  ...console,
  // Ignore certain console messages in tests
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock window properties commonly used in tests
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

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
  (global.console.error as jest.Mock).mockClear();
  (global.console.warn as jest.Mock).mockClear();
  (global.console.info as jest.Mock).mockClear();
});

// Fail on unhandled promise rejections
process.on('unhandledRejection', (error) => {
  throw error;
});
