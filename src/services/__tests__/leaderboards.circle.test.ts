import { getCircleLeaderboard } from '../leaderboards';
import { LeaderboardCategory, LeaderboardPeriod } from '../../types/gamification';

describe('getCircleLeaderboard', () => {
  it('returns empty entries when followingUserIds is empty', async () => {
    const res = await getCircleLeaderboard(LeaderboardCategory.WEEKLY_XP, LeaderboardPeriod.WEEKLY, [], 'u1');
    expect(res.success).toBe(true);
    expect(res.data?.entries?.length).toBe(0);
    expect(res.data?.totalParticipants).toBe(0);
  });
});


