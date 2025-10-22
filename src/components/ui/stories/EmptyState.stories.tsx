import { EmptyState } from '../EmptyState';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No data available',
    description: 'There is currently no data to display.',
  },
};
