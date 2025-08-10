import { ThemeToggle } from '../ThemeToggle';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  decorators: [
    (Story) => <ThemeProvider><Story /></ThemeProvider>
  ],
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {
  args: {},
};
