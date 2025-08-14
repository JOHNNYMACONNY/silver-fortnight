import React from 'react';
import { render, act } from '@testing-library/react';
import { WeeklyXPGoal } from '../components/gamification/WeeklyXPGoal';

// Mock services to yield 600 XP this week (meets goal if target <= 600)
jest.mock('../services/gamification', () => ({
  getUserXPHistory: jest.fn(async () => {
    const now = new Date();
    const mkTs = (d: Date) => ({ toDate: () => d } as any);
    return {
      success: true,
      data: [
        { amount: 200, createdAt: mkTs(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)) },
        { amount: 200, createdAt: mkTs(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)) },
        { amount: 200, createdAt: mkTs(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      ],
    };
  }),
}));

// Mock analytics
const mockTrack = jest.fn();
jest.mock('../contexts/PerformanceContext', () => ({
  useBusinessMetrics: () => ({ track: mockTrack }),
}));

// Mock toast
const mockAddToast = jest.fn();
jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// Mock preferences to disable weekly goal met toast
jest.mock('../contexts/GamificationNotificationContext', () => ({
  useGamificationNotifications: () => ({ preferences: { weeklyGoalMetToasts: false } })
}));

describe('WeeklyXPGoal - weeklyGoalMetToasts preference', () => {
  const userId = 'u1';

  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      // Persist target 600 so this week meets goal
      window.localStorage.setItem(`weekly-xp-goal-target-${userId}`, '600');
    }
  });

  it('suppresses toast when weeklyGoalMetToasts is false but still tracks analytics', async () => {
    render(<WeeklyXPGoal userId={userId} />);
    await act(async () => {});

    // Analytics fired once, toast not called
    expect(mockTrack).toHaveBeenCalledWith('weekly_goal_met', expect.objectContaining({ target: 600 }));
    expect(mockAddToast).not.toHaveBeenCalled();
  });
});


