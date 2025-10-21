import PerformanceMonitor from '../PerformanceMonitor';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import PerformanceProvider from '../../../contexts/PerformanceContext';

const meta: Meta<typeof PerformanceMonitor> = {
  title: 'UI/PerformanceMonitor',
  component: PerformanceMonitor,
  decorators: [
    (Story) => <PerformanceProvider><Story /></PerformanceProvider>
  ],
};
export default meta;

type Story = StoryObj<typeof PerformanceMonitor>;

export const Default: Story = {
  args: {},
};
