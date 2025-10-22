/**
 * Trade Creation Form Steps
 * 
 * Specific step components for the trade creation workflow using
 * glassmorphic form components with TradeYa brand integration.
 */

import React, { useState, useEffect } from "react";
import { StepComponentProps } from "./MultiStepForm";
import { GlassmorphicInput } from "./GlassmorphicInput";
import { GlassmorphicTextarea } from "./GlassmorphicTextarea";
import { GlassmorphicDropdown, DropdownOption } from "./GlassmorphicDropdown";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

// Trade Item Categories
const ITEM_CATEGORIES: DropdownOption[] = [
  { value: 'electronics', label: 'Electronics', description: 'Phones, laptops, gadgets' },
  { value: 'clothing', label: 'Clothing & Fashion', description: 'Apparel, shoes, accessories' },
  { value: 'books', label: 'Books & Media', description: 'Books, movies, music' },
  { value: 'sports', label: 'Sports & Recreation', description: 'Equipment, gear, outdoor items' },
  { value: 'home', label: 'Home & Garden', description: 'Furniture, decor, tools' },
  { value: 'collectibles', label: 'Collectibles', description: 'Art, antiques, memorabilia' },
  { value: 'automotive', label: 'Automotive', description: 'Car parts, accessories' },
  { value: 'other', label: 'Other', description: 'Miscellaneous items' },
];

// Condition Options
const CONDITION_OPTIONS: DropdownOption[] = [
  { value: 'new', label: 'New', description: 'Brand new, never used' },
  { value: 'like-new', label: 'Like New', description: 'Excellent condition, barely used' },
  { value: 'good', label: 'Good', description: 'Minor wear, fully functional' },
  { value: 'fair', label: 'Fair', description: 'Noticeable wear, works well' },
  { value: 'poor', label: 'Poor', description: 'Heavy wear, may need repair' },
];

// Trade Preferences
const TRADE_PREFERENCES: DropdownOption[] = [
  { value: 'local', label: 'Local Only', description: 'Meet in person within my area' },
  { value: 'shipping', label: 'Shipping OK', description: 'Willing to ship nationwide' },
  { value: 'both', label: 'Local or Shipping', description: 'Flexible on delivery method' },
];

/**
 * Step 1: Item Details
 */
export const ItemDetailsStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  onValidationChange,
  errors,
}) => {
  const [isValid, setIsValid] = useState(false);

  // Validation logic
  useEffect(() => {
    const valid = !!(
      data.itemName?.trim() &&
      data.category &&
      data.condition &&
      data.description?.trim() &&
      data.description?.trim().length >= 20
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassmorphicInput
          label="Item Name"
          placeholder="What are you trading?"
          value={data.itemName || ''}
          onChange={(e) => onChange('itemName', e.target.value)}
          variant="glass"
          brandAccent="orange"
          error={errors?.itemName}
          required
          className="col-span-full"
        />

        <GlassmorphicDropdown
          label="Category"
          placeholder="Select item category"
          options={ITEM_CATEGORIES}
          value={data.category || ''}
          onChange={(value) => onChange('category', value)}
          variant="glass"
          brandAccent="blue"
          searchable
          error={errors?.category}
          required
        />

        <GlassmorphicDropdown
          label="Condition"
          placeholder="Select item condition"
          options={CONDITION_OPTIONS}
          value={data.condition || ''}
          onChange={(value) => onChange('condition', value)}
          variant="glass"
          brandAccent="purple"
          error={errors?.condition}
          required
        />
      </div>

      <GlassmorphicTextarea
        label="Description"
        placeholder="Describe your item in detail. Include brand, model, age, any defects, etc. (minimum 20 characters)"
        value={data.description || ''}
        onChange={(e) => onChange('description', e.target.value)}
        variant="glass"
        brandAccent="adaptive"
        minRows={4}
        maxRows={8}
        showCharacterCount
        maxLength={1000}
        error={errors?.description}
        hint="Be detailed and honest about your item's condition"
        required
      />

      {/* Validation Status */}
      <div className={cn(
        'flex items-center space-x-2 text-sm transition-all duration-200 p-3 rounded-lg glassmorphic border-glass backdrop-blur-sm',
        isValid ? 'text-green-600 dark:text-green-400 bg-green-500/5' : 'text-gray-500 dark:text-gray-400 bg-white/5'
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full transition-all duration-200',
          isValid ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50' : 'bg-gradient-to-r from-gray-400/50 to-gray-500/50'
        )} />
        <span>
          {isValid ? 'Item details complete' : 'Please fill in all required fields'}
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Step 2: Pricing & Value
 */
export const PricingStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  onValidationChange,
  errors,
}) => {
  const [isValid, setIsValid] = useState(false);

  // Validation logic
  useEffect(() => {
    const valid = !!(
      data.estimatedValue &&
      parseFloat(data.estimatedValue) > 0 &&
      data.tradeValue &&
      parseFloat(data.tradeValue) > 0
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassmorphicInput
          label="Estimated Value"
          placeholder="0.00"
          type="number"
          min="0"
          step="0.01"
          value={data.estimatedValue || ''}
          onChange={(e) => onChange('estimatedValue', e.target.value)}
          variant="glass"
          brandAccent="orange"
          error={errors?.estimatedValue}
          hint="What do you think your item is worth?"
          required
        />

        <GlassmorphicInput
          label="Desired Trade Value"
          placeholder="0.00"
          type="number"
          min="0"
          step="0.01"
          value={data.tradeValue || ''}
          onChange={(e) => onChange('tradeValue', e.target.value)}
          variant="glass"
          brandAccent="blue"
          error={errors?.tradeValue}
          hint="What value are you looking for in return?"
          required
        />
      </div>

      <GlassmorphicTextarea
        label="What are you looking for?"
        placeholder="Describe what you'd like to trade for. Be specific about brands, models, or types of items you're interested in."
        value={data.lookingFor || ''}
        onChange={(e) => onChange('lookingFor', e.target.value)}
        variant="glass"
        brandAccent="purple"
        minRows={3}
        maxRows={6}
        showCharacterCount
        maxLength={500}
        hint="Help others know if their items might interest you"
      />

      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Trade Value Guidelines</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Be realistic about your item's current market value</li>
          <li>• Consider condition, age, and demand when pricing</li>
          <li>• Trade value can be different from estimated value</li>
          <li>• You can always negotiate with interested traders</li>
        </ul>
      </div>

      {/* Validation Status */}
      <div className={cn(
        'flex items-center space-x-2 text-sm transition-all duration-200 p-3 rounded-lg glassmorphic border-glass backdrop-blur-sm',
        isValid ? 'text-green-600 dark:text-green-400 bg-green-500/5' : 'text-gray-500 dark:text-gray-400 bg-white/5'
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full transition-all duration-200',
          isValid ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50' : 'bg-gradient-to-r from-gray-400/50 to-gray-500/50'
        )} />
        <span>
          {isValid ? 'Pricing information complete' : 'Please enter valid pricing information'}
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Step 3: Trade Preferences
 */
export const PreferencesStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  onValidationChange,
  errors,
}) => {
  const [isValid, setIsValid] = useState(false);

  // Validation logic
  useEffect(() => {
    const valid = !!(data.tradePreference && data.location?.trim());
    setIsValid(valid);
    onValidationChange?.(valid);
  }, [data, onValidationChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassmorphicDropdown
          label="Trade Preference"
          placeholder="How do you want to trade?"
          options={TRADE_PREFERENCES}
          value={data.tradePreference || ''}
          onChange={(value) => onChange('tradePreference', value)}
          variant="glass"
          brandAccent="orange"
          error={errors?.tradePreference}
          required
        />

        <GlassmorphicInput
          label="Location"
          placeholder="City, State or ZIP code"
          value={data.location || ''}
          onChange={(e) => onChange('location', e.target.value)}
          variant="glass"
          brandAccent="blue"
          error={errors?.location}
          hint="For local trades or shipping reference"
          required
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-3 p-3 glassmorphic border-glass backdrop-blur-sm bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={data.allowCounterOffers || false}
            onChange={(e) => onChange('allowCounterOffers', e.target.checked)}
            className="w-4 h-4 text-primary bg-white/20 border-white/30 rounded focus:ring-ring focus:ring-2"
          />
          <span className="text-gray-900 dark:text-white">Allow counter-offers</span>
        </label>

        <label className="flex items-center space-x-3 p-3 glassmorphic border-glass backdrop-blur-sm bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={data.allowPartialTrades || false}
            onChange={(e) => onChange('allowPartialTrades', e.target.checked)}
            className="w-4 h-4 text-blue-500 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-gray-900 dark:text-white">Allow partial trades (multiple items for one)</span>
        </label>

        <label className="flex items-center space-x-3 p-3 glassmorphic border-glass backdrop-blur-sm bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={data.urgentTrade || false}
            onChange={(e) => onChange('urgentTrade', e.target.checked)}
            className="w-4 h-4 text-purple-500 bg-white/20 border-white/30 rounded focus:ring-purple-500 focus:ring-2"
          />
          <span className="text-gray-900 dark:text-white">Urgent trade (need to trade quickly)</span>
        </label>
      </div>

      <GlassmorphicTextarea
        label="Additional Notes"
        placeholder="Any additional information about your trade preferences, availability, or special requirements..."
        value={data.additionalNotes || ''}
        onChange={(e) => onChange('additionalNotes', e.target.value)}
        variant="glass"
        brandAccent="adaptive"
        minRows={3}
        maxRows={5}
        showCharacterCount
        maxLength={300}
        hint="Optional: Share any other relevant details"
      />

      {/* Validation Status */}
      <div className={cn(
        'flex items-center space-x-2 text-sm transition-all duration-200 p-3 rounded-lg glassmorphic border-glass backdrop-blur-sm',
        isValid ? 'text-green-600 dark:text-green-400 bg-green-500/5' : 'text-gray-500 dark:text-gray-400 bg-white/5'
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full transition-all duration-200',
          isValid ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50' : 'bg-gradient-to-r from-gray-400/50 to-gray-500/50'
        )} />
        <span>
          {isValid ? 'Trade preferences complete' : 'Please complete required preference fields'}
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Step 4: Confirmation & Review
 */
export const ConfirmationStep: React.FC<StepComponentProps> = ({
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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Review Your Trade Listing
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please review all information before submitting your trade listing.
        </p>
      </div>

      {/* Item Details Summary */}
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-br from-primary/80 to-primary backdrop-blur-sm text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-3 shadow-lg shadow-primary/30">1</span>
          Item Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Name:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">{data.itemName}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Category:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {ITEM_CATEGORIES.find(cat => cat.value === data.category)?.label}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Condition:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {CONDITION_OPTIONS.find(cond => cond.value === data.condition)?.label}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-gray-600 dark:text-gray-400">Description:</span>
          <p className="mt-1 text-gray-900 dark:text-white">{data.description}</p>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-br from-blue-400/80 to-blue-500 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shadow-lg shadow-blue-500/30">2</span>
          Pricing & Value
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Estimated Value:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">${data.estimatedValue}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Desired Trade Value:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">${data.tradeValue}</span>
          </div>
        </div>
        {data.lookingFor && (
          <div className="mt-4">
            <span className="text-gray-600 dark:text-gray-400">Looking for:</span>
            <p className="mt-1 text-gray-900 dark:text-white">{data.lookingFor}</p>
          </div>
        )}
      </div>

      {/* Preferences Summary */}
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-br from-purple-400/80 to-purple-500 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shadow-lg shadow-purple-500/30">3</span>
          Trade Preferences
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Trade Method:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {TRADE_PREFERENCES.find(pref => pref.value === data.tradePreference)?.label}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Location:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">{data.location}</span>
          </div>
        </div>
        
        {/* Preferences checkboxes */}
        <div className="mt-4 space-y-2">
          {data.allowCounterOffers && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <span className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full mr-2 shadow-sm"></span>
              Counter-offers allowed
            </div>
          )}
          {data.allowPartialTrades && (
            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
              <span className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mr-2 shadow-sm"></span>
              Partial trades allowed
            </div>
          )}
          {data.urgentTrade && (
            <div className="flex items-center text-sm text-primary">
              <span className="w-4 h-4 bg-gradient-to-br from-primary/80 to-primary rounded-full mr-2 shadow-sm"></span>
              Urgent trade
            </div>
          )}
        </div>

        {data.additionalNotes && (
          <div className="mt-4">
            <span className="text-gray-600 dark:text-gray-400">Additional Notes:</span>
            <p className="mt-1 text-gray-900 dark:text-white">{data.additionalNotes}</p>
          </div>
        )}
      </div>

      {/* Final confirmation */}
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500/90 to-blue-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white text-xl">✓</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Ready to Submit</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your trade listing will be published and visible to other traders immediately.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
