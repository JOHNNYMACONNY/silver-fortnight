import React from 'react';
import { motion } from 'framer-motion';
import { useGamificationNotifications } from '../../../contexts/GamificationNotificationContext';
import { cn } from '../../../utils/cn';
import { isAutoFreezeEnabled } from '../../../services/streakConfig';
import { useAuth } from '../../../AuthContext';
import { Sparkles, Flame, CheckCircle, PartyPopper, Trophy, Volume2, Package, Palette, Snowflake, Clock, Info } from 'lucide-react';

interface NotificationPreferencesProps {
  className?: string;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences, isReducedMotion } = useGamificationNotifications();
  const { currentUser } = useAuth();

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
      icon: Sparkles,
      color: 'text-yellow-500',
      bg: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20'
    },
    {
      key: 'streakToasts' as const,
      title: 'Streak Milestones',
      description: 'Show toast notifications for streak milestones',
      icon: Flame,
      color: 'text-orange-500',
      bg: 'bg-gradient-to-br from-orange-500/20 to-red-500/20'
    },
    {
      key: 'weeklyGoalMetToasts' as const,
      title: 'Weekly Goal Met',
      description: 'Show a toast when you meet your weekly XP goal',
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
    },
    {
      key: 'levelUpModals' as const,
      title: 'Level Up Celebrations',
      description: 'Show celebration modals when you level up',
      icon: PartyPopper,
      color: 'text-purple-500',
      bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
    },
    {
      key: 'achievementUnlockModals' as const,
      title: 'Achievement Unlocks',
      description: 'Show modals when you unlock achievements',
      icon: Trophy,
      color: 'text-amber-500',
      bg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20'
    },
    {
      key: 'soundEffects' as const,
      title: 'Sound Effects',
      description: 'Play sound effects for notifications',
      icon: Volume2,
      color: 'text-blue-500',
      bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
    },
    {
      key: 'batchNotifications' as const,
      title: 'Batch Notifications',
      description: 'Group multiple XP gains together',
      icon: Package,
      color: 'text-indigo-500',
      bg: 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20'
    },
    {
      key: 'reducedMotion' as const,
      title: 'Reduced Motion',
      description: 'Use simpler animations (overrides system setting)',
      icon: Palette,
      color: 'text-slate-500',
      bg: 'bg-gradient-to-br from-slate-500/20 to-gray-500/20'
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
        <h3 id="notification-preferences-title" className="text-lg font-semibold mb-2 text-foreground">
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
            'p-4 rounded-lg border glassmorphic',
            'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
            'border-blue-500/30'
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Reduced Motion Detected</p>
              <p className="text-xs mt-1 text-muted-foreground">
                Your system preferences indicate reduced motion. Animations will be simplified automatically.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preference toggles */}
      <div className="space-y-3">
        {preferenceItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={item.key}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg',
                'glassmorphic border border-border/50',
                'hover:border-border transition-all duration-200'
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg', item.bg)}>
                  <IconComponent className={cn('w-5 h-5', item.color)} />
                </div>
                <div>
                  <h4 id={`toggle-${item.key}`} className="font-medium text-foreground">
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
                'relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300',
                'outline-hidden focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background',
                'border shadow-inner',
                preferences[item.key]
                  ? 'bg-gradient-to-r from-primary to-primary/80 border-primary/50 shadow-primary/20'
                  : 'bg-muted/50 border-border/50 shadow-black/10'
              )}
              role="switch"
              aria-checked={preferences[item.key]}
              aria-labelledby={`toggle-${item.key}`}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full transition-all duration-300 shadow-md',
                  preferences[item.key]
                    ? 'translate-x-6 bg-white'
                    : 'translate-x-1 bg-white/90'
                )}
              />
            </button>
          </motion.div>
        );
        })}
      </div>

      {/* Streak auto-freeze */}
      <motion.div
        className={cn('p-4 rounded-lg glassmorphic border border-border/50')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
            <Snowflake className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Streak Auto-Freeze</h4>
            <p className="text-sm text-muted-foreground mb-3">Automatically use a freeze to cover a single-day miss.</p>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                defaultChecked={typeof window !== 'undefined' ? isAutoFreezeEnabled(currentUser?.uid, true) : true}
                onChange={(e) => {
                  try {
                    if (typeof window !== 'undefined' && currentUser?.uid) {
                      window.localStorage.setItem(`streak-auto-freeze-${currentUser.uid}`, String(!!e.target.checked));
                    }
                  } catch {}
                }}
              />
              <span>Enable auto-freeze</span>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Duration setting */}
      <motion.div
        className={cn(
          'p-4 rounded-lg',
          'glassmorphic border border-border/50'
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-500/20">
            <Clock className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">
              Notification Duration
            </h4>
            <p className="text-sm text-muted-foreground">
              How long notifications stay visible
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {durationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDurationChange(option.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                'border',
                preferences.notificationDuration === option.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border text-foreground'
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
          'w-full py-2.5 px-4 rounded-lg text-sm font-medium',
          'border border-border/50',
          'glassmorphic',
          'hover:border-border',
          'transition-all duration-200',
          'text-foreground'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        Reset to Defaults
      </motion.button>
    </div>
  );
};

export default NotificationPreferences;
