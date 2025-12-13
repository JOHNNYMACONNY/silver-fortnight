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
import { logger } from '@utils/logging/logger';
import {
  Bell,
  Handshake,
  Users,
  Trophy,
  MessageSquare,
  Info,
  Flame,
  TrendingUp,
  Award
} from 'lucide-react';



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
      logger.error('Error formatting timestamp:', 'COMPONENT', {}, {
        name: 'TimestampFormatError',
        message: (err as Error).message || String(err),
        cause: err
      } as Error);
      return '';
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <Handshake className="h-5 w-5" />;
      case 'collaboration':
        return <Users className="h-5 w-5" />;
      case 'challenge':
        return <Trophy className="h-5 w-5" />;
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'system':
        return <Info className="h-5 w-5" />;
      // Gamification types
      case 'streak_milestone':
        return <Flame className="h-5 w-5 text-orange-500" />;
      case 'level_up':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'achievement_unlocked':
        return <Award className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5" />;
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
      // Gamification notifications
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
      logger.error('Error marking all notifications as read:', 'COMPONENT', {}, {
        name: 'MarkAllReadError',
        message: (error as Error).message || String(error),
        cause: error
      } as Error);
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
        <Bell className="h-6 w-6" />

        {/* Notification badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={
            "origin-top-right absolute right-0 mt-2 w-80 rounded-md focus:outline-none z-popover " +
            // Glassmorphic surface aligned with navbar
            "bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md navbar-gradient-border " +
            // Enhanced shadow to match mobile menu aesthetic
            "shadow-glass-lg"
          }
        >
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
            <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
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
                      className={`px-4 py-3.5 hover:bg-accent/50 cursor-pointer ${!notification.read ? 'bg-primary/10' : ''
                        }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="grid grid-cols-[auto,1fr,auto] gap-x-3 gap-y-1 items-start">
                        <div className="text-muted-foreground mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-6 text-foreground whitespace-normal break-words">{(notification.title ?? 'Notification').replace('🔥 ', '')}</p>
                          {Boolean(notification.content || notification.message) && (
                            <p className="text-sm leading-6 text-muted-foreground whitespace-normal break-words">{notification.content || notification.message}</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-right">{formatTimestamp(notification.createdAt)}</div>
                        {!notification.read && <div className="col-start-2 w-2 h-2 rounded-full bg-primary" />}
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
