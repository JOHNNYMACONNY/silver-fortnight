/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";

// Use the centralized mock. Assumes the mock file is in the correct `__mocks__` directory.
jest.mock("../../firebase-config");

// Mock firebase/auth module with a callback holder
let authStateCallback: ((user: unknown) => void) | null = null;

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    authStateCallback = callback;
    // Immediately call callback with null to exit loading state
    callback(null);
    return jest.fn(); // unsubscribe function
  }),
}));

// We need to get the mockAuth object from the mock we just created.
// The actual implementation of this will depend on your __mocks__/firebase-config.ts file.
// Assuming it exports a mockAuth object and a way to control onAuthStateChanged.
import { getSyncFirebaseAuth } from "../../firebase-config";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const React = require("react");
  type MotionProps = { children?: React.ReactNode } & Record<string, unknown>;
  return {
    motion: {
      div: ({ children, ...props }: MotionProps) =>
        React.createElement(
          "div",
          props as Record<string, unknown>,
          children as React.ReactNode
        ),
      form: ({ children, ...props }: MotionProps) =>
        React.createElement(
          "form",
          props as Record<string, unknown>,
          children as React.ReactNode
        ),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      children as React.ReactNode,
  };
});

// Import components after mocks
import { AuthProvider, useAuth } from "../../AuthContext";
import * as AuthFunctions from "firebase/auth";

// Let's get a handle on the mock auth object
const mockAuth = getSyncFirebaseAuth();

// Relax the typed mocks to avoid strict Auth parameter typing in tests
const mockSignIn = AuthFunctions.signInWithEmailAndPassword as jest.Mock;
const mockSignUp = AuthFunctions.createUserWithEmailAndPassword as jest.Mock;
const mockSignOut = AuthFunctions.signOut as jest.Mock;

// Test components
const LoginForm: React.FC = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mockSignIn(mockAuth, email, password); // Pass mockAuth instance
    } catch {
      setError("Login failed");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (user) return <div>Welcome, {user.email}!</div>;

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit" data-testid="login-button">
        Login
      </button>
      {error && <div data-testid="error-message">{error}</div>}
    </form>
  );
};

const SignUpForm: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mockSignUp(mockAuth, email, password); // Pass mockAuth instance
    } catch {
      setError("Sign up failed");
    }
  };

  if (user) return <div>Account created for {user.email}!</div>;

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="signup-email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="signup-password-input"
      />
      <button type="submit" data-testid="signup-button">
        Sign Up
      </button>
      {error && <div data-testid="signup-error-message">{error}</div>}
    </form>
  );
};

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <h2>User Profile</h2>
      <p>Email: {user.email}</p>
      <p>UID: {user.uid}</p>
      <button onClick={signOut} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("Authentication Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // This clears all mocks, including onAuthStateChanged implementation
    (mockAuth as any).currentUser = null;
  });

  describe("Login Flow", () => {
    it("should handle successful login", async () => {
      const user = userEvent.setup();
      const mockUser = {
        uid: "test-user-id",
        email: "test@example.com",
        displayName: "Test User",
      };

      // Mock successful login
      mockSignIn.mockResolvedValue({
        user: mockUser,
      } as unknown);

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Fill out login form
      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const loginButton = screen.getByTestId("login-button");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(loginButton);

      // Verify login was called
      expect(mockSignIn).toHaveBeenCalledWith(
        mockAuth,
        "test@example.com",
        "password123"
      );

      // Simulate auth state change by invoking the callback
      await waitFor(() => {
        if (authStateCallback) authStateCallback(mockUser);
        expect(
          screen.getByText("Welcome, test@example.com!")
        ).toBeInTheDocument();
      });
    });

    it("should handle login failure", async () => {
      const user = userEvent.setup();

      // Mock failed login
      mockSignIn.mockRejectedValue(new Error("Invalid credentials"));

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId("email-input");
      const passwordInput = screen.getByTestId("password-input");
      const loginButton = screen.getByTestId("login-button");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Login failed"
        );
      });
    });
  });

  describe("Sign Up Flow", () => {
    it("should handle successful sign up", async () => {
      const user = userEvent.setup();
      const mockUser = {
        uid: "new-user-id",
        email: "newuser@example.com",
        displayName: null,
      };

      // Mock successful sign up
      mockSignUp.mockResolvedValue({
        user: mockUser,
      } as unknown);

      render(
        <TestWrapper>
          <SignUpForm />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId("signup-email-input");
      const passwordInput = screen.getByTestId("signup-password-input");
      const signUpButton = screen.getByTestId("signup-button");

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "newpassword123");
      await user.click(signUpButton);

      expect(mockSignUp).toHaveBeenCalledWith(
        mockAuth,
        "newuser@example.com",
        "newpassword123"
      );

      // Simulate auth state change by invoking the callback
      await waitFor(() => {
        if (authStateCallback) authStateCallback(mockUser);
        expect(
          screen.getByText("Account created for newuser@example.com!")
        ).toBeInTheDocument();
      });
    });

    it("should handle sign up failure", async () => {
      const user = userEvent.setup();

      // Mock failed sign up
      mockSignUp.mockRejectedValue(new Error("Email already in use"));

      render(
        <TestWrapper>
          <SignUpForm />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId("signup-email-input");
      const passwordInput = screen.getByTestId("signup-password-input");
      const signUpButton = screen.getByTestId("signup-button");

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "password123");
      await user.click(signUpButton);

      await waitFor(() => {
        expect(screen.getByTestId("signup-error-message")).toHaveTextContent(
          "Sign up failed"
        );
      });
    });
  });

  describe("Logout Flow", () => {
    it.skip("should handle successful logout", async () => {
      const user = userEvent.setup();
      const mockUser = {
        uid: "test-user-id",
        email: "test@example.com",
        displayName: "Test User",
      };

      // Start with authenticated user
      (mockAuth as any).currentUser = mockUser;
      mockSignOut.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      // Should show user profile
      expect(screen.getByText("Email: test@example.com")).toBeInTheDocument();
      expect(screen.getByText("UID: test-user-id")).toBeInTheDocument();

      // Click logout
      const logoutButton = screen.getByTestId("logout-button");
      await user.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);

      // Simulate auth state change for logout
      await waitFor(() => {
        if (authStateCallback) authStateCallback(null);
        expect(screen.getByText("Please log in")).toBeInTheDocument();
      });
    });
  });

  describe("Authentication State Persistence", () => {
    it.skip("should maintain authentication state across component remounts", async () => {
      const mockUser = {
        uid: "test-user-id",
        email: "test@example.com",
        displayName: "Test User",
      };

      // Start with authenticated user
      (mockAuth as any).currentUser = mockUser;

      const { rerender } = render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      // Should show user profile
      expect(screen.getByText("Email: test@example.com")).toBeInTheDocument();

      // Remount component
      rerender(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      // Should still show user profile
      expect(screen.getByText("Email: test@example.com")).toBeInTheDocument();
    });

    it("should handle authentication state changes", async () => {
      // Mock onAuthStateChanged
      (mockAuth as any).currentUser = null;

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Initially no user
      expect(screen.getByTestId("email-input")).toBeInTheDocument();

      // Simulate user login
      const mockUser = {
        uid: "test-user-id",
        email: "test@example.com",
        displayName: "Test User",
      };

      if (authStateCallback) {
        authStateCallback(mockUser);
      }

      await waitFor(() => {
        expect(
          screen.getByText("Welcome, test@example.com!")
        ).toBeInTheDocument();
      });

      // Simulate user logout
      if (authStateCallback) {
        authStateCallback(null);
      }

      await waitFor(() => {
        expect(screen.getByTestId("email-input")).toBeInTheDocument();
      });
    });
  });

  describe("Protected Route Integration", () => {
    const ProtectedComponent: React.FC = () => {
      const { user, loading } = useAuth();

      if (loading) return <div>Loading...</div>;
      if (!user) return <div>Access denied. Please log in.</div>;

      return <div>Protected content for {user.email}</div>;
    };

    it("should redirect unauthenticated users", () => {
      (mockAuth as any).currentUser = null;

      render(
        <TestWrapper>
          <ProtectedComponent />
        </TestWrapper>
      );

      expect(
        screen.getByText("Access denied. Please log in.")
      ).toBeInTheDocument();
    });

    it.skip("should allow authenticated users", () => {
      const mockUser = {
        uid: "test-user-id",
        email: "test@example.com",
        displayName: "Test User",
      };

      (mockAuth as any).currentUser = mockUser;

      render(
        <TestWrapper>
          <ProtectedComponent />
        </TestWrapper>
      );

      expect(
        screen.getByText("Protected content for test@example.com")
      ).toBeInTheDocument();
    });
  });
});
