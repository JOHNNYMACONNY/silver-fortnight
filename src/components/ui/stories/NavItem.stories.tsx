import NavItem from '../NavItem';
import type { Meta, StoryObj } from '@storybook/react';
import { withMockAllProviders } from './providers';
import { withMemoryRouter } from './routerDecorator';

const meta: Meta<typeof NavItem> = {
  title: 'UI/NavItem',
  component: NavItem,
  decorators: [withMemoryRouter, withMockAllProviders],
};
export default meta;

type Story = StoryObj<typeof NavItem>;

export const Default: Story = {};
