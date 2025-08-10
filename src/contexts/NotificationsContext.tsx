import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  markNotificationAsRead,
  createNotification,
  Notification as FirestoreNotification
} from '../services/firestore-exports';
import {
  getUserNotifications,
  Notification as ServiceNotification
} from '../services/notifications/notificationService';

// Create a union type that can handle both notification formats
type Notification = ServiceNotification;

// Type guard to check if a notification is from firestore
const isFirestoreNotification = (notification: any): notification is FirestoreNotification => {
  return 'content' in notification && !('message' in notification);
};

// Helper function to convert between notification types
const adaptNotification = (notification: Partial<Notification>): Partial<Notification> => {
  if (!notification) return {};

  // Map notification type from service format to firestore format
  let firestoreType: Notification['type'] = 'system'; // Default to system type

  // Convert the type - ensure both old and new type values are handled
  switch (notification.type) {
    case 'trade': // Old service type
    case 'trade_interest': // Firestore type
    case 'trade_completed': // Firestore type
      firestoreType = 'trade'; // Map to unified 'trade' type
      break;
    case 'project':
      firestoreType = 'project';
      break;
    case 'challenge':
      firestoreType = 'challenge';
      break;
    case 'review':
      firestoreType = 'review';
      break;
    case 'message':
      firestoreType = 'message';
      break;
    case 'system':
      firestoreType = 'system';
      break;
    // Add other cases if new types are introduced
    default:
      // Handle unknown types gracefully, perhaps log a warning
      console.warn(`Unknown notification type encountered: ${notification.type}`);
      firestoreType = 'system'; // Default to system type for unknown types
  }

  return {
    ...notification,
    // Ensure content is present, use message as fallback for older formats if needed
    content: notification.content || notification.message || '', // Prefer content, fallback to message, then empty string
    // Ensure message is undefined or null if content is the primary field
    message: undefined, // Explicitly set message to undefined
    // Use the converted type
    type: firestoreType,
  };
};

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createNewNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Fetch notifications using real-time updates
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener
    const unsubscribe = getUserNotifications(currentUser.uid, (fetchedNotifications) => {
      // Sort notifications by date (newest first)
      const sortedNotifications = fetchedNotifications.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // Convert notifications to the service format if needed
      const adaptedNotifications = sortedNotifications.map(notification => {
        // If the notification has content but not message, it's from firestore format
        // NOTE: With unified Notification type, this adaptation might be simplified.
        // Keeping it for now to handle potential subtle differences or future divergence.
        // if (isFirestoreNotification(notification)) {
        //   // Create a new notification object in service format
        //   const serviceNotification: Notification = {
        //     id: notification.id,
        //     userId: notification.userId,
        //     title: notification.title,
        //     content: notification.content, // Use content from firestore notification
        //     read: notification.read,
        //     createdAt: notification.createdAt,
        //     type: mapFirestoreTypeToServiceType(notification.type),
        //     // Add data object with related IDs
        //     data: notification.relatedId ? {
        //       tradeId: notification.type.includes('trade') ? notification.relatedId : undefined,
        //       conversationId: notification.type === 'message' ? notification.relatedId : undefined
        //     } : undefined,
        //     // Remove the message field if it exists, as content is the main field
        //     // message: undefined,
        //   };
        //   return serviceNotification;
        // }
        // With unified types, simply return the notification as is.
        return notification as Notification;
      });

      setNotifications(adaptedNotifications);
      setLoading(false);
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // Helper function to map firestore notification type to service notification type
  const mapFirestoreTypeToServiceType = (firestoreType: string): 'trade' | 'project' | 'challenge' | 'message' | 'system' => {
    switch (firestoreType) {
      case 'trade_interest':
      case 'trade_completed':
        return 'trade';
      case 'review':
        return 'system';
      case 'message':
        return 'message';
      default:
        return 'system';
    }
  };

  // Function to manually refresh notifications (for backward compatibility)
  const fetchNotifications = async () => {
    // This is now a no-op since we're using real-time updates
    // But we keep it for API compatibility
    console.log('Manual notification refresh requested - using real-time updates instead');
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Use the markNotificationAsRead function from firestore.ts
      await markNotificationAsRead(notificationId);

      // No need to update local state manually since we're using real-time updates
      // The listener will automatically update with the new notification status
    } catch (err: any) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notification => !notification.read);

      // Mark each unread notification as read
      for (const notification of unreadNotifications) {
        if (notification.id) {
          await markNotificationAsRead(notification.id);
        }
      }

      // No need to update local state manually since we're using real-time updates
      // The listener will automatically update with the new notification status
    } catch (err: any) {
      setError(err.message || 'Failed to mark all notifications as read');
    }
  };

  // Create a new notification
  const createNewNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      // Convert from service format to firestore format using our adapter
      const firestoreNotification = adaptNotification(notification);

      const { error: createError } = await createNotification(firestoreNotification as any);

      if (createError) throw new Error(createError.message);

      // No need to manually refresh since we're using real-time updates
      // The listener will automatically update with the new notification
    } catch (err: any) {
      setError(err.message || 'Failed to create notification');
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    createNewNotification,
    refreshNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
};
