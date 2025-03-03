import { createContext, useContext, useEffect, useState } from 'react';
import { generateUniqueUsername, updateUsername as updateUsernameUtil } from '../utils/username';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile
} from 'firebase/auth';
import { auth, getDb, withRetry } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.debug('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.debug('Auth state changed:', { 
        isAuthenticated: !!user,
        userId: user?.uid,
        timestamp: new Date().toISOString()
      });
      
      setUser(user);
      setLoading(false);

      // Check for redirect result
      if (!user) {
        try {
          const result = await getRedirectResult(auth);
          if (result?.user) {
            console.debug('Handling redirect sign-in result');
            await handleGoogleSignIn(result.user);
          }
        } catch (error: any) {
          console.error('Redirect sign-in error:', {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString()
          });
          if (error.code === 'auth/unauthorized-domain') {
            setError('This domain is not authorized for authentication. Please contact support.');
          }
        }
      }
    });

    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async (user: User) => {
    try {
      await withRetry(async () => {
        const db = await getDb();
        // Check if user profile exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        // If not, create one
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName || '',
            displayNameLower: (user.displayName || '').toLowerCase(),
            username: await generateUniqueUsername(user.displayName || user.email?.split('@')[0] || 'user'),
            bio: '',
            skills: [],
            portfolio: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name in Firebase Auth
      await updateProfile(userCredential.user, { displayName });
      
      // Create user profile in Firestore
      const db = await getDb();
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        displayNameLower: displayName.toLowerCase(),
        username: await generateUniqueUsername(displayName),
        bio: '',
        skills: [],
        portfolio: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error: any) {
      console.error('Error in signUp:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password accounts are not enabled. Please contact support.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. It must be at least 6 characters long.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for authentication. Please contact support.');
      } else {
        throw new Error('Failed to create account. Please try again.');
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error in signIn:', error);
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for authentication. Please contact support.');
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Try popup first
      try {
        const result = await signInWithPopup(auth, provider);
        await handleGoogleSignIn(result.user);
      } catch (popupError: any) {
        console.error('Popup error:', popupError);
        
        // If popup is blocked or domain is unauthorized, handle appropriately
        if (popupError.code === 'auth/popup-blocked') {
          // Fall back to redirect
          await signInWithRedirect(auth, provider);
        } else if (popupError.code === 'auth/unauthorized-domain') {
          throw new Error('This domain is not authorized for authentication. Please contact support.');
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Error in signInWithGoogle:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await updateUsernameUtil(user.uid, newUsername);
    } catch (error: any) {
      console.error('Error updating username:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp, 
      signIn, 
      signInWithGoogle, 
      logout,
      updateUsername 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
