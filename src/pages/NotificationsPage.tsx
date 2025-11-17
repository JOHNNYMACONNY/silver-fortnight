/**
 * Notifications Page
 * 
 * Displays all user notifications.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Notification, 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/notifications/notificationService';
import { useAuth } from '../AuthContext';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { logger } from '@utils/logging/logger';


// Icons
const TradeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const CollaborationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.25-1.26-.698-1.724M7 16a4 4 0 11-8 0 4 4 0 018 0zM7 16v-2a4 4 0 00-4-4H2" />
  </svg>
);

const ChallengeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const SystemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  
  // Get notifications
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    const unsubscribe = getUserNotifications(currentUser.uid, (fetchedNotifications) => {
      setNotifications(fetchedNotifications);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Helper function to match notification types to filter categories
  const getFilterMatch = (notificationType: string, filterType: string): boolean => {
    switch (filterType) {
      case 'trade':
        return ['trade', 'trade_interest', 'trade_completed', 'trade_reminder'].includes(notificationType);
      case 'collaboration':
        return [
          'collaboration',
          'role_application',
          'application_accepted',
          'application_rejected',
          'role_completion_requested',
          'role_completion_confirmed',
          'role_completion_rejected'
        ].includes(notificationType);
      case 'challenge':
        return ['challenge', 'challenge_completed', 'tier_unlocked'].includes(notificationType);
      case 'message':
        return notificationType === 'message';
      case 'system':
        return [
          'system',
          'review',
          'new_follower',
          'level_up',
          'achievement_unlocked',
          'streak_milestone'
        ].includes(notificationType);
      default:
        return notificationType === filterType;
    }
  };
  
  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return getFilterMatch(notification.type, filter);
  });
  
  // Format timestamp
  const formatTimestamp = (timestamp: import('firebase/firestore').Timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      logger.error('Error formatting timestamp:', 'PAGE', {}, err as Error);
      return '';
    }
  };
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade':
      case 'trade_interest':
      case 'trade_completed':
      case 'trade_reminder':
        return <TradeIcon />;
      case 'collaboration':
      case 'role_application':
      case 'application_accepted':
      case 'application_rejected':
      case 'role_completion_requested':
      case 'role_completion_confirmed':
      case 'role_completion_rejected':
        return <CollaborationIcon />;
      case 'challenge':
      case 'challenge_completed':
      case 'tier_unlocked':
        return <ChallengeIcon />;
      case 'message':
        return <MessageIcon />;
      case 'system':
      case 'review':
      case 'new_follower':
      case 'level_up':
      case 'achievement_unlocked':
      case 'streak_milestone':
        return <SystemIcon />;
      default:
        return <SystemIcon />;
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read && notification.id) {
      await markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }
    
    // Navigate based on notification type
    if (notification.data) {
      // Trade notifications
      if (['trade', 'trade_interest', 'trade_completed', 'trade_reminder'].includes(notification.type) && notification.data.tradeId) {
        navigate(`/trades/${notification.data.tradeId}`);
      } 
      // Collaboration notifications
      else if ([
        'collaboration',
        'role_application',
        'application_accepted',
        'application_rejected',
        'role_completion_requested',
        'role_completion_confirmed',
        'role_completion_rejected'
      ].includes(notification.type) && notification.data.collaborationId) {
        navigate(`/collaborations/${notification.data.collaborationId}`);
      } 
      // Challenge notifications
      else if (['challenge', 'challenge_completed', 'tier_unlocked'].includes(notification.type) && notification.data.challengeId) {
        navigate(`/challenges/${notification.data.challengeId}`);
      } 
      // Message notifications
      else if (notification.type === 'message' && notification.data.conversationId) {
        navigate(`/messages?conversation=${notification.data.conversationId}`);
      } 
      // Gamification notifications (navigate to profile/leaderboard)
      else if (['level_up', 'achievement_unlocked', 'streak_milestone'].includes(notification.type)) {
        navigate('/profile');
      }
      // Follower notifications
      else if (notification.type === 'new_follower' && notification.data.followerId) {
        navigate(`/profile/${notification.data.followerId}`);
      }
      // URL-based navigation
      else if (notification.data.url) {
        window.open(notification.data.url, '_blank');
      }
    }
  };
  
  // Handle mark notification as read
  const handleMarkAsRead = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!notification.id) return;
    
    try {
      await markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      logger.error('Error marking notification as read:', 'PAGE', {}, error as Error);
    }
  };
  
  // Handle delete notification
  const handleDeleteNotification = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!notification.id) return;
    
    try {
      await deleteNotification(notification.id);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(n => n.id !== notification.id)
      );
    } catch (error) {
      logger.error('Error deleting notification:', 'PAGE', {}, error as Error);
    }
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          read: true
        }))
      );
    } catch (error) {
      logger.error('Error marking all notifications as read:', 'PAGE', {}, error as Error);
    }
  };
  
  // Not logged in state
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to view your notifications.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
    );
  }
  
  // loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  // No notifications state
  if (!loading && filteredNotifications.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="glassmorphic backdrop-blur-lg rounded-xl px-6 py-5 border-glass shadow-glass flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <Button
            variant="glassmorphic"
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.read)}
          >
            Mark All as Read
          </Button>
        </div>
        
        {/* Filters */}
        <div className="glassmorphic backdrop-blur-md rounded-xl mb-6 overflow-x-auto border-glass">
          <div className="flex gap-2 px-2 py-2 min-w-max">
            {['all', 'unread', 'trade', 'collaboration', 'challenge', 'message', 'system'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap rounded-lg transition-all duration-200",
                  filter === f
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Notifications</h2>
          <p className="text-muted-foreground">You're all caught up!</p>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="glassmorphic backdrop-blur-lg rounded-xl px-6 py-5 border-glass shadow-glass flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <Button
          variant="glassmorphic"
          onClick={handleMarkAllAsRead}
          disabled={notifications.every(n => n.read)}
        >
          Mark All as Read
        </Button>
      </div>
      
      {/* Filters */}
      <div className="glassmorphic backdrop-blur-md rounded-xl mb-6 overflow-x-auto border-glass">
        <div className="flex gap-2 px-2 py-2 min-w-max">
          {['all', 'unread', 'trade', 'collaboration', 'challenge', 'message', 'system'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap rounded-lg transition-all duration-200",
                filter === f
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="glassmorphic backdrop-blur-md rounded-xl overflow-hidden shadow-glass border-glass">
        <ul className="divide-y divide-border/30">
          {filteredNotifications.map((notification, index) => (
            <li
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "p-4 flex items-start space-x-4 cursor-pointer transition-all duration-200",
                "hover:bg-accent/30",
                !notification.read && "bg-primary/5",
                index > 0 && "border-t border-border/30"
              )}
            >
              {/* Icon */}
              <div className={`mt-1 text-muted-foreground ${!notification.read ? 'text-primary' : ''}`}>
                {getNotificationIcon(notification.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <p className={`text-sm font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {notification.title}
                </p>
                <p className={`text-sm mt-1 ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {notification.content || notification.message}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {formatTimestamp(notification.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleMarkAsRead(notification, e)}
                    aria-label="Mark as read"
                  >
                    <CheckIcon />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteNotification(notification, e)}
                  aria-label="Delete notification"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
