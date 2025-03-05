import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  // Your firebase config should be here
  // If it's missing, you need to add it from your Firebase console
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  experimentalForceLongPolling: true, // Add this line
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize Firestore offline persistence with better error handling
async function initializeFirestore() {
  try {
    await db.enablePersistence({
      synchronizeTabs: true
    });
    console.log('Firestore persistence enabled successfully');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      // Continue without persistence in this tab
    } else if (err.code === 'unimplemented') {
      console.warn('Browser doesn\'t support persistence');
      // Set up alternative offline handling or display user warning
      window.addEventListener('offline', () => {
        console.warn('Internet connection lost. Some features may be unavailable.');
      });
    } else {
      console.error('Firestore persistence initialization error:', err);
      // Consider showing a user-friendly error message
    }
  }

  // Set up network status monitoring
  db.enableNetwork().catch(error => {
    console.error('Failed to enable Firestore network:', error);
  });

  // Register offline/online handlers
  window.addEventListener('online', () => {
    db.enableNetwork().catch(console.error);
  });

  window.addEventListener('offline', () => {
    db.disableNetwork().catch(console.error);
  });
}

// Initialize Firebase with error handling
try {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    throw new Error('Missing required Firebase configuration');
  }
  
  // Initialize services and persistence
  initializeFirestore().catch(console.error);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Consider showing a fatal error UI here
  throw error; // Re-throw to prevent app from running with invalid Firebase setup
}
