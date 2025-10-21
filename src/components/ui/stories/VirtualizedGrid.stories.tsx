import VirtualizedGrid from '../VirtualizedGrid';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta<typeof VirtualizedGrid> = {
  title: 'UI/VirtualizedGrid',
  component: VirtualizedGrid,
};
export default meta;

type Story = StoryObj<typeof VirtualizedGrid>;

export const Default: Story = {
  args: {
    items: [],
    itemHeight: 100,
    columnCount: 3,
    renderItem: () => <div>Item</div>,
  },
};
