/**
 * Conversational Labels Utility
 * 
 * Provides conversational, user-friendly labels and hints for form fields.
 * Falls back to traditional labels when feature flag is disabled.
 */

export interface LabelConfig {
  label: string;
  placeholder?: string;
  hint?: string;
}

export const conversationalLabels: Record<string, LabelConfig> = {
  category: {
    label: "What category is your trade?",
    placeholder: "Choose the best fit for your item",
    hint: "This helps others find your trade more easily"
  },
  skillLevel: {
    label: "What's your skill level?",
    hint: "This helps match you with the right trades"
  },
  title: {
    label: "What are you trading?",
    hint: "Give your trade a clear, descriptive title that catches attention"
  },
  description: {
    label: "Tell us more about your trade",
    placeholder: "Describe what you're offering or looking for...",
    hint: "Be specific about what you can offer or what you need"
  },
  tradingInterests: {
    label: "What interests you?",
    hint: "Choose all categories that interest you"
  },
  experienceLevel: {
    label: "What's your trading experience?",
    hint: "This helps us match you with appropriate trades"
  }
};

/**
 * Get a conversational label for a form field
 * @param key - The field key (e.g., 'category', 'skillLevel')
 * @param useConversational - Whether to use conversational labels (default: true)
 * @returns The label string
 */
export const getLabel = (key: string, useConversational: boolean = true): string => {
  if (useConversational && conversationalLabels[key]) {
    return conversationalLabels[key].label;
  }
  
  // Fallback to traditional labels
  const traditionalLabels: Record<string, string> = {
    category: 'Category',
    skillLevel: 'Skill Level',
    title: 'Title',
    description: 'Description',
    tradingInterests: 'Trading Interests',
    experienceLevel: 'Experience Level'
  };
  
  return traditionalLabels[key] || key;
};

/**
 * Get a hint for a form field
 * @param key - The field key
 * @param useConversational - Whether to use conversational hints (default: true)
 * @returns The hint string or undefined
 */
export const getHint = (key: string, useConversational: boolean = true): string | undefined => {
  if (useConversational && conversationalLabels[key]) {
    return conversationalLabels[key].hint;
  }
  return undefined;
};

/**
 * Get a placeholder for a form field
 * @param key - The field key
 * @param useConversational - Whether to use conversational placeholders (default: true)
 * @returns The placeholder string or undefined
 */
export const getPlaceholder = (key: string, useConversational: boolean = true): string | undefined => {
  if (useConversational && conversationalLabels[key]) {
    return conversationalLabels[key].placeholder;
  }
  return undefined;
};

