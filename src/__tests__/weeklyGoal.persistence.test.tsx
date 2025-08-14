import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeeklyXPGoal } from '../components/gamification/WeeklyXPGoal';

// Mock XP history to exceed target within last 7 days
const mockHistory = [
  { amount: 600, createdAt: { toDate: () => new Date() } },
];

jest.mock('../services/gamification', () => ({
  getUserXPHistory: async () => ({ success: true, data: mockHistory }),
}));

describe('WeeklyXPGoal persistence', () => {
  beforeEach(() => {
    // Clear any prior persisted flags
    if (typeof window !== 'undefined') {
      Object.keys(window.localStorage).forEach((k) => {
        if (k.startsWith('xp-week-goal-')) {
          window.localStorage.removeItem(k);
        }
      });
    }
  });

  it('shows Goal met badge and persists the flag for this week', async () => {
    render(<WeeklyXPGoal userId="u1" target={500} />);
    expect(await screen.findByText('Goal met')).toBeInTheDocument();
    // Verify a key was written
    const stored = Object.keys(window.localStorage).some((k) => k.startsWith('xp-week-goal-u1-'));
    expect(stored).toBe(true);
  });
});


