import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { useAuth } from '../../../AuthContext';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
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
      await markAllNotificationsAsRead(notificationId);
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
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.slice(0, 5).map(notification => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link 
                to={notification.link || '#'} 
                className={cn(
                  'block p-2 rounded-lg transition-colors',
                  !notification.read ? 'bg-primary/10' : 'hover:bg-accent'
                )}
                onClick={() => handleMarkAsRead(notification.id || '')}
              >
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.message || notification.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.timestamp ? 
                    formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true }) :
                    notification.createdAt ?
                    formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) :
                    'Recently'
                  }
                </p>
              </Link>
            </DropdownMenuItem>
          ))
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
