import { Avatar } from '../Avatar';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    src: 'https://placehold.co/64x64',
    alt: 'User Avatar',
  },
};
