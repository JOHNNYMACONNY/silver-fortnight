import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { useAuth } from '../../../AuthContext';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification
} from '../../../services/notifications/notificationService';
import { Button } from '../../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../../ui/DropdownMenu';
import { Badge } from '../../ui/Badge';
import { cn } from '../../../utils/cn';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      try {
        const unsubscribe = getUserNotifications(currentUser.uid, (newNotifications) => {
          setNotifications(newNotifications);
          const unread = newNotifications.filter(n => !n.read);
          setUnreadCount(unread.length);
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up notifications listener:', error);
        setLoading(false);
        // Set empty state on error
        setNotifications([]);
        setUnreadCount(0);
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [currentUser]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      if (!notificationId) return;
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          'w-80',
          // Glassmorphic surface aligned with navbar
          'bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md navbar-gradient-border',
          // Enhanced shadow to match mobile menu aesthetic
          'shadow-glass-lg',
          // Accessibility: respect reduced motion
          'motion-reduce:animate-none motion-reduce:transition-none'
        )}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => currentUser && markAllNotificationsAsRead(currentUser.uid)}
              className="text-xs text-primary hover:text-primary/90"
            >
              Mark all
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
            {notifications.slice(0, 5).map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  to={notification.data?.url || '#'}
                  className={cn(
                    'block px-4 py-3.5 rounded-none transition-colors focus:outline-none',
                    'hover:bg-accent/50',
                    !notification.read && 'bg-primary/10'
                  )}
                  onClick={() => handleMarkAsRead(notification.id || '')}
                >
                  <div className="grid grid-cols-[1fr,auto] gap-x-3 gap-y-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-6 text-foreground whitespace-normal break-words">
                        {notification.title}
                      </p>
                      {Boolean(notification.content || notification.message) && (
                        <p className="text-sm leading-6 text-muted-foreground whitespace-normal break-words">
                          {notification.content || notification.message}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-right self-start">
                       {notification.createdAt
                        ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
                        : 'Recently'}
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            You have no new notifications.
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/notifications" className="flex items-center justify-center p-2">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
