import { Badge } from '../Badge';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'status', 'status-glow'],
    },
    topic: {
      control: { type: 'select' },
      options: ['trades', 'collaboration', 'community', 'success'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Default Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Badge',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive Badge',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Badge',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Badge',
  },
};

export const Status: Story = {
  args: {
    variant: 'status',
    children: 'Status Badge',
  },
};

export const StatusGlow: Story = {
  args: {
    variant: 'status-glow',
    children: 'Live',
  },
};

// Semantic topic badges with transparent backgrounds
export const TradesTopic: Story = {
  args: {
    variant: 'default',
    topic: 'trades',
    children: 'Active',
  },
};

export const CollaborationTopic: Story = {
  args: {
    variant: 'default',
    topic: 'collaboration',
    children: 'Team',
  },
};

export const CommunityTopic: Story = {
  args: {
    variant: 'default',
    topic: 'community',
    children: 'Community',
  },
};

export const SuccessTopic: Story = {
  args: {
    variant: 'default',
    topic: 'success',
    children: 'Rewards',
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="status">Status</Badge>
      <Badge variant="status-glow">Live</Badge>
    </div>
  ),
};

// All topics showcase
export const AllTopics: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default" topic="trades">Active</Badge>
      <Badge variant="default" topic="collaboration">Team</Badge>
      <Badge variant="default" topic="community">Community</Badge>
      <Badge variant="default" topic="success">Rewards</Badge>
    </div>
  ),
};
