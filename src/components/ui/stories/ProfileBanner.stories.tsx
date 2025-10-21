import { ProfileBanner } from '../ProfileBanner';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ToastProvider } from '../../../contexts/ToastContext';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const meta: Meta<typeof ProfileBanner> = {
  title: 'UI/ProfileBanner',
  component: ProfileBanner,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </ThemeProvider>
    )
  ],
};
export default meta;

type Story = StoryObj<typeof ProfileBanner>;

export const Default: Story = {
  args: {
    bannerUrl: 'https://placehold.co/600x200',
    height: 'md',
  },
};
