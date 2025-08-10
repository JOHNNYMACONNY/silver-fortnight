import ReputationBadge from '../ReputationBadge';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ReputationBadge> = {
  title: 'UI/ReputationBadge',
  component: ReputationBadge,
};
export default meta;

type Story = StoryObj<typeof ReputationBadge>;

export const Default: Story = {};
