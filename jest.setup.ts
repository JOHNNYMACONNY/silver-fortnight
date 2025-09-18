import "@testing-library/jest-dom";
import { TextEncoder } from "util";

// Set up global TextEncoder for tests
(global as unknown as { TextEncoder?: typeof TextEncoder }).TextEncoder =
  TextEncoder;

// Custom TextDecoder mock compatible with browser interface
class MockTextDecoder {
  decode(input?: ArrayBuffer | ArrayBufferView | null): string {
    if (!input) return "";
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input).reduce(
        (acc, byte) => acc + String.fromCharCode(byte),
        ""
      );
    }
    if (ArrayBuffer.isView(input)) {
      return Array.from(input as Uint8Array).reduce(
        (acc, byte) => acc + String.fromCharCode(byte),
        ""
      );
    }
    return "";
  }
}

(global as unknown as { TextDecoder?: typeof MockTextDecoder }).TextDecoder =
  MockTextDecoder;

// Create a mock implementation for the Firebase testing utilities early so mocks can reference it
const mockTestEnv = {
  authenticatedContext: (_uid: string, _claims?: Record<string, unknown>) => {
    void _uid;
    void _claims;
    return {
      firestore: () => ({
        collection: jest.fn(),
        doc: jest.fn(),
      }),
      storage: () => ({
        ref: jest.fn(),
      }),
    };
  },
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

// Expose testEnv for cleanup utilities and other helpers
(global as unknown as { testEnv?: unknown }).testEnv = mockTestEnv;

// Mock Firebase testing module and wire its functions to the mock implementation
// Use doMock (non-hoisted) so the mock factory runs at runtime after `mockTestEnv` is defined.
// This avoids "Cannot access 'mockTestEnv' before initialization" when Jest hoists jest.mock calls.
jest.doMock("@firebase/rules-unit-testing", () => {
  const impl = {
    initializeTestEnvironment: jest.fn(),
    assertSucceeds: jest.fn(),
    assertFails: jest.fn(),
  };

  // Wire the mocks to the already-initialized mockTestEnv
  impl.initializeTestEnvironment.mockResolvedValue(mockTestEnv);
  impl.assertSucceeds.mockImplementation(async (p: Promise<unknown>) => await p);
  impl.assertFails.mockImplementation(async (p: Promise<unknown>) => {
    try {
      await p;
      throw new Error("Operation allowed");
    } catch {
      return;
    }
  });

  return impl;
});
const rulesTesting = jest.requireMock("@firebase/rules-unit-testing") as {
  initializeTestEnvironment: jest.Mock;
  assertSucceeds: jest.Mock;
  assertFails: jest.Mock;
};

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
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
  async toBeAllowed(received: Promise<unknown>) {
    try {
      await received;
      return {
        message: () => "Operation was allowed",
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Operation was denied: ${error}`,
        pass: false,
      };
    }
  },
  async toBeDenied(received: Promise<unknown>) {
    try {
      await received;
      return {
        message: () => "Operation was incorrectly allowed",
        pass: false,
      };
    } catch {
      return {
        message: () => "Operation was correctly denied",
        pass: true,
      };
    }
  },
});

// Mock Node.js file system for reading rules files
jest.mock("fs", () => ({
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
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAllowed(): Promise<R>;
      toBeDenied(): Promise<R>;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

// Mock process.env with testing values
process.env = {
  ...process.env,
  NODE_ENV: "test",
  FIREBASE_PROJECT_ID: "demo-test-project",
  FIREBASE_API_KEY: "test-api-key",
  FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
};
