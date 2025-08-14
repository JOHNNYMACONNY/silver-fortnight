import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/ui/Button';

const PageSurfaceExample: React.FC<{ withActions?: boolean }> = ({ withActions = false }) => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Glassmorphic page header */}
      <div className="glassmorphic rounded-xl px-4 py-5 md:px-6 md:py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Page Title</h1>
          <p className="mt-1 text-sm text-muted-foreground">Optional subtitle that explains this page.</p>
        </div>
        {withActions && (
          <div className="flex items-center gap-3">
            <Button variant="secondary">Secondary</Button>
            <Button variant="primary">Primary</Button>
          </div>
        )}
      </div>

      {/* Glassmorphic panel (e.g., search/filters) */}
      <div className="glassmorphic rounded-xl p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Search</label>
            <input className="w-full rounded-md border border-input px-3 py-2 bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Filter</label>
            <select className="w-full rounded-md border border-input px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option>All</option>
              <option>Open</option>
              <option>Closed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof PageSurfaceExample> = {
  title: 'Design System/Page Surfaces',
  component: PageSurfaceExample,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof PageSurfaceExample>;

export const Default: Story = {
  args: { withActions: false },
};

export const WithActions: Story = {
  args: { withActions: true },
};


