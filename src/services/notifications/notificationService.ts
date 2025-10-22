import {
  createNotification as createFirestoreNotification,
  markNotificationAsRead as markFirestoreNotificationAsRead,
  markAllNotificationsAsRead as markFirestoreAllNotificationsAsRead,
  type Notification
} from '../firestore';
import { ServiceResult } from '../../types/ServiceError';

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  doc,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getSyncFirebaseDb } from '../../firebase-config';

export type { Notification };

export const createNotification = createFirestoreNotification;
export const markNotificationAsRead = markFirestoreNotificationAsRead;
export const markAllNotificationsAsRead = markFirestoreAllNotificationsAsRead;

export const deleteNotification = async (notificationId: string): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    await deleteDoc(doc(db, 'notifications', notificationId));
    return { data: undefined, error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to delete notification' } };
  }
};

export const getUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const db = getSyncFirebaseDb();
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data() as Omit<Notification, 'id'>;
      return {
        id: doc.id,
        ...data
      } as Notification;
    });
    
    callback(notifications);
  });
};