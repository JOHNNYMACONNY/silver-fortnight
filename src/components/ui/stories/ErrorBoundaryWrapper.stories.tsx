import React from 'react';
import { ErrorBoundaryWrapper } from '../ErrorBoundaryWrapper';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ErrorBoundaryWrapper> = {
  title: 'UI/ErrorBoundaryWrapper',
  component: ErrorBoundaryWrapper,
};
export default meta;

type Story = StoryObj<typeof ErrorBoundaryWrapper>;

export const Default: Story = {
  render: () => (
    <ErrorBoundaryWrapper>
      <div>Child inside ErrorBoundaryWrapper</div>
    </ErrorBoundaryWrapper>
  ),
};
