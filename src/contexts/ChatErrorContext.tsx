/**
 * Centralized error handling context for chat operations
 * Provides user-friendly error feedback and proper error boundaries
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useToast } from "./ToastContext";
import { logger } from '@utils/logging/logger';

export interface ChatError {
  id: string;
  type: "connection" | "permission" | "validation" | "network" | "unknown";
  message: string;
  originalError?: Error;
  timestamp: number;
  operation?: string;
  recoverable: boolean;
  userMessage: string;
}

interface ChatErrorContextType {
  errors: ChatError[];
  addError: (error: Error, operation?: string, context?: any) => void;
  clearError: (errorId: string) => void;
  clearAllErrors: () => void;
  getErrorsByType: (type: ChatError["type"]) => ChatError[];
  hasErrors: boolean;
  hasRecoverableErrors: boolean;
  retryOperation: (errorId: string) => void;
}

const ChatErrorContext = createContext<ChatErrorContextType | undefined>(
  undefined
);

interface ChatErrorProviderProps {
  children: ReactNode;
  maxErrors?: number;
}

export const ChatErrorProvider: React.FC<ChatErrorProviderProps> = ({
  children,
  maxErrors = 10,
}) => {
  const [errors, setErrors] = useState<ChatError[]>([]);
  const toastContext = useToast();

  // Classify error type based on error message and context
  const classifyError = (
    error: Error,
    operation?: string
  ): ChatError["type"] => {
    const message = error.message.toLowerCase();

    if (message.includes("permission") || message.includes("unauthorized")) {
      return "permission";
    }
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection")
    ) {
      return "network";
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return "validation";
    }
    if (message.includes("firestore") || message.includes("firebase")) {
      return "connection";
    }

    return "unknown";
  };

  // Generate user-friendly error messages
  const generateUserMessage = (
    type: ChatError["type"],
    operation?: string
  ): string => {
    const operationText = operation ? ` ${operation}` : "";

    switch (type) {
      case "connection":
        return `Connection issue while${operationText}. Please check your internet connection.`;
      case "permission":
        return `You don't have permission to perform this action. Please try again or contact support.`;
      case "validation":
        return `Invalid input provided. Please check your message and try again.`;
      case "network":
        return `Network error while${operationText}. Please try again in a moment.`;
      default:
        return `An unexpected error occurred while${operationText}. Please try again.`;
    }
  };

  // Determine if error is recoverable
  const isRecoverable = (type: ChatError["type"]): boolean => {
    return type === "network" || type === "connection" || type === "unknown";
  };

  const addError = useCallback(
    (error: Error, operation?: string, context?: any) => {
      const type = classifyError(error, operation);
      const userMessage = generateUserMessage(type, operation);
      const recoverable = isRecoverable(type);

      const chatError: ChatError = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message: error.message,
        originalError: error,
        timestamp: Date.now(),
        operation,
        recoverable,
        userMessage,
      };

      setErrors((prev) => {
        const newErrors = [chatError, ...prev].slice(0, maxErrors);
        return newErrors;
      });

      // Show toast for user-facing errors (not permission errors for background operations)
      if (type !== "permission" && toastContext) {
        const toastType: "error" | "info" = recoverable ? "info" : "error";
        toastContext.addToast(toastType, userMessage);
      }

      // Log error for debugging
      logger.error('Chat Error [${type}] in ${operation || "unknown operation"}:', 'CONTEXT', {}, error as Error);

      if (context) {
        logger.error('Error context:', 'CONTEXT', context);
      }
    },
    [maxErrors, toastContext]
  );

  const clearError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getErrorsByType = useCallback(
    (type: ChatError["type"]) => {
      return errors.filter((error) => error.type === type);
    },
    [errors]
  );

  const retryOperation = useCallback(
    (errorId: string) => {
      const error = errors.find((e) => e.id === errorId);
      if (error && error.recoverable) {
        clearError(errorId);
        // Note: Actual retry logic would be implemented by the calling component
        if (toastContext) {
          toastContext.addToast("info", "Retrying operation...");
        }
      }
    },
    [errors, clearError, toastContext]
  );

  const hasErrors = errors.length > 0;
  const hasRecoverableErrors = errors.some((error) => error.recoverable);

  const value: ChatErrorContextType = {
    errors,
    addError,
    clearError,
    clearAllErrors,
    getErrorsByType,
    hasErrors,
    hasRecoverableErrors,
    retryOperation,
  };

  return (
    <ChatErrorContext.Provider value={value}>
      {children}
    </ChatErrorContext.Provider>
  );
};

export const useChatError = (): ChatErrorContextType => {
  const context = useContext(ChatErrorContext);
  if (context === undefined) {
    throw new Error("useChatError must be used within a ChatErrorProvider");
  }
  return context;
};

// Error boundary component for chat operations
interface ChatErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ChatErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ChatErrorBoundary extends React.Component<
  ChatErrorBoundaryProps,
  ChatErrorBoundaryState
> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Chat Error Boundary caught an error:', 'CONTEXT', { arg0: error }, errorInfo as Error);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the chat. Please refresh the page to try
            again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling specific chat operations with error handling
export const useChatOperation = () => {
  const { addError } = useChatError();

  const executeWithErrorHandling = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      operationName: string,
      context?: any
    ): Promise<T | null> => {
      try {
        return await operation();
      } catch (error) {
        addError(
          error instanceof Error ? error : new Error(String(error)),
          operationName,
          context
        );
        return null;
      }
    },
    [addError]
  );

  return { executeWithErrorHandling };
};
