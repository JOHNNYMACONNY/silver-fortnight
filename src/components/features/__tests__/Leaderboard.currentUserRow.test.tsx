import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Leaderboard } from '../Leaderboard';
import { LeaderboardCategory, LeaderboardPeriod } from '../../../types/gamification';

jest.mock('../../../AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' } })
}));

jest.mock('../../../services/leaderboards', () => ({
  getLeaderboard: jest.fn(async () => ({
    success: true,
    data: {
      entries: [
        { userId: 'a', userName: 'A', userAvatar: '', rank: 1, value: 1000, rankChange: 0, isCurrentUser: false },
        { userId: 'b', userName: 'B', userAvatar: '', rank: 2, value: 900, rankChange: 0, isCurrentUser: false },
      ],
      currentUserEntry: { userId: 'u1', userName: 'Me', userAvatar: '', rank: 57, value: 123, rankChange: 0, isCurrentUser: true },
      totalParticipants: 2,
      lastUpdated: { toDate: () => new Date() },
      period: 'weekly',
      category: 'WEEKLY_XP'
    }
  }))
}));

describe('Leaderboard - current user context row', () => {
  it('renders current user row when not in top entries', async () => {
    render(
      <Leaderboard category={LeaderboardCategory.WEEKLY_XP} period={LeaderboardPeriod.WEEKLY} limit={2} />
    );
    await act(async () => {});
    expect(screen.getByText(/Your rank/i)).toBeInTheDocument();
    expect(screen.getByText(/Rank #57/i)).toBeInTheDocument();
  });
});


