import { Scale } from '../transitions/Scale';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta<typeof Scale> = {
  title: 'UI/Transitions/Scale',
  component: Scale,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Scale>;

export const Default: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div>
        <button onClick={() => setShow((s) => !s)} style={{ marginBottom: 16 }}>
          Toggle
        </button>
        <Scale show={show}>
          <div style={{ width: 200, height: 80, background: '#cec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Scaling Content
          </div>
        </Scale>
      </div>
    );
  },
};
