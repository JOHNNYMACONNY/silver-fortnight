import UserCardSkeleton from '../UserCardSkeleton';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof UserCardSkeleton> = {
  title: 'UI/UserCardSkeleton',
  component: UserCardSkeleton,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof UserCardSkeleton>;

export const Default: Story = {
  args: {},
};
