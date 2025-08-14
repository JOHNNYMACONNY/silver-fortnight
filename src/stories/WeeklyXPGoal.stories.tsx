import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WeeklyXPGoal } from '../components/gamification/WeeklyXPGoal';

const meta: Meta<typeof WeeklyXPGoal> = {
  title: 'Gamification/WeeklyXPGoal',
  component: WeeklyXPGoal,
  parameters: {
    layout: 'centered',
  },
  args: {
    userId: 'demo-user',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default (target 500)',
  args: {
    target: 500,
  },
};

export const GoalMet: Story = {
  name: 'Goal Met (mocked)',
  render: (args) => {
    // Pre-set localStorage flags for demo user
    if (typeof window !== 'undefined') {
      const weekKey = '2025-W10';
      window.localStorage.setItem(`xp-week-goal-demo-user-${weekKey}`, '1');
    }
    return <WeeklyXPGoal {...args} />;
  },
  args: {
    target: 200,
  },
};

export const EditedTarget: Story = {
  name: 'Edited Target (800)',
  render: (args) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`weekly-xp-goal-target-demo-user`, '800');
      window.localStorage.setItem(`weekly-xp-goal-tips-demo-user`, '1');
    }
    return <WeeklyXPGoal {...args} />;
  },
};


