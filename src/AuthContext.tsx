import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  User as AuthUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { autoCreateUserProfile } from "./utils/autoCreateUserProfile";
import { markLoginDay } from "./services/streaks";
import {
  User as FirestoreUser,
  getUserProfile,
} from "./services/firestore-exports";
import {
  signInWithGoogleFirebase,
  handleGoogleRedirectResult,
  isReturningFromRedirect,
} from "./utils/firebaseGoogleAuth";
import { refreshOwnSocialStats } from "./services/leaderboards";
import { logger } from '@utils/logging/logger';

// Admin configuration - can be moved to environment variables later
const ADMIN_UIDS: string[] = [
  "TozfQg0dAHe4ToLyiSnkDqe3ECj2", // Existing admin UID from MigrationPage
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
  currentUser: AuthUser | null; // Alias for user for backward compatibility
  userProfile: FirestoreUser | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut for backward compatibility
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create auth instance only once
  const auth = useMemo(() => getAuth(), []);

  useEffect(() => {
    logger.debug("AuthProvider: Setting up auth state listener", 'APP');

    // Check for redirect result first
    const checkRedirectResult = async () => {
      if (isReturningFromRedirect()) {
        logger.debug("AuthProvider: Detected return from OAuth redirect, handling result...", 'APP');
        try {
          const result = await handleGoogleRedirectResult();
          if (result) {
            logger.debug("AuthProvider: Redirect sign-in successful", 'APP');
            setUser(result.user);
            setIsAdmin(checkIsAdmin(result.user));
            const { data: profile } = await getUserProfile(result.user.uid);
            setUserProfile(profile || null);
            await autoCreateUserProfile();
            try {
              await markLoginDay(result.user.uid);
            } catch {
              /* non-blocking */
            }
            // Refresh user's own social stats on OAuth sign-in
            try {
              await refreshOwnSocialStats(result.user.uid);
            } catch {
              /* non-blocking */
            }
          }
        } catch (error) {
          logger.error('AuthProvider: Error handling redirect result', 'APP', {}, error as Error);
          setError(error as Error);
        }
      }
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        logger.debug('AuthProvider: Auth state changed', 'APP', {
          hasUser: !!user,
          uid: user?.uid,
        });
        setUser(user);
        setIsAdmin(checkIsAdmin(user));
        if (user) {
          const { data: profile } = await getUserProfile(user.uid);
          setUserProfile(profile || null);
          // Update login streak on session restore
          try {
            await markLoginDay(user.uid);
          } catch {
            /* non-blocking */
          }
          // Refresh user's own social stats (follower/following counts) from userFollows collection
          try {
            await refreshOwnSocialStats(user.uid);
          } catch {
            /* non-blocking */
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
        setError(null); // Clear any previous errors on successful state change
      },
      (error) => {
        logger.error('AuthProvider: Auth state change error', 'APP', {}, error as Error);
        setError(error);
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    );

    return () => {
      logger.debug("AuthProvider: Cleaning up auth state listener", 'APP');
      unsubscribe();
    };
  }, [auth]); // Include auth in dependency array to fix React Hook Rules violation

  const signIn = async (email: string, password: string) => {
    try {
      logger.debug("AuthProvider: Attempting email sign in", 'APP');
      setLoading(true);
      setError(null);
      const sanitizedEmail = email
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();
      const result = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      // Don't call setUser here - let the onAuthStateChanged callback handle it
      // This prevents double setUser calls that cause duplicate toasts
      setIsAdmin(checkIsAdmin(result.user));
      const { data: profile } = await getUserProfile(result.user.uid);
      setUserProfile(profile || null);
      await autoCreateUserProfile(); // Ensure Firestore user doc exists
      // Update login streak on successful sign-in
      try {
        await markLoginDay(result.user.uid);
      } catch {
        /* non-blocking */
      }
      // Refresh user's own social stats on email sign-in
      try {
        await refreshOwnSocialStats(result.user.uid);
      } catch {
        /* non-blocking */
      }
      logger.debug("AuthProvider: Email sign in successful", 'APP');
    } catch (err) {
      logger.error('AuthProvider: Email sign in error', 'APP', {}, err as Error);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = signIn; // Alias for backward compatibility

  const signUp = async (email: string, password: string) => {
    try {
      logger.debug("AuthProvider: Attempting email sign up", 'APP');
      setLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Don't call setUser here - let the onAuthStateChanged callback handle it
      setIsAdmin(checkIsAdmin(result.user));
      await autoCreateUserProfile(); // Ensure Firestore user doc exists
      const { data: profile } = await getUserProfile(result.user.uid);
      setUserProfile(profile || null);
      // Update login streak on successful sign-up
      try {
        await markLoginDay(result.user.uid);
      } catch {
        /* non-blocking */
      }
      // Refresh user's own social stats on sign-up
      try {
        await refreshOwnSocialStats(result.user.uid);
      } catch {
        /* non-blocking */
      }
      logger.debug("AuthProvider: Email sign up successful", 'APP');
    } catch (err) {
      logger.error('AuthProvider: Email sign up error', 'APP', {}, err as Error);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      logger.debug("AuthProvider: Attempting Google sign in with SIMPLE FIREBASE APPROACH", 'APP');
      setLoading(true);
      setError(null);

      // Use only Firebase's built-in OAuth
      const result = await signInWithGoogleFirebase();

      if (result && result.user) {
        // Don't call setUser here - let the onAuthStateChanged callback handle it
        // This prevents double setUser calls that cause duplicate toasts
        setIsAdmin(checkIsAdmin(result.user));
        const { data: profile } = await getUserProfile(result.user.uid);
        setUserProfile(profile || null);
        await autoCreateUserProfile(); // Ensure Firestore user doc exists
        // Update login streak on successful Google sign-in
        try {
          await markLoginDay(result.user.uid);
        } catch {
          /* non-blocking */
        }
        // Refresh user's own social stats on Google sign-in
        try {
          await refreshOwnSocialStats(result.user.uid);
        } catch {
          /* non-blocking */
        }
        logger.debug("AuthProvider: Google sign in successful!", 'APP');
      } else if (
        result &&
        result.error &&
        result.error.code === "auth/redirect-initiated"
      ) {
        // Redirect was initiated, the user will be redirected
        logger.debug("AuthProvider: Redirect initiated, user will be redirected", 'APP');
        return;
      }
    } catch (err: any) {
      logger.error('AuthProvider: Google sign-in failed', 'APP', {}, err as Error);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      logger.debug("AuthProvider: Attempting sign out", 'APP');
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      logger.debug("AuthProvider: Sign out successful", 'APP');
    } catch (err) {
      logger.error('AuthProvider: Sign out error', 'APP', {}, err as Error);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = handleSignOut;
  const logout = handleSignOut; // Alias for backward compatibility

  const value: AuthContextType = {
    user,
    currentUser: user, // Alias for backward compatibility
    userProfile,
    loading,
    error,
    isAdmin,
    signIn,
    signInWithEmail,
    signUp,
    signInWithGoogle,
    signOut,
    logout,
  };

  logger.debug('AuthProvider: Rendering with state', 'APP', {
    hasUser: !!user,
    loading,
    hasError: !!error,
    isAdmin,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
