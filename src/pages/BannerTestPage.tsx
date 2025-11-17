import React from 'react';
import DefaultBanner from '../components/ui/DefaultBanner';
import BannerSelector from '../components/ui/BannerSelector';
import { logger } from '@utils/logging/logger';

const BannerTestPage: React.FC = () => {
  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Default Banner Showcase</h1>
          {/* The global theme toggle in the Navbar should be used instead */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Classic Gradients */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Gradient 1</h2>
            <div className="glassmorphic p-4">
              <DefaultBanner design="gradient1" height="md" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Gradient 2</h2>
            <div className="glassmorphic p-4">
              <DefaultBanner design="gradient2" height="md" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Gradient 3</h2>
            <div className="glassmorphic p-4">
              <DefaultBanner design="gradient3" height="md" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">3D Gradient</h2>
            <div className="glassmorphic p-4">
              <DefaultBanner design="gradient3d" height="md" />
            </div>
          </div>

          {/* Patterns */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Geometric 1</h2>
            <div className="glassmorphic p-4">
              <DefaultBanner design="geometric1" height="md" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Geometric 2</h2>
            <div className="glassmorphic p-4">
              <DefaultBanner design="geometric2" height="md" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Waves</h2>
            <DefaultBanner design="waves" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Dots</h2>
            <DefaultBanner design="dots" height="md" />
          </div>

          {/* Modern Styles */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Glassmorphism 1</h2>
            <DefaultBanner design="glassmorphism1" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Glassmorphism 2</h2>
            <DefaultBanner design="glassmorphism2" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Neobrutalism 1</h2>
            <DefaultBanner design="neobrutalism1" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Neobrutalism 2</h2>
            <DefaultBanner design="neobrutalism2" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Abstract 3D</h2>
            <DefaultBanner design="abstract3d" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Liquid</h2>
            <DefaultBanner design="liquid" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Memphis</h2>
            <DefaultBanner design="memphis" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Cyberpunk</h2>
            <DefaultBanner design="cyberpunk" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Minimal</h2>
            <DefaultBanner design="minimal" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Random</h2>
            <DefaultBanner design="random" height="md" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">With Content</h2>
            <DefaultBanner design="gradient1" height="md" className="flex items-center justify-center">
              <div className="relative z-10 text-white text-center p-4 bg-black/30 backdrop-blur-sm rounded-lg">
                <h3 className="text-xl font-bold">Banner with Content</h3>
                <p>You can add any content inside the banner</p>
              </div>
            </DefaultBanner>
          </div>
        </div>

        <div className="mt-12 p-6 border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Banner Selector Component</h2>
          <BannerSelector
            onSelect={(design) => logger.debug('Selected design:', 'PAGE', design)}
          />
        </div>
      </div>
    </div>
  );
};

export default BannerTestPage;
