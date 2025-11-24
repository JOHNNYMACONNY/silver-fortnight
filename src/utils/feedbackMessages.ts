/**
 * Feedback Messages Utility
 * 
 * Centralized message templates for dynamic feedback.
 * Context-aware messages for different selection types.
 */

export interface FeedbackMessage {
  message: string;
  type: 'success' | 'info';
}

export const feedbackMessages: Record<string, (context?: string) => FeedbackMessage> = {
  categorySelected: (category?: string) => ({
    message: category 
      ? `Great choice! ${category} category selected.`
      : 'Category selected successfully.',
    type: 'success',
  }),
  skillLevelSelected: (level?: string) => ({
    message: level
      ? `Skill level set to ${level.charAt(0).toUpperCase() + level.slice(1)}.`
      : 'Skill level selected.',
    type: 'success',
  }),
  tradingInterestAdded: (interest?: string) => ({
    message: interest
      ? `Added ${interest} to your interests.`
      : 'Interest added successfully.',
    type: 'success',
  }),
  tradingInterestRemoved: (interest?: string) => ({
    message: interest
      ? `Removed ${interest} from your interests.`
      : 'Interest removed.',
    type: 'info',
  }),
  experienceLevelSelected: (level?: string) => ({
    message: level
      ? `Experience level set to ${level}.`
      : 'Experience level selected.',
    type: 'success',
  }),
  skillAdded: (skill?: string) => ({
    message: skill
      ? `Added ${skill} to your skills.`
      : 'Skill added successfully.',
    type: 'success',
  }),
  skillRemoved: (skill?: string) => ({
    message: skill
      ? `Removed ${skill} from your skills.`
      : 'Skill removed.',
    type: 'info',
  }),
};

/**
 * Get a feedback message for a specific action
 * @param key - The message key
 * @param context - Optional context (e.g., selected value)
 * @returns Feedback message object
 */
export const getFeedbackMessage = (
  key: string,
  context?: string
): FeedbackMessage => {
  const messageFn = feedbackMessages[key];
  if (messageFn) {
    return messageFn(context);
  }
  
  // Fallback message
  return {
    message: 'Selection updated.',
    type: 'success',
  };
};

