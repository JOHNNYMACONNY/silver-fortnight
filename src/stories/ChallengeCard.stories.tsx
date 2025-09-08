import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChallengeCard } from '../components/features/challenges/ChallengeCard';
import { ChallengeDifficulty, ChallengeType } from '../types/gamification';

// Lightweight mocks for Storybook only
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'demo-user' } })
}));

jest.mock('../services/threeTierProgression', () => ({
  getUserThreeTierProgress: jest.fn(async () => ({
    success: true,
    data: {
      userId: 'demo-user',
      soloCompletions: 0,
      tradeCompletions: 0,
      collaborationCompletions: 0,
      unlockedTiers: ['SOLO'],
      currentTier: 'SOLO',
      nextTierRequirements: { tier: 'TRADE', requiredCompletions: 3, requiredSkillLevel: 2, description: '' },
      totalChallengesCompleted: 0,
      skillProgression: [],
      lastUpdated: { toDate: () => new Date() }
    }
  }))
}));

const meta: Meta<typeof ChallengeCard> = {
  title: 'Challenges/ChallengeCard',
  component: ChallengeCard,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseChallenge = {
  id: 'c1',
  title: 'Mix and Master a Track',
  description: 'Complete the mix and master in your DAW and export WAV/MP3.',
  difficulty: ChallengeDifficulty.BEGINNER,
  rewards: { xp: 150 },
  timeEstimate: '2h',
  tags: ['audio', 'mixing'] as string[],
};

export const LockedTrade: Story = {
  name: 'Locked (Trade tier)',
  args: {
    challenge: { ...baseChallenge, type: ChallengeType.TRADE },
  },
};

export const UnlockedTrade: Story = {
  name: 'Unlocked (Trade tier)',
  render: (args) => {
    const { getUserThreeTierProgress } = require('../services/threeTierProgression');
    getUserThreeTierProgress.mockResolvedValueOnce({
      success: true,
      data: {
        userId: 'demo-user',
        soloCompletions: 3,
        tradeCompletions: 0,
        collaborationCompletions: 0,
        unlockedTiers: ['SOLO', 'TRADE'],
        currentTier: 'TRADE',
        nextTierRequirements: { tier: 'COLLABORATION', requiredCompletions: 5, requiredSkillLevel: 3, description: '' },
        totalChallengesCompleted: 3,
        skillProgression: [],
        lastUpdated: { toDate: () => new Date() }
      }
    });
    return <ChallengeCard challenge={args.challenge} />;
  },
  args: {
    challenge: { ...baseChallenge, type: ChallengeType.TRADE },
  },
};


