import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassmorphicFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
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
    standard: `
      backdrop-blur-md bg-white/70 dark:bg-neutral-800/60
      border border-white/20 dark:border-neutral-700/30
      rounded-2xl p-6
    `,
    elevated: `
      backdrop-blur-lg bg-white/80 dark:bg-neutral-800/70
      border-2 border-white/30 dark:border-neutral-700/40
      rounded-3xl p-8 shadow-2xl
    `,
    modal: `
      backdrop-blur-xl bg-white/90 dark:bg-neutral-800/80
      border border-white/40 dark:border-neutral-700/50
      rounded-2xl p-8 shadow-beautiful
    `,
    stepped: `
      backdrop-blur-md bg-white/75 dark:bg-neutral-800/65
      border-l-4 border-gradient-to-b from-orange-500 to-blue-500
      rounded-r-2xl pl-8 pr-6 py-6
    `
  };

  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md', 
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  };

  const brandAccentClasses = {
    orange: 'ring-1 ring-orange-500/20 focus-within:ring-orange-500/40',
    blue: 'ring-1 ring-blue-500/20 focus-within:ring-blue-500/40',
    purple: 'ring-1 ring-purple-500/20 focus-within:ring-purple-500/40',
    gradient: 'ring-1 ring-gradient-to-r from-orange-500/20 via-blue-500/20 to-purple-500/20'
  };

  const shadowClasses = {
    'beautiful-shadow': 'shadow-[0_8px_32px_rgba(31,38,135,0.37)]',
    'form-shadow': 'shadow-lg',
    'elevated-shadow': 'shadow-2xl'
  };

  const borderClasses = {
    'glass-borders': 'border border-white/20 dark:border-neutral-700/30',
    'dual-borders': 'border-2 border-white/30 dark:border-neutral-700/40',
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
        <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      );
    }

    if (isSubmitting) {
      return (
        <div className="absolute inset-0 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
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