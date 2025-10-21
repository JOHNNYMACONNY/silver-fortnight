import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton } from '../skeletons/Skeleton';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  render: () => <Skeleton className="h-8 w-32 bg-blue-200" />,
};

export const Text: Story = {
  render: () => <SkeletonText className="w-48" />,
};

export const Circle: Story = {
  render: () => <SkeletonCircle size="h-16 w-16" />,
};

export const Button: Story = {
  render: () => <SkeletonButton />,
};

// Add more variants as needed for visual regression coverage
