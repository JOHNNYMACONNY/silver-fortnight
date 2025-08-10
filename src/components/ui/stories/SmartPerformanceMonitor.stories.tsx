import SmartPerformanceMonitor from '../SmartPerformanceMonitor';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import PerformanceProvider from '../../../contexts/PerformanceContext';
import { SmartPerformanceProvider } from '../../../contexts/SmartPerformanceContext';

const meta: Meta<typeof SmartPerformanceMonitor> = {
  title: 'UI/SmartPerformanceMonitor',
  component: SmartPerformanceMonitor,
  decorators: [
    (Story) => (
      <PerformanceProvider>
        <SmartPerformanceProvider>
          <Story />
        </SmartPerformanceProvider>
      </PerformanceProvider>
    )
  ],
};
export default meta;

type Story = StoryObj<typeof SmartPerformanceMonitor>;

export const Default: Story = {
  args: {},
};
