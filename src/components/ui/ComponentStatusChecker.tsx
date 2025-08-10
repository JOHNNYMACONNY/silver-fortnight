import React, { useState } from 'react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import Logo from './Logo';
import { UserMenu } from './UserMenu';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import ErrorBoundary from './ErrorBoundary';

interface ComponentStatusCheckerProps {
  className?: string;
}

export const ComponentStatusChecker: React.FC<ComponentStatusCheckerProps> = ({ className = '' }) => {
  const [showModal, setShowModal] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const testComponent = (name: string, test: () => boolean) => {
    try {
      const result = test();
      setTestResults(prev => ({ ...prev, [name]: result }));
      return result;
    } catch (error) {
      console.error(`Error testing ${name}:`, error);
      setTestResults(prev => ({ ...prev, [name]: false }));
      return false;
    }
  };

  const runAllTests = () => {
    const tests = {
      'Button': () => typeof Button === 'function',
      'Card': () => typeof Card === 'function' && typeof CardHeader === 'function' && typeof CardTitle === 'function' && typeof CardContent === 'function' && typeof CardFooter === 'function',
      'Modal': () => typeof Modal === 'function',
      'Badge': () => typeof Badge === 'function',
      'Avatar': () => typeof Avatar === 'function',
      'Logo': () => typeof Logo === 'function',
      'UserMenu': () => typeof UserMenu === 'function',
      'NotificationBell': () => typeof NotificationBell === 'function',
      'ThemeToggle': () => typeof ThemeToggle === 'function',
      'ErrorBoundary': () => typeof ErrorBoundary === 'function',
    };

    Object.entries(tests).forEach(([name, test]) => {
      testComponent(name, test);
    });
  };

  React.useEffect(() => {
    runAllTests();
  }, []);

  const allPassed = Object.values(testResults).every(Boolean);
  const testsCompleted = Object.keys(testResults).length > 0;

  return (
    <ErrorBoundary>
      <Card className={`p-6 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Logo size="small" showText={false} />
            UI Component Status
            <Badge variant={allPassed ? 'default' : 'destructive'}>
              {allPassed ? 'All Good' : 'Issues Detected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Component Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(testResults).map(([component, passed]) => (
              <div
                key={component}
                className={`p-3 rounded-md border ${
                  passed
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      passed ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-medium">{component}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Component Tests */}
          <div className="space-y-3">
            <h4 className="font-medium">Interactive Tests</h4>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm">
                Default Button
              </Button>
              <Button variant="outline" size="sm">
                Outline Button
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(true)}>
                Open Modal
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Avatar
                src="https://ui-avatars.com/api/?name=Test+User&background=orange&color=white"
                alt="Test User"
                size="sm"
              />
              <Badge variant="secondary">Test Badge</Badge>
              <ThemeToggle />
            </div>
          </div>

          {/* Status Summary */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {testsCompleted ? 'Tests completed' : 'Running tests...'}
              </span>
              <Button variant="outline" size="sm" onClick={runAllTests}>
                Rerun Tests
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Modal Test"
        size="sm"
      >
        <p>This modal is working correctly!</p>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </ErrorBoundary>
  );
};

export default ComponentStatusChecker; 