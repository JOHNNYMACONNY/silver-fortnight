import Card3D from '../Card3D';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Card3D> = {
  title: 'UI/Card3D',
  component: Card3D,
};
export default meta;

type Story = StoryObj<typeof Card3D>;

export const Default: Story = {
  args: {
    children: '3D Card Content',
  },
};
