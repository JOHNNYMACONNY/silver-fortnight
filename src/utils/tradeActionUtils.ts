import { Trade } from '../services/firestore';
import { hasUserSubmittedEvidence } from './tradeUtils';

interface TradeActions {
  primaryAction: string;
  primaryDisabled: boolean;
  secondaryAction?: string;
  secondaryDisabled?: boolean;
}

/**
 * Determines which actions to show based on the trade status and user role
 * @param trade The trade object
 * @param userId The current user's ID
 * @returns Object with primary and secondary action information
 */
export const getTradeActions = (trade: Trade, userId: string | null): TradeActions => {
  if (!userId) {
    return {
      primaryAction: 'Login to Interact',
      primaryDisabled: true
    };
  }

  // Define user roles
  const isCreator = trade.creatorId === userId;
  const isParticipant = isCreator || trade.participantId === userId;



  if (isParticipant) {
    // Handle based on trade status for any participant
    switch (trade.status) {
      case 'open': {
        // Only trade creator can see proposals
        if (trade.creatorId === userId) {
          return {
            primaryAction: 'View Proposals',
            primaryDisabled: false,
            secondaryAction: 'Cancel Trade',
            secondaryDisabled: false
          };
        } else {
          return {
            primaryAction: 'View Details',
            primaryDisabled: false
          };
        }
      }

      case 'in-progress': {
        // Both creator and participant can submit evidence
        return {
          primaryAction: 'Submit Evidence',
          primaryDisabled: false,
          // Only creator can cancel
          ...(trade.creatorId === userId ? {
            secondaryAction: 'Cancel Trade',
            secondaryDisabled: false
          } : {})
        };
      }

      case 'pending_evidence': {
        return {
          primaryAction: 'Submit Evidence',
          primaryDisabled: false
        };
      }

      case 'pending_confirmation': {
        // Check if the user is the one who requested completion
        if (trade.completionRequestedBy === userId) {
          // Check if the other participant has submitted evidence
          const otherUserHasSubmitted = hasUserSubmittedEvidence(
            trade,
            trade.creatorId === userId ? (trade.participantId || '') : trade.creatorId
          );
          
          if (otherUserHasSubmitted) {
            return {
              primaryAction: 'Awaiting Confirmation',
              primaryDisabled: true
            };
          } else {
            // Other participant hasn't submitted evidence yet
            return {
              primaryAction: 'Awaiting Evidence',
              primaryDisabled: true
            };
          }
        } else {
          // The user is not the one who requested completion
          // Check if they have submitted evidence
          const userHasSubmitted = hasUserSubmittedEvidence(trade, userId);
          
          if (!userHasSubmitted) {
            // User needs to submit evidence first
            return {
              primaryAction: 'Submit Evidence',
              primaryDisabled: false,
              secondaryAction: 'Request Changes',
              secondaryDisabled: false
            };
          } else {
            // User has submitted evidence, they can confirm
            return {
              primaryAction: 'Confirm Completion',
              primaryDisabled: false,
              secondaryAction: 'Request Changes',
              secondaryDisabled: false
            };
          }
        }
      }

      case 'completed': {
        return {
          primaryAction: 'Leave Review',
          primaryDisabled: false
        };
      }

      case 'cancelled': {
        // Only creator can reopen
        if (trade.creatorId === userId) {
          return {
            primaryAction: 'Reopen Trade',
            primaryDisabled: false
          };
        } else {
          return {
            primaryAction: 'View Details',
            primaryDisabled: false
          };
        }
      }

      case 'disputed': {
        return {
          primaryAction: 'View Dispute',
          primaryDisabled: false
        };
      }

      default: {
        return {
          primaryAction: 'View Details',
          primaryDisabled: false
        };
      }
    }
  }

  // Other users
  if (trade.status === 'open') {
    return {
      primaryAction: 'Submit Proposal',
      primaryDisabled: false
    };
  }

  return {
    primaryAction: 'View Details',
    primaryDisabled: false
  };
};
