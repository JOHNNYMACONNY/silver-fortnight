import AppPreloader from '../AppPreloader';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof AppPreloader> = {
  title: 'UI/AppPreloader',
  component: AppPreloader,
};
export default meta;

type Story = StoryObj<typeof AppPreloader>;

export const Default: Story = {
  args: {},
};
