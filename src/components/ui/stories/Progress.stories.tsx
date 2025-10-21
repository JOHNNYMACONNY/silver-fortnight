import { Progress } from '../Progress';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 50,
    max: 100,
  },
};
