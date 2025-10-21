import Logo from '../Logo';
import type { Meta, StoryObj } from '@storybook/react';
import { withThemeProvider } from './providers';
import { withMemoryRouter } from './routerDecorator';

const meta: Meta<typeof Logo> = {
  title: 'UI/Logo',
  component: Logo,
  decorators: [withMemoryRouter, withThemeProvider],
};
export default meta;

type Story = StoryObj<typeof Logo>;

export const Default: Story = {};
