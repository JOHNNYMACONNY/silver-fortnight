import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Leaderboard } from '../Leaderboard';
import { LeaderboardCategory, LeaderboardPeriod } from '../../../types/gamification';

jest.mock('../../../AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' } })
}));

jest.mock('../../../services/firestore', () => ({
  getRelatedUserIds: jest.fn(async () => ({ data: { ids: [] }, error: null }))
}));

jest.mock('../../../services/leaderboards', () => ({
  getLeaderboard: jest.fn(async () => ({ success: true, data: { entries: [], currentUserEntry: undefined, totalParticipants: 0, lastUpdated: { toDate: () => new Date() }, period: 'weekly', category: 'WEEKLY_XP' } })),
  getCircleLeaderboard: jest.fn(async () => ({ success: true, data: { entries: [], currentUserEntry: undefined, totalParticipants: 0, lastUpdated: { toDate: () => new Date() }, period: 'weekly', category: 'WEEKLY_XP' } }))
}));

describe('Leaderboard - My Circle', () => {
  it('hides My Circle toggle when not following anyone', async () => {
    render(
      <Leaderboard category={LeaderboardCategory.WEEKLY_XP} period={LeaderboardPeriod.WEEKLY} />
    );
    await act(async () => {});
    expect(screen.queryByRole('button', { name: /my circle/i })).not.toBeInTheDocument();
  });

  it('shows circle empty state and allows switching back to global', async () => {
    const { getRelatedUserIds } = require('../../../services/firestore');
    getRelatedUserIds.mockResolvedValueOnce({ data: { ids: ['a'] }, error: null });

    render(
      <Leaderboard category={LeaderboardCategory.WEEKLY_XP} period={LeaderboardPeriod.WEEKLY} />
    );
    await act(async () => {});

    // Toggle appears
    const toggle = screen.getByRole('button', { name: /my circle/i });
    fireEvent.click(toggle);
    await act(async () => {});

    // Empty state for circle
    expect(screen.getByText(/No Circle Rankings Yet/i)).toBeInTheDocument();

    // Back to global
    fireEvent.click(screen.getByRole('button', { name: /Show Global/i }));
    await act(async () => {});
    expect(screen.queryByText(/No Circle Rankings Yet/i)).not.toBeInTheDocument();
  });
});


