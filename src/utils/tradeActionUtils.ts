import { Trade } from '../services/firestore';

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
        // Check if this user has already submitted evidence
        const isCreator = trade.creatorId === userId;
        const hasSubmittedEvidence = isCreator
          ? (trade.creatorEvidence && trade.creatorEvidence.length > 0)
          : (trade.participantEvidence && trade.participantEvidence.length > 0);

        if (hasSubmittedEvidence) {
          return {
            primaryAction: 'Waiting for Other User',
            primaryDisabled: true
          };
        } else {
          return {
            primaryAction: 'Submit Evidence',
            primaryDisabled: false
          };
        }
      }

      case 'pending_confirmation': {
        // Check if the user is the one who requested completion
        if (trade.completionRequestedBy === userId) {
          return {
            primaryAction: 'Awaiting Confirmation',
            primaryDisabled: true
          };
        } else {
          // The user is not the one who requested completion, so they should be able to confirm
          return {
            primaryAction: 'Confirm Completion',
            primaryDisabled: false,
            secondaryAction: 'Request Changes',
            secondaryDisabled: false
          };
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
