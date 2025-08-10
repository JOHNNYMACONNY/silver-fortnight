import TradeCardSkeleton, { TradeListSkeleton } from '../skeletons/TradeCardSkeleton';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TradeCardSkeleton> = {
  title: 'UI/TradeCardSkeleton',
  component: TradeCardSkeleton,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TradeCardSkeleton>;

export const Default: Story = {
  args: {},
};

export const ListOfSkeletons: Story = {
  render: () => <TradeListSkeleton count={3} />,
};

// Add more variants as needed for visual regression coverage
