import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Leaderboard } from '../components/features/Leaderboard';
import { LeaderboardCategory, LeaderboardPeriod } from '../types/gamification';

const meta: Meta<typeof Leaderboard> = {
  title: 'Gamification/Leaderboard',
  component: Leaderboard,
  parameters: {
    layout: 'centered',
  },
  args: {
    category: LeaderboardCategory.WEEKLY_XP,
    period: LeaderboardPeriod.WEEKLY,
    limit: 5,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GlobalTop: Story = {
  name: 'Global (Top 5)',
};

export const WithMyCircleToggle: Story = {
  name: 'Global with My Circle Toggle',
  render: (args) => <Leaderboard {...args} />,
};


