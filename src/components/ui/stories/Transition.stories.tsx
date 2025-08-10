import { Transition } from '../transitions/Transition';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta<typeof Transition> = {
  title: 'UI/Transitions/Transition',
  component: Transition,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Transition>;

export const Fade: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div>
        <button onClick={() => setShow((s) => !s)} style={{ marginBottom: 16 }}>
          Toggle
        </button>
        <Transition show={show} type="fade">
          <div style={{ width: 200, height: 80, background: '#cce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Fade Transition
          </div>
        </Transition>
      </div>
    );
  },
};

export const Slide: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div>
        <button onClick={() => setShow((s) => !s)} style={{ marginBottom: 16 }}>
          Toggle
        </button>
        <Transition show={show} type="slide">
          <div style={{ width: 200, height: 80, background: '#ecc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Slide Transition
          </div>
        </Transition>
      </div>
    );
  },
};

export const Zoom: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div>
        <button onClick={() => setShow((s) => !s)} style={{ marginBottom: 16 }}>
          Toggle
        </button>
        <Transition show={show} type="zoom">
          <div style={{ width: 200, height: 80, background: '#cec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Zoom Transition
          </div>
        </Transition>
      </div>
    );
  },
};

export const Bounce: Story = {
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div>
        <button onClick={() => setShow((s) => !s)} style={{ marginBottom: 16 }}>
          Toggle
        </button>
        <Transition show={show} type="bounce">
          <div style={{ width: 200, height: 80, background: '#ecc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Bounce Transition
          </div>
        </Transition>
      </div>
    );
  },
};
