// Simple Firebase mock for testing - JavaScript version
const getAuth = jest.fn(() => ({
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    emailVerified: true
  },
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  signInWithPopup: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn().mockImplementation((callback) => {
    if (typeof callback === 'function') {
      callback({ uid: 'test-uid', email: 'test@example.com' });
    }
    return () => {};
  })
}));

const getSyncFirebaseDb = jest.fn(() => ({
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ mockData: true }),
        id: 'mock-doc-id'
      }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined)
    }),
    add: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: [],
      empty: true,
      size: 0,
      forEach: jest.fn()
    })
  }),
  doc: jest.fn().mockReturnValue({
    id: 'mock-doc-id',
    get: jest.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({ mockData: true }),
      id: 'mock-doc-id'
    }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined)
  })
}));

const getSyncFirebaseAuth = getAuth;
const getSyncFirebaseStorage = jest.fn(() => ({}));
const getFirestore = getSyncFirebaseDb;
const getStorage = getSyncFirebaseStorage;

const initializeApp = jest.fn(() => ({
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
}));

// Firebase/Firestore functions
const doc = jest.fn().mockReturnValue({
  id: 'mock-doc-id',
  path: 'mock/path',
  get: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ mockData: true }),
    id: 'mock-doc-id'
  }),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined)
});

const getDoc = jest.fn().mockResolvedValue({
  exists: () => true,
  data: () => ({ mockData: true }),
  id: 'mock-doc-id'
});

const getDocs = jest.fn().mockResolvedValue({
  docs: [],
  empty: true,
  size: 0,
  forEach: jest.fn()
});

const collection = jest.fn().mockReturnValue({
  doc: jest.fn().mockReturnValue({
    id: 'mock-doc-id',
    get: jest.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({ mockData: true }),
      id: 'mock-doc-id'
    }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined)
  }),
  add: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({
    docs: [],
    empty: true,
    size: 0,
    forEach: jest.fn()
  })
});

// Auth functions
const signInWithEmailAndPassword = jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } });
const signInWithPopup = jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } });
const createUserWithEmailAndPassword = jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } });
const signOut = jest.fn().mockResolvedValue(undefined);
const onAuthStateChanged = jest.fn().mockImplementation((callback) => {
  if (typeof callback === 'function') {
    callback({ uid: 'test-uid', email: 'test@example.com' });
  }
  return () => {};
});

// Google Auth Provider
const GoogleAuthProvider = {
  PROVIDER_ID: 'google.com',
  credentialFromResult: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token'
  })
};

// Timestamp mock
const Timestamp = {
  now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
  fromDate: (date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }),
  fromMillis: (millis) => ({ seconds: millis / 1000, nanoseconds: 0 })
};

// Other commonly used functions
const initializeFirebase = jest.fn().mockResolvedValue(undefined);
const requireAuth = jest.fn().mockReturnValue({ uid: 'test-uid', email: 'test@example.com' });
const rateLimiter = {
  check: jest.fn().mockResolvedValue(true),
  increment: jest.fn().mockResolvedValue(undefined)
};

// Test helpers
const __resetMocks = () => {
  // Reset all mock functions
  Object.values(getSyncFirebaseDb()).forEach(mock => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear();
    }
  });
};

// Firebase Error mock
const FirebaseError = jest.fn().mockImplementation((code, message) => ({
  code,
  message,
  name: 'FirebaseError'
}));

// Export all functions using CommonJS syntax
module.exports = {
  getAuth,
  getSyncFirebaseDb,
  getSyncFirebaseAuth,
  getSyncFirebaseStorage,
  getFirestore,
  getStorage,
  initializeApp,
  doc,
  getDoc,
  getDocs,
  collection,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  Timestamp,
  initializeFirebase,
  requireAuth,
  rateLimiter,
  __resetMocks,
  FirebaseError
};
