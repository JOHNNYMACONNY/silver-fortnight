import { 
  getAllTrades, 
  updateTrade, 
  shouldSendReminder, 
  shouldAutoComplete,
  Trade 
} from './firestore';
import { createTradeNotification } from './notifications/unifiedNotificationService';
import { logger } from '@utils/logging/logger';

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

    logger.debug(`Found ${pendingTrades.length} pending confirmation trades`, 'SERVICE');

    for (const trade of pendingTrades) {
      try {
        await processPendingTrade(trade, result);
      } catch (error: any) {
        result.errors.push(`Error processing trade ${trade.id}: ${error.message}`);
        logger.error('Error processing trade:', 'SERVICE', { arg0: trade.id }, error as Error);
      }
    }

    logger.debug('Auto-resolution completed:', 'SERVICE', result);
    return result;

  } catch (error: any) {
    result.errors.push(`Auto-resolution failed: ${error.message}`);
    logger.error('Auto-resolution error:', 'SERVICE', {}, error as Error);
    return result;
  }
};

/**
 * Process a single pending trade for reminders and auto-completion
 * Note: Reminder notifications are handled by Cloud Functions (functions/src/index.ts)
 * to ensure reliability. This client-side service only handles auto-completion.
 */
const processPendingTrade = async (trade: Trade, result: AutoResolutionResult): Promise<void> => {
  if (!trade.completionRequestedAt || !trade.completionRequestedBy || !trade.id) {
    return;
  }
  
  // Check if we should auto-complete the trade (14+ days)
  if (shouldAutoComplete(trade.completionRequestedAt)) {
    await autoCompleteTrade(trade);
    result.tradesAutoCompleted++;
    return;
  }

  // Note: Reminder notifications removed - handled by Cloud Functions for reliability
};

/**
 * Auto-complete a trade that has been pending for 14+ days
 */
const autoCompleteTrade = async (trade: Trade): Promise<void> => {
  if (!trade.id) return;

  logger.debug(`Auto-completing trade: ${trade.id} - ${trade.title}`, 'SERVICE');

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

  // Notify both users using unified service
  const users = [trade.creatorId, trade.participantId].filter(Boolean);
  
  for (const userId of users) {
    if (userId && trade.id) {
      try {
        await createTradeNotification({
          recipientId: userId,
          tradeId: trade.id,
          tradeTitle: trade.title,
          type: 'complete'
        });
      } catch (error: any) {
        logger.error('Failed to send auto-completion notification:', 'SERVICE', {}, error as Error);
      }
    }
  }
};

// sendReminderNotification removed - trade reminders are now handled by
// Cloud Functions (functions/src/index.ts checkPendingConfirmations) for reliability

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
