import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import {
  Auth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  User,
  connectAuthEmulator
} from 'firebase/auth';
import { Firestore, getFirestore, Timestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { logger } from '@utils/logging/logger';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as limitQuery,
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

/**
 * ROBUST Firebase Configuration - Fixed Version
 *
 * Addresses all critical issues causing hook.js:608 overrideMethod errors:
 * 1. Single initialization pattern
 * 2. Proper error handling without unsafe fallbacks
 * 3. Environment variable validation
 * 4. Prevents duplicate initialization
 * 5. Safe test environment handling
 */

// Environment variable validation with detailed error messages
const getRequiredEnvVar = (name: string): string => {
  try {
    // Test environment - return mock values
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      const testValues: Record<string, string> = {
        VITE_FIREBASE_API_KEY: 'mock-api-key-for-testing',
        VITE_FIREBASE_AUTH_DOMAIN: 'mock-project.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'mock-project-id',
        VITE_FIREBASE_STORAGE_BUCKET: 'mock-project.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef123456'
      };
      return testValues[name] || 'mock-value';
    }

    // PR environment - use staging project with PR-specific configuration
    const isPREnvironment = (typeof process !== 'undefined' && process.env.VITE_ENVIRONMENT === 'pr') ||
                           (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENVIRONMENT === 'pr');
    
    if (isPREnvironment) {
      // For PR environments, fallback to staging configuration if PR-specific values aren't set
      logger.debug('Firebase: Using PR environment configuration', 'APP');
    }

    // Production/Development environment
    let value: string | undefined;

    // Try Node.js environment variables first (for SSR/production scripts)
    if (typeof process !== 'undefined' && process.env) {
      value = process.env[name] || process.env[name.replace('VITE_', 'REACT_APP_')];
    }

    // Try Vite environment variables (browser environment)
    if (!value && typeof import.meta !== 'undefined' && import.meta.env) {
      value = (import.meta.env as Record<string, string>)[name];
    }

    // PR environment fallback to staging values
    if (!value && isPREnvironment) {
      const stagingFallbacks: Record<string, string> = {
        VITE_FIREBASE_PROJECT_ID: 'tradeya-45ede', // Use staging project for PR
        VITE_FIREBASE_AUTH_DOMAIN: 'tradeya-45ede.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'tradeya-45ede.appspot.com'
      };
      value = stagingFallbacks[name];
    }

    if (!value) {
      logger.error(`Missing required environment variable: ${name}`, 'APP');
      logger.error('Please ensure this variable is set in your .env file.', 'APP');
      throw new Error(
        `Missing required environment variable: ${name}. ` +
        `Please ensure this variable is set in your .env file or environment.`
      );
    }

    return value;
  } catch (error) {
    logger.error(`Environment variable error for ${name}:`, 'APP', {}, error as Error);
    throw error;
  }
};

// Firebase configuration with proper validation
const getFirebaseConfig = () => {
  try {
    const config = {
      apiKey: getRequiredEnvVar('VITE_FIREBASE_API_KEY'),
      authDomain: getRequiredEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: getRequiredEnvVar('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: getRequiredEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getRequiredEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getRequiredEnvVar('VITE_FIREBASE_APP_ID')
    };

    logger.debug('Firebase: Configuration loaded successfully', 'APP', {
      projectId: config.projectId,
      authDomain: config.authDomain
    });

    return config;
  } catch (error) {
    logger.error('Firebase configuration error:', 'APP', {}, error as Error);
    throw new Error(`Firebase configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Safe mock factory used only in test environment.
// Purpose: avoid referencing `jest` directly in production code paths while still
// providing test-friendly mocks when running under Jest.
const safeMock = (impl?: any) => {
  if (typeof jest !== 'undefined' && typeof (jest as any).fn === 'function') {
    const fn = (jest as any).fn(impl);
    if (typeof fn.mockResolvedValue === 'undefined') {
      (fn as any).mockResolvedValue = (v: any) => Promise.resolve(v);
    }
    if (typeof fn.mockReturnValue === 'undefined') {
      (fn as any).mockReturnValue = (v: any) => v;
    }
    return fn;
  }

  // Fallback noop function with minimal mock helpers so consumers can call
  // .mockResolvedValue / .mockReturnValue without runtime errors.
  const fallback: any = (..._args: any[]) => undefined;
  fallback.mockResolvedValue = (_v: any) => Promise.resolve(_v);
  fallback.mockReturnValue = (_v: any) => _v;
  return fallback;
};

// Global Firebase instances - initialized once
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

// Initialization state tracking
let initializationPromise: Promise<void> | null = null;
let initializationError: Error | null = null;

/**
 * Initialize Firebase services safely
 * Prevents duplicate initialization and handles errors properly
 */
const initializeFirebase = async (): Promise<void> => {
  // Return existing initialization promise if already in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Throw previous error if initialization failed
  if (initializationError) {
    throw initializationError;
  }

  // If already initialized, return immediately
  if (firebaseApp && firebaseAuth && firebaseDb && firebaseStorage) {
    logger.debug('Firebase: Already initialized, skipping', 'APP');
    return;
  }

  initializationPromise = (async () => {
    try {
      logger.debug('Firebase: Starting initialization...', 'APP');

      // Check if Firebase app already exists (prevents duplicate initialization)
      const existingApps = getApps();
      if (existingApps.length > 0) {
        logger.debug('Firebase: Using existing app instance', 'APP');
        firebaseApp = existingApps[0];
      } else {
        logger.debug('Firebase: Creating new app instance', 'APP');
        const config = getFirebaseConfig();
        firebaseApp = initializeApp(config);
      }

      // Initialize services
      firebaseAuth = getAuth(firebaseApp);
      firebaseDb = getFirestore(firebaseApp);
      firebaseStorage = getStorage(firebaseApp);

      // Enable long polling to fix Listen channel 400 errors
      try {
        // Use the correct Firebase v9+ settings API
        if (typeof (firebaseDb as any).settings === 'function') {
          (firebaseDb as any).settings({
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
            cacheSizeBytes: 40 * 1024 * 1024 // 40MB cache
          });
          logger.debug('Firebase: Long polling and enhanced settings enabled', 'APP');
        } else {
          // For Firebase v9+, use enableNetwork/disableNetwork approach
          logger.debug('Firebase: Using alternative connection method for v9+', 'APP');
          // The long polling will be handled at the query level
        }
      } catch (settingsError) {
        logger.warn('Firebase: Could not enable enhanced settings:', 'APP', settingsError);
        logger.debug('Firebase: Continuing with default connection settings', 'APP');
      }

      // Connect to emulators in development if they're running
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        try {
          // Only connect to emulators if they haven't been connected already
          if (process.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
            logger.debug('Firebase: Connecting to emulators...', 'APP');

            // Connect emulators only once
            if (!(firebaseAuth as any)._delegate?._emulator) {
              connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
            }
            if (!(firebaseDb as any)._delegate?._emulator) {
              connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
            }
            if (!(firebaseStorage as any)._delegate?._emulator) {
              connectStorageEmulator(firebaseStorage, 'localhost', 9199);
            }
          }
        } catch (emulatorError) {
          logger.warn('Firebase: Emulator connection failed (this is OK in production):', 'APP', emulatorError);
        }
      }

      logger.debug('Firebase: Initialization completed successfully', 'APP');

    } catch (error) {
      initializationError = error instanceof Error ? error : new Error('Firebase initialization failed');
      logger.error('Firebase: Initialization failed:', 'APP', {}, initializationError as Error);
      throw initializationError;
    }
  })();

  return initializationPromise;
};

/**
 * Safe getter for Firebase instances with initialization
 * Throws meaningful errors instead of returning empty objects
 */
const getFirebaseInstances = async () => {
  // Handle test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return {
      app: {} as FirebaseApp,
      auth: {
        currentUser: null,
        onAuthStateChanged: safeMock(),
        signOut: safeMock(),
      } as unknown as Auth,
      db: {} as Firestore,
      storage: {} as FirebaseStorage
    };
  }

  // Initialize if not already done
  if (!firebaseApp || !firebaseAuth || !firebaseDb || !firebaseStorage) {
    await initializeFirebase();
  }

  // Final validation
  if (!firebaseApp || !firebaseAuth || !firebaseDb || !firebaseStorage) {
    throw new Error('Firebase services failed to initialize properly');
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseDb,
    storage: firebaseStorage
  };
};

// Synchronous getters for backward compatibility (with proper error handling)
const getSyncFirebaseAuth = (): Auth => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return {
      currentUser: null,
      onAuthStateChanged: safeMock(),
      signOut: safeMock(),
    } as unknown as Auth;
  }

  if (!firebaseAuth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first or ensure initialization completed.');
  }
  return firebaseAuth;
};

const getSyncFirebaseDb = (): Firestore => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return {} as Firestore;
  }

  if (!firebaseDb) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first or ensure initialization completed.');
  }
  return firebaseDb;
};

const getSyncFirebaseStorage = (): FirebaseStorage => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return {} as FirebaseStorage;
  }

  if (!firebaseStorage) {
    throw new Error('Firebase Storage not initialized. Call initializeFirebase() first or ensure initialization completed.');
  }
  return firebaseStorage;
};

export {
  getFirebaseConfig,
  initializeFirebase,
  getFirebaseInstances,
  getSyncFirebaseAuth,
  getSyncFirebaseDb,
  getSyncFirebaseStorage
};

// Export initialized Firebase instances for use in other modules
export { firebaseAuth, firebaseDb };

// Export db alias for backward compatibility with existing imports (live binding)
export { firebaseDb as db };

// Default export keeps prior behavior (backwards compatible)
export default getSyncFirebaseDb;

// Initialize Firebase only in browser non-test environments to avoid
// running environment validation and initialization during SSR/build time.
if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env.NODE_ENV !== 'test')) {
  initializeFirebase().catch(error => {
    // Non-fatal during build; surface the error in logs for debugging.
    // Do not rethrow to avoid breaking SSR/build steps.
    logger.error('Failed to initialize Firebase on module load:', 'APP', {}, error as Error);
  });
}

/**
 * Provide a CommonJS export mapping that doesn't reference symbols declared later.
 * This assigns a plain object composed of the already-declared getters/vars so that
 * require(...) consumers receive usable function references in Jest/CJS interop.
 */
declare const module: any;
if (typeof module !== 'undefined' && module.exports) {
  try {
    // Provide a plain object with __esModule to improve CJS/ESM interop.
    // Export callable aliases and leave instance-backed getters separate so consumers can choose
    // between calling `db()` (function) or reading `dbInstance`/`firebaseDbInstance` (object).
    module.exports = {
      __esModule: true,
      getFirebaseConfig,
      initializeFirebase,
      getFirebaseInstances,
      getSyncFirebaseAuth,
      getSyncFirebaseDb,
      getSyncFirebaseStorage,
      // Callable alias for consumers that call db()
      db: getSyncFirebaseDb,
      // Default export (callable)
      default: getSyncFirebaseDb,
      // placeholders for instance-backed props (defined below)
      firebaseAuth: undefined,
      firebaseDb: undefined
    };

    // Keep named function exports available for require() consumers
    module.exports.getSyncFirebaseDb = getSyncFirebaseDb;
    module.exports.getSyncFirebaseAuth = getSyncFirebaseAuth;
    module.exports.getSyncFirebaseStorage = getSyncFirebaseStorage;
    module.exports.getFirebaseInstances = getFirebaseInstances;
    module.exports.initializeFirebase = initializeFirebase;
    module.exports.getFirebaseConfig = getFirebaseConfig;

    // Define live getters for instance-backed properties so CJS consumers see usable values
    Object.defineProperty(module.exports, 'firebaseAuthInstance', {
      enumerable: true,
      configurable: true,
      get: () => {
        try {
          return firebaseAuth || (typeof getSyncFirebaseAuth === 'function' ? getSyncFirebaseAuth() : firebaseAuth);
        } catch {
          return firebaseAuth;
        }
      }
    });

    Object.defineProperty(module.exports, 'firebaseDbInstance', {
      enumerable: true,
      configurable: true,
      get: () => {
        try {
          return firebaseDb || (typeof getSyncFirebaseDb === 'function' ? getSyncFirebaseDb() : firebaseDb);
        } catch {
          return firebaseDb;
        }
      }
    });

    // Backwards-compatible alias: dbInstance for consumers expecting an object, and db function for callable usage.
    Object.defineProperty(module.exports, 'dbInstance', {
      enumerable: true,
      configurable: true,
      get: () => {
        try {
          return firebaseDb || (typeof getSyncFirebaseDb === 'function' ? getSyncFirebaseDb() : firebaseDb);
        } catch {
          return firebaseDb;
        }
      }
    });

  } catch (e) {
    // Non-fatal: ignored in strict ESM environments
    logger.debug('CJS compatibility export failed (non-fatal):', 'APP', e);
  }
}

// Types and interfaces
export interface AuthResult<T> {
  user: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export interface CreateUserProfileData {
  uid: string;
  email?: string;
  displayName: string;
  profilePicture?: string;
  createdAt: any;
  updatedAt: any;
  provider?: string;
  lastSignInTime?: number;
  emailVerified?: boolean;
  role?: UserRole;
  photoURL?: string;
  bestProfilePicture?: string;
  public?: boolean;
}

export interface UpdateUserProfileData {
  lastSignInTime?: number;
  updatedAt?: any;
  emailVerified?: boolean;
  profilePicture?: string;
  photoURL?: string;
  bestProfilePicture?: string;
  provider?: string;
  public?: boolean;
}

export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserProfile extends CreateUserProfileData {
  role?: UserRole;
  bannerURL?: string;
  bannerData?: any;
  customBannerDesign?: any;
  bio?: string;
  interests?: string;
  location?: string;
  reputationScore?: number;
  skills?: any;
}

// Rate limiter (unchanged)
class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly limit = 5;
  private readonly timeWindow = 60 * 1000; // 1 minute

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
      return true;
    }

    if (now - record.timestamp > this.timeWindow) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= this.limit) {
      return false;
    }

    record.count++;
    return true;
  }

  resetLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();
export { Timestamp };

// Enhanced Auth methods with proper error handling
export const signIn = async (email: string, password: string): Promise<AuthResult<User>> => {
  try {
    const auth = getSyncFirebaseAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    logger.error('Sign in error:', 'APP', {}, error as Error);
    return {
      user: null,
      error: {
        code: error.code || 'auth/unknown-error',
        message: error.message || 'Sign in failed'
      }
    };
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResult<User>> => {
  try {
    const auth = getSyncFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    logger.error('Sign up error:', 'APP', {}, error as Error);
    return {
      user: null,
      error: {
        code: error.code || 'auth/unknown-error',
        message: error.message || 'Sign up failed'
      }
    };
  }
};

export const signOut = async (): Promise<AuthResult<void>> => {
  try {
    const auth = getSyncFirebaseAuth();
    await firebaseSignOut(auth);
    return { user: null, error: null };
  } catch (error: any) {
    logger.error('Sign out error:', 'APP', {}, error as Error);
    return {
      user: null,
      error: {
        code: error.code || 'auth/unknown-error',
        message: error.message || 'Sign out failed'
      }
    };
  }
};

export const signInWithGoogle = async (): Promise<AuthResult<User>> => {
  try {
    const auth = getSyncFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      return { user: result.user, error: null };
    } catch (popupError: any) {
      if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, provider);
        return {
          user: null,
          error: {
            code: 'auth/redirect-initiated',
            message: 'Redirect sign-in initiated'
          }
        };
      }
      throw popupError;
    }
  } catch (error: any) {
    logger.error('Google sign in error:', 'APP', {}, error as Error);
    return {
      user: null,
      error: {
        code: error.code || 'auth/unknown-error',
        message: error.message || 'Google sign in failed'
      }
    };
  }
};

export const checkExistingAccount = async (email: string): Promise<{ exists: boolean; methods?: string[] }> => {
  try {
    const auth = getSyncFirebaseAuth();
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return {
      exists: methods.length > 0,
      methods
    };
  } catch (error) {
    logger.error('Check existing account error:', 'APP', {}, error as Error);
    return {
      exists: false
    };
  }
};

/**
 * Require authentication - throws error if user is not authenticated
 * Used to guard Firestore operations that require authentication
 */
export const requireAuth = (): User => {
  // Handle test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      isAnonymous: false,
      metadata: {} as any,
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: safeMock(),
      getIdToken: safeMock().mockResolvedValue('test-token'),
      getIdTokenResult: safeMock().mockResolvedValue({}),
      reload: safeMock(),
      toJSON: safeMock(),
      phoneNumber: null,
      photoURL: null,
      providerId: 'password'
    } as User;
  }

  const auth = getSyncFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Authentication required. Please sign in to access this feature.');
  }

  return user;
};

// Initialize Firebase immediately in non-test environments
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  initializeFirebase().catch(error => {
    logger.error('Failed to initialize Firebase on module load:', 'APP', {}, error as Error);
  });
}

// Generic Firestore CRUD functions

/**
 * Generic function to get documents from a collection with optional constraints
 */
export const getDocuments = async (
  collectionName: string,
  constraints: Array<{ field: string; operator: string; value: any }> = [],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
): Promise<{ data: DocumentData[] | null; error: { code: string; message: string } | null }> => {
  try {
    const db = getSyncFirebaseDb();
    const collectionRef = collection(db, collectionName);

    const queryConstraints: QueryConstraint[] = [];

    // Add where constraints
    constraints.forEach(constraint => {
      queryConstraints.push(where(constraint.field, constraint.operator as any, constraint.value));
    });

    // Add ordering if specified
    if (orderByField) {
      queryConstraints.push(orderBy(orderByField, orderDirection));
    }

    // Add limit if specified
    if (limitCount) {
      queryConstraints.push(limitQuery(limitCount));
    }

    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as DocumentData)
    }));

    return { data: documents, error: null };
  } catch (error: any) {
    logger.error(`Error getting documents from ${collectionName}:`, 'APP', {}, error as Error);
    return {
      data: null,
      error: {
        code: error.code || 'firestore/unknown-error',
        message: error.message || `Failed to get documents from ${collectionName}`
      }
    };
  }
};

/**
 * Generic function to add a document to a collection
 */
export const addDocument = async (
  collectionName: string,
  data: DocumentData
): Promise<{ data: string | null; error: { code: string; message: string } | null }> => {
  try {
    const db = getSyncFirebaseDb();
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, data);
    return { data: docRef.id, error: null };
  } catch (error: any) {
    logger.error(`Error adding document to ${collectionName}:`, 'APP', {}, error as Error);
    return {
      data: null,
      error: {
        code: error.code || 'firestore/unknown-error',
        message: error.message || `Failed to add document to ${collectionName}`
      }
    };
  }
};

/**
 * Generic function to update a document in a collection
 */
export const updateDocument = async (
  collectionName: string,
  documentId: string,
  updates: Partial<DocumentData>
): Promise<{ data: null; error: { code: string; message: string } | null }> => {
  try {
    const db = getSyncFirebaseDb();
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, updates);
    return { data: null, error: null };
  } catch (error: any) {
    logger.error(`Error updating document ${documentId} in ${collectionName}:`, 'APP', {}, error as Error);
    return {
      data: null,
      error: {
        code: error.code || 'firestore/unknown-error',
        message: error.message || `Failed to update document ${documentId} in ${collectionName}`
      }
    };
  }
};
