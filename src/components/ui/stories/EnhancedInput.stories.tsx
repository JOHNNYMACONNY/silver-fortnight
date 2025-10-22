import EnhancedInput from '../EnhancedInput';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof EnhancedInput> = {
  title: 'UI/EnhancedInput',
  component: EnhancedInput,
};
export default meta;

type Story = StoryObj<typeof EnhancedInput>;

export const Default: Story = {
  args: {
    placeholder: 'Enhanced input...',
  },
};
