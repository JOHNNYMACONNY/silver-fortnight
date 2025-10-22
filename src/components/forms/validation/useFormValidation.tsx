/**
 * Form Validation Hooks
 * 
 * Custom hooks for form validation with real-time feedback,
 * accessibility support, and integration with glassmorphic components.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useValidation, ValidationRule, FieldValidationResult } from "./FormValidationSystem";

// Field Validation Hook Props
export interface UseFieldValidationProps {
  fieldName: string;
  rules: ValidationRule[];
  initialValue?: any;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

// Field Validation Hook Return
export interface UseFieldValidationReturn {
  value: any;
  setValue: (value: any) => void;
  error: string | undefined;
  isValid: boolean;
  isValidating: boolean;
  hasBeenTouched: boolean;
  validate: () => Promise<FieldValidationResult>;
  reset: () => void;
  touch: () => void;
  fieldState: FieldValidationResult;
}

/**
 * Hook for individual field validation
 */
export const useFieldValidation = ({
  fieldName,
  rules,
  initialValue = '',
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFieldValidationProps): UseFieldValidationReturn => {
  const { validateField, getFieldState, clearFieldState } = useValidation();
  const [value, setValue] = useState(initialValue);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const fieldState = getFieldState(fieldName);

  // Clear debounce timer
  const clearDebounceTimer = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = undefined;
    }
  }, []);

  // Validate field
  const validate = useCallback(async (): Promise<FieldValidationResult> => {
    return await validateField(fieldName, value, rules);
  }, [validateField, fieldName, value, rules]);

  // Handle value change
  const handleSetValue = useCallback((newValue: any) => {
    setValue(newValue);
    
    if (validateOnChange && hasBeenTouched) {
      clearDebounceTimer();
      
      if (debounceMs > 0) {
        debounceTimer.current = setTimeout(() => {
          validateField(fieldName, newValue, rules);
        }, debounceMs);
      } else {
        validateField(fieldName, newValue, rules);
      }
    }
  }, [validateOnChange, hasBeenTouched, validateField, fieldName, rules, debounceMs, clearDebounceTimer]);

  // Handle field touch (focus/blur)
  const touch = useCallback(() => {
    setHasBeenTouched(true);
    
    if (validateOnBlur) {
      validateField(fieldName, value, rules);
    }
  }, [validateOnBlur, validateField, fieldName, value, rules]);

  // Reset field
  const reset = useCallback(() => {
    setValue(initialValue);
    setHasBeenTouched(false);
    clearFieldState(fieldName);
    clearDebounceTimer();
  }, [initialValue, clearFieldState, fieldName, clearDebounceTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearDebounceTimer();
    };
  }, [clearDebounceTimer]);

  return {
    value,
    setValue: handleSetValue,
    error: fieldState.message,
    isValid: fieldState.isValid,
    isValidating: fieldState.state === 'validating',
    hasBeenTouched,
    validate,
    reset,
    touch,
    fieldState,
  };
};

// Form Validation Hook Props
export interface UseFormValidationProps {
  initialData?: Record<string, any>;
  validationRules: Record<string, ValidationRule[]>;
  validateOnSubmit?: boolean;
  resetOnSubmit?: boolean;
}

// Form Validation Hook Return
export interface UseFormValidationReturn {
  data: Record<string, any>;
  errors: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
  hasErrors: boolean;
  setFieldValue: (fieldName: string, value: any) => void;
  setFieldError: (fieldName: string, error: string) => void;
  validateField: (fieldName: string) => Promise<FieldValidationResult>;
  validateForm: () => Promise<boolean>;
  resetForm: () => void;
  resetField: (fieldName: string) => void;
  submitForm: (onSubmit: (data: Record<string, any>) => Promise<void> | void) => Promise<void>;
  touchedFields: Set<string>;
  markFieldTouched: (fieldName: string) => void;
}

/**
 * Hook for complete form validation
 */
export const useFormValidation = ({
  initialData = {},
  validationRules,
  validateOnSubmit = true,
  resetOnSubmit = false,
}: UseFormValidationProps): UseFormValidationReturn => {
  const { validateField, validateForm, getFieldState, clearFieldState, clearAllStates, isFormValid } = useValidation();
  const [data, setData] = useState<Record<string, any>>(initialData);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current errors
  const errors = Object.keys(validationRules).reduce((acc, fieldName) => {
    const fieldState = getFieldState(fieldName);
    if (fieldState.message) {
      acc[fieldName] = fieldState.message;
    }
    return acc;
  }, {} as Record<string, string>);

  // Check if any field is validating
  const isValidating = Object.keys(validationRules).some(fieldName => {
    const fieldState = getFieldState(fieldName);
    return fieldState.state === 'validating';
  });

  const hasErrors = Object.keys(errors).length > 0;

  // Set field value
  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    
    // Validate if field has been touched
    if (touchedFields.has(fieldName) && validationRules[fieldName]) {
      validateField(fieldName, value, validationRules[fieldName]);
    }
  }, [touchedFields, validationRules, validateField]);

  // Set field error manually
  const setFieldError = useCallback((fieldName: string, error: string) => {
    // This would typically be handled by the validation system
    // but can be useful for server-side validation errors
    console.warn('Manual error setting not implemented in current validation system');
  }, []);

  // Validate single field
  const validateSingleField = useCallback(async (fieldName: string): Promise<FieldValidationResult> => {
    if (!validationRules[fieldName]) {
      return { isValid: true, state: 'idle' };
    }
    
    const value = data[fieldName];
    return await validateField(fieldName, value, validationRules[fieldName]);
  }, [data, validationRules, validateField]);

  // Validate entire form
  const validateEntireForm = useCallback(async (): Promise<boolean> => {
    const results = await validateForm(data, validationRules);
    return Object.values(results).every(result => result.isValid);
  }, [data, validationRules, validateForm]);

  // Mark field as touched
  const markFieldTouched = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setData(initialData);
    setTouchedFields(new Set());
    clearAllStates();
    setIsSubmitting(false);
  }, [initialData, clearAllStates]);

  // Reset single field
  const resetField = useCallback((fieldName: string) => {
    setData(prev => ({ ...prev, [fieldName]: initialData[fieldName] || '' }));
    setTouchedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
    clearFieldState(fieldName);
  }, [initialData, clearFieldState]);

  // Submit form with validation
  const submitForm = useCallback(async (onSubmit: (data: Record<string, any>) => Promise<void> | void) => {
    setIsSubmitting(true);
    
    try {
      // Mark all fields as touched
      setTouchedFields(new Set(Object.keys(validationRules)));
      
      // Validate form if required
      if (validateOnSubmit) {
        const isValid = await validateEntireForm();
        if (!isValid) {
          throw new Error('Form validation failed');
        }
      }
      
      // Submit form
      await onSubmit(data);
      
      // Reset form if required
      if (resetOnSubmit) {
        resetForm();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validationRules, validateOnSubmit, validateEntireForm, data, resetOnSubmit, resetForm]);

  return {
    data,
    errors,
    isValid: isFormValid && !hasErrors,
    isValidating: isValidating || isSubmitting,
    hasErrors,
    setFieldValue,
    setFieldError,
    validateField: validateSingleField,
    validateForm: validateEntireForm,
    resetForm,
    resetField,
    submitForm,
    touchedFields,
    markFieldTouched,
  };
};

// Validation State Hook for UI Components
export interface UseValidationStateProps {
  fieldName: string;
  showValidationOnTouch?: boolean;
  showSuccessState?: boolean;
}

export interface UseValidationStateReturn {
  validationState: 'idle' | 'validating' | 'valid' | 'invalid' | 'warning';
  validationMessage: string | undefined;
  showValidation: boolean;
  validationIcon: string | null;
  validationColor: string;
  ariaDescribedBy: string;
  ariaInvalid: boolean;
}

/**
 * Hook for validation state in UI components
 */
export const useValidationState = ({
  fieldName,
  showValidationOnTouch = true,
  showSuccessState = true,
}: UseValidationStateProps): UseValidationStateReturn => {
  const { getFieldState } = useValidation();
  const fieldState = getFieldState(fieldName);

  const showValidation = showValidationOnTouch && (
    fieldState.state !== 'idle' && 
    (fieldState.state !== 'valid' || showSuccessState)
  );

  const getValidationIcon = (): string | null => {
    switch (fieldState.state) {
      case 'invalid':
        return '⚠️';
      case 'valid':
        return showSuccessState ? '✅' : null;
      case 'warning':
        return '⚡';
      case 'validating':
        return '⏳';
      default:
        return null;
    }
  };

  const getValidationColor = (): string => {
    switch (fieldState.state) {
      case 'invalid':
        return 'red';
      case 'valid':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'validating':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return {
    validationState: fieldState.state,
    validationMessage: fieldState.message,
    showValidation,
    validationIcon: getValidationIcon(),
    validationColor: getValidationColor(),
    ariaDescribedBy: showValidation ? `${fieldName}-validation` : '',
    ariaInvalid: fieldState.state === 'invalid',
  };
};
