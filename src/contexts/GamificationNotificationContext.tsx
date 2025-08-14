import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import {
  GamificationNotification,
  GamificationNotificationPreferences,
  DEFAULT_GAMIFICATION_PREFERENCES,
  NotificationQueueItem
} from '../types/gamificationNotifications';

interface GamificationNotificationContextType {
  // Notification queue management
  notifications: NotificationQueueItem[];
  addNotification: (notification: GamificationNotification) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Preferences management
  preferences: GamificationNotificationPreferences;
  updatePreferences: (preferences: Partial<GamificationNotificationPreferences>) => void;
  
  // System state
  isReducedMotion: boolean;
  isPlaying: boolean; // For managing sound playback
}

const GamificationNotificationContext = createContext<GamificationNotificationContextType | undefined>(undefined);

export const GamificationNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationQueueItem[]>([]);
  const [preferences, setPreferences] = useState<GamificationNotificationPreferences>(DEFAULT_GAMIFICATION_PREFERENCES);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Detect reduced motion preference from system
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load user preferences from localStorage
  useEffect(() => {
    if (!currentUser) return;
    
    const savedPreferences = localStorage.getItem(`gamification-preferences-${currentUser.uid}`);
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...DEFAULT_GAMIFICATION_PREFERENCES, ...parsed });
      } catch (error) {
        console.warn('Failed to parse gamification preferences:', error);
      }
    }
  }, [currentUser]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!currentUser) return;
    
    localStorage.setItem(
      `gamification-preferences-${currentUser.uid}`,
      JSON.stringify(preferences)
    );
  }, [preferences, currentUser]);

  // Add notification to queue
  const addNotification = useCallback((notification: GamificationNotification) => {
    if (!currentUser || notification.userId !== currentUser.uid) return;
    
    // Check if this type of notification is enabled
    const isEnabled = (() => {
      switch (notification.type) {
        case 'xp_gain':
          return preferences.xpGainToasts;
        case 'level_up':
          return preferences.levelUpModals;
        case 'achievement_unlock':
          return preferences.achievementUnlockModals;
        case 'streak_milestone':
          return preferences.streakToasts;
        default:
          return true;
      }
    })();
    
    if (!isEnabled) return;

    // Determine priority
    const priority = (() => {
      switch (notification.type) {
        case 'level_up':
        case 'achievement_unlock':
          return 'high' as const;
        case 'xp_gain':
          return 'medium' as const;
        default:
          return 'low' as const;
      }
    })();

    const queueItem: NotificationQueueItem = {
      id: `${notification.type}-${Date.now()}-${Math.random()}`,
      notification,
      priority,
      createdAt: new Date()
    };

    setNotifications(prev => {
      // If batching is enabled and this is an XP gain, check for existing XP gains
      if (preferences.batchNotifications && notification.type === 'xp_gain') {
        const existingXPIndex = prev.findIndex(item => 
          item.notification.type === 'xp_gain' && 
          item.notification.source === notification.source
        );
        
        if (existingXPIndex !== -1) {
          // Update existing XP notification by combining amounts
          const updated = [...prev];
          const existing = updated[existingXPIndex].notification as typeof notification;
          updated[existingXPIndex] = {
            ...updated[existingXPIndex],
            notification: {
              ...existing,
              amount: existing.amount + notification.amount,
              timestamp: notification.timestamp
            }
          };
          return updated;
        }
      }
      
      // Add new notification, keeping queue size manageable
      const newQueue = [...prev, queueItem];
      return newQueue.slice(-10); // Keep only last 10 notifications
    });
  }, [currentUser, preferences]);

  // Remove notification from queue
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<GamificationNotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  // Auto-remove notifications after duration
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const timers = notifications.map(item => {
      // High priority notifications stay longer
      const duration = item.priority === 'high' 
        ? preferences.notificationDuration * 2 
        : preferences.notificationDuration;
        
      return setTimeout(() => {
        removeNotification(item.id);
      }, duration);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, preferences.notificationDuration, removeNotification]);

  const value: GamificationNotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    preferences,
    updatePreferences,
    isReducedMotion: isReducedMotion || preferences.reducedMotion,
    isPlaying
  };

  return (
    <GamificationNotificationContext.Provider value={value}>
      {children}
    </GamificationNotificationContext.Provider>
  );
};

export const useGamificationNotifications = () => {
  const context = useContext(GamificationNotificationContext);
  if (context === undefined) {
    throw new Error('useGamificationNotifications must be used within a GamificationNotificationProvider');
  }
  return context;
};
