import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useToast } from "../contexts/ToastContext";
import { GlassmorphicInput } from "../components/ui/GlassmorphicInput";
import { motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { MailIcon, LockIcon, CheckIcon } from "lucide-react";
import Logo from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { logger } from '@utils/logging/logger';

export const SignUpPage: React.FC = () => {
  const { signInWithGoogle, signUp, error, loading, currentUser } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const hasProcessedSignupRef = useRef(false);
  const hasShownSignupToastRef = useRef(false);
  const navigate = useNavigate();

  // Validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // Show success toast and navigate to profile page after successful registration
  useEffect(() => {
    if (
      registrationSuccess &&
      currentUser &&
      !loading &&
      !error &&
      !hasRedirected &&
      currentUser.uid &&
      !hasShownSignupToastRef.current
    ) {
      // Add a small delay to ensure this isn't just a transient state change
      const timeoutId = setTimeout(() => {
        if (currentUser && currentUser.uid && !hasShownSignupToastRef.current) {
          hasProcessedSignupRef.current = true;
          hasShownSignupToastRef.current = true;
          addToast(
            "success",
            "Account created successfully! Welcome to TradeYa!"
          );
          // Short delay to allow toast to be seen
          const timer = setTimeout(() => {
            navigate("/profile");
            setHasRedirected(true);
          }, 1500);

          return () => clearTimeout(timer);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    registrationSuccess,
    currentUser?.uid,
    loading,
    error,
    navigate,
    hasRedirected,
    addToast,
  ]);

  // Reset all signup-related state when user logs out
  useEffect(() => {
    if (!currentUser) {
      setHasRedirected(false);
      setRegistrationSuccess(false);
      hasProcessedSignupRef.current = false;
      hasShownSignupToastRef.current = false;
    }
  }, [currentUser]);

  // Email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(value));
    } else {
      setEmailValid(null);
    }
  };

  // Password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value) {
      setPasswordValid(value.length >= 8);
    } else {
      setPasswordValid(null);
    }

    // Check if passwords match whenever password changes
    if (confirmPassword) {
      setPasswordsMatch(value === confirmPassword);
    }
  };

  // Confirm password validation
  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value) {
      setPasswordsMatch(value === password);
    } else {
      setPasswordsMatch(null);
    }
  };

  const validateForm = () => {
    // Clear previous errors
    setFormError(null);

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address");
      return false;
    }

    // Check if password is strong enough
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await signUp(email, password);
      if (!hasProcessedSignupRef.current) {
        hasProcessedSignupRef.current = true;
        setRegistrationSuccess(true);
        addToast(
          "success",
          "Account created successfully! Welcome to TradeYa!"
        );
        // Redirect to dashboard after successful signup
        navigate("/dashboard");
      }
    } catch (err: any) {
      logger.error('Signup failed:', 'PAGE', {}, err as Error);
      setFormError(
        err.message || "Failed to create account. Please try again."
      );
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      if (
        !error &&
        currentUser &&
        currentUser.uid &&
        !hasProcessedSignupRef.current
      ) {
        hasProcessedSignupRef.current = true;
        setRegistrationSuccess(true);
      }
    } catch (err) {
      logger.error('Google signup failed:', 'PAGE', {}, err as Error);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <Card variant="glass" className="p-8 shadow-lg">
        <div className="text-center mb-8">
          <Logo
            size="large"
            showText={true}
            linkTo={null}
            className="justify-center"
          />
        </div>
        <motion.h1
          className="text-2xl font-bold text-foreground mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Create an Account
        </motion.h1>

        {(error || formError) && (
          <motion.div
            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            {formError || String(error)}
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <GlassmorphicInput
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={handleEmailChange}
            required
            placeholder="Enter your email"
            label="Email"
            icon={<MailIcon className="h-5 w-5" />}
            variant="glass"
            size="lg"
            animatedLabel
            realTimeValidation
            onValidationChange={setEmailValid}
            validationState={
              emailValid === false
                ? "error"
                : emailValid === true
                ? "success"
                : "default"
            }
          />

          <GlassmorphicInput
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={handlePasswordChange}
            required
            placeholder="Create a password"
            label="Password"
            icon={<LockIcon className="h-5 w-5" />}
            variant="glass"
            size="lg"
            animatedLabel
            realTimeValidation
            onValidationChange={setPasswordValid}
            validationState={
              passwordValid === false
                ? "error"
                : passwordValid === true
                ? "success"
                : "default"
            }
            showPasswordToggle
          />

          <GlassmorphicInput
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            placeholder="Confirm your password"
            label="Confirm Password"
            icon={<LockIcon className="h-5 w-5" />}
            variant="glass"
            size="lg"
            animatedLabel
            realTimeValidation
            onValidationChange={setPasswordsMatch}
            validationState={
              passwordsMatch === false
                ? "error"
                : passwordsMatch === true
                ? "success"
                : "default"
            }
            showPasswordToggle
          />

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              isLoading={loading}
            >
              Sign Up
            </Button>
          </motion.div>
        </motion.form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={handleGoogleSignUp}
            disabled={loading}
            isLoading={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24px"
              height="24px"
              className="mr-2"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            <span>Sign up with Google</span>
          </Button>
        </motion.div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
            >
              Log In
            </Link>
          </p>
        </motion.div>
      </Card>
    </div>
  );
};

export default SignUpPage;
