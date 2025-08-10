import LazyImage from '../LazyImage';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LazyImage> = {
  title: 'UI/LazyImage',
  component: LazyImage,
};
export default meta;

type Story = StoryObj<typeof LazyImage>;

export const Default: Story = {
  args: {
    src: 'https://placehold.co/300x200',
    alt: 'Lazy loaded image',
  },
};
