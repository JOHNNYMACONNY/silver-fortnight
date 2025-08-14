import React from 'react';
import { render, screen, act } from '@testing-library/react';
import GamificationDashboard from '../components/gamification/GamificationDashboard';

jest.mock('../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } })
}));

jest.mock('../components/gamification/XPBreakdown', () => ({
  XPBreakdown: () => <div>MOCK_BREAKDOWN</div>
}));

jest.mock('../services/gamification', () => ({
  getUserXP: jest.fn(async () => ({ success: true, data: { userId: 'u1', totalXP: 1000 } })),
  getUserXPHistory: jest.fn(async () => ({ success: true, data: [] })),
}));

jest.mock('../services/achievements', () => ({
  getUserAchievements: jest.fn(async () => ({ success: true, data: [] })),
  ACHIEVEMENTS: [],
}));

describe('GamificationDashboard - XP Breakdown persistence', () => {
  it('shows breakdown when persisted flag is set', async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('xp-breakdown-visible-u1', '1');
    }
    render(<GamificationDashboard />);
    await act(async () => {});
    expect(screen.getByText('MOCK_BREAKDOWN')).toBeInTheDocument();
  });
});


