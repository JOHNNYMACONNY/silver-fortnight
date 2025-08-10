import {
  initializeApp,
  getAuth,
  getFirestore,
  getStorage,
  GoogleAuthProvider,
  mockUtils,
  __setMockUser,
  __resetMocks,
  createAuthError,
  Transaction
} from '../__mocks__/firebase-config';

describe('Firebase Config Mocks', () => {
  beforeEach(() => {
    __resetMocks();
  });

  describe('App Initialization', () => {
    it('should initialize app with mock config', () => {
      const app = initializeApp({});
      expect(app.name).toBe('[DEFAULT]');
      expect(app.options.apiKey).toBe('test-api-key');
      expect(app.options.projectId).toBe('test-project');
    });
  });

  describe('Authentication', () => {
    it('should handle sign in', async () => {
      const auth = getAuth();
      const result = await auth.signInWithEmailAndPassword('test@test.com', 'password');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should handle sign out', async () => {
      const auth = getAuth();
      await auth.signOut();
      expect(auth.signOut).toHaveBeenCalled();
    });

    it('should track auth state changes', () => {
      const auth = getAuth();
      const callback = jest.fn();
      
      const unsubscribe = auth.onAuthStateChanged(callback);
      expect(callback).toHaveBeenCalledWith(mockUtils.user);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow setting mock user', () => {
      const auth = getAuth();
      const newUser = {
        ...mockUtils.user,
        uid: 'new-user',
        email: 'new@test.com'
      };
      
      __setMockUser(newUser);
      expect(auth.currentUser).toBe(newUser);
      
      __setMockUser(null);
      expect(auth.currentUser).toBeNull();
    });
  });

  describe('Firestore', () => {
    it('should handle document operations', async () => {
      const db = getFirestore();
      const docRef = db.doc('test/123');

      await docRef.set({ name: 'Test' });
      expect(docRef.set).toHaveBeenCalledWith({ name: 'Test' });

      const doc = await docRef.get();
      expect(doc.exists()).toBe(true);
      expect(typeof doc.id).toBe('string');
      expect(doc.ref.path).toContain('123');
    });

    it('should handle collection operations', async () => {
      const db = getFirestore();
      const collectionRef = db.collection('tests');
      
      // Test document creation
      const docRef = await collectionRef.add({ field: 'value' });
      expect(docRef.id).toBeDefined();
      expect(typeof docRef.id).toBe('string');

      // Test document methods
      expect(docRef.set).toBeDefined();
      expect(docRef.update).toBeDefined();
      expect(docRef.delete).toBeDefined();
    });

    it('should handle collection methods', async () => {
      const db = getFirestore();
      const collectionRef = db.collection('tests');
      
      // Verify collection methods exist
      expect(typeof collectionRef.doc).toBe('function');
      expect(typeof collectionRef.add).toBe('function');
      expect(typeof collectionRef.get).toBe('function');

      // Test collection query
      const snapshot = await collectionRef.get();
      expect(snapshot.empty).toBe(true);
      expect(snapshot.size).toBe(0);
      expect(Array.isArray(snapshot.docs)).toBe(true);
    });

    it('should handle batch operations', async () => {
      const db = getFirestore();
      const batch = db.batch();
      const docRef = db.doc('test/123');

      batch.set(docRef, { field: 'value' });
      batch.update(docRef, { field: 'updated' });
      batch.delete(docRef);

      await batch.commit();
      expect(batch.commit).toHaveBeenCalled();
      expect(batch.set).toHaveBeenCalledWith(docRef, { field: 'value' });
      expect(batch.update).toHaveBeenCalledWith(docRef, { field: 'updated' });
      expect(batch.delete).toHaveBeenCalledWith(docRef);
    });

    it('should handle transactions', async () => {
      const db = getFirestore();
      
      await db.runTransaction(async (transaction: Transaction) => {
        const docRef = db.doc('test/123');
        const doc = await transaction.get(docRef);
        
        expect(doc).toBeDefined();
        expect(doc.exists()).toBe(true);

        transaction.set(docRef, { field: 'value' });
        transaction.update(docRef, { field: 'updated' });
        transaction.delete(docRef);
      });

      expect(db.runTransaction).toHaveBeenCalled();
    });
  });

  describe('Storage', () => {
    it('should handle file operations', async () => {
      const storage = getStorage();
      const fileRef = storage.ref('test.jpg');
      const testFile = new File([], 'test.jpg');

      const uploadResult = await fileRef.put(testFile);
      const downloadURL = await uploadResult.ref.getDownloadURL();
      
      expect(downloadURL).toBe('https://example.com/test.jpg');
      expect(fileRef.put).toHaveBeenCalledWith(testFile);
    });

    it('should handle file deletion', async () => {
      const storage = getStorage();
      const fileRef = storage.ref('test.jpg');

      await fileRef.delete();
      expect(fileRef.delete).toHaveBeenCalled();
    });

    it('should handle file download URLs', async () => {
      const storage = getStorage();
      const fileRef = storage.ref('test.jpg');
      
      const url = await fileRef.getDownloadURL();
      expect(url).toBe('https://example.com/test.jpg');
      expect(fileRef.getDownloadURL).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should create auth errors', () => {
      const error = createAuthError('auth/invalid-email', 'Invalid email');
      expect(error instanceof Error).toBe(true);
      expect(error.code).toBe('auth/invalid-email');
      expect(error.message).toBe('Invalid email');
    });

    it('should handle Google authentication', () => {
      const credential = GoogleAuthProvider.credentialFromResult({
        user: mockUtils.user
      });
      expect(credential.accessToken).toBe('mock-access-token');
    });

    it('should reset mocks correctly', () => {
      const auth = getAuth();
      const db = getFirestore();
      const storage = getStorage();

      auth.signInWithEmailAndPassword('test@test.com', 'password');
      db.collection('tests').doc('123').get();
      storage.ref('test.jpg').getDownloadURL();

      __resetMocks();

      expect(auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
      expect(db.collection).not.toHaveBeenCalled();
      expect(storage.ref).not.toHaveBeenCalled();
    });
  });
});