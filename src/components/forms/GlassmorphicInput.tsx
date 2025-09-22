/**
 * GlassmorphicInput Component
 * 
 * Sophisticated glassmorphic input with TradeYa brand integration,
 * advanced validation states, and accessibility features.
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { ExclamationCircleIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ValidationRule } from "./validation/FormValidationSystem";
import { ValidationMessage } from "./validation/FormValidationSystem";
import { useFieldValidation } from "./validation/useFormValidation";

// Input Props Interface
export interface GlassmorphicInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: React.ReactNode;
  variant?: 'glass' | 'elevated-glass' | 'inset-glass';
  size?: 'sm' | 'md' | 'lg';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'adaptive';
  validationState?: 'default' | 'error' | 'success' | 'warning';
  showPasswordToggle?: boolean;
  glassmorphism?: {
    blur: 'sm' | 'md' | 'lg';
    opacity: number;
    border: boolean;
    shadow: boolean;
  };

  // Validation Integration
  fieldName?: string;
  validationRules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidationIcon?: boolean;
  enableRealTimeValidation?: boolean;
}

/**
 * GlassmorphicInput Component
 */
export const GlassmorphicInput: React.FC<GlassmorphicInputProps> = ({
  label,
  error,
  success,
  hint,
  icon,
  variant = 'glass',
  size = 'md',
  brandAccent = 'adaptive',
  validationState = 'default',
  showPasswordToggle = false,
  glassmorphism = {
    blur: 'md',
    opacity: 0.1,
    border: true,
    shadow: true
  },
  className = '',
  type = 'text',

  // Validation props
  fieldName,
  validationRules = [],
  validateOnChange = true,
  validateOnBlur = true,
  showValidationIcon = true,
  enableRealTimeValidation = true,

  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validation integration
  const validationHook = fieldName && validationRules.length > 0 ?
    useFieldValidation({
      fieldName,
      rules: validationRules,
      initialValue: props.value || props.defaultValue || '',
      validateOnChange: enableRealTimeValidation && validateOnChange,
      validateOnBlur,
    }) : null;

  // Determine actual validation state
  const actualValidationState = error ? 'error' :
    success ? 'success' :
    validationHook?.fieldState.state === 'invalid' ? 'error' :
    validationHook?.fieldState.state === 'valid' ? 'success' :
    validationState;
  
  // Determine input type for password toggle
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Input variant styles with enhanced animations
  const inputVariants = {
    glass: `glassmorphic transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01] focus:shadow-xl focus:shadow-primary/20 focus:scale-[1.02]`,
    'elevated-glass': `glassmorphic shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:shadow-primary/15 hover:scale-[1.02] focus:shadow-2xl focus:shadow-primary/25 focus:scale-[1.03]`,
    'inset-glass': `glassmorphic shadow-inner transition-all duration-300 ease-out hover:shadow-lg hover:shadow-secondary/10 hover:scale-[1.01] focus:shadow-xl focus:shadow-secondary/20 focus:scale-[1.02]`
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl', 
    lg: 'px-6 py-4 text-lg rounded-2xl'
  };

  // Brand accent classes
  const brandAccentClasses = {
    orange: 'focus:ring-2 focus:ring-ring focus:border-ring',
    blue: 'focus:ring-2 focus:ring-ring focus:border-ring',
    purple: 'focus:ring-2 focus:ring-ring focus:border-ring',
    adaptive: 'focus:ring-2 focus:ring-ring focus:border-ring'
  };

  // Validation classes
  const validationClasses = {
    default: '',
    error: 'ring-2 ring-red-500/30 border-red-500/50 bg-red-50/10 dark:bg-red-900/10',
    success: 'ring-2 ring-green-500/30 border-green-500/50 bg-green-50/10 dark:bg-green-900/10',
    warning: 'ring-2 ring-yellow-500/30 border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-900/10'
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);

    // Update validation hook if available
    if (validationHook) {
      validationHook.setValue(e.target.value);
    }

    props.onChange?.(e);
  };

  // Handle focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    // Mark field as touched for validation
    if (validationHook) {
      validationHook.touch();
    }

    props.onBlur?.(e);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Refocus input after toggle
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Update hasValue when props.value changes
  useEffect(() => {
    setHasValue(!!props.value);
  }, [props.value]);

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label 
          htmlFor={props.id}
          className={cn(
            "block text-sm font-medium transition-colors duration-200",
            isFocused || hasValue 
              ? "text-gray-900 dark:text-white" 
              : "text-gray-600 dark:text-gray-300"
          )}
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Leading Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10">
            {icon}
          </div>
        )}
        
        {/* Input Field */}
        <input
          ref={inputRef}
          {...props}
          type={inputType}
          className={cn(
            // Base styles
            'w-full transition-all duration-300 ease-out',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'text-gray-900 dark:text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none',
            
            // Variant styles
            inputVariants[variant],
            
            // Size styles
            sizeClasses[size],
            
            // Brand accent styles
            actualValidationState === 'default' && brandAccentClasses[brandAccent],
            
            // Validation styles
            validationClasses[actualValidationState],
            
            // Icon padding
            icon && 'pl-10',
            
            // Password toggle padding
            (type === 'password' && showPasswordToggle) && 'pr-10',
            
            // Custom className
            className
          )}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {/* Password Toggle Button */}
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
              "transition-colors duration-200 focus:outline-none focus:text-gray-600 dark:focus:text-gray-300"
            )}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" data-testid="eye-slash-icon" />
            ) : (
              <EyeIcon className="h-5 w-5" data-testid="eye-icon" />
            )}
          </button>
        )}

        {/* Validation Icon */}
        {showValidationIcon && (actualValidationState === 'error' || actualValidationState === 'success' || validationHook?.isValidating) && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            (type === 'password' && showPasswordToggle) && 'right-10'
          )}>
            {validationHook?.isValidating ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : actualValidationState === 'error' ? (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" data-testid="validation-icon-exclamation" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-green-500" data-testid="validation-icon-check" />
            )}
          </div>
        )}
      </div>

      {/* Validation Messages */}
      <AnimatePresence mode="wait">
        {/* Priority: explicit error prop > validation hook error > explicit success > validation hook success > hint */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" data-testid="error-message-icon" />
            {error}
          </motion.p>
        )}
        {!error && validationHook?.error && validationHook.hasBeenTouched && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" data-testid="validation-error-message-icon" />
            {validationHook.error}
          </motion.p>
        )}
        {!error && !validationHook?.error && success && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
            role="status"
            aria-live="polite"
          >
            <CheckCircleIcon className="h-4 w-4 flex-shrink-0" data-testid="success-message-icon" />
            {success}
          </motion.p>
        )}
        {!error && !validationHook?.error && !success && validationHook?.isValid && validationHook.hasBeenTouched && showValidationIcon && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
            role="status"
            aria-live="polite"
          >
            <CheckCircleIcon className="h-4 w-4 flex-shrink-0" data-testid="validation-success-message-icon" />
            Valid
          </motion.p>
        )}
        {!error && !validationHook?.error && !success && !validationHook?.isValid && hint && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </motion.p>
        )}
        {validationHook?.isValidating && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"
            role="status"
            aria-live="polite"
          >
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Validating...
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlassmorphicInput;
