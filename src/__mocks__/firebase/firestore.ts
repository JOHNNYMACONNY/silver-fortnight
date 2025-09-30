// Mock Firebase Firestore functions for tests

// Mock document reference
const mockDocRef = {
  id: "mock-doc-id",
  path: "mock-collection/mock-doc-id",
  parent: {},
  firestore: {},
  converter: null,
  withConverter: jest.fn(),
};

// Mock collection reference
const mockCollectionRef = {
  id: "mock-collection",
  path: "mock-collection",
  parent: null,
  firestore: {},
  converter: null,
  withConverter: jest.fn(),
};

// Mock query snapshot
const mockQuerySnapshot = {
  empty: true,
  size: 0,
  docs: [],
  forEach: jest.fn(),
  docChanges: jest.fn(() => []),
  metadata: {
    hasPendingWrites: false,
    fromCache: false,
  },
};

// Mock document snapshot
const mockDocSnapshot = {
  exists: jest.fn(() => false),
  data: jest.fn(() => null),
  get: jest.fn(),
  id: "mock-doc-id",
  ref: mockDocRef,
  metadata: {
    hasPendingWrites: false,
    fromCache: false,
  },
};

// Mock Firestore functions
export const doc = jest.fn(() => mockDocRef);
export const collection = jest.fn(() => mockCollectionRef);
export const query = jest.fn(() => ({}));
export const where = jest.fn(() => ({}));
export const orderBy = jest.fn(() => ({}));
export const limit = jest.fn(() => ({}));
export const startAfter = jest.fn(() => ({}));
export const endBefore = jest.fn(() => ({}));

// Document operations
export const getDoc = jest.fn(() => Promise.resolve(mockDocSnapshot));
export const getDocs = jest.fn(() => Promise.resolve(mockQuerySnapshot));
export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
export const addDoc = jest.fn(() => Promise.resolve(mockDocRef));

// Real-time operations
export const onSnapshot = jest.fn((target, callback) => {
  // Simulate immediate callback with empty data
  if (typeof callback === "function") {
    setTimeout(() => callback(mockQuerySnapshot), 0);
  }
  // Return unsubscribe function
  return jest.fn();
});

// Transaction operations
export const runTransaction = jest.fn((firestore, updateFunction) => {
  const mockTransaction = {
    get: jest.fn(() => Promise.resolve(mockDocSnapshot)),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return Promise.resolve(updateFunction(mockTransaction));
});

// Batch operations
export const writeBatch = jest.fn(() => ({
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(() => Promise.resolve()),
}));

// Field operations
export const arrayUnion = jest.fn((...elements) => ({
  _methodName: "arrayUnion",
  _elements: elements,
}));
export const arrayRemove = jest.fn((...elements) => ({
  _methodName: "arrayRemove",
  _elements: elements,
}));
export const increment = jest.fn((n) => ({
  _methodName: "increment",
  _operand: n,
}));
export const serverTimestamp = jest.fn(() => ({
  _methodName: "serverTimestamp",
}));
export const deleteField = jest.fn(() => ({ _methodName: "deleteField" }));

// Timestamp operations
export const Timestamp = {
  now: jest.fn(() => ({
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
  })),
  fromDate: jest.fn((date) => ({
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  })),
  fromMillis: jest.fn((millis) => ({
    seconds: Math.floor(millis / 1000),
    nanoseconds: 0,
  })),
};

// GeoPoint
export const GeoPoint = jest.fn((latitude, longitude) => ({
  latitude,
  longitude,
}));

// DocumentReference type
export const DocumentReference = jest.fn();

// CollectionReference type
export const CollectionReference = jest.fn();

// Query type
export const Query = jest.fn();

// Reset function for test cleanup
export const resetFirestoreMocks = () => {
  jest.clearAllMocks();

  // Reset default implementations
  doc.mockReturnValue(mockDocRef);
  collection.mockReturnValue(mockCollectionRef);
  query.mockReturnValue({});
  where.mockReturnValue({});
  orderBy.mockReturnValue({});
  limit.mockReturnValue({});

  getDoc.mockResolvedValue(mockDocSnapshot);
  getDocs.mockResolvedValue(mockQuerySnapshot);
  setDoc.mockResolvedValue(undefined);
  updateDoc.mockResolvedValue(undefined);
  deleteDoc.mockResolvedValue(undefined);
  addDoc.mockResolvedValue(mockDocRef);

  onSnapshot.mockImplementation((target, callback) => {
    if (typeof callback === "function") {
      setTimeout(() => callback(mockQuerySnapshot), 0);
    }
    return jest.fn();
  });

  runTransaction.mockImplementation((firestore, updateFunction) => {
    const mockTransaction = {
      get: jest.fn(() => Promise.resolve(mockDocSnapshot)),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    return Promise.resolve(updateFunction(mockTransaction));
  });

  const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  };
  writeBatch.mockReturnValue(mockBatch);

  // Reset document snapshot
  mockDocSnapshot.exists.mockReturnValue(false);
  mockDocSnapshot.data.mockReturnValue(null);
};

// Initialize mocks
resetFirestoreMocks();
