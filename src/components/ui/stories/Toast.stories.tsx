import { Toast } from '../Toast';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    message: 'Success notification!',
    type: 'success',
    onClose: () => {},
  },
};

export const Error: Story = {
  args: {
    message: 'Error notification!',
    type: 'error',
    onClose: () => {},
  },
};

export const Info: Story = {
  args: {
    message: 'Info notification!',
    type: 'info',
    onClose: () => {},
  },
};

// Add more stories for edge cases or new variants as needed.
