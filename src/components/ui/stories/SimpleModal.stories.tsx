import { SimpleModal } from '../SimpleModal';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const meta: Meta<typeof SimpleModal> = {
  title: 'UI/SimpleModal',
  component: SimpleModal,
  decorators: [
    (Story) => <ThemeProvider><Story /></ThemeProvider>
  ],
};
export default meta;

type Story = StoryObj<typeof SimpleModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: 'This is a simple modal',
  },
};
