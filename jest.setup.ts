import '@testing-library/jest-dom';
import { TextEncoder } from 'util';

// Set up global TextEncoder for tests
(global as any).TextEncoder = TextEncoder;

// Custom TextDecoder mock compatible with browser interface
class MockTextDecoder {
  decode(input?: ArrayBuffer | ArrayBufferView | null): string {
    if (!input) return '';
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input).reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    }
    if (ArrayBuffer.isView(input)) {
      return Array.from(input as Uint8Array).reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    }
    return '';
  }
}

(global as any).TextDecoder = MockTextDecoder;

// Mock Firebase modules
jest.mock('@firebase/rules-unit-testing', () => ({
  initializeTestEnvironment: jest.fn(),
  assertSucceeds: jest.fn(),
  assertFails: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Setup global test environment
beforeAll(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Add custom matchers
expect.extend({
  async toBeAllowed(received: Promise<any>) {
    try {
      await received;
      return {
        message: () => 'Operation was allowed',
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Operation was denied: ${error}`,
        pass: false,
      };
    }
  },
  async toBeDenied(received: Promise<any>) {
    try {
      await received;
      return {
        message: () => 'Operation was incorrectly allowed',
        pass: false,
      };
    } catch (error) {
      return {
        message: () => 'Operation was correctly denied',
        pass: true,
      };
    }
  },
});

// Mock Node.js file system for reading rules files
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(`
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Mock rules for testing
        match /{document=**} {
          allow read, write: if false;
        }
      }
    }
  `),
}));

// Setup global variables and types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAllowed(): Promise<R>;
      toBeDenied(): Promise<R>;
    }
  }
}

// Mock process.env with testing values
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  FIREBASE_PROJECT_ID: 'demo-test-project',
  FIREBASE_API_KEY: 'test-api-key',
  FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
};

// Create a mock implementation for the Firebase testing utilities
const mockTestEnv = {
  authenticatedContext: (uid: string, claims?: Record<string, any>) => ({
    firestore: () => ({
      collection: jest.fn(),
      doc: jest.fn(),
    }),
    storage: () => ({
      ref: jest.fn(),
    }),
  }),
  unauthenticatedContext: () => ({
    firestore: () => ({
      collection: jest.fn(),
      doc: jest.fn(),
    }),
    storage: () => ({
      ref: jest.fn(),
    }),
  }),
  clearFirestore: jest.fn(),
  clearStorage: jest.fn(),
  cleanup: jest.fn(),
};

// Provide mock implementations for Firebase testing utilities
(global as any).initializeTestEnvironment = jest.fn().mockResolvedValue(mockTestEnv);
(global as any).assertSucceeds = jest.fn().mockImplementation(async (promise) => await promise);
(global as any).assertFails = jest.fn().mockRejectedValue(new Error('Operation denied'));
