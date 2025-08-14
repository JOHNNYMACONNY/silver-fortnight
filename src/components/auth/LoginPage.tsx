import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { rateLimiter } from '../../firebase-config';
import { useToast } from '../../contexts/ToastContext';
import { LockIcon, MailIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import Logo from '../ui/Logo';
import { motion } from 'framer-motion';
import { GlassmorphicForm } from '../ui/GlassmorphicForm';
import { GlassmorphicInput } from '../ui/GlassmorphicInput';
import { AccessibleFormField } from '../ui/AccessibleFormField';

interface LoginFormData {
  email: string;
  password: string;
}

interface SecurityLog {
  timestamp: number;
  action: string;
  email: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
}

const LoginPage: React.FC = () => {
  const { signInWithEmail, signInWithGoogle, error, loading, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  // New state for input validation
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    if (currentUser && loginSuccess) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500); // 1.5 second delay
    }
  }, [currentUser, loginSuccess, navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Improved email change handling with validation feedback
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailValid(value ? validateEmail(value) : null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      setPasswordValid(value.length >= 6);
    } else {
      setPasswordValid(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email, password);

    // Set login success flag to trigger the effect
    setLoginSuccess(true);
  };

  // Handle Google sign-in with success feedback
  const handleGoogleSignIn = async () => {
    await signInWithGoogle();

    // Set login success flag to trigger the effect
    setLoginSuccess(true);
  };

  // Security logging function
  const logSecurityEvent = (event: SecurityLog) => {
    const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    const updatedLogs = [...existingLogs, event].slice(-100); // Keep last 100 logs
    localStorage.setItem('security_logs', JSON.stringify(updatedLogs));
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <GlassmorphicForm onSubmit={handleSubmit} className="mt-0">
        <div className="flex flex-col items-center mb-8">
          <Logo size="large" showText={true} linkTo={null} className="justify-center" />
          <motion.h1
            className="text-2xl font-bold text-foreground mt-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Log In
          </motion.h1>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Login Error</AlertTitle>
            <AlertDescription>{String(error)}</AlertDescription>
          </Alert>
        )}
        <AccessibleFormField id="email" label="Email" error={emailValid === false ? 'Please enter a valid email address' : undefined}>
          <GlassmorphicInput
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            required
            icon={<MailIcon className="h-5 w-5" />}
            error={emailValid === false ? 'Please enter a valid email address' : undefined}
            autoComplete="email"
          />
        </AccessibleFormField>
        <div className="flex justify-end items-center mb-1">
          <Link to="/reset-password" className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">
            Forgot password?
          </Link>
        </div>
        <AccessibleFormField id="password" label="Password" error={passwordValid === false ? 'Password must be at least 6 characters' : undefined}>
          <GlassmorphicInput
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            required
            icon={<LockIcon className="h-5 w-5" />}
            error={passwordValid === false ? 'Password must be at least 6 characters' : undefined}
            autoComplete="current-password"
          />
        </AccessibleFormField>
        <Button
          type="submit"
          className="w-full"
          isLoading={loading}
          disabled={loading || (!!currentUser && loginSuccess)}
        >
          {currentUser && loginSuccess ? 'Success!' : 'Log In'}
        </Button>
        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          className="mt-4 w-full"
          isLoading={loading}
          disabled={loading || (!!currentUser && loginSuccess)}
        >
          {loading ? (
            'Signing in...'
          ) : currentUser && loginSuccess ? (
            'Signed in with Google'
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" className="mr-2">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Sign in with Google
            </>
          )}
        </Button>
        <p className="px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          New to TradeYa?{' '}
          <Link to="/signup" className="underline hover:text-primary transition-colors">
            Sign up
          </Link>
        </p>
      </GlassmorphicForm>
    </div>
  );
};

export default LoginPage;
