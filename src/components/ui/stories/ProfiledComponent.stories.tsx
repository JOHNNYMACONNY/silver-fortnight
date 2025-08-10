import ProfiledComponent from '../ProfiledComponent';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ProfiledComponent> = {
  title: 'UI/ProfiledComponent',
  component: ProfiledComponent,
};
export default meta;

type Story = StoryObj<typeof ProfiledComponent>;

export const Default: Story = {};
