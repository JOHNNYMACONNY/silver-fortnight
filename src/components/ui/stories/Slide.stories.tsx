import { Slide } from '../transitions/Slide';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta<typeof Slide> = {
  title: 'UI/Transitions/Slide',
  component: Slide,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Slide>;

export const Default: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div>
        <button onClick={() => setShow((s) => !s)} style={{ marginBottom: 16 }}>
          Toggle
        </button>
        <Slide show={show} direction="right">
          <div style={{ width: 200, height: 80, background: '#ecc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Sliding Content
          </div>
        </Slide>
      </div>
    );
  },
};

export const Directions: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    const directions = ['left', 'right', 'up', 'down'] as const;
    return (
      <div>
        <button onClick={() => setShow((s) => !s)} style={{ marginBottom: 16 }}>
          Toggle All
        </button>
        <div style={{ display: 'flex', gap: 16 }}>
          {directions.map((dir) => (
            <Slide key={dir} show={show} direction={dir}>
              <div style={{ width: 120, height: 60, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {dir}
              </div>
            </Slide>
          ))}
        </div>
      </div>
    );
  },
};
