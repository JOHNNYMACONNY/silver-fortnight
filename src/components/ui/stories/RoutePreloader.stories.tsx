import RoutePreloader from '../RoutePreloader';
import type { Meta, StoryObj } from '@storybook/react';
import { withThemeProvider } from './providers';
import { withMemoryRouter } from './routerDecorator';

const meta: Meta<typeof RoutePreloader> = {
  title: 'UI/RoutePreloader',
  component: RoutePreloader,
  decorators: [withMemoryRouter, withThemeProvider],
};
export default meta;

type Story = StoryObj<typeof RoutePreloader>;

export const Default: Story = {};
