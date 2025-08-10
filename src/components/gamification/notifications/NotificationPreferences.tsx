import React from 'react';
import { motion } from 'framer-motion';
import { useGamificationNotifications } from '../../../contexts/GamificationNotificationContext';
import { cn } from '../../../utils/cn';

interface NotificationPreferencesProps {
  className?: string;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences, isReducedMotion } = useGamificationNotifications();

  const handleToggle = (key: keyof typeof preferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  const handleDurationChange = (duration: number) => {
    updatePreferences({ notificationDuration: duration });
  };

  const preferenceItems = [
    {
      key: 'xpGainToasts' as const,
      title: 'XP Gain Notifications',
      description: 'Show toast notifications when you earn XP',
      icon: '✨'
    },
    {
      key: 'levelUpModals' as const,
      title: 'Level Up Celebrations',
      description: 'Show celebration modals when you level up',
      icon: '🎉'
    },
    {
      key: 'achievementUnlockModals' as const,
      title: 'Achievement Unlocks',
      description: 'Show modals when you unlock achievements',
      icon: '🏆'
    },
    {
      key: 'soundEffects' as const,
      title: 'Sound Effects',
      description: 'Play sound effects for notifications',
      icon: '🔊'
    },
    {
      key: 'batchNotifications' as const,
      title: 'Batch Notifications',
      description: 'Group multiple XP gains together',
      icon: '📦'
    },
    {
      key: 'reducedMotion' as const,
      title: 'Reduced Motion',
      description: 'Use simpler animations (overrides system setting)',
      icon: '🎭'
    }
  ];

  const durationOptions = [
    { value: 2000, label: '2 seconds' },
    { value: 3000, label: '3 seconds' },
    { value: 4000, label: '4 seconds' },
    { value: 5000, label: '5 seconds' }
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Notification Preferences
        </h3>
        <p className="text-sm text-muted-foreground">
          Customize how you receive gamification notifications
        </p>
      </div>

      {/* System detection notice */}
      {isReducedMotion && !preferences.reducedMotion && (
        <motion.div
          className={cn(
            'p-3 rounded-lg border',
            'bg-blue-50 dark:bg-blue-900/20',
            'border-blue-200 dark:border-blue-800',
            'text-blue-800 dark:text-blue-200'
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">ℹ️</span>
            <div>
              <p className="text-sm font-medium">Reduced Motion Detected</p>
              <p className="text-xs mt-1">
                Your system preferences indicate reduced motion. Animations will be simplified automatically.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preference toggles */}
      <div className="space-y-4">
        {preferenceItems.map((item, index) => (
          <motion.div
            key={item.key}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg',
              'bg-card',
              'border border-border',
              'hover:bg-muted/50',
              'transition-colors duration-200'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h4 className="font-medium text-foreground">
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleToggle(item.key)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                preferences[item.key]
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
              role="switch"
              aria-checked={preferences[item.key]}
              aria-labelledby={`toggle-${item.key}`}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
                  preferences[item.key] ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Duration setting */}
      <motion.div
        className={cn(
          'p-4 rounded-lg',
          'bg-card',
          'border border-border'
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start space-x-3 mb-3">
          <span className="text-2xl">⏱️</span>
          <div>
            <h4 className="font-medium text-foreground">
              Notification Duration
            </h4>
            <p className="text-sm text-muted-foreground">
              How long notifications stay visible
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3">
          {durationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDurationChange(option.value)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'border border-border',
                preferences.notificationDuration === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted/50',
                preferences.notificationDuration === option.value
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Reset to defaults */}
      <motion.button
        onClick={() => updatePreferences({
          xpGainToasts: true,
          levelUpModals: true,
          achievementUnlockModals: true,
          soundEffects: false,
          reducedMotion: false,
          batchNotifications: true,
          notificationDuration: 3000
        })}
        className={cn(
          'w-full py-2 px-4 rounded-lg text-sm font-medium',
          'border border-border',
          'bg-card',
          'hover:bg-muted/50',
          'transition-colors duration-200',
          'text-foreground'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Reset to Defaults
      </motion.button>
    </div>
  );
};

export default NotificationPreferences;
