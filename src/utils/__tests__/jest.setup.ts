import '@testing-library/jest-dom';
import 'jest-extended';
import React from 'react';

// Set up global polyfills before any other imports
import { TextEncoder } from 'util';

// Make React available globally for JSX
(global as any).React = React;

// Mock JSX runtime for jest.mock() factories
(global as any).jsx_runtime_1 = {
  jsx: (type: any, props: any, key?: any) => ({ type, props, key }),
  jsxs: (type: any, props: any, key?: any) => ({ type, props, key }),
  Fragment: React.Fragment
};

// Mock react_1 for jest.mock() factories
(global as any).react_1 = {
  default: React,
  createElement: React.createElement,
  Fragment: React.Fragment,
  useState: React.useState,
  useEffect: React.useEffect,
  useContext: React.useContext,
  useReducer: React.useReducer,
  useCallback: React.useCallback,
  useMemo: React.useMemo,
  useRef: React.useRef,
  useImperativeHandle: React.useImperativeHandle,
  useLayoutEffect: React.useLayoutEffect,
  useDebugValue: React.useDebugValue
};

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

// Mock window.matchMedia
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

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock import.meta for Vite environment
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false,
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test-domain',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket',
        VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender',
        VITE_FIREBASE_APP_ID: 'test-app-id',
        VITE_FIREBASE_MEASUREMENT_ID: 'test-measurement',
        VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud',
        VITE_CLOUDINARY_UPLOAD_PRESET: 'test-preset'
      }
    }
  }
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ip: '127.0.0.1' }),
  })
) as jest.Mock;

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    signOut: jest.fn(),
  })),
  GoogleAuthProvider: jest.fn(() => ({
    setCustomParameters: jest.fn(),
  })),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  signInWithPopup: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  createUserWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()), // Return an unsubscribe function
  updateProfile: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  FirebaseError: class FirebaseError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'FirebaseError';
    }
  },
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  runTransaction: jest.fn(async (_db, fn) => {
    const txn = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    return await fn(txn);
  }),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

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

// Configure test environment
beforeAll(() => {
  // Set up any global test configuration
});

afterAll(() => {
  // Clean up any global test configuration
});

beforeEach(() => {
  // Reset any test state before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test - but don't restore mocks as that would clear our Firebase mocks
  // jest.restoreAllMocks(); // Commented out to preserve Firebase mocks
});

// Basic test to satisfy Jest requirement
describe('jest.setup', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
