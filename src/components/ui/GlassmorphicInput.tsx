import React, { useState, useCallback, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface GlassmorphicInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: React.ReactNode;
  variant?: 'glass' | 'elevated-glass' | 'inset-glass' | 'floating-glass';
  size?: 'sm' | 'md' | 'lg';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'adaptive';
  validationState?: 'default' | 'error' | 'success' | 'warning';
  glassmorphism?: {
    blur: 'sm' | 'md' | 'lg';
    opacity: number;
    border: boolean;
    shadow: boolean;
  };
  showPasswordToggle?: boolean;
  animatedLabel?: boolean;
  realTimeValidation?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export const GlassmorphicInput = forwardRef<HTMLInputElement, GlassmorphicInputProps>(
  ({
      label,
      error,
      success,
      hint,
      icon,
      variant = 'glass',
      size = 'md',
    brandAccent = 'adaptive',
    validationState = 'default',
    glassmorphism = {
      blur: 'md',
      opacity: 0.1,
      border: true,
      shadow: true
    },
    showPasswordToggle = false,
    animatedLabel = true,
    realTimeValidation = false,
    onValidationChange,
    className = '',
    type = 'text',
      ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
    const [showPassword, setShowPassword] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    // Phase 6.1: Sophisticated input variants with advanced glassmorphism
    const inputVariants = {
      glass: `
        backdrop-blur-sm bg-white/10 dark:bg-neutral-900/10
        border border-white/20 dark:border-neutral-700/30
        focus:bg-white/20 dark:focus:bg-neutral-900/20
        focus:border-white/40 dark:focus:border-neutral-600/40
        shadow-sm focus:shadow-md
      `,
      'elevated-glass': `
        backdrop-blur-md bg-white/20 dark:bg-neutral-900/20
        border-2 border-white/30 dark:border-neutral-700/40
        shadow-lg focus:shadow-xl
        focus:bg-white/30 dark:focus:bg-neutral-900/30
        focus:border-white/50 dark:focus:border-neutral-600/50
      `,
      'inset-glass': `
        backdrop-blur-sm bg-white/5 dark:bg-neutral-900/5
        border border-white/10 dark:border-neutral-700/20
        shadow-inset shadow-black/10 dark:shadow-white/5
        focus:shadow-inset-lg focus:bg-white/15 dark:focus:bg-neutral-900/15
        focus:border-white/30 dark:focus:border-neutral-600/30
      `,
      'floating-glass': `
        backdrop-blur-md bg-white/15 dark:bg-neutral-900/15
        border border-white/25 dark:border-neutral-700/35
        focus:bg-white/25 dark:focus:bg-neutral-900/25
        focus:border-white/45 dark:focus:border-neutral-600/45
        shadow-md focus:shadow-lg
        transform transition-transform duration-200
        focus:scale-[1.02] hover:scale-[1.01]
      `
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm rounded-lg',
      md: 'px-4 py-3 text-base rounded-xl', 
      lg: 'px-6 py-4 text-lg rounded-2xl'
    };

    const brandAccentClasses = {
      orange: 'focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50',
      blue: 'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50',
      purple: 'focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50',
      adaptive: `
        focus:ring-2 focus:ring-gradient-to-r 
        focus:from-orange-500/30 focus:via-blue-500/30 focus:to-purple-500/30
        focus:border-gradient-to-r focus:from-orange-500/50 focus:via-blue-500/50 focus:to-purple-500/50
      `
    };

    const validationClasses = {
      default: '',
      error: 'ring-2 ring-red-500/30 border-red-500/50 bg-red-50/10 dark:bg-red-900/10',
      success: 'ring-2 ring-green-500/30 border-green-500/50 bg-green-50/10 dark:bg-green-900/10',
      warning: 'ring-2 ring-yellow-500/30 border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-900/10'
    };

    // Phase 6.1: Real-time validation
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setHasValue(!!value);
      
      if (realTimeValidation && onValidationChange) {
        setIsValidating(true);
        // Simulate validation delay
        setTimeout(() => {
          const isValid = value.length > 0; // Simple validation example
          onValidationChange(isValid);
          setIsValidating(false);
        }, 300);
      }
      
      props.onChange?.(e);
    }, [realTimeValidation, onValidationChange, props]);

    // Phase 6.1: Password toggle
    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(!showPassword);
    }, [showPassword]);

    // Phase 6.1: Animated label
    const shouldFloatLabel = animatedLabel && (isFocused || hasValue);

    return (
      <div className="space-y-2">
        {label && (
          <motion.label
            className={cn(
              "block text-sm font-medium transition-colors duration-200",
              isFocused || hasValue 
                ? "text-gray-900 dark:text-white" 
                : "text-gray-600 dark:text-gray-300"
            )}
            initial={false}
            animate={{
              y: shouldFloatLabel ? -4 : 0,
              scale: shouldFloatLabel ? 0.9 : 1,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={showPasswordToggle && showPassword ? 'text' : type}
            className={cn(
              'w-full transition-all duration-300 ease-out',
              'placeholder:text-gray-500 dark:placeholder:text-gray-400',
              'text-gray-900 dark:text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              inputVariants[variant],
              sizeClasses[size],
              brandAccentClasses[brandAccent],
              validationClasses[validationState],
              icon && 'pl-10',
              showPasswordToggle && 'pr-10',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleInputChange}
            {...props}
          />

          {/* Password toggle button */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Validation status icons */}
          <AnimatePresence>
            {(validationState === 'success' || validationState === 'error') && (
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {validationState === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real-time validation indicator */}
          {isValidating && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </motion.div>
          )}
        </div>

        {/* Validation Messages */}
        <AnimatePresence>
          {(error || success || hint) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
        {error && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-4 w-4" />
            {error}
                </p>
        )}
              {success && !error && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircleIcon className="h-4 w-4" />
            {success}
                </p>
              )}
              {hint && !error && !success && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {hint}
                </p>
              )}
            </motion.div>
        )}
        </AnimatePresence>
      </div>
    );
  }
);

GlassmorphicInput.displayName = 'GlassmorphicInput';