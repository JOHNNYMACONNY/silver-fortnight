import BentoGrid from '../BentoGrid';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof BentoGrid> = {
  title: 'UI/BentoGrid',
  component: BentoGrid,
};
export default meta;

type Story = StoryObj<typeof BentoGrid>;

export const Default: Story = {
  args: {
    children: [
      <div key="1">Item 1</div>,
      <div key="2">Item 2</div>,
      <div key="3">Item 3</div>,
    ],
  },
};
