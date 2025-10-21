import { collection, addDoc } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../firebase-config';
import { CreateNotificationParams } from '../types/services';

/**
 * Create a notification for a user
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
