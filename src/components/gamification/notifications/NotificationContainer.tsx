import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGamificationNotifications } from '../../../contexts/GamificationNotificationContext';
import XPGainToast from './XPGainToast';
import { Flame, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import LevelUpModal from './LevelUpModal';
import AchievementUnlockModal from './AchievementUnlockModal';
import { cn } from '../../../utils/cn';

export const NotificationContainer: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    notifications,
    removeNotification,
    isReducedMotion
  } = useGamificationNotifications();

  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Separate notifications by type
  const xpGainNotifications = notifications.filter(item =>
    item.notification.type === 'xp_gain'
  );

  const levelUpNotifications = notifications.filter(item =>
    item.notification.type === 'level_up'
  );

  const achievementNotifications = notifications.filter(item =>
    item.notification.type === 'achievement_unlock'
  );

  const streakMilestoneToasts = notifications.filter(item =>
    item.notification.type === 'streak_milestone'
  );

  // Handle modal display - only show one modal at a time, prioritize level ups
  const currentModal = (() => {
    if (levelUpNotifications.length > 0) {
      return levelUpNotifications[0];
    }
    if (achievementNotifications.length > 0) {
      return achievementNotifications[0];
    }
    return null;
  })();

  const handleModalClose = () => {
    if (currentModal) {
      removeNotification(currentModal.id);
      setActiveModal(null);
    }
  };

  // Set active modal when a new high-priority notification appears
  React.useEffect(() => {
    if (currentModal && activeModal !== currentModal.id) {
      setActiveModal(currentModal.id);
    }
  }, [currentModal, activeModal]);

  return (
    <>
      {/* Toast notifications container - positioned at top-right */}
      <div className="fixed top-20 right-4 z-toast space-y-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {xpGainNotifications.map((item) => (
            <motion.div
              key={item.id}
              className="pointer-events-auto"
              layout={!isReducedMotion}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                layout: { duration: 0.2 }
              }}
            >
              <XPGainToast
                notification={item.notification as any}
                onClose={() => removeNotification(item.id)}
                isReducedMotion={isReducedMotion}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Streak milestone toasts */}
      <div className="fixed top-20 right-4 z-toast space-y-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {streakMilestoneToasts.map((item) => (
            <motion.div
              key={item.id}
              className="pointer-events-auto"
              layout={!isReducedMotion}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, layout: { duration: 0.2 } }}
            >
              <div className="relative bg-neutral-900/80 backdrop-blur-md border border-white/5 rounded-lg shadow-lg p-3 flex items-center gap-3 overflow-hidden">
                <Flame className="w-5 h-5 text-amber-500 opacity-90" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white mb-0.5">Streak Milestone</div>
                  <div className="text-xs text-white/50 truncate">
                    {(item.notification as any).message || 'Great job keeping your streak alive!'}
                  </div>
                </div>
                {currentUser && (
                  <button
                    onClick={() => {
                      removeNotification(item.id);
                      navigate(`/profile/${currentUser.uid}?tab=gamification`);
                    }}
                    className="text-xs font-medium text-amber-500 hover:text-amber-400 hover:underline mr-2 transition-colors"
                  >
                    View
                  </button>
                )}
                <button
                  onClick={() => removeNotification(item.id)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Level up modal */}
      {currentModal?.notification.type === 'level_up' && (
        <LevelUpModal
          notification={currentModal.notification as any}
          isOpen={activeModal === currentModal.id}
          onClose={handleModalClose}
          isReducedMotion={isReducedMotion}
        />
      )}

      {/* Achievement unlock modal */}
      {currentModal?.notification.type === 'achievement_unlock' && (
        <AchievementUnlockModal
          notification={currentModal.notification as any}
          isOpen={activeModal === currentModal.id}
          onClose={handleModalClose}
          isReducedMotion={isReducedMotion}
        />
      )}
    </>
  );
};

export default NotificationContainer;
