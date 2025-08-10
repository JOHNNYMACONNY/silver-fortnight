import React from 'react';
import { Link } from 'react-router-dom';
import { Notification as ServiceNotification } from '../../../services/notifications/notificationService';
import { Notification as FirestoreNotification } from '../../../services/firestore-exports';

// Create a union type that can handle both notification formats
type NotificationType = (ServiceNotification | FirestoreNotification) & {
  // Common properties that must exist in both types
  id?: string;
  userId: string;
  title: string;
  read: boolean;
  createdAt: any;
  // Optional properties that might exist in either type
  message?: string;
  content?: string;
  relatedId?: string;
  data?: {
    tradeId?: string;
    collaborationId?: string;
    challengeId?: string;
    conversationId?: string;
    userId?: string;
    url?: string;
  };
};

interface NotificationItemProps {
  notification: NotificationType;
  onClick: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  // Helper function to normalize notification type for consistent handling
  const getNormalizedType = (): string => {
    // Handle both service and firestore notification types
    const type = notification.type;

    // For service notification types from notificationService
    if (typeof type === 'string') {
      if (type === 'trade') {
        // Check if it's a completed trade based on the message
        return notification.message?.toLowerCase().includes('completed') ? 'trade_completed' : 'trade_interest';
      } else if (type === 'collaboration' || type === 'challenge' || type === 'system') {
        return 'message'; // Default for project, challenge, system
      } else if (type === 'message' || type === 'trade_interest' || type === 'trade_completed' || type === 'review') {
        // These are already in the format we want
        return type;
      }
    }

    // Default to message if we can't determine the type
    return 'message';
  };

  // Get notification icon based on type
  const getNotificationIcon = () => {
    const normalizedType = getNormalizedType();

    switch (normalizedType) {
      case 'message':
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      case 'trade_interest':
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case 'trade_completed':
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'collaboration':
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.25-1.26-.698-1.724M7 16a4 4 0 11-8 0 4 4 0 018 0zM7 16v-2a4 4 0 00-4-4H2" />
            </svg>
          </div>
        );
      case 'review':
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Get notification link based on type and relatedId
  const getNotificationLink = () => {
    const normalizedType = getNormalizedType();

    // Helper to get the related ID from either format
    const getRelatedId = () => {
      // First check if relatedId exists directly (firestore format)
      if ('relatedId' in notification && notification.relatedId) {
        return notification.relatedId;
      }

      // Then check in data object (service format)
      if (notification.data) {
        if (normalizedType === 'message' && notification.data.conversationId) {
          return notification.data.conversationId;
        }
        if ((normalizedType === 'trade_interest' || normalizedType === 'trade_completed') && notification.data.tradeId) {
          return notification.data.tradeId;
        }
        if (normalizedType === 'review' && notification.data.userId) {
          return notification.data.userId;
        }
        if (normalizedType === 'collaboration' && notification.data.collaborationId) {
          return notification.data.collaborationId;
        }
      }

      return null;
    };

    const relatedId = getRelatedId();

    switch (normalizedType) {
      case 'message':
        return relatedId ? `/messages/${relatedId}` : '/messages';
      case 'trade_interest':
      case 'trade_completed':
        return relatedId ? `/trades/${relatedId}` : '/trades';
      case 'review':
        return '/profile';
      case 'collaboration':
        return relatedId ? `/collaborations/${relatedId}` : '/collaborations';
      default:
        return '/notifications';
    }
  };

  return (
    <li className={`px-4 py-3 hover:bg-gray-50 ${!notification.read ? 'bg-orange-50' : ''}`}>
      <Link to={getNotificationLink()} className="flex items-start" onClick={onClick}>
        {getNotificationIcon()}

        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-500 mt-1">{notification.message || notification.content}</p>
          <p className="text-xs text-gray-400 mt-1">
            {notification.createdAt && formatDate(notification.createdAt.toDate())}
          </p>
        </div>

        {!notification.read && (
          <span className="ml-2 flex-shrink-0 h-2 w-2 rounded-full bg-orange-500"></span>
        )}
      </Link>
    </li>
  );
};
