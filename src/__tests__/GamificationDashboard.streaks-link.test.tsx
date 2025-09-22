import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GamificationDashboard } from '../components/gamification/GamificationDashboard';
import { ToastProvider } from '../contexts/ToastContext';
import { PerformanceProvider } from '../contexts/PerformanceContext';
import { GamificationNotificationProvider } from '../contexts/GamificationNotificationContext';

jest.mock('../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

jest.mock('../services/gamification', () => ({
  getUserXP: async () => ({ success: true, data: { totalXP: 0, currentLevel: 1, xpToNextLevel: 100, lastUpdated: { toDate: () => new Date() }, createdAt: { toDate: () => new Date() } } }),
  getUserXPHistory: async () => ({ success: true, data: [] }),
}));

jest.mock('../services/achievements', () => ({
  getUserAchievements: async () => ({ success: true, data: [] }),
  ACHIEVEMENTS: [],
}));

jest.mock('../components/features/StreakWidget', () => ({
  StreakWidget: () => 'streak',
}));

describe('GamificationDashboard streaks link', () => {
  it('navigates to history tab when clicking View streak details', async () => {
    render(
      <PerformanceProvider>
        <ToastProvider>
          <GamificationNotificationProvider>
            <GamificationDashboard />
          </GamificationNotificationProvider>
        </ToastProvider>
      </PerformanceProvider>
    );
    const link = await screen.findByRole('button', { name: /View streak details/i });
    fireEvent.click(link);
    // History tab title
    expect(await screen.findByText('XP History')).toBeInTheDocument();
    // Optional streak panel renders widgets
    expect(screen.getAllByTestId('streak-widget').length).toBeGreaterThan(0);
  });
});


