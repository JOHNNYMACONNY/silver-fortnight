// Test to verify Firebase mocking is working
// Mock Firebase modules explicitly BEFORE any imports
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
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
    onAuthStateChanged: jest.fn().mockImplementation((callback: any) => {
      if (typeof callback === 'function') {
        callback({ uid: 'test-uid', email: 'test@example.com' });
      }
      return () => {};
    })
  })),
  GoogleAuthProvider: jest.fn(() => ({
    PROVIDER_ID: 'google.com'
  })),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  signInWithPopup: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn().mockImplementation((callback: any) => {
    if (typeof callback === 'function') {
      callback({ uid: 'test-uid', email: 'test@example.com' });
    }
    return () => {};
  })
}));

jest.mock('../firebase-config', () => ({
  getSyncFirebaseDb: jest.fn(() => ({
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
  })),
  getSyncFirebaseAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      emailVerified: true
    }
  }))
}));

import { getAuth } from 'firebase/auth';
import { getSyncFirebaseDb } from '../firebase-config';

describe('Firebase Mocking', () => {
  it('should mock getAuth from firebase/auth', () => {
    const auth = getAuth();
    expect(auth).toBeDefined();
    expect(auth.currentUser).toBeDefined();
    expect(auth.currentUser.uid).toBe('test-user-id');
  });

  it('should mock getSyncFirebaseDb from firebase-config', () => {
    const db = getSyncFirebaseDb();
    expect(db).toBeDefined();
    expect(typeof db.collection).toBe('function');
  });
});
