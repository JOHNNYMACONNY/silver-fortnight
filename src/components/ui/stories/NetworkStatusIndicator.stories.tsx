import NetworkStatusIndicator from '../NetworkStatusIndicator';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NetworkStatusIndicator> = {
  title: 'UI/NetworkStatusIndicator',
  component: NetworkStatusIndicator,
};
export default meta;

type Story = StoryObj<typeof NetworkStatusIndicator>;

export const Default: Story = {};
