import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Singleton instances
let appInstance: App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

// Initialize Firebase Admin App
function getAdminApp(): App {
  if (!appInstance) {
    if (getApps().length > 0) {
      appInstance = getApps()[0];
    } else {
      if (!process.env.VITE_FIREBASE_PROJECT_ID || 
          !process.env.FIREBASE_CLIENT_EMAIL || 
          !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('Missing Firebase Admin configuration');
      }

      // Parse the private key, handling both JSON string and regular string formats
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      try {
        privateKey = JSON.parse(privateKey);
      } catch {
        // If parsing fails, assume it's already in the correct format
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      appInstance = initializeApp({
        credential: cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
    }
  }
  return appInstance;
}

// Initialize Admin Firestore
function getAdminFirestore(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getAdminApp());
  }
  return firestoreInstance;
}

// Initialize Admin Auth
function getAdminAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getAdminApp());
  }
  return authInstance;
}

// Export singleton instances
export const adminApp = getAdminApp();
export const adminDb = getAdminFirestore();
export const adminAuth = getAdminAuth();

// Error handling wrapper
export const withAdminRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Admin operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) break;
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  } 
  throw lastError;
};
