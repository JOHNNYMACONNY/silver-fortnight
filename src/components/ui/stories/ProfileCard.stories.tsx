import ProfileCard from '../ProfileCard';
import type { Meta, StoryObj } from '@storybook/react';
import { withMockAllProviders } from './providers';
import { withMemoryRouter } from './routerDecorator';

const meta: Meta<typeof ProfileCard> = {
  title: 'UI/ProfileCard',
  component: ProfileCard,
  decorators: [withMemoryRouter, withMockAllProviders],
};
export default meta;

type Story = StoryObj<typeof ProfileCard>;

export const Default: Story = {};
