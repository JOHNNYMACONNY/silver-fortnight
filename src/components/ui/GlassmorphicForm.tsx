import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassmorphicFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  children: React.ReactNode;
  className?: string;
  
  // Phase 6.1: Advanced form variants
  variant?: 'standard' | 'elevated' | 'modal' | 'stepped';
  blurIntensity?: 'sm' | 'md' | 'lg' | 'xl';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
  shadow?: 'beautiful-shadow' | 'form-shadow' | 'elevated-shadow';
  borders?: 'glass-borders' | 'dual-borders' | 'gradient-borders';
  zIndex?: number;
  
  // Phase 6.1: Multi-step form support
  isMultiStep?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
  
  // Phase 6.1: Form state management
  isLoading?: boolean;
  isSubmitting?: boolean;
  validationState?: 'idle' | 'validating' | 'valid' | 'invalid';
  
  // Phase 6.1: Integration with other phases
  integrateWithBackground?: boolean;
  harmonizeWithCards?: boolean;
  coordinateWithNavigation?: boolean;
}

export const GlassmorphicForm: React.FC<GlassmorphicFormProps> = ({
  children,
  className = '',
  variant = 'standard',
  blurIntensity = 'md',
  brandAccent = 'gradient',
  shadow = 'beautiful-shadow',
  borders = 'glass-borders',
  zIndex = 10,
  isMultiStep = false,
  currentStep = 1,
  totalSteps = 1,
  onStepChange,
  isLoading = false,
  isSubmitting = false,
  validationState = 'idle',
  integrateWithBackground = true,
  harmonizeWithCards = true,
  coordinateWithNavigation = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Phase 6.1: Form variants with sophisticated glassmorphism
  const formVariants = {
    standard: `glassmorphic rounded-2xl p-6`,
    elevated: `glassmorphic rounded-3xl p-8 shadow-2xl`,
    modal: `glassmorphic rounded-2xl p-8 shadow-beautiful`,
    stepped: `glassmorphic rounded-r-2xl pl-8 pr-6 py-6 border-l-4 border-gradient-to-b from-orange-500 to-blue-500`
  };

  const blurClasses = {
    sm: '',
    md: '', 
    lg: '',
    xl: ''
  };

  const brandAccentClasses = {
    orange: 'ring-1 ring-ring/20 focus-within:ring-ring/40',
    blue: 'ring-1 ring-ring/20 focus-within:ring-ring/40',
    purple: 'ring-1 ring-ring/20 focus-within:ring-ring/40',
    gradient: 'ring-1 ring-gradient-to-r from-primary/20 via-secondary/20 to-accent/20'
  };

  const shadowClasses = {
    'beautiful-shadow': 'shadow-[0_8px_32px_rgba(31,38,135,0.37)]',
    'form-shadow': 'shadow-lg',
    'elevated-shadow': 'shadow-2xl'
  };

  const borderClasses = {
    'glass-borders': 'border-glass',
    'dual-borders': 'border-strong',
    'gradient-borders': 'border border-gradient-to-r from-orange-500/20 via-blue-500/20 to-purple-500/20'
  };

  // Phase 6.1: Multi-step progress indicator
  const renderStepProgress = useCallback(() => {
    if (!isMultiStep || totalSteps <= 1) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-orange-500 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  }, [isMultiStep, currentStep, totalSteps]);

  // Phase 6.1: Form state indicators
  const renderFormState = useCallback(() => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 glassmorphic rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ring border-t-transparent"></div>
        </div>
      );
    }

    if (isSubmitting) {
      return (
        <div className="absolute inset-0 glassmorphic rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Submitting...</p>
          </div>
        </div>
      );
    }

    return null;
  }, [isLoading, isSubmitting]);

  // Phase 6.1: Validation state styling
  const validationClasses = {
    idle: '',
    validating: 'ring-2 ring-yellow-500/30',
    valid: 'ring-2 ring-green-500/30',
    invalid: 'ring-2 ring-red-500/30'
  };

  return (
    <motion.form
      className={cn(
        'relative',
        formVariants[variant],
        blurClasses[blurIntensity],
        brandAccentClasses[brandAccent],
        shadowClasses[shadow],
        borderClasses[borders],
        validationClasses[validationState],
        'transition-all duration-300 ease-out',
        integrateWithBackground && 'relative z-card-layer-1',
        harmonizeWithCards && 'card-harmony-enabled',
        coordinateWithNavigation && 'nav-coordination-enabled',
        className
      )}
      style={{ zIndex }}
      initial={{ opacity: 0 as number, y: 20 as number }}
      animate={{ opacity: 1 as number, y: 0 as number }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...(props as any)}
    >
      {/* Multi-step progress indicator */}
      {renderStepProgress()}

      {/* Form content */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Form state overlay */}
      {renderFormState()}
    </motion.form>
  );
};

export default GlassmorphicForm; 