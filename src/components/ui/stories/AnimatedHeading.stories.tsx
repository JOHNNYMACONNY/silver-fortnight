import AnimatedHeading from '../AnimatedHeading';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof AnimatedHeading> = {
  title: 'UI/AnimatedHeading',
  component: AnimatedHeading,
};
export default meta;

type Story = StoryObj<typeof AnimatedHeading>;

export const Default: Story = {
  args: {
    children: 'Animated Heading',
  },
};
