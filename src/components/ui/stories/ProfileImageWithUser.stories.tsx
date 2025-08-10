import ProfileImageWithUser from '../ProfileImageWithUser';
import type { Meta, StoryObj } from '@storybook/react';
import { withMockAllProviders } from './providers';
import { withMemoryRouter } from './routerDecorator';

const meta: Meta<typeof ProfileImageWithUser> = {
  title: 'UI/ProfileImageWithUser',
  component: ProfileImageWithUser,
  decorators: [withMemoryRouter, withMockAllProviders],
};
export default meta;

type Story = StoryObj<typeof ProfileImageWithUser>;

export const Default: Story = {
  args: {
    // NOTE: For Storybook, use a real userId from your Firestore or mock the user data/provider.
    userId: 'storybook-user-uid',
  },
};
