import React from 'react';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import { Card } from '../components/ui/Card';
import StatsCard from '../components/ui/StatsCard';
import { themeClasses } from '../utils/themeUtils';

/**
 * Example of an Asymmetric Home Page Layout.
 *
 * This demonstrates how to use the enhanced BentoGrid component to create
 * a modern, visually engaging layout with alternating row patterns.
 */
const AsymmetricHomePageLayout = () => {
  return (
    <div className="p-4 md:p-8 bg-bg-secondary min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className={themeClasses.heading1 + " mb-8"}>
          TradeYa Asymmetric Layout Demo
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          This demonstrates the asymmetric layout system with alternating visual rhythm patterns.
          Each row alternates between small-large and large-small arrangements.
        </p>

        <BentoGrid
          layoutPattern="asymmetric"
          visualRhythm="alternating"
          contentAwareLayout={true}
          className="mb-12"
          gap="lg"
        >
        {/* --- ROW 1: Small (1/3) + Large (2/3) --- */}
        {/* The grid will arrange these two items into the first row. */}
        <BentoItem
          asymmetricSize="small"
          contentType="feature"
          layoutRole="simple"
        >
          <Card variant="glass" className="h-full flex flex-col p-6">
            <h2 className={themeClasses.heading4}>Quick Actions</h2>
            <p className={themeClasses.body + ' mt-2 flex-grow'}>
              Simple content, like a list of links or a brief summary, fits perfectly here.
            </p>
          </Card>
        </BentoItem>

        <BentoItem
          asymmetricSize="large"
          contentType="mixed"
          layoutRole="complex"
        >
          <Card variant="glass" className="h-full flex flex-col p-6">
            <h2 className={themeClasses.heading4}>Featured Skill Trades</h2>
            <p className={themeClasses.body + ' mt-2 flex-grow'}>
              More complex content, perhaps with its own internal grid, images, and stats, is ideal for a large item.
            </p>
          </Card>
        </BentoItem>

        {/* --- ROW 2: Large (2/3) + Small (1/3) --- */}
        {/* The grid's internal logic will see this is the second row and apply a reversed order. */}
        <BentoItem
          asymmetricSize="auto" // Let the hook decide the size
          contentType="stats"
          layoutRole="complex"
        >
          <StatsCard label="Total Trades" value={128} />
        </BentoItem>

        <BentoItem
          asymmetricSize="small"
          contentType="feature"
          layoutRole="simple"
        >
          <Card variant="glass" className="h-full flex flex-col p-6">
            <h2 className={themeClasses.heading4}>Trending Skills</h2>
            <p className={themeClasses.body + ' mt-2 flex-grow'}>
              A small, focused card highlighting trending topics.
            </p>
          </Card>
        </BentoItem>

        {/* --- ROW 3: Small (1/3) + Large (2/3) --- */}
        <BentoItem
          asymmetricSize="small"
          contentType="stats"
          layoutRole="simple"
        >
          <Card variant="glass" className="h-full flex flex-col p-6">
            <h2 className={themeClasses.heading4}>Active Users</h2>
            <p className={themeClasses.body + ' mt-2 flex-grow'}>
              <span className="text-2xl font-bold text-orange-500">1,247</span>
              <br />
              users online now
            </p>
          </Card>
        </BentoItem>

        <BentoItem
          asymmetricSize="large"
          contentType="mixed"
          layoutRole="complex"
        >
          <Card variant="glass" className="h-full flex flex-col p-6">
            <h2 className={themeClasses.heading4}>Recent Activity</h2>
            <div className="space-y-3 mt-4 flex-grow">
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">New trade created: Web Development</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Collaboration joined: Design Team</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Challenge completed: UI/UX</span>
              </div>
            </div>
          </Card>
        </BentoItem>
      </BentoGrid>
      </div>
    </div>
  );
};

export default AsymmetricHomePageLayout;