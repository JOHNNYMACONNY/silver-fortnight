import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { WeeklyXPGoal } from '../components/gamification/WeeklyXPGoal';

// Mock services and contexts
jest.mock('../services/gamification', () => ({
  getUserXPHistory: jest.fn(async (_userId: string) => {
    const now = new Date();
    const mkTs = (d: Date) => ({ toDate: () => d } as any);
    // 3 transactions within the last 7 days: total 600 XP
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

const mockTrack = jest.fn();
jest.mock('../contexts/PerformanceContext', () => ({
  useBusinessMetrics: () => ({ track: mockTrack }),
}));

const mockAddToast = jest.fn();
jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

describe('WeeklyXPGoal', () => {
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage between tests
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('uses editable target and persists it', async () => {
    render(<WeeklyXPGoal userId={userId} />);

    // Wait for loading to settle
    await act(async () => {});

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit weekly xp target/i }));

    // Change value to 1000 and save
    const input = screen.getByLabelText(/weekly xp target/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Target text should reflect 1000
    expect(screen.getByText(/Target: 1000/i)).toBeInTheDocument();

    // Persisted
    expect(window.localStorage.getItem(`weekly-xp-goal-target-${userId}`)).toBe('1000');
  });

  it('computes percent using customized target', async () => {
    // Pre-persist target 1200
    window.localStorage.setItem(`weekly-xp-goal-target-${userId}`, '1200');

    render(<WeeklyXPGoal userId={userId} />);
    await act(async () => {});

    // weekXP is 600; percent = 600/1200 = 50%
    expect(screen.getByText(/50% of weekly goal/i)).toBeInTheDocument();
  });

  it('tips toggle persists in localStorage', async () => {
    render(<WeeklyXPGoal userId={userId} />);
    await act(async () => {});

    // Show tips
    fireEvent.click(screen.getByRole('button', { name: /show tips/i }));
    expect(window.localStorage.getItem(`weekly-xp-goal-tips-${userId}`)).toBe('1');

    // Hide tips
    fireEvent.click(screen.getByRole('button', { name: /hide tips/i }));
    expect(window.localStorage.getItem(`weekly-xp-goal-tips-${userId}`)).toBe('0');
  });

  it('fires analytics once upon crossing 100% and shows toast', async () => {
    // Pre-persist analytics not fired
    // First render with target 1200 → percent 50% (no fire)
    window.localStorage.setItem(`weekly-xp-goal-target-${userId}`, '1200');
    const { rerender } = render(<WeeklyXPGoal userId={userId} />);
    await act(async () => {});
    expect(mockTrack).not.toHaveBeenCalled();

    // Simulate raising target to 600 so it crosses to 100%
    window.localStorage.setItem(`weekly-xp-goal-target-${userId}`, '600');
    rerender(<WeeklyXPGoal userId={userId} />);
    await act(async () => {});

    expect(mockTrack).toHaveBeenCalledWith('weekly_goal_met', expect.objectContaining({ weekKey: expect.any(String) }));
    expect(mockAddToast).toHaveBeenCalled();

    // Rerender should not fire again
    rerender(<WeeklyXPGoal userId={userId} />);
    await act(async () => {});
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });
});


