import React, { useState } from 'react';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { themeClasses } from '../utils/themeUtils';

/**
 * Asymmetric Layout Test Page
 * 
 * Comprehensive test page to verify the asymmetric layout system
 * with debugging information and multiple layout patterns.
 */
const AsymmetricLayoutTestPage: React.FC = () => {
  const [layoutPattern, setLayoutPattern] = useState<'alternating' | 'progressive' | 'none'>('alternating');
  const [showDebug, setShowDebug] = useState(false);

  const layoutPatterns = [
    { key: 'alternating', label: 'Alternating', description: 'Small-Large, Large-Small pattern' },
    { key: 'progressive', label: 'Progressive', description: '2x Small-Large, then 2x Large-Small' },
    { key: 'none', label: 'Static', description: 'All rows Small-Large' },
  ];

  return (
    <div className="p-4 md:p-8 bg-bg-secondary min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={themeClasses.heading1 + " mb-4"}>
            Asymmetric Layout System Test
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Test the asymmetric layout system with different visual rhythm patterns.
            Each pattern creates different arrangements of small and large items.
          </p>

          {/* Layout Pattern Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            {layoutPatterns.map((pattern) => (
              <Button
                key={pattern.key}
                variant={layoutPattern === pattern.key ? 'default' : 'outline'}
                onClick={() => setLayoutPattern(pattern.key as any)}
                className="flex flex-col items-start p-4 h-auto"
              >
                <span className="font-semibold">{pattern.label}</span>
                <span className="text-xs opacity-75">{pattern.description}</span>
              </Button>
            ))}
          </div>

          {/* Debug Toggle */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </Button>
            
            {showDebug && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Current Pattern:</strong> {layoutPattern} | 
                <strong> Expected:</strong> {layoutPattern === 'alternating' ? 'S-L, L-S, S-L, L-S' : 
                                          layoutPattern === 'progressive' ? 'S-L, S-L, L-S, L-S' : 
                                          'S-L, S-L, S-L, S-L'}
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        {showDebug && (
          <Card variant="glass" className="mb-6 p-4">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <div className="text-sm space-y-1">
              <div><strong>Layout Pattern:</strong> {layoutPattern}</div>
              <div><strong>Visual Rhythm:</strong> {layoutPattern}</div>
              <div><strong>Content Aware:</strong> true</div>
              <div><strong>Gap:</strong> lg</div>
              <div><strong>Total Items:</strong> 8</div>
              <div><strong>Expected Rows:</strong> 4</div>
            </div>
          </Card>
        )}

        {/* Asymmetric Grid */}
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
          <strong>Debug Info:</strong> Layout Pattern: {layoutPattern} | Expected: {layoutPattern === 'alternating' ? 'S-L, L-S, S-L, L-S' : 
                                          layoutPattern === 'progressive' ? 'S-L, S-L, L-S, L-S' : 
                                          'S-L, S-L, S-L, S-L'}
        </div>
        
        <BentoGrid
          layoutPattern="asymmetric"
          visualRhythm={layoutPattern}
          contentAwareLayout={true}
          className="mb-12"
          gap="lg"
        >
          {/* Row 1 */}
          <BentoItem
            asymmetricSize="small"
            contentType="feature"
            layoutRole="simple"
          >
            <Card variant="glass" className="h-full flex flex-col p-6 border-2 border-primary">
              <div className="flex items-center justify-between mb-2">
                <h2 className={themeClasses.heading4}>Quick Stats</h2>
                <Badge variant="outline" className="bg-primary text-primary-foreground">Small (1/3)</Badge>
              </div>
              <p className={themeClasses.body + ' mt-2 flex-grow'}>
                This is a small item (1/3 width) in the first row. It should be narrower than the large item.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Row 1, Item 1 - Should be 1/3 width
              </div>
            </Card>
          </BentoItem>

          <BentoItem
            asymmetricSize="large"
            contentType="mixed"
            layoutRole="complex"
          >
            <Card variant="glass" className="h-full flex flex-col p-6 border-2 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h2 className={themeClasses.heading4}>Featured Content</h2>
                <Badge variant="outline" className="bg-blue-500 text-white">Large (2/3)</Badge>
              </div>
              <p className={themeClasses.body + ' mt-2 flex-grow'}>
                This is a large item (2/3 width) in the first row. It should be wider than the small item.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Row 1, Item 2 - Should be 2/3 width
              </div>
            </Card>
          </BentoItem>

          {/* Row 2 */}
          <BentoItem
            asymmetricSize="large"
            contentType="stats"
            layoutRole="complex"
          >
            <Card variant="glass" className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className={themeClasses.heading4}>Statistics Panel</h2>
                <Badge variant="outline">Large</Badge>
              </div>
              <div className="flex-grow flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1,247</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Row 2, Item 1
              </div>
            </Card>
          </BentoItem>

          <BentoItem
            asymmetricSize="small"
            contentType="feature"
            layoutRole="simple"
          >
            <Card variant="glass" className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className={themeClasses.heading4}>Quick Info</h2>
                <Badge variant="outline">Small</Badge>
              </div>
              <p className={themeClasses.body + ' mt-2 flex-grow'}>
                This is a small item (1/3 width) in the second row.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Row 2, Item 2
              </div>
            </Card>
          </BentoItem>

          {/* Row 3 */}
          <BentoItem
            asymmetricSize="small"
            contentType="stats"
            layoutRole="simple"
          >
            <Card variant="glass" className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className={themeClasses.heading4}>Metrics</h2>
                <Badge variant="outline">Small</Badge>
              </div>
              <div className="flex-grow flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">89%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Row 3, Item 1
              </div>
            </Card>
          </BentoItem>

          <BentoItem
            asymmetricSize="large"
            contentType="mixed"
            layoutRole="complex"
          >
            <Card variant="glass" className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className={themeClasses.heading4}>Activity Feed</h2>
                <Badge variant="outline">Large</Badge>
              </div>
              <div className="space-y-3 mt-4 flex-grow">
                <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">New trade created</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Collaboration joined</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Challenge completed</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Row 3, Item 2
              </div>
            </Card>
          </BentoItem>

          {/* Row 4 */}
          <BentoItem
            asymmetricSize="large"
            contentType="mixed"
            layoutRole="complex"
          >
            <Card variant="glass" className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className={themeClasses.heading4}>Recent Trades</h2>
                <Badge variant="outline">Large</Badge>
              </div>
              <div className="space-y-3 mt-4 flex-grow">
                <div className="p-3 bg-white/10 rounded-lg">
                  <div className="font-medium">Web Development</div>
                  <div className="text-sm text-gray-600">Looking for React developer</div>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <div className="font-medium">UI/UX Design</div>
                  <div className="text-sm text-gray-600">Need design system expert</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Row 4, Item 1
              </div>
            </Card>
          </BentoItem>

          <BentoItem
            asymmetricSize="small"
            contentType="feature"
            layoutRole="simple"
          >
            <Card variant="glass" className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className={themeClasses.heading4}>Summary</h2>
                <Badge variant="outline">Small</Badge>
              </div>
              <p className={themeClasses.body + ' mt-2 flex-grow'}>
                This is a small item (1/3 width) in the fourth row.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Row 4, Item 2
              </div>
            </Card>
          </BentoItem>
        </BentoGrid>

        {/* Layout Pattern Explanation */}
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold mb-4">Layout Pattern Explanation</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Alternating:</strong> Each row alternates between Small-Large and Large-Small arrangements.
            </div>
            <div>
              <strong>Progressive:</strong> First two rows are Small-Large, then two rows are Large-Small.
            </div>
            <div>
              <strong>Static:</strong> All rows follow the same Small-Large pattern.
            </div>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <strong>Note:</strong> The asymmetric layout system automatically arranges items into rows of 2,
              applying the visual rhythm pattern to create the desired arrangement.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AsymmetricLayoutTestPage; 