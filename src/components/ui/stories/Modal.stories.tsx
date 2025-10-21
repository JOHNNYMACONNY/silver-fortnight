import { ModalComponent } from '../Modal';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ModalComponent> = {
  title: 'UI/Modal',
  component: ModalComponent,
};
export default meta;

type Story = StoryObj<typeof ModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: 'This is a modal',
    title: 'Default Modal',
  },
};

export const WithFooter: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: 'Modal with footer',
    title: 'Modal Title',
    footer: <div>Footer Content</div>,
  },
};

export const NoTitle: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: 'No title here',
  },
};

export const Small: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: 'Small modal',
    size: 'sm',
    title: 'Small Modal',
  },
};
export const Large: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: 'Large modal',
    size: 'lg',
    title: 'Large Modal',
  },
};
export const Full: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: 'Full size modal',
    size: 'full',
    title: 'Full Modal',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    children: 'This modal is closed',
    title: 'Closed Modal',
  },
};
// Add more stories for edge cases or new variants as needed.
