import { collection, addDoc } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../firebase-config';
import { CreateNotificationParams } from '../types/services';

/**
 * @deprecated Use unified notification service instead
 * import { createNotification, NotificationType } from './notifications/unifiedNotificationService'
 * 
 * This file is kept for backward compatibility only.
 * The unified service provides:
 * - Complete NotificationType enum with all 20+ types
 * - Parameter normalization (recipientId/userId, message/content)
 * - Deduplication support
 * - Priority handling
 */

/**
 * Create a notification for a user
 * @deprecated Use unified notification service
 */
export const createNotification = async (params: CreateNotificationParams): Promise<string | null> => {
  try {
    const db = getSyncFirebaseDb();
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      ...params,
      read: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
