/**
 * Progress Component Utilities
 * 
 * Developer-friendly utilities for common progress patterns and configurations
 */

import { type Topic } from './semanticColors';

// Common progress configurations for different use cases
export const progressPresets = {
  // Trade-related progress
  tradeUpload: {
    steps: [
      { label: 'Upload', description: 'Upload trade files' },
      { label: 'Review', description: 'Review trade details' },
      { label: 'Confirm', description: 'Confirm trade terms' },
      { label: 'Complete', description: 'Trade completed' }
    ],
    topic: 'trades' as Topic,
    orientation: 'horizontal' as const
  },

  // Collaboration workflow
  collaborationFlow: {
    steps: [
      { label: 'Invite', description: 'Send collaboration invite' },
      { label: 'Accept', description: 'Partner accepts invite' },
      { label: 'Plan', description: 'Plan collaboration' },
      { label: 'Execute', description: 'Execute collaboration' },
      { label: 'Review', description: 'Review results' }
    ],
    topic: 'collaboration' as Topic,
    orientation: 'horizontal' as const
  },

  // Community onboarding
  communityOnboarding: {
    steps: [
      { label: 'Profile', description: 'Complete profile' },
      { label: 'Skills', description: 'Add skills' },
      { label: 'Verify', description: 'Verify identity' },
      { label: 'Active', description: 'Become active member' }
    ],
    topic: 'community' as Topic,
    orientation: 'vertical' as const
  },

  // Achievement progress
  achievementProgress: {
    steps: [
      { label: 'Start', description: 'Begin challenge' },
      { label: 'Progress', description: 'Make progress' },
      { label: 'Complete', description: 'Complete challenge' },
      { label: 'Reward', description: 'Earn reward' }
    ],
    topic: 'success' as Topic,
    orientation: 'horizontal' as const
  }
} as const;

// Utility function to create step progress from data
export function createStepProgress(
  data: Array<{ status: 'pending' | 'current' | 'completed' | 'error'; label: string; description?: string }>,
  topic?: Topic
) {
  return {
    steps: data.map(item => ({
      label: item.label,
      description: item.description,
      completed: item.status === 'completed',
      current: item.status === 'current',
      error: item.status === 'error'
    })),
    topic
  };
}

// Utility function to create linear progress with semantic styling
export function createLinearProgress(
  value: number,
  max: number = 100,
  options: {
    topic?: Topic;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    label?: string;
  } = {}
) {
  return {
    value,
    max,
    topic: options.topic,
    variant: options.variant || 'default',
    size: options.size || 'md',
    showLabel: options.showLabel || false,
    label: options.label
  };
}

// Common progress patterns for different contexts
export const progressPatterns = {
  // File upload progress
  fileUpload: (progress: number, filename?: string) => createLinearProgress(
    progress,
    100,
    {
      topic: 'trades',
      showLabel: true,
      label: filename ? `Uploading ${filename}` : 'Uploading file'
    }
  ),

  // Trade completion progress
  tradeCompletion: (currentStep: number, totalSteps: number) => createLinearProgress(
    (currentStep / totalSteps) * 100,
    100,
    {
      topic: 'trades',
      showLabel: true,
      label: `Trade Progress: ${currentStep}/${totalSteps}`
    }
  ),

  // Collaboration status
  collaborationStatus: (status: 'pending' | 'active' | 'completed' | 'cancelled') => {
    const statusMap = {
      pending: { value: 25, variant: 'warning' as const, label: 'Pending Approval' },
      active: { value: 50, variant: 'default' as const, label: 'In Progress' },
      completed: { value: 100, variant: 'success' as const, label: 'Completed' },
      cancelled: { value: 0, variant: 'error' as const, label: 'Cancelled' }
    };
    
    const config = statusMap[status];
    return createLinearProgress(config.value, 100, {
      topic: 'collaboration',
      variant: config.variant,
      showLabel: true,
      label: config.label
    });
  },

  // Community engagement
  communityEngagement: (engagement: number) => createLinearProgress(
    engagement,
    100,
    {
      topic: 'community',
      showLabel: true,
      label: `Community Engagement: ${engagement}%`
    }
  ),

  // Achievement progress
  achievementProgress: (progress: number, achievementName: string) => createLinearProgress(
    progress,
    100,
    {
      topic: 'success',
      showLabel: true,
      label: `${achievementName}: ${progress}%`
    }
  )
} as const;

// Type definitions for better developer experience
export type ProgressPreset = keyof typeof progressPresets;
export type ProgressPattern = keyof typeof progressPatterns;

// Helper to get preset configuration
export function getProgressPreset(preset: ProgressPreset) {
  return progressPresets[preset];
}

// Helper to get pattern configuration
export function getProgressPattern(pattern: ProgressPattern, ...args: any[]) {
  return progressPatterns[pattern](...args);
}
