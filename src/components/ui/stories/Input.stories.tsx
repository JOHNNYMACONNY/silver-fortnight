import { Input } from '../Input';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

// Add more stories for edge cases or new variants as needed.
