import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GamificationDashboard } from '../components/gamification/GamificationDashboard';

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
  StreakWidget: () => <div data-testid="streak-widget">streak</div>,
}));

describe('GamificationDashboard streaks link', () => {
  it('navigates to history tab when clicking View streak details', async () => {
    render(<GamificationDashboard />);
    const link = await screen.findByRole('button', { name: /View streak details/i });
    fireEvent.click(link);
    // History tab title
    expect(await screen.findByText('XP History')).toBeInTheDocument();
    // Optional streak panel renders widgets
    expect(screen.getAllByTestId('streak-widget').length).toBeGreaterThan(0);
  });
});


