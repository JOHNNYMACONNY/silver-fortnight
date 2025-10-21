import { ProfileImage } from '../ProfileImage';
import type { Meta, StoryObj } from '@storybook/react';
import { withMockAllProviders } from './providers';

const meta: Meta<typeof ProfileImage> = {
  title: 'UI/ProfileImage',
  component: ProfileImage,
  decorators: [withMockAllProviders],
};
export default meta;

type Story = StoryObj<typeof ProfileImage>;

export const Default: Story = {
  args: {
    photoURL: 'https://placehold.co/64x64',
    displayName: 'User Avatar',
  },
};
