import AnimatedComponent from '../AnimatedComponent';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof AnimatedComponent> = {
  title: 'UI/AnimatedComponent',
  component: AnimatedComponent,
};
export default meta;

type Story = StoryObj<typeof AnimatedComponent>;

export const Default: Story = {
  args: {
    children: 'Animated Content',
  },
};
