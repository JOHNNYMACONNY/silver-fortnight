import JohnRobertsProfileImage from '../JohnRobertsProfileImage';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof JohnRobertsProfileImage> = {
  title: 'UI/JohnRobertsProfileImage',
  component: JohnRobertsProfileImage,
};
export default meta;

type Story = StoryObj<typeof JohnRobertsProfileImage>;

export const Default: Story = {
  args: {},
};
