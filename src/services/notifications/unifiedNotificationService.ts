import { Timestamp, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../../firebase-config';

/**
 * Complete NotificationType enum with ALL types used across the codebase
 * Validated against: streaks.ts, roleCompletions.ts, roleApplications.ts, 
 * roleAbandonment.ts, leaderboards.ts, gamification.ts, achievements.ts,
 * challengeCompletion.ts, autoResolution.ts, functions/src/index.ts
 */
export enum NotificationType {
  // Core types
  MESSAGE = 'message',
  SYSTEM = 'system',
  REVIEW = 'review',
  
  // Trade types
  TRADE = 'trade',
  TRADE_INTEREST = 'trade_interest',
  TRADE_COMPLETED = 'trade_completed',
  TRADE_REMINDER = 'trade_reminder',
  
  // Collaboration types
  COLLABORATION = 'collaboration',
  ROLE_APPLICATION = 'role_application',
  APPLICATION_ACCEPTED = 'application_accepted',
  APPLICATION_REJECTED = 'application_rejected',
  ROLE_COMPLETION_REQUESTED = 'role_completion_requested',
  ROLE_COMPLETION_CONFIRMED = 'role_completion_confirmed',
  ROLE_COMPLETION_REJECTED = 'role_completion_rejected',
  
  // Challenge types
  CHALLENGE = 'challenge',
  CHALLENGE_COMPLETED = 'challenge_completed',
  TIER_UNLOCKED = 'tier_unlocked',
  
  // Gamification types
  STREAK_MILESTONE = 'streak_milestone',
  NEW_FOLLOWER = 'new_follower',
  LEVEL_UP = 'level_up',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
}

/**
 * Unified notification parameters interface
 * Supports both CreateNotificationParams (recipientId/message) 
 * and NotificationData (userId/content) formats
 */
interface UnifiedNotificationParams {
  // Support both parameter formats
  userId?: string;
  recipientId?: string;
  
  type: NotificationType | string;
  title: string;
  
  // Support both content field names
  content?: string;
  message?: string;
  
  relatedId?: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  deduplicationKey?: string; // Optional key to prevent duplicate notifications
  createdAt?: any;
}

/**
 * Normalize notification parameters to handle both formats:
 * - CreateNotificationParams (uses recipientId, message)
 * - NotificationData (uses userId, content)
 */
function normalizeNotificationParams(params: UnifiedNotificationParams) {
  // Handle both userId and recipientId
  const userId = params.userId || params.recipientId;
  if (!userId) {
    throw new Error('Notification must have userId or recipientId');
  }
  
  // Handle both content and message
  const content = params.content || params.message;
  if (!content) {
    throw new Error('Notification must have content or message');
  }
  
  // Build notification object, filtering out undefined values
  const notification: any = {
    userId,
    type: params.type,
    title: params.title,
    content,
    data: params.data || {},
    priority: params.priority || 'medium',
    read: false,
    createdAt: Timestamp.now()
  };
  
  // Only add optional fields if they're defined (Firestore rejects undefined)
  if (params.relatedId !== undefined) {
    notification.relatedId = params.relatedId;
  }
  
  if (params.deduplicationKey !== undefined) {
    notification.deduplicationKey = params.deduplicationKey;
  }
  
  return notification;
}

/**
 * Check for duplicate notifications using deduplicationKey
 * Returns true if a duplicate notification exists within the last 5 minutes
 */
async function checkForDuplicate(
  userId: string, 
  deduplicationKey: string | undefined
): Promise<boolean> {
  if (!deduplicationKey) return false;
  
  try {
    const db = getSyncFirebaseDb();
    const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('deduplicationKey', '==', deduplicationKey),
      where('createdAt', '>=', fiveMinutesAgo)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking for duplicate notification:', error);
    // On error, allow notification to be created
    return false;
  }
}

/**
 * Unified notification creation function
 * Handles both parameter formats and prevents duplicates
 */
export async function createNotification(
  params: UnifiedNotificationParams
): Promise<{ data: string | null; error: any | null }> {
  try {
    const normalized = normalizeNotificationParams(params);
    
    // Check for duplicates if deduplicationKey provided
    if (normalized.deduplicationKey) {
      const isDuplicate = await checkForDuplicate(
        normalized.userId, 
        normalized.deduplicationKey
      );
      
      if (isDuplicate) {
        console.log('Duplicate notification prevented:', normalized.deduplicationKey);
        return { data: null, error: null };
      }
    }
    
    const db = getSyncFirebaseDb();
    const docRef = await addDoc(collection(db, 'notifications'), normalized);
    
    return { data: docRef.id, error: null };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return {
      data: null,
      error: {
        code: error.code || 'unknown',
        message: error.message || 'Failed to create notification'
      }
    };
  }
}

/**
 * Helper function for trade notifications
 * Automatically sets correct type, title, content based on trade event
 */
export function createTradeNotification(params: {
  recipientId: string;
  tradeId: string;
  tradeTitle: string;
  type: 'request' | 'confirm' | 'complete' | 'reminder';
}) {
  const typeMap = {
    request: {
      type: NotificationType.TRADE,
      title: 'Trade Completion Requested',
      content: `${params.tradeTitle} - Please review the completion request`
    },
    confirm: {
      type: NotificationType.TRADE_COMPLETED,
      title: 'Trade Completed',
      content: `${params.tradeTitle} - Trade confirmed as completed!`
    },
    complete: {
      type: NotificationType.TRADE_COMPLETED,
      title: 'Trade Auto-Completed',
      content: `${params.tradeTitle} has been automatically marked as completed`
    },
    reminder: {
      type: NotificationType.TRADE_REMINDER,
      title: 'Reminder: Trade Completion',
      content: `Please confirm completion of trade: ${params.tradeTitle}`
    }
  };
  
  const config = typeMap[params.type];
  
  return createNotification({
    recipientId: params.recipientId,
    ...config,
    relatedId: params.tradeId,
    data: { tradeId: params.tradeId },
    priority: params.type === 'reminder' ? 'high' : 'medium'
  });
}

