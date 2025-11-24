/**
 * Utility functions for trade-related operations
 */

import { Trade, TradeSkill } from '../services/firestore';
import { EmbeddedEvidence } from '../types/evidence';

/**
 * Check if a user is a participant in a trade
 *
 * @param trade Trade object
 * @param userId User ID to check
 * @returns Boolean indicating if the user is a participant
 */
export const isTradeParticipant = (trade: Trade, userId: string): boolean => {
  return trade.creatorId === userId || trade.participantId === userId;
};

/**
 * Check if a user can request completion for a trade
 *
 * @param trade Trade object
 * @param userId User ID to check
 * @returns Object with canRequest boolean and reason string if false
 */
export const canRequestCompletion = (
  trade: Trade,
  userId: string
): { canRequest: boolean; reason?: string } => {
  // Check if trade is in progress
  if (trade.status !== 'in-progress') {
    return {
      canRequest: false,
      reason: `Cannot request completion for a trade with status: ${trade.status}`
    };
  }

  // Check if user is a participant
  if (!isTradeParticipant(trade, userId)) {
    return {
      canRequest: false,
      reason: 'Only trade participants can request completion'
    };
  }

  return { canRequest: true };
};

/**
 * Check if a user can confirm completion for a trade
 *
 * @param trade Trade object
 * @param userId User ID to check
 * @returns Object with canConfirm boolean and reason string if false
 */
export const canConfirmCompletion = (
  trade: Trade,
  userId: string
): { canConfirm: boolean; reason?: string } => {
  // Check if trade is pending confirmation
  if (trade.status !== 'pending_confirmation') {
    return {
      canConfirm: false,
      reason: `Cannot confirm a trade with status: ${trade.status}`
    };
  }

  // Check if user is a participant
  if (!isTradeParticipant(trade, userId)) {
    return {
      canConfirm: false,
      reason: 'Only trade participants can confirm completion'
    };
  }

  // Check if user is not the one who requested completion
  if (userId === trade.completionRequestedBy) {
    return {
      canConfirm: false,
      reason: 'You cannot confirm your own completion request'
    };
  }

  return { canConfirm: true };
};

/**
 * Check if a user can request changes to a trade
 *
 * @param trade Trade object
 * @param userId User ID to check
 * @returns Object with canRequestChanges boolean and reason string if false
 */
export const canRequestChanges = (
  trade: Trade,
  userId: string
): { canRequestChanges: boolean; reason?: string } => {
  // Check if trade is pending confirmation
  if (trade.status !== 'pending_confirmation') {
    return {
      canRequestChanges: false,
      reason: `Cannot request changes for a trade with status: ${trade.status}`
    };
  }

  // Check if user is a participant
  if (!isTradeParticipant(trade, userId)) {
    return {
      canRequestChanges: false,
      reason: 'Only trade participants can request changes'
    };
  }

  // Check if user is not the one who requested completion
  if (userId === trade.completionRequestedBy) {
    return {
      canRequestChanges: false,
      reason: 'You cannot request changes to your own completion request'
    };
  }

  return { canRequestChanges: true };
};

/**
 * Get the other participant in a trade
 *
 * @param trade Trade object
 * @param userId Current user ID
 * @returns The other participant's ID or null if not found
 */
export const getOtherParticipant = (trade: Trade, userId: string): string | null => {
  if (trade.creatorId === userId) {
    return trade.participantId || null;
  } else if (trade.participantId === userId) {
    return trade.creatorId;
  }
  return null;
};

/**
 * Calculate skill match percentage between a trade and a user's skills
 *
 * @param tradeSkills Skills required by the trade
 * @param userSkills Skills offered by the user
 * @returns Match percentage (0-100)
 */
export const calculateSkillMatch = (
  tradeSkills: string[] | TradeSkill[],
  userSkills: string[] | TradeSkill[]
): number => {
  if (!tradeSkills.length || !userSkills.length) {
    return 0;
  }

  // Convert TradeSkill objects to strings if needed
  const normalizedTradeSkills = tradeSkills.map(skill =>
    typeof skill === 'string' ? skill.toLowerCase() : skill.name.toLowerCase()
  );

  const normalizedUserSkills = userSkills.map(skill =>
    typeof skill === 'string' ? skill.toLowerCase() : skill.name.toLowerCase()
  );

  // Count matches
  const matches = normalizedTradeSkills.filter(skill =>
    normalizedUserSkills.includes(skill)
  ).length;

  // Calculate percentage
  return Math.round((matches / normalizedTradeSkills.length) * 100);
};

/**
 * Check if a user has submitted evidence for a trade
 *
 * @param trade Trade object
 * @param userId User ID to check
 * @returns Boolean indicating if the user has submitted evidence
 */
export const hasUserSubmittedEvidence = (trade: Trade, userId: string): boolean => {
  if (trade.creatorId === userId) {
    return !!(trade.creatorEvidence && trade.creatorEvidence.length > 0);
  } else if (trade.participantId === userId) {
    return !!(trade.participantEvidence && trade.participantEvidence.length > 0);
  }
  return false;
};

/**
 * Get all evidence from both participants in a trade
 * Merges creatorEvidence and participantEvidence, with fallback to completionEvidence for backward compatibility
 *
 * @param trade Trade object
 * @returns Array of all evidence from both participants
 */
export const getAllTradeEvidence = (trade: Trade): EmbeddedEvidence[] => {
  // If role-specific fields exist, merge them
  if (trade.creatorEvidence || trade.participantEvidence) {
    return [
      ...(trade.creatorEvidence || []),
      ...(trade.participantEvidence || [])
    ];
  }
  // Fallback to legacy completionEvidence for backward compatibility
  return trade.completionEvidence || [];
};

/**
 * Get the appropriate action button text based on trade status and user role
 * This function has been moved to tradeActionUtils.ts to avoid duplication
 * @deprecated Use getTradeActions from tradeActionUtils.ts instead
 */
