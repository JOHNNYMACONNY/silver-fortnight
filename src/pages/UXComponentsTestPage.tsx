/**
 * UX Components Test Page
 * 
 * Test page to verify all new UX components are working correctly:
 * - Typography Component System
 * - Enhanced ProgressStepper
 * - PageLayout Components
 * - Undo System Hook
 */

import React, { useState } from 'react';
import {
  PageLayout,
  PageHeader,
  PageTitle,
  PageDescription,
  PageActions,
  PageContent,
} from '../components/layout/PageLayout';
import {
  Typography,
  H1,
  H2,
  H3,
  Body,
  Caption,
} from '../components/ui/Typography';
import { ProgressStepper } from '../components/ui/ProgressStepper';
import { useUndo } from '../hooks/useUndo';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useToast } from '../contexts/ToastContext';
import { Plus, ArrowRight, Save, Check, Search } from 'lucide-react';

export const UXComponentsTestPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [deletedItems, setDeletedItems] = useState<string[]>([]);
  const { showToast } = useToast();
  const { execute, undo, canUndo, lastActionLabel } = useUndo({ timeout: 10000 });

  // ProgressStepper test data
  const steps = [
    { 
      label: 'Details', 
      description: 'Enter trade information',
      completed: currentStep > 0,
    },
    { 
      label: 'Requirements', 
      description: 'Set skill requirements',
      current: currentStep === 1,
      completed: currentStep > 1,
    },
    { 
      label: 'Review', 
      description: 'Review and confirm',
      completed: currentStep > 2,
    },
    { 
      label: 'Publish', 
      description: 'Publish your trade',
      completed: currentStep > 3,
    },
  ];

  // Undo test
  const handleDelete = (itemId: string) => {
    execute({
      execute: () => {
        setDeletedItems(prev => [...prev, itemId]);
        showToast(`Item ${itemId} deleted`, 'success');
      },
      undo: () => {
        setDeletedItems(prev => prev.filter(id => id !== itemId));
        showToast(`Item ${itemId} restored`, 'success');
      },
      label: `Delete item ${itemId}`,
    });
  };

  return (
    <PageLayout maxWidth="xl">
      <PageHeader>
        <PageTitle>UX Components Test Page</PageTitle>
        <PageDescription>
          This page tests all the new UX components to ensure they work correctly.
        </PageDescription>
        <PageActions>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </PageActions>
      </PageHeader>

      <PageContent spacing="lg">
        {/* Typography Test */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Component System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <H1>Heading 1 (H1)</H1>
              <H2>Heading 2 (H2)</H2>
              <H3>Heading 3 (H3)</H3>
              <Typography variant="h4">Heading 4 (H4)</Typography>
              <Typography variant="h5">Heading 5 (H5)</Typography>
              <Typography variant="h6">Heading 6 (H6)</Typography>
            </div>
            
            <div className="space-y-2">
              <Body>Regular body text - This is the default body text style.</Body>
              <Body color="muted">Muted body text - Used for secondary information.</Body>
              <Typography variant="body-lg">Large body text - For emphasis.</Typography>
              <Typography variant="body-sm">Small body text - For less important content.</Typography>
              <Caption>Caption text - For labels and small print.</Caption>
            </div>

            <div className="space-y-2">
              <Typography variant="body" color="primary">Primary colored text</Typography>
              <Typography variant="body" color="secondary">Secondary colored text</Typography>
              <Typography variant="body" color="success">Success colored text</Typography>
              <Typography variant="body" color="warning">Warning colored text</Typography>
              <Typography variant="body" color="error">Error colored text</Typography>
            </div>
          </CardContent>
        </Card>

        {/* ProgressStepper Test */}
        <Card>
          <CardHeader>
            <CardTitle>ProgressStepper Component</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Typography variant="h4" className="mb-4">Horizontal Stepper</Typography>
              <ProgressStepper
                steps={steps}
                currentStep={currentStep}
                onStepClick={(index) => {
                  if (index <= currentStep + 1) {
                    setCurrentStep(index);
                  }
                }}
                showProgress={true}
                orientation="horizontal"
              />
            </div>

            <div className="flex gap-4">
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
                    setCurrentStep(0);
                  }
                }}
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Reset'}
              </Button>
            </div>

            <div>
              <Typography variant="h4" className="mb-4">Vertical Stepper</Typography>
              <ProgressStepper
                steps={steps.slice(0, 3)}
                currentStep={Math.min(currentStep, 2)}
                showProgress={true}
                orientation="vertical"
                size="lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Undo System Test */}
        <Card>
          <CardHeader>
            <CardTitle>Undo System Hook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Typography variant="body" color="muted">
              Test the undo functionality by deleting items below. You can undo the deletion within 10 seconds.
            </Typography>

            <div className="flex gap-2 flex-wrap">
              {['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'].map(item => (
                <Button
                  key={item}
                  variant={deletedItems.includes(item) ? 'outline' : 'destructive'}
                  onClick={() => {
                    if (deletedItems.includes(item)) {
                      // Restore
                      setDeletedItems(prev => prev.filter(id => id !== item));
                      showToast(`${item} restored`, 'success');
                    } else {
                      handleDelete(item);
                    }
                  }}
                >
                  {deletedItems.includes(item) ? `Restore ${item}` : `Delete ${item}`}
                </Button>
              ))}
            </div>

            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <Typography variant="body-sm" className="mb-2">
                <strong>Undo Status:</strong>
              </Typography>
              <Typography variant="body-sm" color="muted">
                Can Undo: {canUndo ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body-sm" color="muted">
                Last Action: {lastActionLabel || 'None'}
              </Typography>
              {canUndo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  className="mt-2"
                >
                  Undo Last Action
                </Button>
              )}
            </div>

            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <Typography variant="body-sm" className="mb-2">
                <strong>Deleted Items:</strong>
              </Typography>
              {deletedItems.length > 0 ? (
                <ul className="list-disc list-inside">
                  {deletedItems.map(item => (
                    <li key={item} className="text-sm text-neutral-600 dark:text-neutral-400">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body-sm" color="muted">
                  No items deleted
                </Typography>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Button Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Button Component Showcase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Standard Variants */}
            <div>
              <Typography variant="h4" className="mb-4">Standard Variants</Typography>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Custom Variants */}
            <div>
              <Typography variant="h4" className="mb-4">Custom Variants</Typography>
              <div className="flex flex-wrap gap-3">
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="glassmorphic">Glassmorphic</Button>
                <Button variant="premium">Premium</Button>
                <Button variant="premium-outline">Premium Outline</Button>
                <Button variant="interactive">Interactive</Button>
                <Button variant="interactive-outline">Interactive Outline</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <Typography variant="h4" className="mb-4">Sizes</Typography>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
                <Button size="icon"><Search size={16} /></Button>
              </div>
            </div>

            {/* States */}
            <div>
              <Typography variant="h4" className="mb-4">States</Typography>
              <div className="flex flex-wrap gap-3">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button isLoading>Loading</Button>
                <Button showSuccess>Success</Button>
                <Button showError>Error</Button>
              </div>
            </div>

            {/* With Icons */}
            <div>
              <Typography variant="h4" className="mb-4">With Icons</Typography>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<Plus size={16} />}>Add Item</Button>
                <Button rightIcon={<ArrowRight size={16} />}>Continue</Button>
                <Button leftIcon={<Save size={16} />} rightIcon={<Check size={16} />}>Save & Continue</Button>
              </div>
            </div>

            {/* Full Width */}
            <div>
              <Typography variant="h4" className="mb-4">Full Width</Typography>
              <div className="space-y-2">
                <Button fullWidth>Full Width Button</Button>
                <Button fullWidth variant="outline">Full Width Outline</Button>
              </div>
            </div>

            {/* Usage Examples */}
            <div>
              <Typography variant="h4" className="mb-4">Usage Examples</Typography>
              <div className="space-y-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <Typography variant="body-sm" className="mb-2">
                  <strong>Primary Action:</strong> Use <code className="text-primary">variant="default"</code> or <code className="text-primary">variant="premium"</code> for main actions
                </Typography>
                <div className="flex gap-2">
                  <Button variant="default">Save Changes</Button>
                  <Button variant="premium">Upgrade Now</Button>
                </div>

                <Typography variant="body-sm" className="mb-2 mt-4">
                  <strong>Secondary Action:</strong> Use <code className="text-primary">variant="outline"</code> or <code className="text-primary">variant="ghost"</code> for secondary actions
                </Typography>
                <div className="flex gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="ghost">Skip</Button>
                </div>

                <Typography variant="body-sm" className="mb-2 mt-4">
                  <strong>Destructive Action:</strong> Use <code className="text-primary">variant="destructive"</code> for dangerous actions
                </Typography>
                <div className="flex gap-2">
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PageLayout Test */}
        <Card>
          <CardHeader>
            <CardTitle>PageLayout Components</CardTitle>
          </CardHeader>
          <CardContent>
            <Typography variant="body" color="muted">
              This entire page is using the PageLayout components. The structure includes:
            </Typography>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li className="text-sm">PageLayout - Main container with max-width</li>
              <li className="text-sm">PageHeader - Contains title, description, and actions</li>
              <li className="text-sm">PageTitle - Large, prominent page title</li>
              <li className="text-sm">PageDescription - Secondary descriptive text</li>
              <li className="text-sm">PageActions - Container for action buttons</li>
              <li className="text-sm">PageContent - Main content area with consistent spacing</li>
            </ul>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
};

