import BannerSelector from '../BannerSelector';
import type { Meta, StoryObj } from '@storybook/react';
import { withThemeProvider } from './providers';
import { withMemoryRouter } from './routerDecorator';

const meta: Meta<typeof BannerSelector> = {
  title: 'UI/BannerSelector',
  component: BannerSelector,
  decorators: [withMemoryRouter, withThemeProvider],
};
export default meta;

type Story = StoryObj<typeof BannerSelector>;

export const Default: Story = {
  args: {
    onSelect: () => {},
  },
};
