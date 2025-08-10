import { Card } from '../Card';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: 'Default Card Content',
  },
};
