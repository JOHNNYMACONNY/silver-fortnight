/**
 * MultiStepForm Component
 * 
 * Advanced multi-step form system for trade creation workflows with
 * glassmorphic styling, progress indicators, and state management.
 */

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { GlassmorphicForm } from "./GlassmorphicForm";

// Step Configuration Interface
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<StepComponentProps>;
  validation?: (data: any) => Promise<boolean> | boolean;
  optional?: boolean;
}

// Step Component Props Interface
export interface StepComponentProps {
  data: any;
  onChange: (field: string, value: any) => void;
  onValidationChange?: (isValid: boolean) => void;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
}

// Multi-Step Form Props Interface
export interface MultiStepFormProps {
  steps: FormStep[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void> | void;
  onStepChange?: (currentStep: number, totalSteps: number) => void;
  className?: string;
  variant?: 'standard' | 'elevated' | 'modal' | 'stepped';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
  showProgressBar?: boolean;
  showStepNumbers?: boolean;
  allowStepNavigation?: boolean;
  validateOnStepChange?: boolean;
  persistData?: boolean;
  storageKey?: string;
}

/**
 * MultiStepForm Component
 */
export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  initialData = {},
  onSubmit,
  onStepChange,
  className = '',
  variant = 'stepped',
  brandAccent = 'gradient',
  showProgressBar = true,
  showStepNumbers = true,
  allowStepNavigation = false,
  validateOnStepChange = true,
  persistData = true,
  storageKey = 'multistep-form-data',
}) => {
  // State management
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    if (persistData && storageKey) {
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setFormData({ ...initialData, ...parsed });
        }
      } catch (error) {
        console.warn('Failed to load persisted form data:', error);
      }
    }
  }, [persistData, storageKey, initialData]);

  // Persist data when it changes
  useEffect(() => {
    if (persistData && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.warn('Failed to persist form data:', error);
      }
    }
  }, [formData, persistData, storageKey]);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStepIndex + 1, steps.length);
  }, [currentStepIndex, steps.length, onStepChange]);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep.validation) return true;

    setIsValidating(true);
    try {
      const isValid = await currentStep.validation(formData);
      setStepValidation(prev => ({
        ...prev,
        [currentStepIndex]: isValid
      }));
      return isValid;
    } catch (error) {
      console.error('Step validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [currentStepIndex, steps, formData]);

  // Handle step validation change
  const handleStepValidationChange = useCallback((isValid: boolean) => {
    setStepValidation(prev => ({
      ...prev,
      [currentStepIndex]: isValid
    }));
  }, [currentStepIndex]);

  // Navigate to next step
  const goToNextStep = useCallback(async () => {
    if (validateOnStepChange) {
      const isValid = await validateCurrentStep();
      if (!isValid) return;
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, steps.length, validateOnStepChange, validateCurrentStep]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // Navigate to specific step
  const goToStep = useCallback(async (stepIndex: number) => {
    if (!allowStepNavigation) return;
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    // If moving forward, validate all steps in between
    if (stepIndex > currentStepIndex && validateOnStepChange) {
      for (let i = currentStepIndex; i < stepIndex; i++) {
        const step = steps[i];
        if (step.validation) {
          const isValid = await step.validation(formData);
          if (!isValid) return;
        }
      }
    }

    setCurrentStepIndex(stepIndex);
  }, [allowStepNavigation, currentStepIndex, steps, validateOnStepChange, formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate all steps
      if (validateOnStepChange) {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (step.validation) {
            const isValid = await step.validation(formData);
            if (!isValid) {
              setCurrentStepIndex(i);
              throw new Error(`Step ${i + 1} validation failed`);
            }
          }
        }
      }

      // Submit form
      await onSubmit(formData);

      // Clear persisted data on successful submission
      if (persistData && storageKey) {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle submission errors
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, steps, validateOnStepChange, persistData, storageKey]);

  // Current step data
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentStepValid = stepValidation[currentStepIndex] ?? false;

  // Progress calculation
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Progress Bar */}
      {showProgressBar && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentStep.title}
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          
          {currentStep.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {currentStep.description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            
            {/* Step Indicators */}
            {showStepNumbers && (
              <div className="flex justify-between mt-4">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    disabled={!allowStepNavigation}
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200',
                      index <= currentStepIndex
                        ? 'bg-gradient-to-r from-orange-500 to-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                      allowStepNavigation && 'hover:scale-110 cursor-pointer',
                      !allowStepNavigation && 'cursor-default'
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Content */}
      <GlassmorphicForm
        variant={variant}
        brandAccent={brandAccent}
        className="min-h-[400px]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step Component */}
            <currentStep.component
              data={formData}
              onChange={handleFieldChange}
              onValidationChange={handleStepValidationChange}
              errors={errors}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10 dark:border-gray-700/20">
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={isFirstStep || isSubmitting}
            className={cn(
              'px-6 py-3 rounded-xl font-medium transition-all duration-200',
              'backdrop-blur-sm border',
              isFirstStep || isSubmitting
                ? 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 text-gray-400 cursor-not-allowed'
                : 'bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/30'
            )}
          >
            Previous
          </button>

          <div className="flex space-x-4">
            {!isLastStep ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={validateOnStepChange && !currentStepValid || isValidating || isSubmitting}
                className={cn(
                  'px-8 py-3 rounded-xl font-medium transition-all duration-200',
                  'bg-gradient-to-r from-orange-500 to-blue-500 text-white',
                  'hover:from-orange-600 hover:to-blue-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'shadow-lg hover:shadow-xl'
                )}
              >
                {isValidating ? 'Validating...' : 'Next Step'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (validateOnStepChange && !currentStepValid)}
                className={cn(
                  'px-8 py-3 rounded-xl font-medium transition-all duration-200',
                  'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
                  'hover:from-green-600 hover:to-emerald-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'shadow-lg hover:shadow-xl'
                )}
              >
                {isSubmitting ? 'Submitting...' : 'Complete'}
              </button>
            )}
          </div>
        </div>
      </GlassmorphicForm>
    </div>
  );
};

export default MultiStepForm;
