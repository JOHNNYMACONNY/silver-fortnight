/**
 * Profile Completion Form Steps
 * 
 * Specific step components for user profile setup and completion
 * using glassmorphic design system with TradeYa brand integration.
 */

import React, { useState, useEffect, useRef } from "react";
import { StepComponentProps } from "./MultiStepForm";
import { GlassmorphicInput } from "./GlassmorphicInput";
import { GlassmorphicTextarea } from "./GlassmorphicTextarea";
import { GlassmorphicDropdown, DropdownOption } from "./GlassmorphicDropdown";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

// Location Options (US States + Major Cities)
const LOCATION_OPTIONS: DropdownOption[] = [
  { value: 'AL', label: 'Alabama', group: 'States' },
  { value: 'CA', label: 'California', group: 'States' },
  { value: 'FL', label: 'Florida', group: 'States' },
  { value: 'NY', label: 'New York', group: 'States' },
  { value: 'TX', label: 'Texas', group: 'States' },
  { value: 'los-angeles', label: 'Los Angeles, CA', group: 'Major Cities' },
  { value: 'new-york-city', label: 'New York City, NY', group: 'Major Cities' },
  { value: 'chicago', label: 'Chicago, IL', group: 'Major Cities' },
  { value: 'houston', label: 'Houston, TX', group: 'Major Cities' },
  { value: 'miami', label: 'Miami, FL', group: 'Major Cities' },
];

// Trading Interests
const TRADING_INTERESTS: DropdownOption[] = [
  { value: 'electronics', label: 'Electronics', description: 'Phones, laptops, gadgets' },
  { value: 'clothing', label: 'Clothing & Fashion', description: 'Apparel, shoes, accessories' },
  { value: 'books', label: 'Books & Media', description: 'Books, movies, music' },
  { value: 'sports', label: 'Sports & Recreation', description: 'Equipment, gear, outdoor items' },
  { value: 'home', label: 'Home & Garden', description: 'Furniture, decor, tools' },
  { value: 'collectibles', label: 'Collectibles', description: 'Art, antiques, memorabilia' },
  { value: 'automotive', label: 'Automotive', description: 'Car parts, accessories' },
  { value: 'crafts', label: 'Arts & Crafts', description: 'Handmade items, supplies' },
];

// Experience Levels
const EXPERIENCE_LEVELS: DropdownOption[] = [
  { value: 'beginner', label: 'New to Trading', description: 'Just getting started' },
  { value: 'intermediate', label: 'Some Experience', description: 'A few successful trades' },
  { value: 'experienced', label: 'Experienced Trader', description: 'Many successful trades' },
  { value: 'expert', label: 'Trading Expert', description: 'Highly experienced, mentor others' },
];

/**
 * Step 1: Basic Information
 */
export const BasicInfoStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  onValidationChange,
  errors,
}) => {
  const [isValid, setIsValid] = useState(false);

  // Validation logic
  useEffect(() => {
    const valid = !!(
      data.firstName?.trim() &&
      data.lastName?.trim() &&
      data.email?.trim() &&
      data.email?.includes('@') &&
      data.location
    );
    setIsValid(valid);
    onValidationChange?.(valid);
  }, [data, onValidationChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 backdrop-blur-sm bg-gradient-to-r from-orange-500/90 to-blue-500/90 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glass">
          <span className="text-white text-2xl font-bold">👋</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Welcome to TradeYa!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Let's start by getting to know you better.
        </p>
      </div>

      <div className="glassmorphic p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassmorphicInput
            label="First Name"
            placeholder="Enter your first name"
            value={data.firstName || ''}
            onChange={(e) => onChange('firstName', e.target.value)}
            variant="glass"
            brandAccent="orange"
            error={errors?.firstName}
            required
          />

          <GlassmorphicInput
            label="Last Name"
            placeholder="Enter your last name"
            value={data.lastName || ''}
            onChange={(e) => onChange('lastName', e.target.value)}
            variant="glass"
            brandAccent="blue"
            error={errors?.lastName}
            required
          />
        </div>

        <GlassmorphicInput
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={data.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          variant="glass"
          brandAccent="purple"
          error={errors?.email}
          hint="We'll use this to send you trade notifications"
          required
        />

        <GlassmorphicDropdown
          label="Location"
          placeholder="Select your location"
          options={LOCATION_OPTIONS}
          value={data.location || ''}
          onChange={(value) => onChange('location', value)}
          variant="glass"
          brandAccent="orange"
          searchable
          error={errors?.location}
          hint="This helps us show you local trading opportunities"
          required
        />

        <GlassmorphicInput
          label="Phone Number (Optional)"
          type="tel"
          placeholder="(555) 123-4567"
          value={data.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          variant="glass"
          brandAccent="orange"
          hint="For coordinating trades (kept private)"
        />

        {/* Validation Status */}
        <div className={cn(
          'flex items-center space-x-2 text-sm transition-all duration-200 mt-4 p-3 rounded-lg',
          isValid 
            ? 'backdrop-blur-sm bg-green-50/80 dark:bg-green-900/30 border border-success text-green-600 dark:text-green-400' 
            : 'backdrop-blur-sm bg-gray-50/80 dark:bg-gray-900/30 border border-gray-200/50 dark:border-gray-800/50 text-gray-500 dark:text-gray-400'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full transition-all duration-200',
            isValid ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
          )} />
          <span>
            {isValid ? 'Basic information complete' : 'Please fill in all required fields'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Step 2: Avatar & Bio
 */
export const AvatarBioStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  onValidationChange,
  errors,
}) => {
  const [isValid, setIsValid] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation logic
  useEffect(() => {
    const valid = !!(data.bio?.trim() && data.bio?.trim().length >= 20);
    setIsValid(valid);
    onValidationChange?.(valid);
  }, [data, onValidationChange]);

  // Handle avatar upload
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        onChange('avatar', file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove avatar
  const removeAvatar = () => {
    setAvatarPreview(null);
    onChange('avatar', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">📸</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Show Your Personality
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add a photo and tell us about yourself to build trust with other traders.
        </p>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className={cn(
            'w-32 h-32 rounded-full border-4 border-dashed transition-all duration-200 flex items-center justify-center overflow-hidden',
            avatarPreview 
              ? 'border-success bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-ring dark:hover:border-ring'
          )}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto mb-2"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Upload Photo</span>
              </div>
            )}
          </div>
          
          {avatarPreview && (
            <button
              type="button"
              onClick={removeAvatar}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-blue-600 transition-all duration-200"
          >
            {avatarPreview ? 'Change Photo' : 'Upload Photo'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Upload a clear photo of yourself. Max 5MB. JPG, PNG, or GIF format.
        </p>
      </div>

      {/* Bio */}
      <GlassmorphicTextarea
        label="Tell us about yourself"
        placeholder="Share a bit about yourself, your trading interests, hobbies, or what makes you a trustworthy trader. This helps build connections with other traders. (minimum 20 characters)"
        value={data.bio || ''}
        onChange={(e) => onChange('bio', e.target.value)}
        variant="glass"
        brandAccent="adaptive"
        minRows={4}
        maxRows={8}
        showCharacterCount
        maxLength={500}
        error={errors?.bio}
        hint="A good bio helps other traders feel comfortable trading with you"
        required
      />

      {/* Trading Philosophy */}
      <GlassmorphicTextarea
        label="Trading Philosophy (Optional)"
        placeholder="What's your approach to trading? Do you prefer fair value exchanges, helping others find what they need, or building community connections?"
        value={data.tradingPhilosophy || ''}
        onChange={(e) => onChange('tradingPhilosophy', e.target.value)}
        variant="glass"
        brandAccent="purple"
        minRows={2}
        maxRows={4}
        showCharacterCount
        maxLength={200}
        hint="Share what trading means to you"
      />

      {/* Validation Status */}
      <div className={cn(
        'flex items-center space-x-2 text-sm transition-all duration-200',
        isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full transition-all duration-200',
          isValid ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        )} />
        <span>
          {isValid ? 'Profile information complete' : 'Please add a bio (minimum 20 characters)'}
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Step 3: Trading Preferences
 */
export const TradingPreferencesStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  onValidationChange,
  errors,
}) => {
  const [isValid, setIsValid] = useState(false);

  // Validation logic
  useEffect(() => {
    const valid = !!(
      data.tradingInterests?.length > 0 &&
      data.experienceLevel &&
      data.preferredTradeMethod
    );
    setIsValid(valid);
    onValidationChange?.(valid);
  }, [data, onValidationChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">⚙️</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Trading Preferences
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Help us personalize your trading experience and connect you with the right opportunities.
        </p>
      </div>

      <GlassmorphicDropdown
        label="Trading Interests"
        placeholder="Select categories you're interested in"
        options={TRADING_INTERESTS}
        value={data.tradingInterests || []}
        onChange={(value) => onChange('tradingInterests', value)}
        variant="glass"
        brandAccent="orange"
        multiSelect
        searchable
        error={errors?.tradingInterests}
        hint="Choose all categories that interest you"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassmorphicDropdown
          label="Experience Level"
          placeholder="Select your trading experience"
          options={EXPERIENCE_LEVELS}
          value={data.experienceLevel || ''}
          onChange={(value) => onChange('experienceLevel', value)}
          variant="glass"
          brandAccent="blue"
          error={errors?.experienceLevel}
          required
        />

        <GlassmorphicDropdown
          label="Preferred Trade Method"
          placeholder="How do you prefer to trade?"
          options={[
            { value: 'local', label: 'Local Meetups', description: 'Meet in person' },
            { value: 'shipping', label: 'Shipping', description: 'Mail items' },
            { value: 'both', label: 'Both Methods', description: 'Flexible approach' },
          ]}
          value={data.preferredTradeMethod || ''}
          onChange={(value) => onChange('preferredTradeMethod', value)}
          variant="glass"
          brandAccent="purple"
          error={errors?.preferredTradeMethod}
          required
        />
      </div>

      {/* Trading Preferences Checkboxes */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Additional Preferences</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={data.openToCounterOffers || false}
              onChange={(e) => onChange('openToCounterOffers', e.target.checked)}
              className="w-4 h-4 text-primary bg-white/20 border-border rounded focus:ring-ring focus:ring-2"
            />
            <span className="text-gray-900 dark:text-white">Open to counter-offers</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={data.allowPartialTrades || false}
              onChange={(e) => onChange('allowPartialTrades', e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-white/20 border-border rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-gray-900 dark:text-white">Allow partial trades</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={data.mentorNewTraders || false}
              onChange={(e) => onChange('mentorNewTraders', e.target.checked)}
              className="w-4 h-4 text-purple-500 bg-white/20 border-border rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="text-gray-900 dark:text-white">Help mentor new traders</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={data.receiveRecommendations || false}
              onChange={(e) => onChange('receiveRecommendations', e.target.checked)}
              className="w-4 h-4 text-green-500 bg-white/20 border-border rounded focus:ring-green-500 focus:ring-2"
            />
            <span className="text-gray-900 dark:text-white">Receive trade recommendations</span>
          </label>
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="glassmorphic p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Communication Preferences</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
              <input
              type="checkbox"
              checked={data.emailNotifications || true}
              onChange={(e) => onChange('emailNotifications', e.target.checked)}
              className="w-4 h-4 text-primary bg-white/20 border-border rounded focus:ring-ring focus:ring-2"
            />
            <span className="text-sm text-gray-900 dark:text-white">Email notifications for new trade offers</span>
          </label>

          <label className="flex items-center space-x-3">
              <input
              type="checkbox"
              checked={data.weeklyDigest || true}
              onChange={(e) => onChange('weeklyDigest', e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-white/20 border-border rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-900 dark:text-white">Weekly digest of recommended trades</span>
          </label>

          <label className="flex items-center space-x-3">
              <input
              type="checkbox"
              checked={data.communityUpdates || false}
              onChange={(e) => onChange('communityUpdates', e.target.checked)}
                className="w-4 h-4 text-purple-500 bg-white/20 border-border rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="text-sm text-gray-900 dark:text-white">Community updates and news</span>
          </label>
        </div>
      </div>

      {/* Validation Status */}
      <div className={cn(
        'flex items-center space-x-2 text-sm transition-all duration-200',
        isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full transition-all duration-200',
          isValid ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        )} />
        <span>
          {isValid ? 'Trading preferences complete' : 'Please complete all required preference fields'}
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Step 4: Profile Review & Completion
 */
export const ProfileReviewStep: React.FC<StepComponentProps> = ({
  data,
  onValidationChange,
}) => {
  useEffect(() => {
    // Always valid since this is just a review step
    onValidationChange?.(true);
  }, [onValidationChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">✨</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Profile Complete!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Review your profile information before joining the TradeYa community.
        </p>
      </div>

      {/* Profile Summary */}
      <div className="glassmorphic p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {data.avatar ? (
              <img
                src={typeof data.avatar === 'string' ? data.avatar : URL.createObjectURL(data.avatar)}
                alt="Profile avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-glass"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {data.firstName?.[0]}{data.lastName?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.firstName} {data.lastName}
            </h4>
            <p className="text-gray-600 dark:text-gray-400">{data.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              📍 {LOCATION_OPTIONS.find(loc => loc.value === data.location)?.label}
            </p>
            {data.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                📞 {data.phone}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {data.bio && (
                  <div className="mt-4 pt-4 border-t border-border">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">About</h5>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{data.bio}</p>
          </div>
        )}

        {/* Trading Philosophy */}
        {data.tradingPhilosophy && (
          <div className="mt-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Trading Philosophy</h5>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{data.tradingPhilosophy}</p>
          </div>
        )}
      </div>

      {/* Trading Preferences Summary */}
      <div className="glassmorphic p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Trading Preferences</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Experience Level:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {EXPERIENCE_LEVELS.find(level => level.value === data.experienceLevel)?.label}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Preferred Method:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {data.preferredTradeMethod === 'local' ? 'Local Meetups' :
               data.preferredTradeMethod === 'shipping' ? 'Shipping' : 'Both Methods'}
            </span>
          </div>
        </div>

        {/* Trading Interests */}
        {data.tradingInterests?.length > 0 && (
          <div className="mt-4">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Interested in:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.tradingInterests.map((interest: string) => {
                const category = TRADING_INTERESTS.find(cat => cat.value === interest);
                return (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-blue-500/20 text-gray-900 dark:text-white rounded-full text-xs font-medium border border-border"
                  >
                    {category?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Preferences */}
        <div className="mt-4 space-y-2">
          {data.openToCounterOffers && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
              Open to counter-offers
            </div>
          )}
          {data.allowPartialTrades && (
            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
              <span className="w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
              Allows partial trades
            </div>
          )}
          {data.mentorNewTraders && (
            <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
              <span className="w-4 h-4 bg-purple-500 rounded-full mr-2"></span>
              Mentors new traders
            </div>
          )}
          {data.receiveRecommendations && (
            <div className="flex items-center text-sm text-primary">
              <span className="w-4 h-4 bg-primary rounded-full mr-2"></span>
              Receives trade recommendations
            </div>
          )}
        </div>
      </div>

      {/* Welcome Message */}
      <div className="glassmorphic p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🎉</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Welcome to TradeYa!</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your profile is ready. Start exploring trades and connecting with the community.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
