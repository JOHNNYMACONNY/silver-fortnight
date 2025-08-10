import React from 'react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { AuthProvider } from '../../../AuthContext';
import { ToastProvider } from '../../../contexts/ToastContext';

// Mock AuthContext for Storybook to avoid Firebase initialization
const MockAuthContext = React.createContext({
  user: null,
  currentUser: null,
  loading: false,
  error: null,
  isAdmin: false,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  logout: async () => {},
});

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <MockAuthContext.Provider value={{
    user: null,
    currentUser: null,
    loading: false,
    error: null,
    isAdmin: false,
    signIn: async () => {},
    signInWithEmail: async () => {},
    signInWithGoogle: async () => {},
    signOut: async () => {},
    logout: async () => {},
  }}>
    {children}
  </MockAuthContext.Provider>
);

export const withThemeProvider = (Story: any) => (
  <ThemeProvider>
    <Story />
  </ThemeProvider>
);

export const withAuthProvider = (Story: any) => (
  <AuthProvider>
    <Story />
  </AuthProvider>
);

export const withToastProvider = (Story: any) => (
  <ToastProvider>
    <Story />
  </ToastProvider>
);

export const withAllProviders = (Story: any) => (
  <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <Story />
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>
);

export const withMockAllProviders = (Story: any) => (
  <ThemeProvider>
    <MockAuthProvider>
      <ToastProvider>
        <Story />
      </ToastProvider>
    </MockAuthProvider>
  </ThemeProvider>
);
