import { Fade } from '../transitions/Fade';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta<typeof Fade> = {
  title: 'UI/Transitions/Fade',
  component: Fade,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Fade>;

export const Default: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div>
        <button onClick={() => setShow((s) => !s)} style={{ marginBottom: 16 }}>
          Toggle
        </button>
        <Fade show={show}>
          <div style={{ width: 200, height: 80, background: '#cce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Fading Content
          </div>
        </Fade>
      </div>
    );
  },
};
