import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  User as AuthUser, 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { autoCreateUserProfile } from './utils/autoCreateUserProfile';
import { markLoginDay } from './services/streaks';
import { User as FirestoreUser, getUserProfile } from './services/firestore-exports';

// Admin configuration - can be moved to environment variables later
const ADMIN_UIDS: string[] = [
  'TozfQg0dAHe4ToLyiSnkDqe3ECj2', // Existing admin UID from MigrationPage
];

const ADMIN_EMAILS: string[] = [
  // Add admin email addresses here if needed
];

// Helper function to check if user is admin
const checkIsAdmin = (user: AuthUser | null): boolean => {
  if (!user) return false;
  
  const isAdminByUid = ADMIN_UIDS.includes(user.uid);
  const isAdminByEmail = user.email ? ADMIN_EMAILS.includes(user.email) : false;
  
  return isAdminByUid || isAdminByEmail;
};

export interface AuthContextType {
  user: AuthUser | null;
  currentUser: AuthUser | null;  // Alias for user for backward compatibility
  userProfile: FirestoreUser | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;  // Alias for signOut for backward compatibility
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create auth and provider instances only once
  const auth = useMemo(() => getAuth(), []);
  const googleProvider = useMemo(() => new GoogleAuthProvider(), []);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth,
      async (user) => {
        console.log('AuthProvider: Auth state changed', { hasUser: !!user, uid: user?.uid });
        setUser(user);
        setIsAdmin(checkIsAdmin(user));
        if (user) {
          const { data: profile } = await getUserProfile(user.uid);
          setUserProfile(profile || null);
          // Update login streak on session restore
          try { await markLoginDay(user.uid); } catch { /* non-blocking */ }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
        setError(null); // Clear any previous errors on successful state change
      },
      (error) => {
        console.error('AuthProvider: Auth state change error', error);
        setError(error);
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthProvider: Cleaning up auth state listener');
      unsubscribe();
    };
  }, [auth]); // Include auth in dependency array to fix React Hook Rules violation

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Attempting email sign in');
      setLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      setIsAdmin(checkIsAdmin(result.user));
      const { data: profile } = await getUserProfile(result.user.uid);
      setUserProfile(profile || null);
      await autoCreateUserProfile(); // Ensure Firestore user doc exists
      // Update login streak on successful sign-in
      try { await markLoginDay(result.user.uid); } catch { /* non-blocking */ }
      console.log('AuthProvider: Email sign in successful');
    } catch (err) {
      console.error('AuthProvider: Email sign in error', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = signIn;  // Alias for backward compatibility

  const signInWithGoogle = async () => {
    try {
      console.log('AuthProvider: Attempting Google sign in');
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setIsAdmin(checkIsAdmin(result.user));
      const { data: profile } = await getUserProfile(result.user.uid);
      setUserProfile(profile || null);
      await autoCreateUserProfile(); // Ensure Firestore user doc exists
      // Update login streak on successful Google sign-in
      try { await markLoginDay(result.user.uid); } catch { /* non-blocking */ }
      console.log('AuthProvider: Google sign in successful');
    } catch (err) {
      console.error('AuthProvider: Google sign in error', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('AuthProvider: Attempting sign out');
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      console.log('AuthProvider: Sign out successful');
    } catch (err) {
      console.error('AuthProvider: Sign out error', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = handleSignOut;
  const logout = handleSignOut;  // Alias for backward compatibility

  const value: AuthContextType = {
    user,
    currentUser: user,  // Alias for backward compatibility
    userProfile,
    loading,
    error,
    isAdmin,
    signIn,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    logout
  };

  console.log('AuthProvider: Rendering with state', { 
    hasUser: !!user, 
    loading, 
    hasError: !!error, 
    isAdmin 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;