// Mock Firebase modules explicitly BEFORE any imports
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      emailVerified: true
    },
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
    signInWithPopup: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn().mockImplementation((callback: any) => {
      if (typeof callback === 'function') {
        callback({ uid: 'test-uid', email: 'test@example.com' });
      }
      return () => {};
    })
  })),
  GoogleAuthProvider: jest.fn(() => ({
    PROVIDER_ID: 'google.com'
  })),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  signInWithPopup: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn().mockImplementation((callback: any) => {
    if (typeof callback === 'function') {
      callback({ uid: 'test-uid', email: 'test@example.com' });
    }
    return () => {};
  })
}));

// Mock firebase/app for FirebaseError
jest.mock('firebase/app', () => ({
  FirebaseError: jest.fn().mockImplementation((code: string, message: string) => ({
    code,
    message,
    name: 'FirebaseError'
  }))
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../../AuthContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import { FirebaseError } from 'firebase/app';

// Mock useNavigate and useLocation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    state: { from: { pathname: '/dashboard' } }
  })
}));

// Mock AuthContext
const mockSignInWithEmail = jest.fn();
const mockSignInWithGoogle = jest.fn();

jest.mock('../../../AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    signInWithEmail: mockSignInWithEmail,
    signInWithGoogle: mockSignInWithGoogle,
    error: null,
    loading: false,
    currentUser: null
  })
}));

describe('LoginPage', () => {
  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <LoginPage {...props} />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderComponent();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('handles email sign in submission', async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('handles Google sign in', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });
});
