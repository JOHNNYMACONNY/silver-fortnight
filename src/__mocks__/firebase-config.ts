/**
 * Firebase configuration mock for tests
 * Comprehensive mock that covers both firebase-config imports and Firebase SDK imports
 */
import { Firestore } from "firebase/firestore";

// Mock Firestore instance
const mockFirestore = {
  app: {},
  type: "firestore",
  _delegate: {},
  _databaseId: { projectId: "test-project", database: "(default)" },
  _persistenceKey: "test-key",
  _settings: {},
  _terminated: false,
} as unknown as Firestore;

// Mock Firebase Auth
const mockAuth = {
  app: {},
  name: "default",
  config: {},
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
} as any;

// Mock Firebase Storage
const mockStorage = {
  app: {},
  maxOperationRetryTime: 120000,
  maxUploadRetryTime: 600000,
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
} as any;

// Mock Firebase App
export const mockFirebaseApp = {
  name: '[DEFAULT]',
  options: {
    apiKey: 'test-api-key',
    authDomain: 'test-project.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test-project.appspot.com',
  }
};

// Mock initialization functions
export const getFirebaseConfig = jest.fn(() => ({
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id",
}));

export const initializeFirebase = jest.fn(() =>
  Promise.resolve({
    auth: mockAuth,
    db: mockFirestore,
    storage: mockStorage,
  })
);

export function initializeApp(config?: any) {
  return mockFirebaseApp;
}

export const getFirebaseInstances = jest.fn(() => ({
  auth: mockAuth,
  db: mockFirestore,
  storage: mockStorage,
}));

// Sync getters - CRITICAL for many tests!
export const getSyncFirebaseAuth = jest.fn(() => mockAuth);
export const getSyncFirebaseDb = jest.fn(() => mockFirestore);
export const getSyncFirebaseStorage = jest.fn(() => mockStorage);

// Mock SDK functions
export function getAuth(app?: any) {
  return mockAuth;
}

export function getFirestore(app?: any) {
  return mockFirestore;
}

export function getStorage(app?: any) {
  return mockStorage;
}

export function getAnalytics(app?: any) {
  return {
    logEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn()
  };
}

// Export instances with multiple aliases for compatibility
export const firebaseAuth = mockAuth;
export const firebaseDb = mockFirestore;
export const db = mockFirestore;
export const auth = mockAuth;
export const storage = mockStorage;
export const analytics = getAnalytics();

// Default export
export default getSyncFirebaseDb;

// Mock utility functions
export const getDocuments = jest.fn(() =>
  Promise.resolve({ data: [], error: null })
);
export const addDocument = jest.fn(() =>
  Promise.resolve({ data: "mock-doc-id", error: null })
);
export const updateDocument = jest.fn(() =>
  Promise.resolve({ data: null, error: null })
);
export const deleteDocument = jest.fn(() =>
  Promise.resolve({ data: null, error: null })
);
export const getDocument = jest.fn(() =>
  Promise.resolve({ data: null, error: null })
);

// Mock Firestore functions
export const mockDoc = jest.fn();
export const mockGetDoc = jest.fn(() =>
  Promise.resolve({
    exists: () => false,
    data: () => null,
    id: "mock-id",
    ref: {},
  })
);
export const mockSetDoc = jest.fn(() => Promise.resolve());
export const mockUpdateDoc = jest.fn(() => Promise.resolve());
export const mockDeleteDoc = jest.fn(() => Promise.resolve());
export const mockCollection = jest.fn();
export const mockQuery = jest.fn();
export const mockWhere = jest.fn();
export const mockOrderBy = jest.fn();
export const mockLimit = jest.fn();
export const mockGetDocs = jest.fn(() =>
  Promise.resolve({
    empty: true,
    size: 0,
    docs: [],
    forEach: jest.fn(),
  })
);
export const mockOnSnapshot = jest.fn(() => jest.fn());
export const mockRunTransaction = jest.fn(() => Promise.resolve());
export const mockWriteBatch = jest.fn(() => ({
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(() => Promise.resolve()),
}));

// Reset all mocks function for test cleanup
export const resetAllMocks = () => {
  jest.clearAllMocks();

  getSyncFirebaseDb.mockReturnValue(mockFirestore);
  getSyncFirebaseAuth.mockReturnValue(mockAuth);
  getSyncFirebaseStorage.mockReturnValue(mockStorage);

  mockGetDoc.mockResolvedValue({
    exists: () => false,
    data: () => null,
    id: "mock-id",
    ref: {},
  });

  mockGetDocs.mockResolvedValue({
    empty: true,
    size: 0,
    docs: [],
    forEach: jest.fn(),
  });

  mockOnSnapshot.mockReturnValue(jest.fn());
  mockRunTransaction.mockResolvedValue(undefined);

  const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  };
  mockWriteBatch.mockReturnValue(mockBatch);
};

// Initialize mocks
resetAllMocks();
