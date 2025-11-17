/**
 * Form Validation System
 * 
 * Comprehensive validation system with real-time feedback, animated transitions,
 * WCAG 2.1 AA compliance, and error handling for all form components.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../utils/cn";
import { logger } from '@utils/logging/logger';

// Validation Rule Types
export type ValidationRule = {
  type: 'required' | 'email' | 'phone' | 'url' | 'number' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, formData?: any) => boolean | Promise<boolean>;
};

// Validation State Types
export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'warning';

// Field Validation Result
export interface FieldValidationResult {
  isValid: boolean;
  state: ValidationState;
  message?: string;
  suggestions?: string[];
}

// Form Validation Context
export interface FormValidationContext {
  validateField: (fieldName: string, value: any, rules: ValidationRule[]) => Promise<FieldValidationResult>;
  validateForm: (formData: any, fieldRules: Record<string, ValidationRule[]>) => Promise<Record<string, FieldValidationResult>>;
  getFieldState: (fieldName: string) => FieldValidationResult;
  setFieldState: (fieldName: string, result: FieldValidationResult) => void;
  clearFieldState: (fieldName: string) => void;
  clearAllStates: () => void;
  isFormValid: boolean;
  validationStates: Record<string, FieldValidationResult>;
}

// Validation Provider Props
export interface ValidationProviderProps {
  children: React.ReactNode;
  debounceMs?: number;
  enableRealTimeValidation?: boolean;
  enableAccessibility?: boolean;
}

// Create Validation Context
const ValidationContext = React.createContext<FormValidationContext | null>(null);

/**
 * Built-in Validation Rules
 */
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message,
    validator: (value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return value != null && value !== '';
    }
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    type: 'email',
    message,
    validator: (value) => {
      if (!value) return true; // Allow empty unless required
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    type: 'phone',
    message,
    validator: (value) => {
      if (!value) return true; // Allow empty unless required
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
      return phoneRegex.test(cleaned) && cleaned.length >= 10;
    }
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    type: 'url',
    message,
    validator: (value) => {
      if (!value) return true; // Allow empty unless required
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  }),

  number: (min?: number, max?: number, message?: string): ValidationRule => ({
    type: 'number',
    value: { min, max },
    message: message || `Please enter a valid number${min !== undefined ? ` (min: ${min})` : ''}${max !== undefined ? ` (max: ${max})` : ''}`,
    validator: (value) => {
      if (!value) return true; // Allow empty unless required
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;
    }
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value: length,
    message: message || `Must be at least ${length} characters`,
    validator: (value) => {
      if (!value) return true; // Allow empty unless required
      return String(value).length >= length;
    }
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value: length,
    message: message || `Must be no more than ${length} characters`,
    validator: (value) => {
      if (!value) return true; // Allow empty unless required
      return String(value).length <= length;
    }
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    type: 'pattern',
    value: regex,
    message,
    validator: (value) => {
      if (!value) return true; // Allow empty unless required
      return regex.test(String(value));
    }
  }),

  custom: (validator: (value: any, formData?: any) => boolean | Promise<boolean>, message: string): ValidationRule => ({
    type: 'custom',
    message,
    validator
  })
};

/**
 * Validation Provider Component
 */
export const ValidationProvider: React.FC<ValidationProviderProps> = ({
  children,
  debounceMs = 300,
  enableRealTimeValidation = true,
  enableAccessibility = true,
}) => {
  const [validationStates, setValidationStates] = useState<Record<string, FieldValidationResult>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Clear debounce timer for a field
  const clearDebounceTimer = useCallback((fieldName: string) => {
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
      delete debounceTimers.current[fieldName];
    }
  }, []);

  // Validate a single field
  const validateField = useCallback(async (
    fieldName: string,
    value: any,
    rules: ValidationRule[]
  ): Promise<FieldValidationResult> => {
    // Clear existing timer
    clearDebounceTimer(fieldName);

    // Set validating state immediately for real-time feedback
    if (enableRealTimeValidation) {
      setValidationStates(prev => ({
        ...prev,
        [fieldName]: { isValid: false, state: 'validating' }
      }));
    }

    return new Promise((resolve) => {
      const validateAsync = async () => {
        try {
          // Run validation rules
          for (const rule of rules) {
            if (rule.validator) {
              const isValid = await rule.validator(value);
              if (!isValid) {
                const result: FieldValidationResult = {
                  isValid: false,
                  state: 'invalid',
                  message: rule.message
                };
                
                setValidationStates(prev => ({
                  ...prev,
                  [fieldName]: result
                }));
                
                resolve(result);
                return;
              }
            }
          }

          // All rules passed
          const result: FieldValidationResult = {
            isValid: true,
            state: 'valid'
          };
          
          setValidationStates(prev => ({
            ...prev,
            [fieldName]: result
          }));
          
          resolve(result);
        } catch (error) {
          logger.error('Validation error:', 'COMPONENT', {}, error as Error);
          const result: FieldValidationResult = {
            isValid: false,
            state: 'invalid',
            message: 'Validation error occurred'
          };
          
          setValidationStates(prev => ({
            ...prev,
            [fieldName]: result
          }));
          
          resolve(result);
        }
      };

      // Debounce validation
      if (debounceMs > 0) {
        debounceTimers.current[fieldName] = setTimeout(validateAsync, debounceMs);
      } else {
        validateAsync();
      }
    });
  }, [enableRealTimeValidation, debounceMs, clearDebounceTimer]);

  // Validate entire form
  const validateForm = useCallback(async (
    formData: any,
    fieldRules: Record<string, ValidationRule[]>
  ): Promise<Record<string, FieldValidationResult>> => {
    const results: Record<string, FieldValidationResult> = {};

    // Validate all fields
    await Promise.all(
      Object.entries(fieldRules).map(async ([fieldName, rules]) => {
        const value = formData[fieldName];
        results[fieldName] = await validateField(fieldName, value, rules);
      })
    );

    return results;
  }, [validateField]);

  // Get field validation state
  const getFieldState = useCallback((fieldName: string): FieldValidationResult => {
    return validationStates[fieldName] || { isValid: true, state: 'idle' };
  }, [validationStates]);

  // Set field validation state
  const setFieldState = useCallback((fieldName: string, result: FieldValidationResult) => {
    setValidationStates(prev => ({
      ...prev,
      [fieldName]: result
    }));
  }, []);

  // Clear field validation state
  const clearFieldState = useCallback((fieldName: string) => {
    clearDebounceTimer(fieldName);
    setValidationStates(prev => {
      const newStates = { ...prev };
      delete newStates[fieldName];
      return newStates;
    });
  }, [clearDebounceTimer]);

  // Clear all validation states
  const clearAllStates = useCallback(() => {
    // Clear all debounce timers
    Object.keys(debounceTimers.current).forEach(clearDebounceTimer);
    setValidationStates({});
  }, [clearDebounceTimer]);

  // Check if form is valid
  const isFormValid = Object.values(validationStates).every(state => state.isValid);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const contextValue: FormValidationContext = {
    validateField,
    validateForm,
    getFieldState,
    setFieldState,
    clearFieldState,
    clearAllStates,
    isFormValid,
    validationStates,
  };

  return (
    <ValidationContext.Provider value={contextValue}>
      {children}
    </ValidationContext.Provider>
  );
};

/**
 * Hook to use validation context
 */
export const useValidation = (): FormValidationContext => {
  const context = React.useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

/**
 * Validation Message Component
 */
export interface ValidationMessageProps {
  fieldName: string;
  className?: string;
  showIcon?: boolean;
  enableAnimation?: boolean;
  ariaLive?: 'polite' | 'assertive' | 'off';
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  fieldName,
  className = '',
  showIcon = true,
  enableAnimation = true,
  ariaLive = 'polite',
}) => {
  const { getFieldState } = useValidation();
  const fieldState = getFieldState(fieldName);

  const messageVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' },
    exit: { opacity: 0, y: -10, height: 0 }
  };

  const getStateStyles = () => {
    switch (fieldState.state) {
      case 'invalid':
        return 'text-red-600 dark:text-red-400';
      case 'valid':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'validating':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStateIcon = () => {
    switch (fieldState.state) {
      case 'invalid':
        return '⚠️';
      case 'valid':
        return '✅';
      case 'warning':
        return '⚡';
      case 'validating':
        return '⏳';
      default:
        return null;
    }
  };

  if (!fieldState.message && fieldState.state === 'idle') {
    return null;
  }

  const content = (
    <div
      className={cn(
        'flex items-center space-x-2 text-sm transition-all duration-200',
        getStateStyles(),
        className
      )}
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
    >
      {showIcon && getStateIcon() && (
        <span className="flex-shrink-0" aria-hidden="true">
          {getStateIcon()}
        </span>
      )}
      <span>
        {fieldState.message || (fieldState.state === 'validating' ? 'Validating...' : '')}
      </span>
    </div>
  );

  if (!enableAnimation) {
    return content;
  }

  return (
    <AnimatePresence mode="wait">
      {(fieldState.message || fieldState.state === 'validating') && (
        <motion.div
          key={`${fieldName}-${fieldState.state}`}
          variants={messageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
