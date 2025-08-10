import { TransitionGroup } from '../transitions/TransitionGroup';
import { Transition } from '../transitions/Transition';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta<typeof TransitionGroup> = {
  title: 'UI/Transitions/TransitionGroup',
  component: TransitionGroup,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TransitionGroup>;

export const Default: Story = {
  render: () => {
    const [items, setItems] = useState([1, 2, 3]);
    return (
      <div>
        <button onClick={() => setItems((prev) => prev.length ? prev.slice(0, -1) : [1, 2, 3])} style={{ marginBottom: 16 }}>
          {items.length ? 'Remove Last' : 'Reset'}
        </button>
        <TransitionGroup className="flex gap-4">
          {items.map((item) => (
            <Transition key={item} show type="fade">
              <div style={{ width: 60, height: 60, background: '#cce', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {item}
              </div>
            </Transition>
          ))}
        </TransitionGroup>
      </div>
    );
  },
};
