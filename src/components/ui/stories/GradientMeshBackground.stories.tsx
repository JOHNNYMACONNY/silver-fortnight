import GradientMeshBackground from '../GradientMeshBackground';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GradientMeshBackground> = {
  title: 'UI/GradientMeshBackground',
  component: GradientMeshBackground,
};
export default meta;

type Story = StoryObj<typeof GradientMeshBackground>;

export const Default: Story = {
  args: {},
};
