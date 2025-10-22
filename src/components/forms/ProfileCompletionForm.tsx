/**
 * ProfileCompletionForm Component
 * 
 * Complete profile setup workflow using the multi-step form system
 * with glassmorphic styling and TradeYa brand integration.
 */

import React, { useState, useCallback } from "react";
import { MultiStepForm, FormStep } from "./MultiStepForm";
import {
  BasicInfoStep,
  AvatarBioStep,
  TradingPreferencesStep,
  ProfileReviewStep,
} from "./ProfileCompletionSteps";

// Profile Completion Form Data Interface
export interface ProfileCompletionData {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  phone?: string;
  
  // Avatar & Bio
  avatar?: File | string | null;
  bio: string;
  tradingPhilosophy?: string;
  
  // Trading Preferences
  tradingInterests: string[];
  experienceLevel: string;
  preferredTradeMethod: string;
  openToCounterOffers?: boolean;
  allowPartialTrades?: boolean;
  mentorNewTraders?: boolean;
  receiveRecommendations?: boolean;
  
  // Communication Preferences
  emailNotifications?: boolean;
  weeklyDigest?: boolean;
  communityUpdates?: boolean;
  
  // Metadata
  completedAt?: Date;
  profileVersion?: string;
}

// Form Props Interface
export interface ProfileCompletionFormProps {
  onSubmit: (data: ProfileCompletionData) => Promise<void> | void;
  onSkip?: () => void;
  initialData?: Partial<ProfileCompletionData>;
  className?: string;
  variant?: 'standard' | 'elevated' | 'modal' | 'stepped';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
  showSkipOption?: boolean;
}

/**
 * ProfileCompletionForm Component
 */
export const ProfileCompletionForm: React.FC<ProfileCompletionFormProps> = ({
  onSubmit,
  onSkip,
  initialData = {},
  className = '',
  variant = 'stepped',
  brandAccent = 'gradient',
  showSkipOption = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form step validation functions
  const validateBasicInfo = useCallback(async (data: any): Promise<boolean> => {
    const errors: string[] = [];
    
    if (!data.firstName?.trim()) {
      errors.push('First name is required');
    }
    
    if (!data.lastName?.trim()) {
      errors.push('Last name is required');
    }
    
    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!data.email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    if (!data.location) {
      errors.push('Location is required');
    }
    
    return errors.length === 0;
  }, []);

  const validateAvatarBio = useCallback(async (data: any): Promise<boolean> => {
    const errors: string[] = [];
    
    if (!data.bio?.trim()) {
      errors.push('Bio is required');
    } else if (data.bio.trim().length < 20) {
      errors.push('Bio must be at least 20 characters');
    }
    
    return errors.length === 0;
  }, []);

  const validateTradingPreferences = useCallback(async (data: any): Promise<boolean> => {
    const errors: string[] = [];
    
    if (!data.tradingInterests?.length) {
      errors.push('At least one trading interest is required');
    }
    
    if (!data.experienceLevel) {
      errors.push('Experience level is required');
    }
    
    if (!data.preferredTradeMethod) {
      errors.push('Preferred trade method is required');
    }
    
    return errors.length === 0;
  }, []);

  // Form steps configuration
  const formSteps: FormStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Let\'s start with your basic details',
      component: BasicInfoStep,
      validation: validateBasicInfo,
    },
    {
      id: 'avatar-bio',
      title: 'Profile & Bio',
      description: 'Add a photo and tell us about yourself',
      component: AvatarBioStep,
      validation: validateAvatarBio,
    },
    {
      id: 'trading-preferences',
      title: 'Trading Preferences',
      description: 'Set up your trading preferences',
      component: TradingPreferencesStep,
      validation: validateTradingPreferences,
    },
    {
      id: 'review',
      title: 'Review & Complete',
      description: 'Review your profile and join the community',
      component: ProfileReviewStep,
      // No validation needed for review step
    },
  ];

  // Handle form submission
  const handleSubmit = useCallback(async (data: ProfileCompletionData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Add metadata
      const completeData: ProfileCompletionData = {
        ...data,
        completedAt: new Date(),
        profileVersion: '1.0',
      };

      await onSubmit(completeData);
    } catch (error) {
      console.error('Profile completion error:', error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Failed to complete profile setup. Please try again.'
      );
      throw error; // Re-throw to prevent form from closing
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit]);

  // Handle step changes
  const handleStepChange = useCallback((currentStep: number, totalSteps: number) => {
    // Could be used for analytics or progress tracking
    console.log(`Profile completion progress: ${currentStep}/${totalSteps}`);
  }, []);

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-3xl font-bold">👤</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Complete Your Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Help us create the perfect trading experience for you. Complete your profile to 
          connect with other traders and start building your reputation in the TradeYa community.
        </p>
      </div>

      {/* Error Display */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
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
        allowStepNavigation={false} // Force linear progression for profile completion
        validateOnStepChange={true}
        persistData={true}
        storageKey="profile-completion-form"
      />

      {/* Skip Option */}
      {showSkipOption && onSkip && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 disabled:opacity-50"
          >
            Skip for now and complete later
          </button>
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-12 glassmorphic p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Why Complete Your Profile?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">🤝</span>
            </div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Build Trust</h4>
            <p>A complete profile helps other traders feel confident trading with you.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">🎯</span>
            </div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Better Matches</h4>
            <p>We'll recommend trades that match your interests and preferences.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">⭐</span>
            </div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Higher Success</h4>
            <p>Complete profiles have 3x higher trade success rates.</p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Your privacy is important to us. We only share information that helps facilitate trades. 
          You can update your privacy settings anytime in your account preferences.
        </p>
      </div>
    </div>
  );
};

export default ProfileCompletionForm;
