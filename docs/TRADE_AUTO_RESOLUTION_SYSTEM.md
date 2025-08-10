# Trade Auto-Resolution System

This document outlines the design and implementation plan for the Trade Auto-Resolution System, which will automatically handle unresponsive users in the trade completion process.

## Overview

The Trade Auto-Resolution System will:

1. Send reminder notifications to users with pending confirmations
2. Auto-complete trades after a certain timeout period
3. Use Cloud Functions for scheduled tasks

## System Components

### 1. Reminder Notification System

The system will send reminder notifications to users who have pending trade confirmations:

- First reminder: 3 days after completion request
- Second reminder: 7 days after completion request
- Final reminder: 10 days after completion request

#### Implementation Details

```typescript
// Cloud Function to check for pending confirmations
export const checkPendingConfirmations = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const threeDaysAgo = new Date(now.toMillis() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.toMillis() - 10 * 24 * 60 * 60 * 1000);

    // Query trades with pending confirmations
    const pendingTradesSnapshot = await admin.firestore()
      .collection('trades')
      .where('status', '==', 'pending_confirmation')
      .get();

    for (const tradeDoc of pendingTradesSnapshot.docs) {
      const trade = tradeDoc.data();
      const completionRequestedAt = trade.completionRequestedAt.toDate();
      const recipientId = trade.completionRequestedBy === trade.creatorId 
        ? trade.participantId 
        : trade.creatorId;

      // Determine which reminder to send
      if (completionRequestedAt <= tenDaysAgo.getTime()) {
        // Send final reminder
        await createNotification({
          userId: recipientId,
          type: 'trade_confirmation',
          title: 'Final Reminder: Trade Completion',
          content: `This is your final reminder to confirm completion of trade: ${trade.title}. The trade will be auto-completed in 4 days if no action is taken.`,
          relatedId: tradeDoc.id,
          priority: 'high'
        });
      } else if (completionRequestedAt <= sevenDaysAgo.getTime()) {
        // Send second reminder
        await createNotification({
          userId: recipientId,
          type: 'trade_confirmation',
          title: 'Reminder: Trade Completion',
          content: `Please confirm completion of trade: ${trade.title}. This trade has been pending for 7 days.`,
          relatedId: tradeDoc.id,
          priority: 'medium'
        });
      } else if (completionRequestedAt <= threeDaysAgo.getTime()) {
        // Send first reminder
        await createNotification({
          userId: recipientId,
          type: 'trade_confirmation',
          title: 'Reminder: Trade Completion',
          content: `Please confirm completion of trade: ${trade.title}. Your partner is waiting for your confirmation.`,
          relatedId: tradeDoc.id,
          priority: 'low'
        });
      }
    }

    return null;
  });
```

### 2. Auto-Completion System

The system will automatically complete trades that have been pending confirmation for too long:

- Auto-completion: 14 days after completion request
- System will mark the trade as completed
- System will add a note indicating auto-completion

#### Implementation Details

```typescript
// Cloud Function to auto-complete pending trades
export const autoCompletePendingTrades = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const fourteenDaysAgo = new Date(now.toMillis() - 14 * 24 * 60 * 60 * 1000);

    // Query trades with pending confirmations older than 14 days
    const pendingTradesSnapshot = await admin.firestore()
      .collection('trades')
      .where('status', '==', 'pending_confirmation')
      .where('completionRequestedAt', '<=', admin.firestore.Timestamp.fromDate(fourteenDaysAgo))
      .get();

    for (const tradeDoc of pendingTradesSnapshot.docs) {
      const trade = tradeDoc.data();
      
      // Auto-complete the trade
      await admin.firestore()
        .collection('trades')
        .doc(tradeDoc.id)
        .update({
          status: 'completed',
          completionConfirmedAt: now,
          autoCompleted: true,
          autoCompletionReason: 'No response after 14 days',
          updatedAt: now
        });

      // Notify both users
      const users = [trade.creatorId, trade.participantId];
      for (const userId of users) {
        await createNotification({
          userId,
          type: 'trade_completion',
          title: 'Trade Auto-Completed',
          content: `Trade "${trade.title}" has been automatically marked as completed due to no response after 14 days.`,
          relatedId: tradeDoc.id,
          priority: 'medium'
        });
      }
    }

    return null;
  });
```

### 3. UI Indicators

The UI will be updated to show auto-completion status and countdown:

- Add countdown indicator for pending confirmations
- Show auto-completion status in trade details
- Display system notes for auto-completed trades

#### Implementation Details

```tsx
// Component to show countdown for pending confirmations
const ConfirmationCountdown: React.FC<{ completionRequestedAt: any }> = ({ completionRequestedAt }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const requestDate = completionRequestedAt?.toDate?.() || new Date(completionRequestedAt);
      const autoCompleteDate = new Date(requestDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      if (now >= autoCompleteDate) {
        setTimeRemaining('Auto-completion imminent');
        return;
      }
      
      const diffTime = Math.abs(autoCompleteDate.getTime() - now.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      setTimeRemaining(`Auto-completes in ${diffDays} days, ${diffHours} hours`);
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60 * 60 * 1000); // Update every hour
    
    return () => clearInterval(interval);
  }, [completionRequestedAt]);
  
  return (
    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
      <span className="inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {timeRemaining}
      </span>
    </div>
  );
};
```

## Integration with Existing System

### 1. Database Schema Updates

Add new fields to the Trade interface:

```typescript
export interface Trade {
  // Existing fields...
  
  // Auto-completion fields
  autoCompleted?: boolean;
  autoCompletionReason?: string;
}
```

### 2. Service Layer Updates

Update the trade service functions to handle auto-completion:

```typescript
// Get trade with auto-completion status
export const getTrade = async (tradeId: string) => {
  const trade = await getDocument(COLLECTIONS.TRADES, tradeId);
  
  // Add auto-completion countdown if pending confirmation
  if (trade && trade.status === 'pending_confirmation') {
    const completionRequestedAt = trade.completionRequestedAt?.toDate?.() || new Date(trade.completionRequestedAt);
    const autoCompleteDate = new Date(completionRequestedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    trade.autoCompletionCountdown = Math.max(0, Math.floor((autoCompleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  
  return trade;
};
```

### 3. UI Updates

Update the TradeDetailPage to show auto-completion information:

```tsx
{/* Auto-completion countdown */}
{trade.status === 'pending_confirmation' && (
  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Pending Confirmation</h4>
    <p className="text-sm text-yellow-700 dark:text-yellow-400">
      This trade is waiting for confirmation from {currentUser?.uid === trade.completionRequestedBy ? 'the other participant' : 'you'}.
    </p>
    <ConfirmationCountdown completionRequestedAt={trade.completionRequestedAt} />
  </div>
)}

{/* Auto-completed indicator */}
{trade.autoCompleted && (
  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
    <h4 className="font-medium text-blue-800 dark:text-blue-300">Auto-Completed</h4>
    <p className="text-sm text-blue-700 dark:text-blue-400">
      This trade was automatically completed: {trade.autoCompletionReason}
    </p>
  </div>
)}
```

## Implementation Plan

### Phase 1: Database and Service Updates (1-2 days)

1. Update Trade interface with auto-completion fields
2. Update service functions to handle auto-completion
3. Add helper functions for calculating auto-completion dates

### Phase 2: Cloud Functions (2-3 days)

1. Create Cloud Function for reminder notifications
2. Create Cloud Function for auto-completion
3. Set up scheduled triggers for both functions
4. Test functions with sample data

### Phase 3: UI Updates (1-2 days)

1. Create ConfirmationCountdown component
2. Update TradeDetailPage to show auto-completion information
3. Add auto-completion indicators to TradeStatusTimeline
4. Test UI with different trade statuses

### Phase 4: Testing and Deployment (1-2 days)

1. Test complete auto-resolution flow
2. Verify notifications are sent correctly
3. Test auto-completion with different scenarios
4. Deploy to production

## Conclusion

The Trade Auto-Resolution System will improve the user experience by ensuring trades don't get stuck in the pending confirmation state. It will automatically handle unresponsive users and provide clear indicators of the auto-completion process.
