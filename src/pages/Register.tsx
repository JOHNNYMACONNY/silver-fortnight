import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, AlertCircle, HelpCircle } from 'lucide-react';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | JSX.Element>('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (password.length < 6) {
      setError(
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Password Too Short</p>
            <p className="text-sm mt-1">
              Password must be at least 6 characters long for security.
            </p>
          </div>
        </div>
      );
      setLoading(false);
      return;
    }

    if (!displayName.trim()) {
      setError(
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Display Name Required</p>
            <p className="text-sm mt-1">
              Please enter a display name to create your account.
            </p>
          </div>
        </div>
      );
      setLoading(false);
      return;
    }
    
    try {
      await signUp(email, password, displayName);
      navigate('/discover');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('unauthorized-domain')) {
          setError(
            <div className="flex items-start gap-2 bg-yellow-50 p-4 rounded-lg">
              <HelpCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Domain Authorization Pending</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This domain is not yet authorized for authentication. This can happen when:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                  <li>The domain was recently added to Firebase</li>
                  <li>Changes are still propagating (can take up to 15 minutes)</li>
                  <li>The domain wasn't added to Firebase's authorized domains</li>
                </ul>
                <p className="text-sm text-yellow-700 mt-2">
                  Please try again in a few minutes. If the issue persists, contact support.
                </p>
              </div>
            </div>
          );
        } else {
          setError(
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Registration Failed</p>
                <p className="text-sm mt-1">{err.message}</p>
              </div>
            </div>
          );
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      navigate('/discover');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign up with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-900 flex items-center justify-center"> {/* Updated background color */}
      <div className="bg-earth-800 p-8 rounded-lg shadow-md w-96 border border-earth-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-text-primary font-display">
          Create Account
        </h2>
        
        {error && (
          <div className="mb-6">
            {typeof error === 'string' ? (
              <div className="bg-red-100 text-red-700 p-3 rounded">
                {error}
              </div>
            ) : error}
          </div>
        )}

        {/* Google Sign Up Button */}
        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full bg-earth-800 border-2 border-earth-700 text-text-primary py-2 px-4 rounded-lg hover:border-accent-clay hover:text-accent-clay mb-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-earth-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-earth-800 text-text-muted">Or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignUp}>
          <div className="mb-4">
            <label className="block text-text-muted mb-2" htmlFor="displayName">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-2 bg-earth-800 border border-earth-700 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 transition-all duration-300"
              required
              minLength={2}
              maxLength={50}
            />
          </div>
          <div className="mb-4">
            <label className="block text-text-muted mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-earth-800 border border-earth-700 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 transition-all duration-300"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-text-muted mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-earth-800 border border-earth-700 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 transition-all duration-300"
              required
              minLength={6}
            />
            <p className="mt-1 text-sm text-text-muted">
              Must be at least 6 characters long
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent-clay to-accent-ochre text-text-light py-2 px-4 rounded-lg hover:shadow-lg hover:shadow-accent-clay/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}