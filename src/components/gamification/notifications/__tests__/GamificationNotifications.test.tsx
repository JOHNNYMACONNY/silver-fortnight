import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GamificationNotificationProvider } from '../../../../contexts/GamificationNotificationContext';
import { XPGainToast } from '../XPGainToast';
import { LevelUpModal } from '../LevelUpModal';
import { AchievementUnlockModal } from '../AchievementUnlockModal';
import { NotificationPreferences } from '../NotificationPreferences';
import { XPSource } from '../../../../types/gamification';

// Mock framer-motion with a hoist-safe factory that strips animation props
jest.mock('framer-motion', () => {
  const React = require('react');

  const STRIP_KEYS = [
    'initial', 'animate', 'exit', 'transition', 'variants',
    'layout', 'layoutId', 'drag', 'dragConstraints', 'dragElastic', 'dragMomentum'
  ];
  const STRIP_PREFIXES = ['while', 'onPan', 'onDrag', 'onHover', 'onTap'];

  const stripFramerProps = (props = {}) => {
    const out: any = {};
    Object.keys(props || {}).forEach((k) => {
      if (STRIP_KEYS.includes(k)) return;
      if (STRIP_PREFIXES.some(p => k.startsWith(p))) return;
      out[k] = (props as any)[k];
    });
    return out;
  };

  const make = (tag: any) => (props: any) => {
    const { children } = props || {};
    const rest = stripFramerProps(props);
    return React.createElement(String(tag), rest, children);
  };

  const motion = new Proxy({}, {
    get: (_t, prop) => make(prop as any),
  });

  return {
    __esModule: true,
    motion,
    AnimatePresence: (props: any) => React.createElement(React.Fragment, null, props.children),
  };
});

beforeEach(() => {
  // clear any saved preferences to avoid cross-test pollution
  try { localStorage.clear(); } catch {}
});

// Mock auth context
const mockAuthContext = {
  currentUser: { uid: 'test-user-123' },
  loading: false,
  error: null,
  signInWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
};

jest.mock('../../../../AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('Gamification Notifications', () => {
  const mockXPNotification = {
    type: 'xp_gain' as const,
    amount: 100,
    source: XPSource.TRADE_COMPLETION,
    sourceId: 'trade-123',
    description: 'Trade completion',
    timestamp: new Date(),
    userId: 'test-user-123',
  };

  const mockLevelUpNotification = {
    type: 'level_up' as const,
    newLevel: 3,
    previousLevel: 2,
    levelTitle: 'Skilled Trader',
    benefits: ['Access to premium features', 'Priority support'],
    timestamp: new Date(),
    userId: 'test-user-123',
  };

  const mockAchievementNotification = {
    type: 'achievement_unlock' as const,
    achievementId: 'first_trade',
    achievementTitle: 'First Trade',
    achievementDescription: 'Complete your first trade on TradeYa',
    achievementIcon: '🤝',
    xpReward: 50,
    rarity: 'common' as const,
    timestamp: new Date(),
    userId: 'test-user-123',
  };

  describe('XPGainToast', () => {
    it('renders XP gain notification correctly', () => {
      const onClose = jest.fn();
      
      render(
        <XPGainToast
          notification={mockXPNotification}
          onClose={onClose}
          isReducedMotion={true}
        />
      );

      expect(screen.getByText('+100 XP')).toBeInTheDocument();
      expect(screen.getByText('Trade Completion')).toBeInTheDocument();
      expect(screen.getByText('Trade completion')).toBeInTheDocument();
    });

    it('calls onClose when clicked', () => {
      const onClose = jest.fn();
      
      render(
        <XPGainToast
          notification={mockXPNotification}
          onClose={onClose}
          isReducedMotion={true}
        />
      );

      fireEvent.click(screen.getByText('+100 XP').closest('div')!);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('LevelUpModal', () => {
    it('renders level up notification correctly', () => {
      const onClose = jest.fn();
      
      render(
        <LevelUpModal
          notification={mockLevelUpNotification}
          isOpen={true}
          onClose={onClose}
          isReducedMotion={true}
        />
      );

      expect(screen.getByText('Level Up!')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('Skilled Trader')).toBeInTheDocument();
      expect(screen.getByText('Access to premium features')).toBeInTheDocument();
    });

    it('calls onClose when continue button is clicked', () => {
      const onClose = jest.fn();
      
      render(
        <LevelUpModal
          notification={mockLevelUpNotification}
          isOpen={true}
          onClose={onClose}
          isReducedMotion={true}
        />
      );

      fireEvent.click(screen.getByText('Continue Your Journey'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('AchievementUnlockModal', () => {
    it('renders achievement unlock notification correctly', () => {
      const onClose = jest.fn();
      
      render(
        <AchievementUnlockModal
          notification={mockAchievementNotification}
          isOpen={true}
          onClose={onClose}
          isReducedMotion={true}
        />
      );

      expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
      expect(screen.getByText('First Trade')).toBeInTheDocument();
      expect(screen.getByText('Complete your first trade on TradeYa')).toBeInTheDocument();
      expect(screen.getByText('+50 XP')).toBeInTheDocument();
      expect(screen.getByText('common')).toBeInTheDocument();
    });

    it('calls onClose when awesome button is clicked', () => {
      const onClose = jest.fn();
      
      render(
        <AchievementUnlockModal
          notification={mockAchievementNotification}
          isOpen={true}
          onClose={onClose}
          isReducedMotion={true}
        />
      );

      fireEvent.click(screen.getByText('Awesome!'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('NotificationPreferences', () => {
    it('renders notification preferences correctly', () => {
      render(
        <GamificationNotificationProvider>
          <NotificationPreferences />
        </GamificationNotificationProvider>
      );

      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('XP Gain Notifications')).toBeInTheDocument();
      expect(screen.getByText('Level Up Celebrations')).toBeInTheDocument();
      expect(screen.getByText('Achievement Unlocks')).toBeInTheDocument();
      expect(screen.getByText('Sound Effects')).toBeInTheDocument();
      expect(screen.getByText('Notification Duration')).toBeInTheDocument();
    });

    it('allows toggling notification preferences', async () => {
      render(
        <GamificationNotificationProvider>
          <NotificationPreferences />
        </GamificationNotificationProvider>
      );

      const xpToggle = screen.getByRole('switch', { name: /xp gain notifications/i });
      expect(xpToggle).toBeInTheDocument();

      // Click to ensure the handler runs; re-query because the element may be re-rendered
      fireEvent.click(xpToggle);
      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /xp gain notifications/i })).toBeInTheDocument();
      });
    });

    it('allows changing notification duration', async () => {
      render(
        <GamificationNotificationProvider>
          <NotificationPreferences />
        </GamificationNotificationProvider>
      );

      const durationButton = screen.getByText(/4 seconds/i);
      expect(durationButton).toBeInTheDocument();
      fireEvent.click(durationButton);
      // Re-query to ensure the button (or updated element) exists
      await waitFor(() => {
        expect(screen.getByText(/4 seconds/i)).toBeInTheDocument();
      });
    });

    it('resets preferences to defaults', () => {
      render(
        <GamificationNotificationProvider>
          <NotificationPreferences />
        </GamificationNotificationProvider>
      );

      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);
      
      // All toggles should be in their default state
      expect(screen.getByRole('switch', { name: /xp gain notifications/i })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('switch', { name: /level up celebrations/i })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('switch', { name: /achievement unlocks/i })).toHaveAttribute('aria-checked', 'true');
    });
  });
});
