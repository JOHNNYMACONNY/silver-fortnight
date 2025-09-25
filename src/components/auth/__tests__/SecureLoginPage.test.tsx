import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SecureLoginPage from '../SecureLoginPage';
import { AuthProvider } from '../../../AuthContext';
import { FirebaseError } from 'firebase/app';

// Mock useNavigate and useLocation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    state: { from: { pathname: '/dashboard' } }
  })
}));

describe('SecureLoginPage', () => {
  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <SecureLoginPage {...props} />
        </AuthProvider>
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
    expect(screen.getByText('Sign in with Email')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('handles email sign in submission', async () => {
    const onSuccess = jest.fn();
    renderComponent({ onSuccess });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByText('Sign in with Email'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles sign in errors correctly', async () => {
    const onError = jest.fn();
    const mockError = new FirebaseError('auth/wrong-password', 'Invalid password');
    
    // Mock the Firebase auth function to reject for this test
    const { signInWithEmailAndPassword } = jest.requireMock('firebase/auth');
    signInWithEmailAndPassword.mockRejectedValueOnce(mockError);
    
    renderComponent({ onError });

    // Simulate a failed sign in
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' }
    });

    fireEvent.click(screen.getByText('Sign in with Email'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Incorrect password');
      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  it('handles Google sign in successfully', async () => {
    const onSuccess = jest.fn();
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    
    // Mock successful Google sign-in
    const { signInWithGoogle } = jest.requireMock('firebase/auth');
    signInWithGoogle.mockResolvedValue({ user: mockUser });
    
    renderComponent({ onSuccess });

    fireEvent.click(screen.getByText('Sign in with Google'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles Google sign in redirect', async () => {
    const onSuccess = jest.fn();
    
    // Mock redirect scenario
    const { signInWithGoogle } = jest.requireMock('firebase/auth');
    signInWithGoogle.mockResolvedValue({ 
      user: null, 
      error: { code: 'auth/redirect-initiated', message: 'Redirect sign-in initiated' }
    });
    
    renderComponent({ onSuccess });

    fireEvent.click(screen.getByText('Sign in with Google'));

    await waitFor(() => {
      // Should not call onSuccess for redirect scenario
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it('disables form during submission', async () => {
    // Mock the Firebase auth function to have a delay
    const { signInWithEmailAndPassword } = jest.requireMock('firebase/auth');
    signInWithEmailAndPassword.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ user: { uid: 'test-uid' } }), 100))
    );
    
    renderComponent();

    // Fill in form data first
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByText('Sign in with Email'));

    // Check that form elements are disabled during loading
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });
});
