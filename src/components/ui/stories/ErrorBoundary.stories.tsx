import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'UI/ErrorBoundary',
  component: ErrorBoundary,
};
export default meta;

type Story = StoryObj<typeof ErrorBoundary>;

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div>Child inside ErrorBoundary</div>
    </ErrorBoundary>
  ),
};
