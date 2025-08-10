import React from 'react';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

/**
 * BentoGrid Demo Page
 * 
 * Demonstrates the enhanced BentoGrid features from Phase 3:
 * - Container queries
 * - AutoFit grids
 * - Masonry layouts
 * - Content-aware layouts
 */
const BentoGridDemoPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          BentoGrid Phase 3 Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Showcasing advanced layout features: Container Queries, AutoFit, and Masonry layouts
        </p>
      </div>

      {/* Demo 1: Traditional Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Traditional Responsive Grid
        </h2>
        <BentoGrid 
          layoutPattern="symmetric"
          columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
          gap="lg"
          className="mb-8"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <BentoItem key={i} colSpan={1} rowSpan={1}>
              <Card variant="glass" className="h-full p-6">
                <h3 className="text-lg font-semibold mb-2">Card {i + 1}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Traditional grid item with responsive columns
                </p>
                <Badge variant="secondary">Grid Item</Badge>
              </Card>
            </BentoItem>
          ))}
        </BentoGrid>
      </section>

      {/* Demo 2: AutoFit Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          AutoFit Grid (Responsive to Container)
        </h2>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Resize this container to see the grid adapt automatically
          </p>
          <BentoGrid 
            layoutPattern="symmetric"
            autoFit={true}
            minItemWidth="250px"
            gap="md"
            containerQueries={true}
            className="bento-grid"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <BentoItem key={i} className="bento-item">
                <Card variant="premium" className="h-full p-4">
                  <h3 className="text-lg font-semibold mb-2">AutoFit Card {i + 1}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    This card automatically adjusts based on available space
                  </p>
                  <Badge variant="primary">AutoFit</Badge>
                </Card>
              </BentoItem>
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Demo 3: Masonry Layout */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Masonry Layout
        </h2>
        <BentoGrid 
          layoutPattern="symmetric"
          masonry={true}
          gap="lg"
          className="masonry-layout"
        >
          {[
            { height: 'h-32', title: 'Short Card', content: 'Compact content' },
            { height: 'h-48', title: 'Medium Card', content: 'Medium height content with more text to demonstrate the masonry effect' },
            { height: 'h-64', title: 'Tall Card', content: 'Taller content that creates visual interest in the masonry layout' },
            { height: 'h-40', title: 'Medium Card 2', content: 'Another medium height card' },
            { height: 'h-56', title: 'Large Card', content: 'Larger content area for this masonry item' },
            { height: 'h-36', title: 'Short Card 2', content: 'Another short card' },
          ].map((item, i) => (
            <BentoItem key={i} className="masonry-item">
              <Card variant="glass" className={`${item.height} p-4`}>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.content}</p>
                <Badge variant="accent" className="mt-2">Masonry</Badge>
              </Card>
            </BentoItem>
          ))}
        </BentoGrid>
      </section>

      {/* Demo 4: Content-Aware Layout */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Content-Aware Layout
        </h2>
        <BentoGrid 
          layoutPattern="symmetric"
          columns={3}
          gap="lg"
          contentAwareLayout={true}
        >
          <BentoItem 
            layoutRole="simple" 
            contentType="feature"
            colSpan={1}
          >
            <Card variant="glass" className="h-full p-4">
              <h3 className="text-lg font-semibold mb-2">Simple Feature</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simple content with minimal styling
              </p>
              <Badge variant="secondary">Simple</Badge>
            </Card>
          </BentoItem>

          <BentoItem 
            layoutRole="complex" 
            contentType="stats"
            colSpan={1}
          >
            <Card variant="glass" className="h-full p-6">
              <h3 className="text-xl font-semibold mb-4 text-center">Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">1,234</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Trades</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">567</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Users</div>
                </div>
              </div>
              <Badge variant="primary" className="mt-4">Stats</Badge>
            </Card>
          </BentoItem>

          <BentoItem 
            layoutRole="featured" 
            contentType="integration"
            colSpan={1}
          >
            <Card variant="premium" className="h-full p-8">
              <h3 className="text-xl font-semibold mb-4">Featured Integration</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Premium content with enhanced styling and more padding
              </p>
              <Button variant="primary" size="sm">Learn More</Button>
              <Badge variant="accent" className="mt-4">Featured</Badge>
            </Card>
          </BentoItem>
        </BentoGrid>
      </section>

      {/* Demo 5: Asymmetric Layout */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Asymmetric Layout with Visual Rhythm
        </h2>
        <BentoGrid 
          layoutPattern="asymmetric"
          visualRhythm="alternating"
          gap="lg"
        >
          <BentoItem asymmetricSize="small">
            <Card variant="glass" className="h-full p-4">
              <h3 className="text-lg font-semibold mb-2">Small Item</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Takes up 1/3 of the row width
              </p>
              <Badge variant="secondary">Small</Badge>
            </Card>
          </BentoItem>

          <BentoItem asymmetricSize="large">
            <Card variant="premium" className="h-full p-6">
              <h3 className="text-xl font-semibold mb-4">Large Item</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Takes up 2/3 of the row width with more content and enhanced styling
              </p>
              <div className="flex gap-2">
                <Badge variant="primary">Large</Badge>
                <Badge variant="accent">Featured</Badge>
              </div>
            </Card>
          </BentoItem>

          <BentoItem asymmetricSize="large">
            <Card variant="glass" className="h-full p-6">
              <h3 className="text-xl font-semibold mb-4">Large Item (Reversed)</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This row is reversed, so this large item comes first
              </p>
              <Badge variant="primary">Large</Badge>
            </Card>
          </BentoItem>

          <BentoItem asymmetricSize="small">
            <Card variant="glass" className="h-full p-4">
              <h3 className="text-lg font-semibold mb-2">Small Item</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Small item in the reversed row
              </p>
              <Badge variant="secondary">Small</Badge>
            </Card>
          </BentoItem>
        </BentoGrid>
      </section>

      {/* Demo 6: Container Query Demo */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Container Query Demo
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Narrow Container */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Narrow Container</h3>
            <BentoGrid 
              layoutPattern="symmetric"
              columns={1}
              gap="md"
              containerQueries={true}
              className="bento-grid"
            >
              <BentoItem className="bento-item">
                <Card variant="glass" className="p-4">
                  <h4 className="font-semibold mb-2">Adaptive Card</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This card adapts to its container size
                  </p>
                </Card>
              </BentoItem>
            </BentoGrid>
          </div>

          {/* Wide Container */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Wide Container</h3>
            <BentoGrid 
              layoutPattern="symmetric"
              columns={2}
              gap="md"
              containerQueries={true}
              className="bento-grid"
            >
              <BentoItem className="bento-item">
                <Card variant="glass" className="p-4">
                  <h4 className="font-semibold mb-2">Adaptive Card</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Same card, different container
                  </p>
                </Card>
              </BentoItem>
              <BentoItem className="bento-item">
                <Card variant="glass" className="p-4">
                  <h4 className="font-semibold mb-2">Adaptive Card</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Adapts to available space
                  </p>
                </Card>
              </BentoItem>
            </BentoGrid>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BentoGridDemoPage; 