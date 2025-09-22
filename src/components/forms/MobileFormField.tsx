/**
 * Mobile Form Field Component
 * 
 * Optimized form field component for mobile devices with enhanced
 * touch interactions, validation, and accessibility.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdvancedTouchInteractions } from '../../hooks/useAdvancedTouchInteractions';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

interface MobileFormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  success?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  icon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  onRightIconClick?: () => void;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  validation?: {
    realTime?: boolean;
    onValidate?: (value: string) => boolean;
    message?: string;
  };
  hapticFeedback?: boolean;
  className?: string;
}

const MobileFormField: React.FC<MobileFormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success,
  disabled = false,
  required = false,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  showPasswordToggle = false,
  onPasswordToggle,
  validation,
  hapticFeedback = true,
  className = '',
}) => {
  const { isMobile, isTouchDevice, touchTarget } = useMobileOptimization();
  const [isFocused, setIsFocused] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Touch interaction handlers
  const handleTouchGesture = useCallback((gesture: string, event: any) => {
    if (gesture === 'long-press' && onPasswordToggle) {
      onPasswordToggle();
    }
  }, [onPasswordToggle]);

  const touchInteractions = useAdvancedTouchInteractions(
    {
      hapticEnabled: hapticFeedback,
      hapticIntensity: 'light',
      longPressDelay: 1000,
    },
    {
      onLongPress: (event) => handleTouchGesture('long-press', event),
    }
  );

  // Real-time validation
  useEffect(() => {
    if (!validation?.realTime || !validation.onValidate) return;
    
    const timeoutId = setTimeout(() => {
      setIsValidating(true);
      const isValid = validation.onValidate?.(value) ?? true;
      setValidationResult(isValid);
      setIsValidating(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, validation]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (hapticFeedback) {
      touchInteractions.triggerHaptic('light');
    }
  }, [hapticFeedback, touchInteractions]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handlePasswordToggle = useCallback(() => {
    setShowPassword(prev => !prev);
    onPasswordToggle?.();
    if (hapticFeedback) {
      touchInteractions.triggerHaptic('light');
    }
  }, [onPasswordToggle, hapticFeedback, touchInteractions]);

  const handleRightIconClick = useCallback(() => {
    onRightIconClick?.();
    if (hapticFeedback) {
      touchInteractions.triggerHaptic('light');
    }
  }, [onRightIconClick, hapticFeedback, touchInteractions]);

  // Determine input type
  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password')
    : type;

  // Get validation state
  const getValidationState = () => {
    if (error) return 'error';
    if (success) return 'success';
    if (validationResult === true) return 'success';
    if (validationResult === false) return 'error';
    return 'default';
  };

  const validationState = getValidationState();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <motion.label
        className={`
          block text-sm font-medium transition-colors duration-200
          ${validationState === 'error' 
            ? 'text-red-600 dark:text-red-400' 
            : validationState === 'success'
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-700 dark:text-gray-300'
          }
        `}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </motion.label>

      {/* Input Container */}
      <motion.div
        className={`
          relative flex items-center rounded-xl border-2 transition-all duration-200
          ${validationState === 'error'
            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
            : validationState === 'success'
            ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
            : isFocused
            ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{
          minHeight: `${touchTarget.minSize}px`,
        }}
        whileFocus={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Left Icon */}
        {Icon && (
          <div className="absolute left-3 z-10">
            <Icon className={`
              h-5 w-5 transition-colors duration-200
              ${validationState === 'error'
                ? 'text-red-500'
                : validationState === 'success'
                ? 'text-green-500'
                : isFocused
                ? 'text-blue-500'
                : 'text-gray-400'
              }
            `} />
          </div>
        )}

        {/* Input Field */}
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={`
            w-full px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
            bg-transparent border-0 outline-none text-base
            ${Icon ? 'pl-10' : ''}
            ${(RightIcon || showPasswordToggle) ? 'pr-10' : ''}
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
          style={{
            fontSize: '16px', // Prevent zoom on iOS
          }}
          {...(isTouchDevice ? touchInteractions.handlers : {})}
        />

        {/* Right Icon / Password Toggle */}
        {(RightIcon || showPasswordToggle) && (
          <div className="absolute right-3 z-10">
            {showPasswordToggle ? (
              <motion.button
                type="button"
                onClick={handlePasswordToggle}
                className={`
                  p-1 rounded-lg transition-colors duration-200
                  ${validationState === 'error'
                    ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : validationState === 'success'
                    ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                whileTap={{ scale: 0.95 }}
                style={{
                  minHeight: `${touchTarget.minSize - 8}px`,
                  minWidth: `${touchTarget.minSize - 8}px`,
                }}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleRightIconClick}
                className={`
                  p-1 rounded-lg transition-colors duration-200
                  ${validationState === 'error'
                    ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : validationState === 'success'
                    ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                whileTap={{ scale: 0.95 }}
                style={{
                  minHeight: `${touchTarget.minSize - 8}px`,
                  minWidth: `${touchTarget.minSize - 8}px`,
                }}
              >
                {RightIcon && <RightIcon className="h-5 w-5" />}
              </motion.button>
            )}
          </div>
        )}

        {/* Validation Indicator */}
        <AnimatePresence>
          {isValidating && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {(error || success || (validation?.message && validationResult === false)) && (
          <motion.div
            className={`
              text-sm font-medium
              ${validationState === 'error' 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
              }
            `}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {error || success || (validation?.message && validationResult === false ? validation.message : '')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileFormField;
