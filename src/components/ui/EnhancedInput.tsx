import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { themeClasses } from "../../utils/themeUtils";

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  labelClassName?: string;
  inputClassName?: string;
  containerClassName?: string;
  animateLabel?: boolean;
  glassmorphism?: boolean;
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(({
  label,
  helperText,
  error,
  success,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  labelClassName = '',
  inputClassName = '',
  containerClassName = '',
  animateLabel = true,
  glassmorphism = false,
  disabled,
  id,
  ...props
}, ref) => {
  // State for focus and value tracking
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  // Generate a unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    if (props.onChange) props.onChange(e);
  };

  // Base classes using theme utilities
  const baseClasses = cn(
    'rounded-md border transition-all duration-200',
    glassmorphism
      ? 'backdrop-blur-sm bg-input-glass border-border-secondary'
      : 'bg-input border-border',
    'text-text-primary',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'
  );

  // Status classes
  const statusClasses = error
    ? 'border-destructive focus:ring-destructive'
    : success
      ? 'border-success focus:ring-success'
      : '';

  // Disabled classes
  const disabledClasses = disabled ? 'bg-background-secondary cursor-not-allowed' : '';

  // Icon padding classes
  const leftIconPadding = leftIcon ? 'pl-10' : '';
  const rightIconPadding = (rightIcon || error || success) ? 'pr-10' : '';

  // Full width class
  const fullWidthClass = fullWidth ? 'w-full' : '';

  // Determine if we should show the floating label animation
  const shouldFloatLabel = animateLabel && (isFocused || hasValue);

  return (
    <div className={cn(fullWidth ? 'w-full' : '', containerClassName)}>
      <div className="relative">
        {label && animateLabel && (
          <motion.label
            htmlFor={inputId}
            className={cn(
              'absolute left-3 transition-all pointer-events-none',
              shouldFloatLabel
                ? `${themeClasses.caption} -top-2 px-1 ${glassmorphism ? 'bg-input-glass' : 'bg-background-primary'} z-10 text-primary`
                : `${themeClasses.bodySmall} top-1/2 -translate-y-1/2 text-text-muted`,
              labelClassName
            )}
            initial={false}
            animate={shouldFloatLabel ? 'floated' : 'resting'}
            variants={{
              resting: { y: '-50%', x: 0, scale: 1 },
              floated: { y: 0, x: 0, scale: 0.85 }
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {label}
          </motion.label>
        )}

        {label && !animateLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              'block mb-1',
              themeClasses.bodySmall,
              'text-text-primary',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseClasses,
              statusClasses,
              disabledClasses,
              leftIconPadding,
              rightIconPadding,
              fullWidthClass,
              animateLabel && label ? 'pt-4 pb-2' : 'py-2',
              inputClassName,
              className
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            onFocus={(e) => {
              setIsFocused(true);
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (props.onBlur) props.onBlur(e);
            }}
            onChange={handleChange}
            {...props}
          />

          {/* Status icons */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {error ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : success ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {rightIcon && !error && !success && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
              {rightIcon}
            </div>
          )}

          {/* Focus indicator line */}
          {isFocused && !disabled && (
            <motion.div
              className={cn(
                "absolute bottom-0 left-0 h-0.5",
                error ? "bg-destructive" : success ? "bg-success" : "bg-primary"
              )}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              exit={{ width: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-destructive"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!error && helperText && (
          <motion.p
            id={`${inputId}-helper`}
            className={cn('mt-1 text-sm', 'text-text-muted')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

export default EnhancedInput;
