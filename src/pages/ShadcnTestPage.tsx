/**
 * Shadcn Migration Test Page
 * 
 * This page demonstrates the migrated Button component (now using Shadcn-based implementation).
 * The Button component has been successfully migrated to production.
 * Access at: /shadcn-test
 * 
 * Status: Production - Uses migrated Button component from src/components/ui/Button.tsx
 * Note: This page serves as a visual reference for all Button variants and states.
 */

import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export const ShadcnTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Shadcn Migration Test
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Testing Shadcn UI patterns with TradeYa design system
          </p>
        </div>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Shadcn Standard Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>TradeYa Custom Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="glassmorphic">Glassmorphic</Button>
              <Button variant="premium">Premium</Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Additional TradeYa Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Glass Toggle (with active state)</p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="glass-toggle">Glass Toggle</Button>
                  <Button variant="glass-toggle" data-active="true">Active</Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Premium Variants</p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="premium-outline">Premium Outline</Button>
                  <Button variant="premium-light">Premium Light</Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Interactive Variants</p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="interactive">Interactive</Button>
                  <Button variant="interactive-outline">Interactive Outline</Button>
                  <Button variant="interactive-light">Interactive Light</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Alias Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary (alias)</Button>
              <Button variant="brand">Brand (alias)</Button>
              <Button variant="accent">Accent (alias)</Button>
              <Button variant="danger">Danger (alias)</Button>
              <Button variant="tertiary">Tertiary (alias)</Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Sizes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>States</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
              <Button isLoading>Loading</Button>
              <Button fullWidth>Full Width</Button>
              <Button rounded>Rounded</Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Dark Mode Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Toggle dark mode to verify all variants work correctly in both themes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="glassmorphic">Glassmorphic</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Checklist:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>All variants render correctly</li>
                <li>TradeYa custom variants work (glassmorphic, premium)</li>
                <li>Dark mode works for all variants</li>
                <li>Accessibility maintained (keyboard, ARIA)</li>
                <li>Styling matches TradeYa design system</li>
                <li>No console errors</li>
                <li>Mobile responsive (test on mobile viewport)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShadcnTestPage;

