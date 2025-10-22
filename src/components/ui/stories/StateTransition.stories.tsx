import StateTransition from '../StateTransition';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StateTransition> = {
  title: 'UI/StateTransition',
  component: StateTransition,
};
export default meta;

type Story = StoryObj<typeof StateTransition>;

export const Default: Story = {};
