/**
 * GlassmorphicTextarea Component
 * 
 * Sophisticated glassmorphic textarea with auto-resize, character counting,
 * and TradeYa brand integration.
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

// Textarea Props Interface
export interface GlassmorphicTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  variant?: 'glass' | 'elevated-glass' | 'inset-glass';
  size?: 'sm' | 'md' | 'lg';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'adaptive';
  validationState?: 'default' | 'error' | 'success' | 'warning';
  autoResize?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  glassmorphism?: {
    blur: 'sm' | 'md' | 'lg';
    opacity: number;
    border: boolean;
    shadow: boolean;
  };
}

/**
 * GlassmorphicTextarea Component
 */
export const GlassmorphicTextarea: React.FC<GlassmorphicTextareaProps> = ({
  label,
  error,
  success,
  hint,
  variant = 'glass',
  size = 'md',
  brandAccent = 'adaptive',
  validationState = 'default',
  autoResize = true,
  showCharacterCount = false,
  maxLength,
  minRows = 3,
  maxRows = 8,
  glassmorphism = {
    blur: 'md',
    opacity: 0.1,
    border: true,
    shadow: true
  },
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine actual validation state
  const actualValidationState = error ? 'error' : success ? 'success' : validationState;

  // Textarea variant styles
  const textareaVariants = {
    glass: `glassmorphic`,
    'elevated-glass': `glassmorphic shadow-lg focus:shadow-xl`,
    'inset-glass': `glassmorphic shadow-inner focus:shadow-inner`
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

  // Auto-resize functionality
  const adjustHeight = () => {
    if (!autoResize || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    
    // Set the new height
    textarea.style.height = `${newHeight}px`;
  };

  // Handle textarea changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setHasValue(!!value);
    setCharacterCount(value.length);
    
    // Trigger auto-resize
    if (autoResize) {
      setTimeout(adjustHeight, 0);
    }
    
    props.onChange?.(e);
  };

  // Handle focus
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  // Initialize character count and height
  useEffect(() => {
    if (props.value) {
      setCharacterCount(String(props.value).length);
      setHasValue(!!props.value);
    }
    if (autoResize) {
      adjustHeight();
    }
  }, [props.value, autoResize]);

  // Character count color based on usage
  const getCharacterCountColor = () => {
    if (!maxLength) return 'text-gray-500 dark:text-gray-400';
    
    const percentage = (characterCount / maxLength) * 100;
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 90) return 'text-yellow-500';
    if (percentage >= 75) return 'text-primary';
    return 'text-gray-500 dark:text-gray-400';
  };

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
      
      {/* Textarea Container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          {...props}
          rows={autoResize ? minRows : props.rows}
          maxLength={maxLength}
          className={cn(
            // Base styles
            'w-full transition-all duration-300 ease-out resize-none',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'text-gray-900 dark:text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none',
            
            // Variant styles
            textareaVariants[variant],
            
            // Size styles
            sizeClasses[size],
            
            // Brand accent styles
            actualValidationState === 'default' && brandAccentClasses[brandAccent],
            
            // Validation styles
            validationClasses[actualValidationState],
            
            // Auto-resize styles
            autoResize && 'overflow-hidden',
            
            // Custom className
            className
          )}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {/* Validation Icon */}
        {(actualValidationState === 'error' || actualValidationState === 'success') && (
          <div className="absolute top-3 right-3">
            {actualValidationState === 'error' ? (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" data-testid="validation-icon-exclamation" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-green-500" data-testid="validation-icon-check" />
            )}
          </div>
        )}
      </div>

      {/* Character Count */}
      {showCharacterCount && (
        <div className="flex justify-end">
          <span className={cn(
            "text-xs transition-colors duration-200",
            getCharacterCountColor()
          )}>
            {characterCount}{maxLength && ` / ${maxLength}`}
          </span>
        </div>
      )}

      {/* Validation Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" data-testid="error-message-icon" />
            {error}
          </motion.p>
        )}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
          >
            <CheckCircleIcon className="h-4 w-4 flex-shrink-0" data-testid="success-message-icon" />
            {success}
          </motion.p>
        )}
        {hint && !error && !success && (
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
      </AnimatePresence>
    </div>
  );
};

export default GlassmorphicTextarea;
