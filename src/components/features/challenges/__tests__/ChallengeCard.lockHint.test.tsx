import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ChallengeCard } from '../../ChallengeCard';
import { Challenge, ChallengeDifficulty, ChallengeType } from '../../../../types/gamification';

jest.mock('../../../../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } })
}));

jest.mock('../../../../services/threeTierProgression', () => ({
  getUserThreeTierProgress: jest.fn(async () => ({ success: true, data: {
    userId: 'u1',
    soloCompletions: 0,
    tradeCompletions: 0,
    collaborationCompletions: 0,
    unlockedTiers: ['SOLO'],
    currentTier: 'SOLO',
    nextTierRequirements: { tier: 'TRADE', requiredCompletions: 3, requiredSkillLevel: 2, description: '' },
    totalChallengesCompleted: 0,
    skillProgression: [],
    lastUpdated: { toDate: () => new Date() }
  } }))
}));

const baseChallenge: Partial<Challenge> = {
  id: 'c1',
  title: 'Test Challenge',
  description: 'Desc',
  difficulty: ChallengeDifficulty.BEGINNER,
  rewards: { xp: 100 },
  timeEstimate: '1h',
  tags: []
};

describe('ChallengeCard lock hint', () => {
  it('renders lock chip for TRADE when not unlocked', async () => {
    render(
      <ChallengeCard
        challenge={{ ...(baseChallenge as Challenge), type: ChallengeType.TRADE }}
        onSelect={() => {}}
      />
    );
    await act(async () => {});
    expect(screen.getByText(/Locked/i)).toBeInTheDocument();
  });

  it('does not show lock when tier is unlocked', async () => {
    const { getUserThreeTierProgress } = require('../../../../services/threeTierProgression');
    getUserThreeTierProgress.mockResolvedValueOnce({ success: true, data: {
      userId: 'u1',
      soloCompletions: 3,
      tradeCompletions: 0,
      collaborationCompletions: 0,
      unlockedTiers: ['SOLO', 'TRADE'],
      currentTier: 'TRADE',
      nextTierRequirements: { tier: 'COLLABORATION', requiredCompletions: 5, requiredSkillLevel: 3, description: '' },
      totalChallengesCompleted: 3,
      skillProgression: [],
      lastUpdated: { toDate: () => new Date() }
    } });

    render(
      <ChallengeCard
        challenge={{ ...(baseChallenge as Challenge), type: ChallengeType.TRADE }}
        onSelect={() => {}}
      />
    );
    await act(async () => {});
    expect(screen.queryByText(/Locked/i)).not.toBeInTheDocument();
  });
});


