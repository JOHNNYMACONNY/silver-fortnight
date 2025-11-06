import "@testing-library/jest-dom";
import { TextEncoder } from "util";

// Mock Vite environment config - MUST come before any other imports
jest.mock("./src/config/env", () => ({
  getViteEnv: jest.fn(() => ({
    VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud-name',
    VITE_CLOUDINARY_UPLOAD_PRESET: 'test-preset',
    VITE_CLOUDINARY_API_KEY: 'test-key',
    VITE_CLOUDINARY_PROFILE_PRESET: 'test-profile-preset',
    VITE_CLOUDINARY_BANNER_PRESET: 'test-banner-preset',
    VITE_CLOUDINARY_PORTFOLIO_PRESET: 'test-portfolio-preset',
    VITE_CLOUDINARY_PROJECT_PRESET: 'test-project-preset',
    VITE_PROFILE_ENRICH_ROLES: 'true',
    DEV: false,
    MODE: 'test',
    PROD: false,
  })),
  isDevelopment: jest.fn(() => false),
  getEnvVar: jest.fn((key: string, fallback: string = '') => {
    const mockEnv: Record<string, string> = {
      VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud-name',
      VITE_CLOUDINARY_UPLOAD_PRESET: 'test-preset',
      VITE_CLOUDINARY_API_KEY: 'test-key',
      VITE_CLOUDINARY_PROFILE_PRESET: 'test-profile-preset',
      VITE_CLOUDINARY_BANNER_PRESET: 'test-banner-preset',
      VITE_CLOUDINARY_PORTFOLIO_PRESET: 'test-portfolio-preset',
      VITE_CLOUDINARY_PROJECT_PRESET: 'test-project-preset',
      VITE_PROFILE_ENRICH_ROLES: 'true',
    };
    return mockEnv[key] || fallback;
  }),
  CLOUDINARY_CLOUD_NAME: 'test-cloud-name',
  CLOUDINARY_UPLOAD_PRESET: 'test-preset',
  CLOUDINARY_API_KEY: 'test-key',
  CLOUDINARY_PROFILE_PRESET: 'test-profile-preset',
  CLOUDINARY_BANNER_PRESET: 'test-banner-preset',
  CLOUDINARY_PORTFOLIO_PRESET: 'test-portfolio-preset',
  CLOUDINARY_PROJECT_PRESET: 'test-project-preset',
}));

// Set up global TextEncoder for tests
(global as unknown as { TextEncoder?: typeof TextEncoder }).TextEncoder =
  TextEncoder;

// Mock ResizeObserver for tests
(global as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia for tests
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
jest.mock("@firebase/rules-unit-testing", () => ({
  initializeTestEnvironment: jest.fn(),
  assertSucceeds: jest.fn(),
  assertFails: jest.fn(),
}));
const rulesTesting = jest.requireMock("@firebase/rules-unit-testing") as {
  initializeTestEnvironment: jest.Mock;
  assertSucceeds: jest.Mock;
  assertFails: jest.Mock;
};
rulesTesting.initializeTestEnvironment.mockResolvedValue(mockTestEnv);
rulesTesting.assertSucceeds.mockImplementation(
  async (p: Promise<unknown>) => await p
);
rulesTesting.assertFails.mockImplementation(async (p: Promise<unknown>) => {
  try {
    await p;
    throw new Error("Operation allowed");
  } catch {
    return;
  }
});

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
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
  VITE_CLOUDINARY_CLOUD_NAME: "test-cloud",
  VITE_CLOUDINARY_UPLOAD_PRESET: "test-preset",
  VITE_CLOUDINARY_PROFILE_PRESET: "test-profile-preset",
  env: {
    VITE_CLOUDINARY_CLOUD_NAME: "test-cloud",
    VITE_CLOUDINARY_UPLOAD_PRESET: "test-preset",
    VITE_CLOUDINARY_PROFILE_PRESET: "test-profile-preset",
  } as any,
};

// Mock imageUtils to avoid import.meta issues - must come before any imports
jest.mock("./src/utils/imageUtils", () => ({
  safeImageUrl: jest.fn((url) => url || undefined),
  getFallbackAvatar: jest.fn((name) => `fallback-avatar-${name || 'U'}.svg`),
  getProfileImageUrlBasic: jest.fn((url) => url || undefined),
  getProfileImageUrl: jest.fn((url) => url || "default-avatar.png"),
  generateAvatarUrl: jest.fn((name) => `avatar-${name || 'user'}.png`),
  uploadToCloudinary: jest.fn(async () => ({
    url: "https://test.cloudinary.com/image.jpg",
    publicId: "test-public-id",
  })),
  optimizeImageUrl: jest.fn((url) => url),
  getOptimizedImageUrl: jest.fn((url) => url),
}));

// Mock ProfileImage component that uses imageUtils
jest.mock("./src/components/ui/ProfileImage", () => {
  const React = require("react");
  return {
    ProfileImage: ({ photoURL, profilePicture, displayName, className }: any) =>
      React.createElement("img", {
        src: profilePicture || photoURL || "default-avatar.png",
        alt: displayName || "User",
        className: className || "",
        "data-testid": "profile-image",
      }),
  };
});
