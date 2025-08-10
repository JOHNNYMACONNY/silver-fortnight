/**
 * NotificationDropdown Component
 * 
 * Displays a dropdown of user notifications.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { 
  Notification, 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../../../services/notifications/notificationService';
import { useAuth } from '../../../AuthContext';

// Icons
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const TradeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const CollaborationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.25-1.26-.698-1.724M7 16a4 4 0 11-8 0 4 4 0 018 0zM7 16v-2a4 4 0 00-4-4H2" />
  </svg>
)

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

export const NotificationDropdown: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
  
  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Format timestamp
  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffSecs < 60) {
        return 'just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays === 1) {
        return 'yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (err) {
      console.error('Error formatting timestamp:', err);
      return '';
    }
  };
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <TradeIcon />;
      case 'collaboration':
        return <CollaborationIcon />;
      case 'challenge':
        return <ChallengeIcon />;
      case 'message':
        return <MessageIcon />;
      case 'system':
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
    }
    
    // Navigate based on notification type
    if (notification.data) {
      if (notification.type === 'trade' && notification.data.tradeId) {
        navigate(`/trades/${notification.data.tradeId}`);
      } else if (notification.type === 'collaboration' && notification.data.collaborationId) {
        navigate(`/collaborations/${notification.data.collaborationId}`);
      } else if (notification.type === 'challenge' && notification.data.challengeId) {
        navigate(`/challenges/${notification.data.challengeId}`);
      } else if (notification.type === 'message' && notification.data.conversationId) {
        navigate(`/messages?conversation=${notification.data.conversationId}`);
      } else if (notification.data.url) {
        window.open(notification.data.url, '_blank');
      }
    }
    
    setIsOpen(false);
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
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // View all notifications
  const viewAllNotifications = () => {
    navigate('/notifications');
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification bell */}
      <button
        className="relative p-1 rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">View notifications</span>
        <BellIcon />
        
        {/* Notification badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-card border border-border focus:outline-none z-50">
          <div className="py-1">
            {/* Header */}
            <div className="px-4 py-2 border-b border-border">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:text-primary/90"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
            
            {/* Notification list */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-accent cursor-pointer ${
                        !notification.read ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 text-muted-foreground">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-border">
              <button
                onClick={viewAllNotifications}
                className="w-full text-center text-sm font-medium text-primary hover:text-primary/90"
              >
                View all notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
