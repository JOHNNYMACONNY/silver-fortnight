import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../../contexts/ToastContext';
import LoginPage from '../LoginPage';

// Mock AuthContext
const mockSignInWithEmail = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockAuthContext = {
  user: null,
  currentUser: null,
  loading: false,
  error: null,
  signIn: mockSignInWithEmail,
  signInWithEmail: mockSignInWithEmail,
  signInWithGoogle: mockSignInWithGoogle,
  signOut: jest.fn(),
  logout: jest.fn(),
};

jest.mock('../../../AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

jest.mock('../../../firebase-config', () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
  rateLimiter: {
    checkLimit: jest.fn().mockResolvedValue(true)
  }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('LoginPage', () => {
  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <ToastProvider>
          <LoginPage />
        </ToastProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithEmail.mockResolvedValue(undefined);
    mockSignInWithGoogle.mockResolvedValue(undefined);
    
    // Reset localStorage
    (localStorage.setItem as jest.Mock).mockClear();
    (localStorage.getItem as jest.Mock).mockClear();
    (localStorage.removeItem as jest.Mock).mockClear();
  });

  it('renders login form correctly', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderLoginPage();
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    renderLoginPage();
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    mockSignInWithEmail.mockResolvedValue(undefined); // AuthContext throws on error, returns void on success

    renderLoginPage();
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login error', async () => {
    const mockError = new Error('Invalid password');
    mockSignInWithEmail.mockRejectedValue(mockError);

    renderLoginPage();
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalled();
      expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
    });
  });

  it('handles Google sign-in successfully', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    mockSignInWithGoogle.mockResolvedValue({ user: mockUser });

    renderLoginPage();
    
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles Google sign-in redirect', async () => {
    const redirectError = new Error('Redirect sign-in initiated') as Error & { code: string };
    redirectError.code = 'auth/redirect-initiated';
    mockSignInWithGoogle.mockResolvedValue({ 
      user: null, 
      error: { code: 'auth/redirect-initiated', message: 'Redirect sign-in initiated' }
    });

    renderLoginPage();
    
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      // Should not navigate on redirect initiation
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
