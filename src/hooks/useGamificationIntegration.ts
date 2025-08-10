import { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useGamificationNotifications } from '../contexts/GamificationNotificationContext';
import { setGamificationNotificationCallback } from '../services/gamification';
import { GamificationNotification } from '../types/gamificationNotifications';

/**
 * Hook to integrate gamification service with real-time notifications
 * This hook sets up the callback for the gamification service to trigger notifications
 */
export const useGamificationIntegration = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useGamificationNotifications();

  useEffect(() => {
    if (!currentUser) {
      // Clear callback when user logs out
      setGamificationNotificationCallback(() => {});
      return;
    }

    // Set up the callback for real-time notifications
    const handleGamificationNotification = (notification: GamificationNotification) => {
      // Only process notifications for the current user
      if (notification.userId === currentUser.uid) {
        addNotification(notification);
      }
    };

    setGamificationNotificationCallback(handleGamificationNotification);

    // Cleanup on unmount or user change
    return () => {
      setGamificationNotificationCallback(() => {});
    };
  }, [currentUser, addNotification]);
};

export default useGamificationIntegration;
