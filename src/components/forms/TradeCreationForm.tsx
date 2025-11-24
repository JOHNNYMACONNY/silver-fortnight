/**
 * TradeCreationForm Component
 * 
 * Complete trade creation workflow using the multi-step form system
 * with glassmorphic styling and TradeYa brand integration.
 */

import React, { useState, useCallback } from "react";
import { MultiStepForm, FormStep } from "./MultiStepForm";
import { logger } from '@utils/logging/logger';
import { Button } from "../ui/Button";
import {
  ItemDetailsStep,
  PricingStep,
  PreferencesStep,
  ConfirmationStep,
} from "./TradeCreationSteps";

// Trade Creation Form Data Interface
export interface TradeCreationData {
  // Item Details
  itemName: string;
  category: string;
  condition: string;
  description: string;
  
  // Pricing
  estimatedValue: string;
  tradeValue: string;
  lookingFor?: string;
  
  // Preferences
  tradePreference: string;
  location: string;
  allowCounterOffers?: boolean;
  allowPartialTrades?: boolean;
  urgentTrade?: boolean;
  additionalNotes?: string;
  
  // Metadata
  createdAt?: Date;
  userId?: string;
}

// Form Props Interface
export interface TradeCreationFormProps {
  onSubmit: (data: TradeCreationData) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: Partial<TradeCreationData>;
  className?: string;
  variant?: 'standard' | 'elevated' | 'modal' | 'stepped';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
}

/**
 * TradeCreationForm Component
 */
export const TradeCreationForm: React.FC<TradeCreationFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  className = '',
  variant = 'stepped',
  brandAccent = 'gradient',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form step validation functions
  const validateItemDetails = useCallback(async (data: any): Promise<boolean> => {
    const errors: string[] = [];
    
    if (!data.itemName?.trim()) {
      errors.push('Item name is required');
    }
    
    if (!data.category) {
      errors.push('Category is required');
    }
    
    if (!data.condition) {
      errors.push('Condition is required');
    }
    
    if (!data.description?.trim()) {
      errors.push('Description is required');
    } else if (data.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    
    return errors.length === 0;
  }, []);

  const validatePricing = useCallback(async (data: any): Promise<boolean> => {
    const errors: string[] = [];
    
    if (!data.estimatedValue || parseFloat(data.estimatedValue) <= 0) {
      errors.push('Valid estimated value is required');
    }
    
    if (!data.tradeValue || parseFloat(data.tradeValue) <= 0) {
      errors.push('Valid trade value is required');
    }
    
    return errors.length === 0;
  }, []);

  const validatePreferences = useCallback(async (data: any): Promise<boolean> => {
    const errors: string[] = [];
    
    if (!data.tradePreference) {
      errors.push('Trade preference is required');
    }
    
    if (!data.location?.trim()) {
      errors.push('Location is required');
    }
    
    return errors.length === 0;
  }, []);

  // Form steps configuration
  const formSteps: FormStep[] = [
    {
      id: 'item-details',
      title: 'Item Details',
      description: 'Tell us about the item you want to trade',
      component: ItemDetailsStep,
      validation: validateItemDetails,
    },
    {
      id: 'pricing',
      title: 'Pricing & Value',
      description: 'Set your item\'s value and trade preferences',
      component: PricingStep,
      validation: validatePricing,
    },
    {
      id: 'preferences',
      title: 'Trade Preferences',
      description: 'Configure how you want to trade',
      component: PreferencesStep,
      validation: validatePreferences,
    },
    {
      id: 'confirmation',
      title: 'Review & Confirm',
      description: 'Review your trade listing before publishing',
      component: ConfirmationStep,
      // No validation needed for confirmation step
    },
  ];

  // Handle form submission
  const handleSubmit = useCallback(async (data: TradeCreationData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Add metadata
      const completeData: TradeCreationData = {
        ...data,
        createdAt: new Date(),
        // userId would typically come from auth context
      };

      await onSubmit(completeData);
    } catch (error) {
      logger.error('Trade creation error:', 'COMPONENT', {}, error as Error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create trade listing. Please try again.'
      );
      throw error; // Re-throw to prevent form from closing
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit]);

  // Handle step changes
  const handleStepChange = useCallback((currentStep: number, totalSteps: number) => {
    // Could be used for analytics or progress tracking
    logger.debug(`Trade creation progress: ${currentStep}/${totalSteps}`, 'COMPONENT');
  }, []);

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Trade Listing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          List your item for trade and connect with other traders in the TradeYa community.
          Fill out the details below to get started.
        </p>
      </div>

      {/* Error Display */}
      {submitError && (
        <div className="mb-6 p-4 glassmorphic border-glass backdrop-blur-xl bg-destructive/5">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-br from-red-500/80 to-red-600/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs">!</span>
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">
              {submitError}
            </p>
          </div>
        </div>
      )}

      {/* Multi-Step Form */}
      <MultiStepForm
        steps={formSteps}
        initialData={initialData}
        onSubmit={handleSubmit}
        onStepChange={handleStepChange}
        variant={variant}
        brandAccent={brandAccent}
        showProgressBar={true}
        showStepNumbers={true}
        allowStepNavigation={false} // Force linear progression for trade creation
        validateOnStepChange={true}
        persistData={true}
        storageKey="trade-creation-form"
      />

      {/* Cancel Button */}
      {onCancel && (
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel and return to dashboard
          </Button>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 glassmorphic border-glass backdrop-blur-xl bg-white/5 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Tips for a Successful Trade
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Be Detailed</h4>
            <p>Include specific details about your item's condition, brand, model, and any defects.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Fair Pricing</h4>
            <p>Research current market values to set realistic trade values that attract traders.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Clear Photos</h4>
            <p>Add high-quality photos from multiple angles to build trust with potential traders.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Quick Response</h4>
            <p>Respond promptly to trade offers to maintain good standing in the community.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeCreationForm;
