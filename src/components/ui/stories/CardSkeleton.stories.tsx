import { CardSkeleton } from '../skeletons/CardSkeleton';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CardSkeleton> = {
  title: 'UI/CardSkeleton',
  component: CardSkeleton,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof CardSkeleton>;

export const Default: Story = {
  args: {},
};

export const WithImage: Story = {
  args: { hasImage: true },
};

export const WithFooter: Story = {
  args: { hasFooter: true },
};

export const WithImageAndFooter: Story = {
  args: { hasImage: true, hasFooter: true },
};

export const CustomClass: Story = {
  render: () => <CardSkeleton className="max-w-xs border border-blue-400" hasImage hasFooter />,
};
