import PageTransition from '../PageTransition';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PageTransition> = {
  title: 'UI/PageTransition',
  component: PageTransition,
};
export default meta;

type Story = StoryObj<typeof PageTransition>;

export const Default: Story = {};
