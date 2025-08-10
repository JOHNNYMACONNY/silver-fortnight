/**
 * Form Component Examples
 * 
 * Comprehensive examples demonstrating all form components and patterns
 * in the TradeYa glassmorphic form system.
 */

import React, { useState } from 'react';
import { ValidationProvider, ValidationRules } from '../validation/FormValidationSystem';
import { GlassmorphicForm } from '../GlassmorphicForm';
import { GlassmorphicInput } from '../GlassmorphicInput';
import { GlassmorphicTextarea } from '../GlassmorphicTextarea';
import { GlassmorphicDropdown, DropdownOption } from '../GlassmorphicDropdown';
import { MultiStepForm, FormStep } from '../MultiStepForm';
import { TradeCreationForm } from '../TradeCreationForm';
import { ProfileCompletionForm } from '../ProfileCompletionForm';

// Sample data for dropdowns
const categories: DropdownOption[] = [
  { value: 'electronics', label: 'Electronics', description: 'Phones, laptops, gadgets' },
  { value: 'clothing', label: 'Clothing & Fashion', description: 'Apparel, shoes, accessories' },
  { value: 'books', label: 'Books & Media', description: 'Books, movies, music' },
  { value: 'sports', label: 'Sports & Recreation', description: 'Equipment, gear, outdoor items' },
];

const locations: DropdownOption[] = [
  { value: 'CA', label: 'California', group: 'States' },
  { value: 'NY', label: 'New York', group: 'States' },
  { value: 'TX', label: 'Texas', group: 'States' },
  { value: 'los-angeles', label: 'Los Angeles, CA', group: 'Major Cities' },
  { value: 'new-york-city', label: 'New York City, NY', group: 'Major Cities' },
  { value: 'chicago', label: 'Chicago, IL', group: 'Major Cities' },
];

/**
 * Example 1: Basic Form with Validation
 */
export const BasicFormExample: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    category: '',
    interests: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Form submitted successfully!');
  };

  return (
    <ValidationProvider>
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Basic Form Example
        </h2>
        
        <GlassmorphicForm variant="elevated" brandAccent="gradient">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <GlassmorphicInput
              label="Email Address"
              type="email"
              fieldName="email"
              validationRules={[
                ValidationRules.required('Email is required'),
                ValidationRules.email('Please enter a valid email address')
              ]}
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              variant="glass"
              brandAccent="orange"
              placeholder="Enter your email"
            />

            {/* Password Input */}
            <GlassmorphicInput
              label="Password"
              type="password"
              fieldName="password"
              validationRules={[
                ValidationRules.required('Password is required'),
                ValidationRules.minLength(8, 'Password must be at least 8 characters'),
                ValidationRules.pattern(
                  /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  'Password must contain lowercase, uppercase, and number'
                )
              ]}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              variant="glass"
              brandAccent="blue"
              showPasswordToggle={true}
              placeholder="Enter your password"
            />

            {/* Confirm Password */}
            <GlassmorphicInput
              label="Confirm Password"
              type="password"
              fieldName="confirmPassword"
              validationRules={[
                ValidationRules.required('Please confirm your password'),
                ValidationRules.custom(
                  (value) => value === formData.password,
                  'Passwords do not match'
                )
              ]}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              variant="glass"
              brandAccent="purple"
              showPasswordToggle={true}
              placeholder="Confirm your password"
            />

            {/* Bio Textarea */}
            <GlassmorphicTextarea
              label="Bio"
              fieldName="bio"
              validationRules={[
                ValidationRules.minLength(20, 'Bio must be at least 20 characters'),
                ValidationRules.maxLength(500, 'Bio must be no more than 500 characters')
              ]}
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              variant="glass"
              brandAccent="gradient"
              placeholder="Tell us about yourself..."
              minRows={3}
              maxRows={6}
              showCharacterCount={true}
              maxLength={500}
            />

            {/* Category Dropdown */}
            <GlassmorphicDropdown
              label="Primary Interest"
              options={categories}
              fieldName="category"
              validationRules={[
                ValidationRules.required('Please select a category')
              ]}
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value as string }))}
              variant="glass"
              brandAccent="orange"
              searchable={true}
              placeholder="Select your primary interest"
            />

            {/* Multi-select Interests */}
            <GlassmorphicDropdown
              label="Additional Interests"
              options={categories}
              fieldName="interests"
              value={formData.interests}
              onChange={(value) => setFormData(prev => ({ ...prev, interests: value as string[] }))}
              variant="glass"
              brandAccent="blue"
              multiSelect={true}
              searchable={true}
              placeholder="Select additional interests"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              Submit Form
            </button>
          </form>
        </GlassmorphicForm>
      </div>
    </ValidationProvider>
  );
};

/**
 * Example 2: Advanced Validation Patterns
 */
export const AdvancedValidationExample: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    website: '',
    age: '',
    zipCode: '',
  });

  return (
    <ValidationProvider debounceMs={500}>
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Advanced Validation Example
        </h2>
        
        <GlassmorphicForm variant="modal" brandAccent="purple">
          <div className="space-y-6">
            {/* Username with async validation */}
            <GlassmorphicInput
              label="Username"
              fieldName="username"
              validationRules={[
                ValidationRules.required('Username is required'),
                ValidationRules.minLength(3, 'Username must be at least 3 characters'),
                ValidationRules.pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
                ValidationRules.custom(
                  async (value) => {
                    // Simulate API call to check username availability
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return !['admin', 'root', 'test'].includes(value.toLowerCase());
                  },
                  'This username is not available'
                )
              ]}
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              variant="elevated-glass"
              brandAccent="purple"
              placeholder="Choose a unique username"
            />

            {/* Phone Number */}
            <GlassmorphicInput
              label="Phone Number"
              type="tel"
              fieldName="phone"
              validationRules={[
                ValidationRules.phone('Please enter a valid phone number')
              ]}
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              variant="glass"
              brandAccent="blue"
              placeholder="(555) 123-4567"
            />

            {/* Website URL */}
            <GlassmorphicInput
              label="Website"
              type="url"
              fieldName="website"
              validationRules={[
                ValidationRules.url('Please enter a valid URL')
              ]}
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              variant="glass"
              brandAccent="orange"
              placeholder="https://example.com"
            />

            {/* Age with number validation */}
            <GlassmorphicInput
              label="Age"
              type="number"
              fieldName="age"
              validationRules={[
                ValidationRules.required('Age is required'),
                ValidationRules.number(13, 120, 'Age must be between 13 and 120')
              ]}
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              variant="glass"
              brandAccent="gradient"
              placeholder="Enter your age"
            />

            {/* ZIP Code with pattern validation */}
            <GlassmorphicInput
              label="ZIP Code"
              fieldName="zipCode"
              validationRules={[
                ValidationRules.pattern(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code (12345 or 12345-6789)')
              ]}
              value={formData.zipCode}
              onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
              variant="glass"
              brandAccent="purple"
              placeholder="12345 or 12345-6789"
            />
          </div>
        </GlassmorphicForm>
      </div>
    </ValidationProvider>
  );
};

/**
 * Example 3: Multi-Step Form
 */
export const MultiStepFormExample: React.FC = () => {
  // Step 1 Component
  const Step1: React.FC<any> = ({ data, onChange, onValidationChange }) => {
    React.useEffect(() => {
      const isValid = !!(data.firstName && data.lastName && data.email);
      onValidationChange?.(isValid);
    }, [data, onValidationChange]);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassmorphicInput
            label="First Name"
            value={data.firstName || ''}
            onChange={(e) => onChange('firstName', e.target.value)}
            variant="glass"
            brandAccent="orange"
            required
          />
          <GlassmorphicInput
            label="Last Name"
            value={data.lastName || ''}
            onChange={(e) => onChange('lastName', e.target.value)}
            variant="glass"
            brandAccent="blue"
            required
          />
        </div>
        <GlassmorphicInput
          label="Email"
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          variant="glass"
          brandAccent="purple"
          required
        />
      </div>
    );
  };

  // Step 2 Component
  const Step2: React.FC<any> = ({ data, onChange, onValidationChange }) => {
    React.useEffect(() => {
      const isValid = !!(data.location && data.interests?.length > 0);
      onValidationChange?.(isValid);
    }, [data, onValidationChange]);

    return (
      <div className="space-y-6">
        <GlassmorphicDropdown
          label="Location"
          options={locations}
          value={data.location || ''}
          onChange={(value) => onChange('location', value)}
          variant="glass"
          brandAccent="gradient"
          searchable={true}
          required
        />
        <GlassmorphicDropdown
          label="Interests"
          options={categories}
          value={data.interests || []}
          onChange={(value) => onChange('interests', value)}
          variant="glass"
          brandAccent="orange"
          multiSelect={true}
          searchable={true}
          required
        />
      </div>
    );
  };

  // Step 3 Component
  const Step3: React.FC<any> = ({ data, onValidationChange }) => {
    React.useEffect(() => {
      onValidationChange?.(true); // Review step is always valid
    }, [onValidationChange]);

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Your Information</h3>
        <div className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/30">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Name:</dt>
              <dd className="text-gray-900 dark:text-white">{data.firstName} {data.lastName}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Email:</dt>
              <dd className="text-gray-900 dark:text-white">{data.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Location:</dt>
              <dd className="text-gray-900 dark:text-white">
                {locations.find(loc => loc.value === data.location)?.label}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Interests:</dt>
              <dd className="text-gray-900 dark:text-white">
                {data.interests?.map((interest: string) => 
                  categories.find(cat => cat.value === interest)?.label
                ).join(', ')}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  };

  const steps: FormStep[] = [
    {
      id: 'personal',
      title: 'Personal Info',
      description: 'Enter your basic information',
      component: Step1,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Set your preferences',
      component: Step2,
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and confirm',
      component: Step3,
    },
  ];

  const handleSubmit = async (data: any) => {
    console.log('Multi-step form submitted:', data);
    alert('Multi-step form submitted successfully!');
  };

  return (
    <ValidationProvider>
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Multi-Step Form Example
        </h2>
        
        <MultiStepForm
          steps={steps}
          initialData={{}}
          onSubmit={handleSubmit}
          variant="stepped"
          brandAccent="gradient"
          showProgressBar={true}
          showStepNumbers={true}
          allowStepNavigation={false}
          validateOnStepChange={true}
        />
      </div>
    </ValidationProvider>
  );
};

/**
 * Example 4: Pre-built Forms
 */
export const PrebuiltFormsExample: React.FC = () => {
  const [activeForm, setActiveForm] = useState<'trade' | 'profile' | null>(null);

  const handleTradeSubmit = async (data: any) => {
    console.log('Trade creation data:', data);
    alert('Trade listing created successfully!');
    setActiveForm(null);
  };

  const handleProfileSubmit = async (data: any) => {
    console.log('Profile completion data:', data);
    alert('Profile completed successfully!');
    setActiveForm(null);
  };

  if (activeForm === 'trade') {
    return (
      <ValidationProvider>
        <TradeCreationForm
          onSubmit={handleTradeSubmit}
          onCancel={() => setActiveForm(null)}
          variant="stepped"
          brandAccent="orange"
        />
      </ValidationProvider>
    );
  }

  if (activeForm === 'profile') {
    return (
      <ValidationProvider>
        <ProfileCompletionForm
          onSubmit={handleProfileSubmit}
          onSkip={() => setActiveForm(null)}
          showSkipOption={true}
          variant="stepped"
          brandAccent="gradient"
        />
      </ValidationProvider>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Pre-built Forms Example
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="backdrop-blur-md bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 rounded-xl p-6 shadow-glass">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trade Creation Form
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete multi-step workflow for creating trade listings with item details, pricing, and preferences.
          </p>
          <button
            onClick={() => setActiveForm('trade')}
            className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-blue-600 transition-all duration-200 shadow-glass"
          >
            Try Trade Creation Form
          </button>
        </div>

        <div className="backdrop-blur-md bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 rounded-xl p-6 shadow-glass">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profile Completion Form
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            User onboarding workflow with personal information, avatar upload, and trading preferences.
          </p>
          <button
            onClick={() => setActiveForm('profile')}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-orange-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-orange-600 transition-all duration-200 shadow-glass"
          >
            Try Profile Completion Form
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Examples Component
 */
export const FormExamples: React.FC = () => {
  const [activeExample, setActiveExample] = useState<string>('basic');

  const examples = [
    { id: 'basic', title: 'Basic Form', component: BasicFormExample },
    { id: 'validation', title: 'Advanced Validation', component: AdvancedValidationExample },
    { id: 'multistep', title: 'Multi-Step Form', component: MultiStepFormExample },
    { id: 'prebuilt', title: 'Pre-built Forms', component: PrebuiltFormsExample },
  ];

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || BasicFormExample;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <div className="backdrop-blur-lg bg-white/80 dark:bg-neutral-800/80 border-b border-white/20 dark:border-neutral-700/30 sticky top-0 z-10 shadow-glass">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            TradeYa Form Components Examples
          </h1>
          <nav className="flex space-x-4">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeExample === example.id
                    ? 'bg-gradient-to-r from-orange-500 to-blue-500 text-white shadow-glass'
                    : 'backdrop-blur-sm bg-white/50 dark:bg-neutral-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-neutral-800/70 border border-white/20 dark:border-neutral-700/30'
                }`}
              >
                {example.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default FormExamples;
