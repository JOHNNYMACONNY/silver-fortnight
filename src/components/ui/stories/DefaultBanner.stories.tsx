import DefaultBanner from '../DefaultBanner';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const meta: Meta<typeof DefaultBanner> = {
  title: 'UI/DefaultBanner',
  component: DefaultBanner,
  decorators: [
    (Story) => <ThemeProvider><Story /></ThemeProvider>
  ],
};
export default meta;

type Story = StoryObj<typeof DefaultBanner>;

export const Default: Story = {
  args: {},
};
