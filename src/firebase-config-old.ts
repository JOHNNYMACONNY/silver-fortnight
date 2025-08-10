import { FirebaseApp, initializeApp } from 'firebase/app';
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
  User
} from 'firebase/auth';
import { Firestore, getFirestore, Timestamp } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const getEnvVar = (name: string): string => {
  try {
    // Handle test environment
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      const testValues: Record<string, string> = {
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
        VITE_FIREBASE_PROJECT_ID: 'test-project-id',
        VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
        VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-sender-id',
        VITE_FIREBASE_APP_ID: 'test-app-id',
        REACT_APP_FIREBASE_API_KEY: 'test-api-key',
        REACT_APP_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
        REACT_APP_FIREBASE_PROJECT_ID: 'test-project-id',
        REACT_APP_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-sender-id',
        REACT_APP_FIREBASE_APP_ID: 'test-app-id'
      };
      return testValues[name] || process.env[name] || 'test-value';
    }

    // Handle Node.js environment (production scripts)
    if (typeof process !== 'undefined' && process.env) {
      // Try VITE_ prefix first
      if (process.env[name]) {
        return process.env[name] || '';
      }
      
      // Try REACT_APP_ prefix for backwards compatibility
      const reactAppName = name.replace('VITE_', 'REACT_APP_');
      if (process.env[reactAppName]) {
        return process.env[reactAppName] || '';
      }
      
      // For production scripts, use default values if environment variables are not set
      const defaultValues: Record<string, string> = {
        VITE_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || 'production-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: `${process.env.FIREBASE_PROJECT_ID || 'tradeya-45ede'}.firebaseapp.com`,
        VITE_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'tradeya-45ede',
        VITE_FIREBASE_STORAGE_BUCKET: `${process.env.FIREBASE_PROJECT_ID || 'tradeya-45ede'}.appspot.com`,
        VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
        VITE_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef'
      };
      
      if (defaultValues[name]) {
        return defaultValues[name];
      }
    }

    // Handle Vite's environment variables (browser environment)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return (import.meta.env as Record<string, string>)[name] || '';
    }

    // Fallback for production scripts
    return 'production-default';
  } catch (error) {
    console.warn(`Error accessing environment variable ${name}:`, error);
    return 'fallback-value';
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
};

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

if (process.env.NODE_ENV === 'test') {
  firebaseAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
  } as unknown as Auth;
  firebaseDb = {} as Firestore;
  firebaseStorage = {} as FirebaseStorage;
} else {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Ensure we always have Auth and Firestore instances
firebaseAuth = firebaseAuth || ({} as Auth);
firebaseDb = firebaseDb || ({} as Firestore);
firebaseStorage = firebaseStorage || ({} as FirebaseStorage);

export const app = firebaseApp;
export const auth = firebaseAuth;
export const db = firebaseDb;
export const storage = firebaseStorage;

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
}

export interface UpdateUserProfileData {
  lastSignInTime?: number;
  updatedAt?: any;
  emailVerified?: boolean;
  profilePicture?: string;
  photoURL?: string;
  bestProfilePicture?: string;
  provider?: string;
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

// Auth methods
export const signIn = async (email: string, password: string): Promise<AuthResult<User>> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        code: error.code || 'unknown',
        message: error.message
      }
    };
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResult<User>> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        code: error.code || 'unknown',
        message: error.message
      }
    };
  }
};

export const signOut = async (): Promise<AuthResult<void>> => {
  try {
    await firebaseSignOut(auth);
    return { user: null, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        code: error.code || 'unknown',
        message: error.message
      }
    };
  }
};

export const signInWithGoogle = async (): Promise<AuthResult<User>> => {
  try {
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
    return {
      user: null,
      error: {
        code: error.code || 'unknown',
        message: error.message
      }
    };
  }
};

export const checkExistingAccount = async (email: string): Promise<{ exists: boolean; methods?: string[] }> => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return {
      exists: methods.length > 0,
      methods
    };
  } catch (error) {
    return {
      exists: false
    };
  }
};
