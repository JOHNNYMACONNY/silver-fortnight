import { Badge } from '../Badge';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Default Badge',
  },
};
