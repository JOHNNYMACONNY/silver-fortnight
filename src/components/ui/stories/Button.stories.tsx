import { Button } from '../Button';
import type { Meta, StoryObj } from '@storybook/react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

// --- Variants ---
export const Primary: Story = {
  args: { children: 'Primary', variant: 'primary' },
};
export const Secondary: Story = {
  args: { children: 'Secondary', variant: 'secondary' },
};
export const Tertiary: Story = {
  args: { children: 'Tertiary', variant: 'tertiary' },
};
export const Outline: Story = {
  args: { children: 'Outline', variant: 'outline' },
};
export const Danger: Story = {
  args: { children: 'Danger', variant: 'danger' },
};
export const Success: Story = {
  args: { children: 'Success', variant: 'success' },
};
export const Ghost: Story = {
  args: { children: 'Ghost', variant: 'ghost' },
};

// --- Sizes ---
export const XSmall: Story = {
  args: { children: 'XS', size: 'xs' },
};
export const Small: Story = {
  args: { children: 'Small', size: 'sm' },
};
export const Medium: Story = {
  args: { children: 'Medium', size: 'md' },
};
export const Large: Story = {
  args: { children: 'Large', size: 'lg' },
};
export const XLarge: Story = {
  args: { children: 'XL', size: 'xl' },
};

// --- States ---
export const Loading: Story = {
  args: { children: 'Loading...', isLoading: true },
};
export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
};
export const FullWidth: Story = {
  args: { children: 'Full Width', fullWidth: true },
};
export const Rounded: Story = {
  args: { children: 'Rounded', rounded: true },
};

// --- Icons ---
export const LeftIcon: Story = {
  args: { children: 'Left Icon', leftIcon: <FaCheck /> },
};
export const RightIcon: Story = {
  args: { children: 'Right Icon', rightIcon: <FaTimes /> },
};

// Add more stories for edge cases or new variants as needed.
