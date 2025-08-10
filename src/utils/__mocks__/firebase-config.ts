import { jest } from '@jest/globals';
import { MockTimestamp, createMockDoc } from '../__tests__/testUtils';

// Types
interface FirebaseApp {
  name: string;
  options: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
}

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthError extends Error {
  code: string;
}

interface DocData {
  [key: string]: any;
}

// Mock Data
const mockUser: FirebaseUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true
};

const mockApp: FirebaseApp = {
  name: '[DEFAULT]',
  options: {
    apiKey: 'test-api-key',
    authDomain: 'test-project.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456',
    measurementId: 'G-TEST123456'
  }
};

// Mock Functions
const mockJestFn = () => {
  const fn = jest.fn() as any;
  fn.mockReturnThis = () => {
    fn.mockImplementation(() => fn);
    return fn;
  };
  return fn;
};

// Auth Mocks
const mockAuthMethods = {
  signInWithEmailAndPassword: mockJestFn(),
  signInWithPopup: mockJestFn(),
  createUserWithEmailAndPassword: mockJestFn(),
  signOut: mockJestFn(),
  onAuthStateChanged: mockJestFn()
};

Object.values(mockAuthMethods).forEach(mock => {
  mock.mockReturnValue(Promise.resolve({ user: mockUser }));
});

mockAuthMethods.onAuthStateChanged.mockImplementation((callback: (user: any) => void) => {
  callback(mockUser);
  return () => {};
});

const mockAuth = {
  currentUser: mockUser,
  ...mockAuthMethods
};

// Firestore Mocks
const createDocRef = (id: string) => ({
  id,
  path: `mock/path/${id}`,
  get: mockJestFn().mockResolvedValue(createMockDoc({ id } as DocData)),
  set: mockJestFn().mockResolvedValue(undefined),
  update: mockJestFn().mockResolvedValue(undefined),
  delete: mockJestFn().mockResolvedValue(undefined)
});

const createQuerySnapshot = () => ({
  docs: [],
  empty: true,
  size: 0,
  forEach: mockJestFn()
});

const createCollectionRef = () => {
  // Create a globally chainable query that all operations return
  let globalChainableQuery: any;
  
  const createChainableQuery = (): any => {
    const query: any = {
      where: mockJestFn(),
      orderBy: mockJestFn(),
      limit: mockJestFn(),
      get: mockJestFn(),
      getDocs: mockJestFn()
    };
    
    // Make each method return this same query object for proper chaining
    query.where.mockImplementation((...args: any[]) => {
      return query;
    });
    query.orderBy.mockImplementation((...args: any[]) => {
      return query;
    });
    query.limit.mockImplementation((limitValue: any) => {
      return query;
    });
    query.get.mockResolvedValue(createQuerySnapshot());
    query.getDocs.mockResolvedValue(createQuerySnapshot());
    
    return query;
  };

  // Initialize the global chainable query
  globalChainableQuery = createChainableQuery();

  const ref = {
    doc: mockJestFn(),
    add: mockJestFn(),
    where: mockJestFn(),
    orderBy: mockJestFn(),
    limit: mockJestFn(),
    get: mockJestFn(),
    getDocs: mockJestFn()
  };

  ref.doc.mockImplementation((id: string) => createDocRef(id));
  ref.add.mockImplementation(async () => {
    const id = Math.random().toString(36).substring(7);
    return createDocRef(id);
  });
  
  // Make collection methods return the global chainable query instance
  ref.where.mockImplementation((...args: any[]) => {
    return globalChainableQuery;
  });
  ref.orderBy.mockImplementation((...args: any[]) => {
    return globalChainableQuery;
  });
  ref.limit.mockImplementation((limitValue: any) => {
    return globalChainableQuery;
  });
  ref.get.mockResolvedValue(createQuerySnapshot());
  ref.getDocs.mockResolvedValue(createQuerySnapshot());

  return ref;
};

const createBatchMock = () => ({
  set: mockJestFn().mockReturnThis(),
  update: mockJestFn().mockReturnThis(),
  delete: mockJestFn().mockReturnThis(),
  commit: mockJestFn().mockResolvedValue(undefined),
  operations: []
});

const mockTransaction = {
  get: mockJestFn().mockResolvedValue(createMockDoc({})),
  set: mockJestFn(),
  update: mockJestFn(),
  delete: mockJestFn()
};

const mockFirestore = {
  collection: mockJestFn().mockImplementation(() => {
    const ref = createCollectionRef();
    // Ensure the collection reference itself is chainable
    return ref;
  }),
  doc: mockJestFn().mockImplementation((path: string) => createDocRef(path)),
  batch: mockJestFn().mockReturnValue(createBatchMock()),
  runTransaction: mockJestFn().mockImplementation(async (handler: (transaction: any) => Promise<any>) => {
    return handler(mockTransaction);
  })
};

// Storage Mocks
const createStorageRef = () => ({
  put: mockJestFn().mockResolvedValue({
    ref: {
      getDownloadURL: mockJestFn().mockResolvedValue('https://example.com/test.jpg')
    }
  }),
  delete: mockJestFn().mockResolvedValue(undefined),
  getDownloadURL: mockJestFn().mockResolvedValue('https://example.com/test.jpg')
});

const mockStorage = {
  ref: mockJestFn().mockReturnValue(createStorageRef())
};

// Initialize Mock Functions
export const initializeApp = mockJestFn().mockReturnValue(mockApp);
export const getAuth = mockJestFn().mockReturnValue(mockAuth);
export const getFirestore = mockJestFn().mockReturnValue(mockFirestore);
export const getStorage = mockJestFn().mockReturnValue(mockStorage);
export const GoogleAuthProvider = {
  PROVIDER_ID: 'google.com',
  credentialFromResult: mockJestFn().mockReturnValue({
    accessToken: 'mock-access-token'
  })
};

// Utils
export { MockTimestamp as Timestamp };

// Test Helpers
export const __setMockUser = (user: FirebaseUser | null) => {
  (mockAuth as any).currentUser = user;
};

export const __resetMocks = () => {
  (mockAuth as any).currentUser = mockUser;
  Object.values(mockAuthMethods).forEach(mock => mock.mockClear());
  mockFirestore.collection.mockClear();
  mockFirestore.doc.mockClear();
  mockStorage.ref.mockClear();
};

export const createAuthError = (code: string, message: string): AuthError => {
  const error = new Error(message) as AuthError;
  error.code = code;
  return error;
};

// Test Utilities Export
export const mockUtils = {
  app: mockApp,
  auth: mockAuth,
  user: mockUser,
  firestore: mockFirestore,
  storage: mockStorage,
  transaction: mockTransaction,
  createDocRef,
  createCollectionRef,
  createBatchMock,
  createStorageRef,
  createAuthError
};