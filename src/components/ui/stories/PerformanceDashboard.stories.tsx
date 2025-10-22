import PerformanceDashboard from '../PerformanceDashboard';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PerformanceDashboard> = {
  title: 'UI/PerformanceDashboard',
  component: PerformanceDashboard,
};
export default meta;

type Story = StoryObj<typeof PerformanceDashboard>;

export const Default: Story = {};
