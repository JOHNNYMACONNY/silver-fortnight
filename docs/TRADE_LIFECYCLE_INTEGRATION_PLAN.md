# Trade Lifecycle Integration Plan

This document outlines the plan for integrating the Trade Lifecycle System components into the TradeYa application. It provides a step-by-step guide for developers to follow when implementing the remaining parts of the system.

## Overview

We have successfully implemented the core components of the Trade Lifecycle System:
- Database schema updates
- Service layer implementation
- UI components (TradeProposalForm, TradeProposalCard, TradeCompletionForm, TradeConfirmationForm)

The next phase involves integrating these components into the TradeDetailPage and creating a proposal dashboard for trade creators.

## Integration Steps

### 1. Update TradeDetailPage

#### 1.1 Add Trade Proposal Section

```tsx
// Add this section to TradeDetailPage.tsx
const [showProposalForm, setShowProposalForm] = useState(false);
const [proposals, setProposals] = useState<TradeProposal[]>([]);
const [loadingProposals, setLoadingProposals] = useState(false);

// Fetch proposals if user is the trade creator
useEffect(() => {
  const fetchProposals = async () => {
    if (trade && currentUser && trade.creatorId === currentUser.uid) {
      setLoadingProposals(true);
      try {
        const { data, error } = await getTradeProposals(trade.id);
        if (error) throw new Error(error);
        if (data) {
          setProposals(data as TradeProposal[]);
        }
      } catch (err) {
        console.error('Error fetching proposals:', err);
      } finally {
        setLoadingProposals(false);
      }
    }
  };

  fetchProposals();
}, [trade, currentUser]);

// Add this to the JSX
{currentUser && trade && trade.status === 'open' && trade.creatorId !== currentUser.uid && (
  <>
    {!showProposalForm ? (
      <button
        onClick={() => setShowProposalForm(true)}
        className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        Submit Proposal
      </button>
    ) : (
      <TradeProposalForm
        tradeId={trade.id}
        tradeName={trade.title}
        offeredSkills={trade.offeredSkills || []}
        requestedSkills={trade.requestedSkills || []}
        onSuccess={() => {
          setShowProposalForm(false);
          addToast('success', 'Proposal submitted successfully!');
        }}
        onCancel={() => setShowProposalForm(false)}
      />
    )}
  </>
)}

// Add this section for trade creators to view proposals
{currentUser && trade && trade.creatorId === currentUser.uid && trade.status === 'open' && (
  <div className="mt-8">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Proposals</h2>
    {loadingProposals ? (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    ) : proposals.length === 0 ? (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">No proposals yet.</p>
      </div>
    ) : (
      <div className="space-y-6">
        {proposals.map(proposal => (
          <TradeProposalCard
            key={proposal.id}
            proposal={proposal}
            isCreator={true}
            onAccept={() => handleAcceptProposal(proposal.id)}
            onReject={() => handleRejectProposal(proposal.id)}
          />
        ))}
      </div>
    )}
  </div>
)}
```

#### 1.2 Add Trade Completion Section

```tsx
// Add this section to TradeDetailPage.tsx
const [showCompletionForm, setShowCompletionForm] = useState(false);
const [showConfirmationForm, setShowConfirmationForm] = useState(false);

// Add these handler functions
const handleRequestCompletion = () => {
  setShowCompletionForm(true);
};

const handleConfirmCompletion = () => {
  setShowConfirmationForm(true);
};

// Add this to the JSX for in-progress trades
{currentUser && trade && trade.status === 'in-progress' && 
  (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid) && (
  <>
    {!showCompletionForm ? (
      <button
        onClick={handleRequestCompletion}
        className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        Request Completion
      </button>
    ) : (
      <TradeCompletionForm
        tradeId={trade.id}
        tradeName={trade.title}
        onSuccess={() => {
          setShowCompletionForm(false);
          addToast('success', 'Completion requested successfully!');
          // Refresh trade data
          fetchTrade();
        }}
        onCancel={() => setShowCompletionForm(false)}
      />
    )}
  </>
)}

// Add this to the JSX for pending confirmation trades
{currentUser && trade && trade.status === 'pending_confirmation' && 
  trade.completionRequestedBy !== currentUser.uid &&
  (trade.creatorId === currentUser.uid || trade.participantId === currentUser.uid) && (
  <>
    {!showConfirmationForm ? (
      <button
        onClick={handleConfirmCompletion}
        className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        Review & Confirm Completion
      </button>
    ) : (
      <TradeConfirmationForm
        trade={trade}
        onSuccess={() => {
          setShowConfirmationForm(false);
          addToast('success', 'Trade completed successfully!');
          // Refresh trade data
          fetchTrade();
        }}
        onCancel={() => setShowConfirmationForm(false)}
        onRequestChanges={() => {
          setShowConfirmationForm(false);
          addToast('info', 'Changes requested.');
          // Refresh trade data
          fetchTrade();
        }}
      />
    )}
  </>
)}
```

#### 1.3 Add Trade Status Visualization

```tsx
// Add this component to display trade status
const TradeStatusTimeline: React.FC<{ status: string }> = ({ status }) => {
  const statuses = ['open', 'in-progress', 'pending_confirmation', 'completed'];
  const currentIndex = statuses.indexOf(status);

  return (
    <div className="w-full py-4">
      <div className="flex items-center">
        {statuses.map((step, index) => (
          <React.Fragment key={step}>
            {/* Status circle */}
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
              index <= currentIndex 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {index < currentIndex && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {index === currentIndex && (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
              {index > currentIndex && (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
            
            {/* Connector line */}
            {index < statuses.length - 1 && (
              <div className={`flex-1 h-1 ${
                index < currentIndex 
                  ? 'bg-orange-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Status labels */}
      <div className="flex justify-between mt-2">
        <div className="text-xs text-center">Open</div>
        <div className="text-xs text-center">In Progress</div>
        <div className="text-xs text-center">Pending Confirmation</div>
        <div className="text-xs text-center">Completed</div>
      </div>
    </div>
  );
};

// Add this to the JSX
{trade && (
  <div className="mt-6 mb-8">
    <TradeStatusTimeline status={trade.status} />
  </div>
)}
```

### 2. Create Proposal Dashboard

Create a new component `TradeProposalDashboard.tsx` in `src/components/features/trades/`:

```tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { getTradeProposals, updateTradeProposalStatus, TradeProposal } from '../../../services/firestore';
import TradeProposalCard from './TradeProposalCard';
import { useToast } from '../../../contexts/ToastContext';

interface TradeProposalDashboardProps {
  tradeId: string;
  onProposalAccepted: () => void;
}

const TradeProposalDashboard: React.FC<TradeProposalDashboardProps> = ({
  tradeId,
  onProposalAccepted
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');

  // Fetch proposals
  useEffect(() => {
    const fetchProposals = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await getTradeProposals(tradeId);
        
        if (error) throw new Error(error);
        
        if (data) {
          setProposals(data as TradeProposal[]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch proposals');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposals();
  }, [tradeId, currentUser]);

  // Handle accept proposal
  const handleAcceptProposal = async (proposalId: string) => {
    if (!currentUser) return;
    
    try {
      const { success, error } = await updateTradeProposalStatus(tradeId, proposalId, 'accepted');
      
      if (error) throw new Error(error);
      
      if (success) {
        // Update local state
        setProposals(prevProposals => 
          prevProposals.map(proposal => 
            proposal.id === proposalId 
              ? { ...proposal, status: 'accepted' } 
              : proposal.status === 'pending'
                ? { ...proposal, status: 'rejected' }
                : proposal
          )
        );
        
        addToast('success', 'Proposal accepted successfully!');
        onProposalAccepted();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to accept proposal');
    }
  };

  // Handle reject proposal
  const handleRejectProposal = async (proposalId: string) => {
    if (!currentUser) return;
    
    try {
      const { success, error } = await updateTradeProposalStatus(tradeId, proposalId, 'rejected');
      
      if (error) throw new Error(error);
      
      if (success) {
        // Update local state
        setProposals(prevProposals => 
          prevProposals.map(proposal => 
            proposal.id === proposalId 
              ? { ...proposal, status: 'rejected' } 
              : proposal
          )
        );
        
        addToast('success', 'Proposal rejected');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reject proposal');
    }
  };

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trade Proposals</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'pending'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'accepted'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'rejected'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500"></div>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-4 py-8 rounded-lg text-center">
          {filter === 'all' 
            ? 'No proposals found for this trade.' 
            : `No ${filter} proposals found.`}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProposals.map(proposal => (
            <TradeProposalCard
              key={proposal.id}
              proposal={proposal}
              isCreator={true}
              onAccept={() => handleAcceptProposal(proposal.id)}
              onReject={() => handleRejectProposal(proposal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TradeProposalDashboard;
```

### 3. Update Trade Actions

Update the `getTradeActions` function in `src/utils/tradeUtils.ts` to handle all trade statuses:

```typescript
export const getTradeActions = (trade: Trade, userId: string) => {
  if (!trade || !userId) {
    return { primaryAction: 'View Details', primaryDisabled: false };
  }

  // Trade creator
  if (trade.creatorId === userId) {
    switch (trade.status) {
      case 'open':
        return { 
          primaryAction: 'View Proposals', 
          primaryDisabled: false,
          secondaryAction: 'Cancel Trade',
          secondaryDisabled: false
        };
      case 'in-progress':
        return { 
          primaryAction: 'Mark Complete', 
          primaryDisabled: false,
          secondaryAction: 'Cancel Trade',
          secondaryDisabled: false
        };
      case 'pending_confirmation':
        if (trade.completionRequestedBy === userId) {
          return { 
            primaryAction: 'Awaiting Confirmation', 
            primaryDisabled: true 
          };
        } else {
          return { 
            primaryAction: 'Confirm Completion', 
            primaryDisabled: false,
            secondaryAction: 'Request Changes',
            secondaryDisabled: false
          };
        }
      case 'completed':
        return { 
          primaryAction: 'Leave Review', 
          primaryDisabled: false 
        };
      default:
        return { 
          primaryAction: 'View Details', 
          primaryDisabled: false 
        };
    }
  }

  // Trade participant
  if (trade.participantId === userId) {
    switch (trade.status) {
      case 'in-progress':
        return { 
          primaryAction: 'Mark Complete', 
          primaryDisabled: false 
        };
      case 'pending_confirmation':
        if (trade.completionRequestedBy === userId) {
          return { 
            primaryAction: 'Awaiting Confirmation', 
            primaryDisabled: true 
          };
        } else {
          return { 
            primaryAction: 'Confirm Completion', 
            primaryDisabled: false,
            secondaryAction: 'Request Changes',
            secondaryDisabled: false
          };
        }
      case 'completed':
        return { 
          primaryAction: 'Leave Review', 
          primaryDisabled: false 
        };
      default:
        return { 
          primaryAction: 'View Details', 
          primaryDisabled: false 
        };
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
```

## Testing Plan

After implementing the integration, follow this testing plan to ensure everything works correctly:

1. **Trade Creation**
   - Create a new trade with valid data
   - Verify it appears in the trades list with status "open"

2. **Proposal Submission**
   - Submit a proposal to an open trade
   - Verify the proposal appears in the trade creator's dashboard

3. **Proposal Acceptance**
   - Accept a proposal as the trade creator
   - Verify the trade status changes to "in-progress"
   - Verify other proposals are automatically rejected

4. **Completion Request**
   - Request completion as either the creator or participant
   - Verify the trade status changes to "pending_confirmation"
   - Verify evidence is properly attached

5. **Completion Confirmation**
   - Confirm completion as the other party
   - Verify the trade status changes to "completed"
   - Verify both users can see the completed trade

6. **Change Request**
   - Request changes instead of confirming
   - Verify the trade status returns to "in-progress"
   - Verify the change request is recorded

7. **Edge Cases**
   - Test with missing data
   - Test with invalid inputs
   - Test with unauthorized users

## Conclusion

By following this integration plan, you will successfully implement the complete Trade Lifecycle System in the TradeYa application. This will provide users with a structured, intuitive experience for managing trades from creation to completion.

Remember to update the documentation as you implement each part of the system to keep track of your progress and any issues encountered.
