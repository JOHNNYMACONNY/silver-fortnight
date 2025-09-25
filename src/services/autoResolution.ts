import { 
  getAllTrades, 
  updateTrade, 
  createNotification, 
  shouldSendReminder, 
  shouldAutoComplete,
  Trade 
} from './firestore';

/**
 * Client-side auto-resolution service
 * Runs when users visit the app to check for pending trades that need resolution
 */

export interface AutoResolutionResult {
  remindersProcessed: number;
  tradesAutoCompleted: number;
  errors: string[];
}

/**
 * Process pending confirmations and auto-complete trades
 * This runs on the client side when users visit the app
 */
export const processAutoResolution = async (): Promise<AutoResolutionResult> => {
  const result: AutoResolutionResult = {
    remindersProcessed: 0,
    tradesAutoCompleted: 0,
    errors: []
  };

  try {
    // Get all trades to check for pending confirmations
    const { data: trades, error } = await getAllTrades(undefined, undefined, { includeNonPublic: true });
    
    if (error) {
      result.errors.push(`Failed to fetch trades: ${error.message}`);
      return result;
    }

    if (!trades) {
      return result;
    }

    // Filter for pending confirmation trades
    const pendingTrades = trades.items.filter(trade =>
      trade.status === 'pending_confirmation' &&
      trade.completionRequestedAt &&
      trade.completionRequestedBy
    );

    console.log(`Found ${pendingTrades.length} pending confirmation trades`);

    for (const trade of pendingTrades) {
      try {
        await processPendingTrade(trade, result);
      } catch (error: any) {
        result.errors.push(`Error processing trade ${trade.id}: ${error.message}`);
        console.error('Error processing trade:', trade.id, error);
      }
    }

    console.log('Auto-resolution completed:', result);
    return result;

  } catch (error: any) {
    result.errors.push(`Auto-resolution failed: ${error.message}`);
    console.error('Auto-resolution error:', error);
    return result;
  }
};

/**
 * Process a single pending trade for reminders and auto-completion
 */
const processPendingTrade = async (trade: Trade, result: AutoResolutionResult): Promise<void> => {
  if (!trade.completionRequestedAt || !trade.completionRequestedBy || !trade.id) {
    return;
  }

  const remindersSent = trade.remindersSent || 0;
  
  // Check if we should auto-complete the trade (14+ days)
  if (shouldAutoComplete(trade.completionRequestedAt)) {
    await autoCompleteTrade(trade);
    result.tradesAutoCompleted++;
    return;
  }

  // Check if we should send a reminder
  if (shouldSendReminder(trade.completionRequestedAt, remindersSent)) {
    await sendReminderNotification(trade, remindersSent);
    result.remindersProcessed++;
  }
};

/**
 * Auto-complete a trade that has been pending for 14+ days
 */
const autoCompleteTrade = async (trade: Trade): Promise<void> => {
  if (!trade.id) return;

  console.log(`Auto-completing trade: ${trade.id} - ${trade.title}`);

  // Update the trade status
  const { error: updateError } = await updateTrade(trade.id, {
    status: 'completed',
    completionConfirmedAt: new Date() as any,
    autoCompleted: true,
    autoCompletionReason: 'No response after 14 days',
    updatedAt: new Date() as any
  });

  if (updateError) {
    throw new Error(`Failed to auto-complete trade: ${updateError.message}`);
  }

  // Notify both users
  const users = [trade.creatorId, trade.participantId].filter(Boolean);
  
  for (const userId of users) {
    if (userId) {
      try {
        await createNotification({
          userId,
          type: 'trade_completed',
          title: 'Trade Auto-Completed',
          content: `Trade "${trade.title}" has been automatically marked as completed due to no response after 14 days.`,
          relatedId: trade.id
        });
      } catch (error: any) {
        console.error('Failed to send auto-completion notification:', error);
      }
    }
  }
};

/**
 * Send reminder notification for pending confirmation
 */
const sendReminderNotification = async (trade: Trade, remindersSent: number): Promise<void> => {
  if (!trade.id || !trade.completionRequestedBy) return;

  const recipientId = trade.completionRequestedBy === trade.creatorId 
    ? trade.participantId 
    : trade.creatorId;

  if (!recipientId) return;

  const requestDate = trade.completionRequestedAt instanceof Date 
    ? trade.completionRequestedAt 
    : (trade.completionRequestedAt as any)?.toDate?.();

  if (!requestDate) return;

  const daysSinceRequest = Math.floor((Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let title = 'Reminder: Trade Completion';
  let content = `Please confirm completion of trade: ${trade.title}. Your partner is waiting for your confirmation.`;

  if (daysSinceRequest >= 10) {
    title = 'Final Reminder: Trade Completion';
    content = `This is your final reminder to confirm completion of trade: ${trade.title}. The trade will be auto-completed in 4 days if no action is taken.`;
    // escalate wording only
  } else if (daysSinceRequest >= 7) {
    content = `Please confirm completion of trade: ${trade.title}. This trade has been pending for 7 days.`;
  }

  console.log(`Sending reminder ${remindersSent + 1} for trade: ${trade.id}`);

  // Send notification
  const { error: notificationError } = await createNotification({
    userId: recipientId,
    type: 'trade',
    title,
    content,
    relatedId: trade.id
  });

  if (notificationError) {
    throw new Error(`Failed to send reminder notification: ${notificationError.message}`);
  }

  // Update reminders sent count
  const { error: updateError } = await updateTrade(trade.id!, {
    remindersSent: remindersSent + 1,
    updatedAt: new Date() as any
  });

  if (updateError) {
    console.error('Failed to update reminders sent count:', updateError);
  }
};

/**
 * Check if auto-resolution should run based on last run time
 * Prevents running too frequently
 */
export const shouldRunAutoResolution = (): boolean => {
  const lastRun = localStorage.getItem('autoResolutionLastRun');
  if (!lastRun) return true;

  const lastRunTime = new Date(lastRun);
  const now = new Date();
  const hoursSinceLastRun = (now.getTime() - lastRunTime.getTime()) / (1000 * 60 * 60);

  // Run at most once every 6 hours
  return hoursSinceLastRun >= 6;
};

/**
 * Mark auto-resolution as run
 */
export const markAutoResolutionRun = (): void => {
  localStorage.setItem('autoResolutionLastRun', new Date().toISOString());
};
