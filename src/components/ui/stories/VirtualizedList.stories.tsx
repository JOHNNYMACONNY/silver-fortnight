import { VirtualizedList } from '../VirtualizedList';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VirtualizedList> = {
  title: 'UI/VirtualizedList',
  component: VirtualizedList,
};
export default meta;

type Story = StoryObj<typeof VirtualizedList>;

export const Default: Story = {
  args: {
    items: [],
    renderItem: (item, index, style) => <div style={style}>Item</div>,
    getItemSize: () => 50,
    estimatedItemSize: 50,
    width: 300,
  },
};
