# UX Components Usage Guide

**Version:** 1.0  
**Date:** January 2025  
**Status:** Reference Guide

This guide demonstrates how to use the new UX components that implement the five core UX principles.

---

## Table of Contents

1. [Typography Component System](#typography-component-system)
2. [Enhanced ProgressStepper](#enhanced-progressstepper)
3. [PageLayout Components](#pagelayout-components)
4. [Undo System Hook](#undo-system-hook)
5. [Complete Examples](#complete-examples)

---

## Typography Component System

### Basic Usage

```tsx
import { Typography, H1, H2, Body, Caption } from '@/components/ui/Typography';

// Using the main Typography component
<Typography variant="h1">Main Heading</Typography>
<Typography variant="body" color="muted">Body text</Typography>

// Using convenience components
<H1>Main Heading</H1>
<H2>Section Heading</H2>
<Body>Regular body text</Body>
<Caption color="muted">Small caption text</Caption>
```

### Variants

- `h1` - 36px, bold, tight leading
- `h2` - 30px, semibold, tight leading
- `h3` - 24px, semibold, snug leading
- `h4` - 20px, medium, snug leading
- `h5` - 18px, medium, normal leading
- `h6` - 16px, medium, normal leading
- `body-lg` - 18px, normal, relaxed leading
- `body` - 16px, normal, relaxed leading
- `body-sm` - 14px, normal, relaxed leading
- `caption` - 12px, normal, relaxed leading
- `label` - 14px, medium, normal leading

### Color Variants

- `default` - Neutral text (dark in light mode, light in dark mode)
- `muted` - Muted text for secondary information
- `primary` - Primary brand color
- `secondary` - Secondary brand color
- `success` - Success state color
- `warning` - Warning state color
- `error` - Error state color

### Examples

```tsx
// Page title with custom element
<Typography variant="h1" as="h2" className="mb-4">
  Page Title
</Typography>

// Body text with custom weight
<Typography variant="body" weight="semibold" color="primary">
  Important information
</Typography>

// Label with error color
<Typography variant="label" color="error">
  Required field
</Typography>
```

---

## Enhanced ProgressStepper

### Basic Usage

```tsx
import { ProgressStepper } from '@/components/ui/ProgressStepper';

const steps = [
  { label: 'Details', description: 'Enter trade details', completed: true },
  { label: 'Requirements', description: 'Set requirements', current: true },
  { label: 'Review', description: 'Review and confirm' },
  { label: 'Publish', description: 'Publish trade' },
];

<ProgressStepper
  steps={steps}
  currentStep={1}
  onStepClick={(index) => {
    console.log('Navigate to step:', index);
  }}
  showProgress={true}
  orientation="horizontal"
/>
```

### With Step Navigation

```tsx
const [currentStep, setCurrentStep] = useState(0);

const steps = [
  { label: 'Step 1', completed: currentStep > 0 },
  { label: 'Step 2', current: currentStep === 1 },
  { label: 'Step 3' },
];

<ProgressStepper
  steps={steps}
  currentStep={currentStep}
  onStepClick={(index) => {
    // Allow navigation to completed steps or next step
    if (index <= currentStep + 1) {
      setCurrentStep(index);
    }
  }}
  showProgress={true}
/>
```

### Vertical Orientation

```tsx
<ProgressStepper
  steps={steps}
  orientation="vertical"
  size="lg"
  showStepNumbers={true}
/>
```

### With Error State

```tsx
const steps = [
  { label: 'Step 1', completed: true },
  { label: 'Step 2', error: true, description: 'Validation failed' },
  { label: 'Step 3' },
];

<ProgressStepper steps={steps} />
```

---

## PageLayout Components

### Basic Page Structure

```tsx
import {
  PageLayout,
  PageHeader,
  PageTitle,
  PageDescription,
  PageActions,
  PageContent,
} from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';

function MyPage() {
  return (
    <PageLayout maxWidth="xl">
      <PageHeader>
        <PageTitle>Page Title</PageTitle>
        <PageDescription>
          This is a description of what this page does and what users can accomplish here.
        </PageDescription>
        <PageActions>
          <Button variant="default" size="lg">
            Primary Action
          </Button>
        </PageActions>
      </PageHeader>
      
      <PageContent>
        {/* Main page content */}
        <Card>
          <CardContent>Content goes here</CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
```

### With Sidebar

```tsx
import { PageLayoutWithSidebar } from '@/components/layout/PageLayout';

function MyPageWithSidebar() {
  return (
    <PageLayoutWithSidebar
      maxWidth="2xl"
      sidebarPosition="right"
      sidebarWidth="md"
      content={
        <PageContent>
          {/* Main content */}
        </PageContent>
      }
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Sidebar content */}
          </CardContent>
        </Card>
      }
    />
  );
}
```

### Custom Layout

```tsx
<PageLayout maxWidth="lg" containerized={true}>
  <PageHeader spacing="lg">
    <div className="flex items-center justify-between">
      <div>
        <PageTitle size="lg">Dashboard</PageTitle>
        <PageDescription>Your activity overview</PageDescription>
      </div>
      <PageActions align="right">
        <Button variant="outline">Export</Button>
        <Button variant="default">Create New</Button>
      </PageActions>
    </div>
  </PageHeader>
  
  <PageContent spacing="lg">
    {/* Content sections */}
  </PageContent>
</PageLayout>
```

---

## Undo System Hook

### Basic Usage

```tsx
import { useUndo } from '@/hooks/useUndo';
import { useToast } from '@/contexts/ToastContext';

function MyComponent() {
  const { execute, undo, canUndo, lastActionLabel } = useUndo({ timeout: 10000 });
  const { showToast } = useToast();

  const handleDelete = () => {
    execute({
      execute: () => {
        // Delete the item
        deleteItem(itemId);
      },
      undo: () => {
        // Restore the item
        restoreItem(itemId);
      },
      label: 'Delete item',
    });

    // Show toast with undo option
    showToast(
      'Item deleted',
      'success',
      canUndo ? { label: 'Undo', onClick: undo } : undefined
    );
  };

  return (
    <Button onClick={handleDelete}>
      Delete
    </Button>
  );
}
```

### With Auto Toast

```tsx
import { useUndoWithToast } from '@/hooks/useUndo';
import { useToast } from '@/contexts/ToastContext';

function MyComponent() {
  const { showToast } = useToast();
  const { executeWithToast } = useUndoWithToast({
    timeout: 10000,
    showToast,
  });

  const handleDelete = () => {
    executeWithToast({
      execute: () => deleteItem(itemId),
      undo: () => restoreItem(itemId),
      label: 'Delete item',
      successMessage: 'Item deleted successfully',
      undoLabel: 'Undo',
      toastType: 'success',
    });
  };

  return (
    <Button onClick={handleDelete}>
      Delete
    </Button>
  );
}
```

### Advanced Usage with History

```tsx
const { execute, undo, redo, canUndo, canRedo, clear, historyLength } = useUndo({
  timeout: 5000,
  maxHistory: 10,
  autoExecute: true,
});

// Execute multiple actions
execute({ execute: () => action1(), undo: () => undo1(), label: 'Action 1' });
execute({ execute: () => action2(), undo: () => undo2(), label: 'Action 2' });

// Undo last action
if (canUndo) {
  undo();
}

// Redo last undone action
if (canRedo) {
  redo();
}

// Clear all history
clear();
```

---

## Complete Examples

### Trade Creation Page with Progress

```tsx
import { useState } from 'react';
import {
  PageLayout,
  PageHeader,
  PageTitle,
  PageDescription,
  PageContent,
} from '@/components/layout/PageLayout';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { Typography } from '@/components/ui/Typography';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function CreateTradePage() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Details', description: 'Enter trade information' },
    { label: 'Requirements', description: 'Set skill requirements' },
    { label: 'Review', description: 'Review and confirm' },
    { label: 'Publish', description: 'Publish your trade' },
  ];

  const completedSteps = steps.slice(0, currentStep).map(step => ({
    ...step,
    completed: true,
  }));

  const currentStepData = {
    ...steps[currentStep],
    current: true,
  };

  const remainingSteps = steps.slice(currentStep + 1);

  const displaySteps = [
    ...completedSteps,
    currentStepData,
    ...remainingSteps,
  ];

  return (
    <PageLayout maxWidth="lg">
      <PageHeader>
        <PageTitle>Create New Trade</PageTitle>
        <PageDescription>
          Follow the steps below to create a new skill exchange trade.
        </PageDescription>
      </PageHeader>

      <PageContent>
        <Card>
          <CardContent className="p-6">
            <ProgressStepper
              steps={displaySteps}
              currentStep={currentStep}
              onStepClick={(index) => {
                // Allow navigation to completed steps or next step
                if (index <= currentStep + 1) {
                  setCurrentStep(index);
                }
              }}
              showProgress={true}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-6">
            <Typography variant="h3" className="mb-4">
              {steps[currentStep].label}
            </Typography>
            <Typography variant="body" color="muted" className="mb-6">
              {steps[currentStep].description}
            </Typography>

            {/* Step content here */}

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                  } else {
                    // Publish trade
                  }
                }}
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Publish'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
```

### Page with Undo Functionality

```tsx
import { useUndoWithToast } from '@/hooks/useUndo';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

function TradesListPage() {
  const { showToast } = useToast();
  const { executeWithToast, canUndo, undo } = useUndoWithToast({
    timeout: 10000,
    showToast,
  });

  const handleDeleteTrade = (tradeId: string) => {
    executeWithToast({
      execute: async () => {
        await deleteTrade(tradeId);
      },
      undo: async () => {
        await restoreTrade(tradeId);
      },
      label: 'Delete trade',
      successMessage: 'Trade deleted successfully',
      undoLabel: 'Undo',
      toastType: 'success',
    });
  };

  return (
    <PageLayout>
      <PageHeader>
        <PageTitle>My Trades</PageTitle>
      </PageHeader>

      <PageContent>
        {trades.map(trade => (
          <Card key={trade.id}>
            <CardHeader>
              <CardTitle>{trade.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => handleDeleteTrade(trade.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </PageContent>
    </PageLayout>
  );
}
```

---

## Best Practices

### Typography

1. **Use semantic HTML**: Let Typography choose the right element, or override with `as` prop
2. **Maintain hierarchy**: Use H1 for page titles, H2 for sections, H3 for subsections
3. **Consistent spacing**: Use the spacing system (4px base) for margins between typography elements

### ProgressStepper

1. **Clear labels**: Use descriptive step labels that users understand
2. **Show progress**: Always show progress percentage for multi-step flows
3. **Allow navigation**: Make completed steps clickable for better UX
4. **Handle errors**: Use error state to indicate validation failures

### PageLayout

1. **Above the fold**: Put primary actions and key information in PageHeader
2. **Consistent structure**: Use PageLayout on all pages for consistency
3. **Responsive design**: PageLayout handles responsive spacing automatically
4. **Sidebar usage**: Use sidebar for filters, navigation, or secondary content

### Undo System

1. **Reasonable timeout**: 5-10 seconds is usually enough for undo actions
2. **Clear labels**: Provide descriptive labels for better user experience
3. **Toast integration**: Always show toast notifications with undo option
4. **Error handling**: Handle errors in both execute and undo functions

---

## Related Documentation

- [UX Principles Implementation Plan](./UX_PRINCIPLES_IMPLEMENTATION_PLAN.md)
- [Design System Documentation](../archived/ui-design-docs/DESIGN_SYSTEM_DOCUMENTATION.md)
- [Layout System Architecture](./TRADEYA_LAYOUT_SYSTEM_ARCHITECTURE.md)

---

**Last Updated:** January 2025

