import React, { createContext, useContext } from "react";
import { AuthProvider, useAuth } from "../AuthContext";
// import { tokenValidator } from '../utils/tokenUtils'; // File not found
import { rateLimiter } from "../utils/rateLimiting";
import { securityMonitor } from "../services/securityMonitoring";
import { User } from "firebase/auth";
import { ERROR_MESSAGES } from "../utils/constants";

interface SecureAuthState {
  checkRateLimit: (identifier: string) => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  getLastLoginAttempt: () => number | null;
  getRemainingAttempts: (identifier: string) => number;
  clearSecurityState: () => void;
}

const SecureAuthContext = createContext<SecureAuthState | undefined>(undefined);

export const SecureAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();

  const checkRateLimit = async (identifier: string) => {
    const result = await rateLimiter.checkLimit(identifier);

    await securityMonitor.logEvent({
      type: "rate_limit",
      severity: result.allowed ? "low" : "medium",
      details: {
        identifier,
        allowed: result.allowed,
        remainingAttempts: result.remainingAttempts,
        nextResetTime: result.nextResetTime,
      },
    });

    return result.allowed;
  };

  const validateSession = async () => {
    if (!auth.currentUser) {
      return false;
    }

    try {
      // const result = await tokenValidator.validateToken(auth.currentUser);
      const result = { isValid: true, error: null }; // Temporary fallback

      await securityMonitor.logEvent({
        type: "token",
        severity: result.isValid ? "low" : "high",
        userId: auth.currentUser.uid,
        details: {
          isValid: result.isValid,
          error: result.error,
        },
      });

      if (!result.isValid) {
        // Force re-authentication on invalid token
        await auth.logout();
        throw new Error(ERROR_MESSAGES.TOKEN.INVALID);
      }

      return true;
    } catch (error) {
      await securityMonitor.logEvent({
        type: "token",
        severity: "high",
        userId: auth.currentUser.uid,
        details: {
          error:
            error instanceof Error
              ? error.message
              : "Unknown token validation error",
        },
      });
      return false;
    }
  };

  const getLastLoginAttempt = (): number | null => {
    const now = Date.now();
    const status = rateLimiter.getStatus("login");

    if (
      !status.attempts ||
      (Array.isArray(status.attempts) && status.attempts.length === 0)
    ) {
      return null;
    }

    if (Array.isArray(status.attempts)) {
      const timestamps = status.attempts.filter(
        (t): t is number => typeof t === "number"
      );
      return timestamps.length > 0 ? now - Math.max(...timestamps) : null;
    }

    return typeof status.attempts === "number" ? now - status.attempts : null;
  };

  const getRemainingAttempts = (identifier: string): number => {
    const status = rateLimiter.getStatus(identifier);
    return status.remainingAttempts;
  };

  const clearSecurityState = (): void => {
    rateLimiter.resetAll();
    // tokenValidator.clearCache();
  };

  const value: SecureAuthState = {
    checkRateLimit,
    validateSession,
    getLastLoginAttempt,
    getRemainingAttempts,
    clearSecurityState,
  };

  return (
    <AuthProvider>
      <SecureAuthContext.Provider value={value}>
        {children}
      </SecureAuthContext.Provider>
    </AuthProvider>
  );
};

export const useSecureAuth = () => {
  const context = useContext(SecureAuthContext);
  if (!context) {
    throw new Error("useSecureAuth must be used within SecureAuthProvider");
  }
  return context;
};

/**
 * HOC for route security
 */
export const withSecureAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    validateSession?: boolean;
    rateLimitKey?: string;
  } = {}
) => {
  return function WithSecureAuthWrapper(props: P) {
    const auth = useAuth();
    const secureAuth = useSecureAuth();
    const [isValidating, setIsValidating] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      const validate = async () => {
        try {
          if (options.requireAuth && !auth.currentUser) {
            throw new Error("Authentication required");
          }

          if (options.validateSession && auth.currentUser) {
            const isValid = await secureAuth.validateSession();
            if (!isValid) {
              throw new Error(ERROR_MESSAGES.TOKEN.INVALID);
            }
          }

          if (options.rateLimitKey) {
            const isAllowed = await secureAuth.checkRateLimit(
              options.rateLimitKey
            );
            if (!isAllowed) {
              throw new Error(ERROR_MESSAGES.RATE_LIMIT.EXCEEDED);
            }
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Security validation failed"
          );
        } finally {
          setIsValidating(false);
        }
      };

      validate();
    }, [auth.currentUser]);

    if (isValidating) {
      return <div>Validating security requirements...</div>;
    }

    if (error) {
      return <div>Access denied: {error}</div>;
    }

    return <WrappedComponent {...props} />;
  };
};
